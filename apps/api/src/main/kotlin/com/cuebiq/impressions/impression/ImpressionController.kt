package com.cuebiq.impressions.impression

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/impressions")
class ImpressionController(private val repository: ImpressionRepository) {

    /** Impressions aggregated per US state (all states in one response). */
    @GetMapping("/by-state")
    fun byState(): ByStateResponse = repository.countsByState()

    /** Impressions per hour of day, in local (per state timezone) and UTC series. */
    @GetMapping("/by-hour")
    fun byHour(): ByHourResponse = repository.countsByHour()

    /** Top devices by impression count (plus the total device count). */
    @GetMapping("/by-device")
    fun byDevice(): ByDeviceResponse = repository.topDevices()

    /** Black Friday impression rate (lift) per year. */
    @GetMapping("/black-friday")
    fun blackFriday(): List<BlackFridayYear> = repository.blackFriday()
}
