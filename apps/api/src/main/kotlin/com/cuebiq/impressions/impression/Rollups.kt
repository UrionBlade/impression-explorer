package com.cuebiq.impressions.impression

import org.springframework.jdbc.core.simple.JdbcClient

/**
 * The pre-aggregated rollup views (defined in V4__rollups.sql) and how to refresh
 * them. Single source of truth shared by the seed loader and the integration tests.
 */
object Rollups {
    val VIEWS = listOf(
        "mv_state_counts",
        "mv_hour_counts",
        "mv_device_stats",
        "mv_device_buckets",
        "mv_daily_counts",
    )

    /** Recompute every rollup from the current (committed) impressions data. */
    fun refresh(jdbc: JdbcClient) {
        for (view in VIEWS) jdbc.sql("REFRESH MATERIALIZED VIEW $view").update()
    }
}
