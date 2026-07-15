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
    fun `distribution buckets devices by their impression count, with median and max`() {
        repeat(5) { insert(100) } //   device 100 → 5 impressions  (1–10)
        repeat(15) { insert(200) } //  device 200 → 15 impressions (11–20)
        repeat(105) { insert(300) } // device 300 → 105 impressions (100+)
        refreshRollups()

        val result = repository.deviceDistribution()

        assertEquals(3, result.totalDevices)
        assertEquals(125.0 / 3.0, result.meanPerDevice, 1e-9) // mean of [5, 15, 105]
        assertEquals(15.0, result.medianPerDevice) // median of [5, 15, 105]
        assertEquals(105, result.maxPerDevice)

        val byLabel = result.buckets.associate { it.label to it.devices }
        assertEquals(1, byLabel["1–10"]) // device 100
        assertEquals(1, byLabel["11–20"]) // device 200
        assertEquals(1, byLabel["100+"]) // device 300
        assertEquals(0, byLabel["21–30"])
    }
}
