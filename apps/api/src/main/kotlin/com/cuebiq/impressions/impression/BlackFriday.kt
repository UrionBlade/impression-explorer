package com.cuebiq.impressions.impression

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters

/** Black Friday date logic: the Friday after the 4th Thursday of November. */
object BlackFriday {
    fun of(year: Int): LocalDate {
        val firstThursday = LocalDate.of(year, 11, 1)
            .with(TemporalAdjusters.nextOrSame(DayOfWeek.THURSDAY))
        val fourthThursday = firstThursday.plusWeeks(3)
        return fourthThursday.plusDays(1)
    }
}

/**
 * Black Friday for one year: its date, the impression count that day, the mean
 * daily impressions over the *rest* of the year (Black Friday excluded, so the
 * spike doesn't inflate its own baseline), and the lift (count ÷ that mean).
 */
data class BlackFridayYear(
    val year: Int,
    val date: String,
    val count: Long,
    val restOfYearDailyMean: Double,
    val lift: Double,
)
