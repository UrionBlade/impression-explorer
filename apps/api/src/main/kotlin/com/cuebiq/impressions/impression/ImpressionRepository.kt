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
}
