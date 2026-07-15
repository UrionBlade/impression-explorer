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

    /** Top-N devices by impression count, plus the total number of distinct devices. */
    fun topDevices(limit: Int = 15): ByDeviceResponse {
        val top = jdbc.sql(
            """
            SELECT device_id, count(*) AS cnt
            FROM impressions
            GROUP BY device_id
            ORDER BY cnt DESC, device_id
            LIMIT :limit
            """.trimIndent(),
        ).param("limit", limit)
            .query { rs, _ -> DeviceCount(rs.getLong("device_id"), rs.getLong("cnt")) }
            .list()
        val totalDevices = jdbc.sql("SELECT count(DISTINCT device_id) FROM impressions")
            .query { rs, _ -> rs.getLong(1) }.single()
        return ByDeviceResponse(totalDevices, top)
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
            ).param("y", year)
                .query { rs, _ -> rs.getLong("total") to rs.getLong("days") }.single()

            val dailyMean = if (observedDays == 0L) 0.0 else yearTotal.toDouble() / observedDays
            val lift = if (dailyMean == 0.0) 0.0 else bfCount / dailyMean
            BlackFridayYear(year, bf.toString(), bfCount, dailyMean, lift)
        }
    }
}
