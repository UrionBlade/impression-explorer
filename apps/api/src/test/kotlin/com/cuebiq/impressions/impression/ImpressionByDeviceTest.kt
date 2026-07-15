package com.cuebiq.impressions.impression

import com.cuebiq.impressions.IntegrationTestBase
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.core.simple.JdbcClient
import kotlin.test.assertEquals

class ImpressionByDeviceTest : IntegrationTestBase() {
    @Autowired
    lateinit var jdbc: JdbcClient

    @Autowired
    lateinit var repository: ImpressionRepository

    private fun insert(deviceId: Long) {
        jdbc.sql("INSERT INTO impressions(device_id,lat,lng,ts,state_id) VALUES (?,0,0,now(),NULL)")
            .param(deviceId).update()
    }

    @Test
    fun `top devices ordered by count, honouring the limit and the distinct total`() {
        repeat(3) { insert(100) }
        insert(200)
        repeat(2) { insert(300) }

        val result = repository.topDevices(limit = 2)

        assertEquals(3, result.totalDevices) // 3 distinct devices
        assertEquals(2, result.top.size) // limit honoured
        assertEquals(DeviceCount(100, 3), result.top[0]) // densest first
        assertEquals(DeviceCount(300, 2), result.top[1])
    }
}
