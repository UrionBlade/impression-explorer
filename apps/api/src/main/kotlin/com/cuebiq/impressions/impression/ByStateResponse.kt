package com.cuebiq.impressions.impression

/** One US state's impression count. `state` is the state name (matches map.json level1). */
data class StateCount(val state: String, val count: Long)

/**
 * Per-state aggregate for the choropleth. `unattributed` counts impressions that
 * fell outside every US state polygon; `total` = sum(states) + unattributed.
 */
data class ByStateResponse(
    val total: Long,
    val unattributed: Long,
    val states: List<StateCount>,
)
