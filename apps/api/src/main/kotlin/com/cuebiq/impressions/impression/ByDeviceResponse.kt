package com.cuebiq.impressions.impression

/** How many devices fall in one "impressions per device" range. */
data class DeviceBucket(val label: String, val devices: Long)

/**
 * Distribution of impressions per device: the shape of how impressions spread
 * across devices (most light, a few heavy). Plus the typical (median) and
 * heaviest device, and the total device count for context.
 */
data class ByDeviceResponse(
    val totalDevices: Long,
    val meanPerDevice: Double,
    val medianPerDevice: Double,
    val maxPerDevice: Long,
    val buckets: List<DeviceBucket>,
)
