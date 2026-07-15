package com.cuebiq.impressions.impression

import com.cuebiq.impressions.IntegrationTestBase
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.core.simple.JdbcClient
import kotlin.test.assertEquals

class ImpressionByStateTest : IntegrationTestBase() {
    @Autowired
    lateinit var jdbc: JdbcClient

    @Autowired
    lateinit var repository: ImpressionRepository

    private fun insertState(name: String): Int =
        jdbc.sql("INSERT INTO states(name) VALUES (?) RETURNING id").param(name)
            .query { rs, _ -> rs.getInt(1) }.single()

    private fun insertImpression(stateId: Int?) {
        if (stateId == null) {
            jdbc.sql("INSERT INTO impressions(device_id,lat,lng,ts,state_id) VALUES (1,0,0,now(),NULL)").update()
        } else {
            jdbc.sql("INSERT INTO impressions(device_id,lat,lng,ts,state_id) VALUES (1,0,0,now(),?)")
                .param(stateId).update()
        }
    }

    @Test
    fun `aggregates per state, orders by count, reconciles with unattributed`() {
        val florida = insertState("Florida")
        val texas = insertState("Texas")
        repeat(3) { insertImpression(florida) }
        insertImpression(texas)
        repeat(2) { insertImpression(null) }
        refreshRollups()

        val result = repository.countsByState()

        assertEquals(6, result.total)
        assertEquals(2, result.unattributed)
        assertEquals("Florida", result.states.first().state) // densest first
        assertEquals(3, result.states.first().count)
        assertEquals(result.total, result.states.sumOf { it.count } + result.unattributed)
    }
}
