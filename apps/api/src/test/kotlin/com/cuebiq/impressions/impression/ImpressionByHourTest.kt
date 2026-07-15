package com.cuebiq.impressions.impression

import com.cuebiq.impressions.IntegrationTestBase
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.core.simple.JdbcClient
import kotlin.test.assertEquals

class ImpressionByHourTest : IntegrationTestBase() {
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
    fun `both series have 24 buckets, utc counts all and local only the attributed`() {
        val florida = insertState("Florida") // has a state_timezone row from V3
        repeat(3) { insertImpression(florida) }
        repeat(2) { insertImpression(null) }

        val result = repository.countsByHour()

        assertEquals(24, result.utc.size)
        assertEquals(24, result.local.size)
        assertEquals(5, result.utc.sumOf { it.count }) // every impression
        assertEquals(3, result.local.sumOf { it.count }) // only the state-attributed ones
    }
}
