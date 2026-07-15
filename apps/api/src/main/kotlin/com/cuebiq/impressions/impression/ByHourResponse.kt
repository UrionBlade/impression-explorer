package com.cuebiq.impressions.impression

/** Impression count for one hour of day (0–23). */
data class HourCount(val hour: Int, val count: Long)

/**
 * Impressions per hour of day in two readings:
 * - `local`: bucketed by the hour in each impression's US state timezone
 *   (the human daily rhythm; excludes impressions with no state).
 * - `utc`: bucketed by absolute UTC hour (all impressions).
 * Each list has all 24 hours, zero-filled.
 */
data class ByHourResponse(val local: List<HourCount>, val utc: List<HourCount>)
