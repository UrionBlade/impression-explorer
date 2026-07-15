package com.cuebiq.impressions.impression

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.time.LocalDate

/**
 * Read-only analytical aggregates. Every query reads a pre-aggregated rollup
 * (materialized view, refreshed after the seed) rather than scanning the
 * impressions table, so serving cost is independent of the row count. Plain SQL
 * via JdbcClient — no entity mapping, the queries stay visible.
 */
@Repository
class ImpressionRepository(private val jdbc: JdbcClient) {

    /** Impressions per US state, plus the unattributed count. Reads mv_state_counts. */
    fun countsByState(): ByStateResponse {
        val states = jdbc.sql(
            """
            SELECT s.name AS name, m.cnt AS cnt
            FROM mv_state_counts m
            JOIN states s ON s.id = m.state_id
            ORDER BY cnt DESC, s.name
            """.trimIndent(),
        ).query { rs, _ -> StateCount(rs.getString("name"), rs.getLong("cnt")) }.list()

        val unattributed = jdbc
            .sql("SELECT coalesce((SELECT cnt FROM mv_state_counts WHERE state_id IS NULL), 0)")
            .query { rs, _ -> rs.getLong(1) }
            .single()

        return ByStateResponse(
            total = states.sumOf { it.count } + unattributed,
            unattributed = unattributed,
            states = states,
        )
    }

    /** Impressions per hour of day, localised and UTC. Reads mv_hour_counts. */
    fun countsByHour(): ByHourResponse {
        val rows = jdbc.sql("SELECT mode, hour, cnt FROM mv_hour_counts")
            .query { rs, _ -> Triple(rs.getString("mode"), rs.getInt("hour"), rs.getLong("cnt")) }
            .list()
        val utc = rows.filter { it.first == "utc" }.associate { it.second to it.third }
        val local = rows.filter { it.first == "local" }.associate { it.second to it.third }
        return ByHourResponse(local = fill24(local), utc = fill24(utc))
    }

    /** Expand a sparse hour→count map into all 24 hours, zero-filling the gaps. */
    private fun fill24(rows: Map<Int, Long>): List<HourCount> =
        (0..23).map { HourCount(it, rows[it] ?: 0) }

    // Even 10-wide bands; index i (0-based) is rollup bucket i+1, the tail is 100+.
    private val bucketLabels = listOf(
        "1–10", "11–20", "21–30", "31–40", "41–50",
        "51–60", "61–70", "71–80", "81–90", "91–100", "100+",
    )

    /**
     * Distribution of impressions per device, plus median, heaviest, and total —
     * bucketing and percentile are done in SQL (mv_device_stats + mv_device_buckets),
     * so nothing per-device is materialised in the JVM.
     */
    fun deviceDistribution(): ByDeviceResponse {
        val stats = jdbc.sql("SELECT total_devices, mean, median, max FROM mv_device_stats")
            .query { rs, _ ->
                DeviceStats(rs.getLong("total_devices"), rs.getDouble("mean"), rs.getDouble("median"), rs.getLong("max"))
            }.single()

        val byBucket = jdbc.sql("SELECT bucket, devices FROM mv_device_buckets")
            .query { rs, _ -> rs.getInt("bucket") to rs.getLong("devices") }
            .list().toMap()
        val buckets = bucketLabels.mapIndexed { i, label -> DeviceBucket(label, byBucket[i + 1] ?: 0) }

        return ByDeviceResponse(
            totalDevices = stats.totalDevices,
            meanPerDevice = stats.mean,
            medianPerDevice = stats.median,
            maxPerDevice = stats.max,
            buckets = buckets,
        )
    }

    private data class DeviceStats(val totalDevices: Long, val mean: Double, val median: Double, val max: Long)

    /**
     * Black Friday lift per year: the BF-day impression count against the mean of
     * the rest of the year's days. Reads mv_daily_counts (one row per US day); the
     * "Friday after the 4th Thursday of November" logic stays in the Kotlin helper.
     */
    fun blackFriday(): List<BlackFridayYear> {
        val daily = jdbc.sql("SELECT day, cnt FROM mv_daily_counts")
            .query { rs, _ -> rs.getObject("day", LocalDate::class.java) to rs.getLong("cnt") }
            .list()
        val byYear = daily.groupBy { it.first.year }

        return byYear.keys.sorted().map { year ->
            val bf = BlackFriday.of(year)
            val days = byYear.getValue(year)
            val bfCount = days.firstOrNull { it.first == bf }?.second ?: 0
            val yearTotal = days.sumOf { it.second }
            val observedDays = days.size

            // Mean daily impressions over the rest of the year (Black Friday excluded).
            val restDays = (observedDays - if (bfCount > 0) 1 else 0).coerceAtLeast(1)
            val restMean = (yearTotal - bfCount).toDouble() / restDays
            val lift = if (restMean == 0.0) 0.0 else bfCount / restMean
            BlackFridayYear(year, bf.toString(), bfCount, restMean, lift)
        }
    }
}
