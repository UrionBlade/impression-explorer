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
}
