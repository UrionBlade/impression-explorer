package com.cuebiq.impressions.impression

/** One device's impression count. */
data class DeviceCount(val deviceId: Long, val count: Long)

/** The heaviest devices by impression count, plus the total number of distinct devices. */
data class ByDeviceResponse(val totalDevices: Long, val top: List<DeviceCount>)
