package com.cuebiq.impressions.seed

import kotlin.math.floor

/** A closed ring of `[lng, lat]` vertices. */
typealias Ring = List<DoubleArray>

/** Axis-aligned bounding box for cheap rejection before the full ray cast. */
class BBox(
    val minLng: Double,
    val minLat: Double,
    val maxLng: Double,
    val maxLat: Double,
) {
    fun contains(lng: Double, lat: Double): Boolean =
        lng in minLng..maxLng && lat in minLat..maxLat

    companion object {
        /** Bounding box of a single polygon (all its rings). */
        fun ofPolygon(polygon: List<Ring>): BBox {
            var minLng = Double.MAX_VALUE
            var minLat = Double.MAX_VALUE
            var maxLng = -Double.MAX_VALUE
            var maxLat = -Double.MAX_VALUE
            for (ring in polygon) {
                for (p in ring) {
                    if (p[0] < minLng) minLng = p[0]
                    if (p[0] > maxLng) maxLng = p[0]
                    if (p[1] < minLat) minLat = p[1]
                    if (p[1] > maxLat) maxLat = p[1]
                }
            }
            return BBox(minLng, minLat, maxLng, maxLat)
        }
    }
}

/**
 * One US state's geometry: one or more polygons, each a list of rings
 * (exterior first, holes after). A point is inside the state if it is inside
 * any of its polygons.
 *
 * Each polygon carries its own bounding box (a tighter prefilter than a single
 * union box for dispersed geometries such as island states). A state with no
 * polygons has no boxes, so [contains] is always false — it matches nothing,
 * by construction rather than by relying on empty-range arithmetic.
 */
class StateShape(val name: String, private val polygons: List<List<Ring>>) {
    val boxes: List<BBox> = polygons.map { BBox.ofPolygon(it) }

    fun contains(lng: Double, lat: Double): Boolean {
        for (i in polygons.indices) {
            if (boxes[i].contains(lng, lat) && pointInPolygon(polygons[i], lng, lat)) return true
        }
        return false
    }
}

/**
 * Even-odd ray casting. A point is inside the polygon when a ray to the right
 * crosses the polygon's edges an odd number of times. Counting across every
 * ring of the polygon (exterior + holes) makes holes fall out for free.
 *
 * Boundary convention: the strict `>` on y and `<` on x make this half-open, so
 * a point exactly on a shared border is counted inside for one side only —
 * adjacent states will not both claim it in the usual case. Where edge
 * orientation makes both claim it, [StateResolver] breaks the tie by order.
 * With real float lng/lat, exact-border points are effectively nonexistent.
 */
fun pointInPolygon(rings: List<Ring>, x: Double, y: Double): Boolean {
    var inside = false
    for (ring in rings) {
        var j = ring.size - 1
        for (i in ring.indices) {
            val xi = ring[i][0]
            val yi = ring[i][1]
            val xj = ring[j][0]
            val yj = ring[j][1]
            if ((yi > y) != (yj > y)) {
                val xIntersect = (xj - xi) * (y - yi) / (yj - yi) + xi
                if (x < xIntersect) inside = !inside
            }
            j = i
        }
    }
    return inside
}

/**
 * Resolves a `(lng, lat)` point to a state id.
 *
 * A coarse 1°×1° grid maps each cell to the states whose bounding boxes touch
 * it, so a point is only tested against nearby states instead of all of them —
 * O(1) expected candidates rather than O(states) per point. A point in a cell
 * no state touches resolves to null immediately.
 */
class StateResolver(private val entries: List<Pair<Int, StateShape>>) {
    private val grid: Map<Long, List<Int>> = buildGrid()

    fun resolve(lng: Double, lat: Double): Int? {
        val candidates = grid[cellKey(floor(lat).toInt(), floor(lng).toInt())] ?: return null
        for (idx in candidates) {
            val (id, shape) = entries[idx]
            if (shape.contains(lng, lat)) return id
        }
        return null
    }

    private fun buildGrid(): Map<Long, List<Int>> {
        val g = HashMap<Long, LinkedHashSet<Int>>()
        entries.forEachIndexed { idx, (_, shape) ->
            for (b in shape.boxes) {
                var lat = floor(b.minLat).toInt()
                val latMax = floor(b.maxLat).toInt()
                while (lat <= latMax) {
                    var lng = floor(b.minLng).toInt()
                    val lngMax = floor(b.maxLng).toInt()
                    while (lng <= lngMax) {
                        g.getOrPut(cellKey(lat, lng)) { LinkedHashSet() }.add(idx)
                        lng++
                    }
                    lat++
                }
            }
        }
        return g.mapValues { it.value.toList() }
    }

    /** Pack two cell indices into one Long key (lat in high 32 bits, lng in low). */
    private fun cellKey(lat: Int, lng: Int): Long =
        (lat.toLong() shl 32) or (lng.toLong() and 0xFFFFFFFFL)
}
