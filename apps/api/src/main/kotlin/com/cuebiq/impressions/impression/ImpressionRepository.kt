package com.cuebiq.impressions.impression

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository

/**
 * Read-only analytical aggregates over the pre-enriched impressions table.
 * Plain SQL via JdbcClient — no entity mapping, the queries stay visible.
 */
@Repository
class ImpressionRepository(private val jdbc: JdbcClient) {

    /** Impressions per US state (indexed GROUP BY on state_id), plus the unattributed count. */
    fun countsByState(): ByStateResponse {
        val states = jdbc.sql(
            """
            SELECT s.name AS name, count(*) AS cnt
            FROM impressions i
            JOIN states s ON s.id = i.state_id
            GROUP BY s.name
            ORDER BY cnt DESC, s.name
            """.trimIndent(),
        ).query { rs, _ -> StateCount(rs.getString("name"), rs.getLong("cnt")) }.list()

        val unattributed = jdbc.sql("SELECT count(*) FROM impressions WHERE state_id IS NULL")
            .query { rs, _ -> rs.getLong(1) }
            .single()

        return ByStateResponse(
            total = states.sumOf { it.count } + unattributed,
            unattributed = unattributed,
            states = states,
        )
    }

    /** Impressions per hour of day, both localised to each state's timezone and in UTC. */
    fun countsByHour(): ByHourResponse {
        val utc = jdbc.sql("SELECT extract(hour FROM ts)::int AS h, count(*) AS cnt FROM impressions GROUP BY h")
            .query { rs, _ -> rs.getInt("h") to rs.getLong("cnt") }
            .list().toMap()

        val local = jdbc.sql(
            """
            SELECT extract(hour FROM i.ts AT TIME ZONE tz.timezone)::int AS h, count(*) AS cnt
            FROM impressions i
            JOIN states s ON s.id = i.state_id
            JOIN state_timezone tz ON tz.state = s.name
            GROUP BY h
            """.trimIndent(),
        ).query { rs, _ -> rs.getInt("h") to rs.getLong("cnt") }
            .list().toMap()

        return ByHourResponse(local = fill24(local), utc = fill24(utc))
    }

    /** Expand a sparse hour→count map into all 24 hours, zero-filling the gaps. */
    private fun fill24(rows: Map<Int, Long>): List<HourCount> =
        (0..23).map { HourCount(it, rows[it] ?: 0) }

    private data class DeviceRange(val label: String, val lo: Long, val hi: Long)

    private val deviceRanges = listOf(
        DeviceRange("1–10", 1, 10),
        DeviceRange("11–20", 11, 20),
        DeviceRange("21–30", 21, 30),
        DeviceRange("31–40", 31, 40),
        DeviceRange("41–50", 41, 50),
        DeviceRange("51–60", 51, 60),
        DeviceRange("61–70", 61, 70),
        DeviceRange("71–80", 71, 80),
        DeviceRange("81–90", 81, 90),
        DeviceRange("91–100", 91, 100),
        DeviceRange("100+", 101, Long.MAX_VALUE),
    )

    /** Distribution of impressions per device, plus the median, heaviest, and total. */
    fun deviceDistribution(): ByDeviceResponse {
        val perDevice = jdbc.sql("SELECT count(*) AS c FROM impressions GROUP BY device_id")
            .query { rs, _ -> rs.getLong("c") }.list()
        val buckets = deviceRanges.map { r ->
            DeviceBucket(r.label, perDevice.count { it in r.lo..r.hi }.toLong())
        }
        return ByDeviceResponse(
            totalDevices = perDevice.size.toLong(),
            meanPerDevice = if (perDevice.isEmpty()) 0.0 else perDevice.sum().toDouble() / perDevice.size,
            medianPerDevice = median(perDevice),
            maxPerDevice = perDevice.maxOrNull() ?: 0,
            buckets = buckets,
        )
    }

    private fun median(values: List<Long>): Double {
        if (values.isEmpty()) return 0.0
        val sorted = values.sorted()
        val mid = sorted.size / 2
        return if (sorted.size % 2 == 1) sorted[mid].toDouble() else (sorted[mid - 1] + sorted[mid]) / 2.0
    }

    /**
     * Black Friday lift per year: the BF-day impression count against the year's
     * mean daily impressions. Days are attributed on a US reference timezone; the
     * daily mean uses the year's observed days so partial coverage doesn't distort it.
     */
    fun blackFriday(): List<BlackFridayYear> {
        val years = jdbc.sql(
            "SELECT DISTINCT extract(year FROM ts AT TIME ZONE 'America/New_York')::int AS y FROM impressions ORDER BY y",
        ).query { rs, _ -> rs.getInt("y") }.list()

        return years.map { year ->
            val bf = BlackFriday.of(year)
            val bfCount = jdbc.sql(
                "SELECT count(*) FROM impressions WHERE (ts AT TIME ZONE 'America/New_York')::date = :d",
            ).param("d", java.sql.Date.valueOf(bf))
                .query { rs, _ -> rs.getLong(1) }.single()

            val (yearTotal, observedDays) = jdbc.sql(
                """
                SELECT count(*) AS total,
                       count(DISTINCT (ts AT TIME ZONE 'America/New_York')::date) AS days
                FROM impressions
                WHERE extract(year FROM ts AT TIME ZONE 'America/New_York')::int = :y
                """.trimIndent(),
            ).param("y", year).query { rs, _ -> rs.getLong("total") to rs.getLong("days") }.single()

            // Mean daily impressions over the rest of the year (Black Friday excluded).
            val restDays = (observedDays - if (bfCount > 0) 1 else 0).coerceAtLeast(1)
            val restMean = (yearTotal - bfCount).toDouble() / restDays
            val lift = if (restMean == 0.0) 0.0 else bfCount / restMean
            BlackFridayYear(year, bf.toString(), bfCount, restMean, lift)
        }
    }
}
