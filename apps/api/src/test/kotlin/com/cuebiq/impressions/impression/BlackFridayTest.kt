package com.cuebiq.impressions.impression

import org.junit.jupiter.api.Test
import java.time.LocalDate
import kotlin.test.assertEquals

class BlackFridayTest {
    @Test
    fun `is the friday after the fourth thursday of november`() {
        assertEquals(LocalDate.of(2019, 11, 29), BlackFriday.of(2019))
        assertEquals(LocalDate.of(2023, 11, 24), BlackFriday.of(2023))
        assertEquals(LocalDate.of(2024, 11, 29), BlackFriday.of(2024))
        assertEquals(LocalDate.of(2025, 11, 28), BlackFriday.of(2025))
    }
}
