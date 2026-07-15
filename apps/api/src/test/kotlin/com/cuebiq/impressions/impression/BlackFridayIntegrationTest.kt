package com.cuebiq.impressions.impression

import com.cuebiq.impressions.IntegrationTestBase
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.core.simple.JdbcClient
import kotlin.test.assertEquals

class BlackFridayIntegrationTest : IntegrationTestBase() {
    @Autowired
    lateinit var jdbc: JdbcClient

    @Autowired
    lateinit var repository: ImpressionRepository

    private fun insertAt(instant: String) {
        jdbc.sql("INSERT INTO impressions(device_id,lat,lng,ts,state_id) VALUES (1,0,0,?::timestamptz,NULL)")
            .param(instant).update()
    }

    @Test
    fun `lift is the black friday count over the year's daily mean`() {
        // 2024 Black Friday is 2024-11-29 (New York). 4 impressions that day, 2 on
        // another day → observed days 2, total 6, daily mean 3, lift = 4 / 3.
        repeat(4) { insertAt("2024-11-29 12:00:00+00") }
        repeat(2) { insertAt("2024-06-15 12:00:00+00") }

        val year = repository.blackFriday().single { it.year == 2024 }

        assertEquals("2024-11-29", year.date)
        assertEquals(4, year.count)
        assertEquals(3.0, year.dailyMean)
        assertEquals(4.0 / 3.0, year.lift, 1e-9)
    }
}
