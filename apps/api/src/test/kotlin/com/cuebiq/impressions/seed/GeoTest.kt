package com.cuebiq.impressions.seed

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class GeoTest {
    // A unit square from (2,2) to (8,8), counter-clockwise, ring closed.
    private val square: Ring = listOf(
        doubleArrayOf(2.0, 2.0),
        doubleArrayOf(8.0, 2.0),
        doubleArrayOf(8.0, 8.0),
        doubleArrayOf(2.0, 8.0),
        doubleArrayOf(2.0, 2.0),
    )

    @Test
    fun `point inside the square`() {
        assertTrue(pointInPolygon(listOf(square), 5.0, 5.0))
    }

    @Test
    fun `point to the left is outside`() {
        assertFalse(pointInPolygon(listOf(square), 0.0, 5.0))
    }

    @Test
    fun `point to the right is outside`() {
        assertFalse(pointInPolygon(listOf(square), 10.0, 5.0))
    }

    @Test
    fun `point above is outside`() {
        assertFalse(pointInPolygon(listOf(square), 5.0, 10.0))
    }

    @Test
    fun `hole is excluded`() {
        // Outer square (0..10) with an inner hole (4..6).
        val outer: Ring = listOf(
            doubleArrayOf(0.0, 0.0), doubleArrayOf(10.0, 0.0),
            doubleArrayOf(10.0, 10.0), doubleArrayOf(0.0, 10.0), doubleArrayOf(0.0, 0.0),
        )
        val hole: Ring = listOf(
            doubleArrayOf(4.0, 4.0), doubleArrayOf(6.0, 4.0),
            doubleArrayOf(6.0, 6.0), doubleArrayOf(4.0, 6.0), doubleArrayOf(4.0, 4.0),
        )
        assertTrue(pointInPolygon(listOf(outer, hole), 1.0, 1.0)) // in the ring
        assertFalse(pointInPolygon(listOf(outer, hole), 5.0, 5.0)) // in the hole
    }

    @Test
    fun `resolver picks the containing state and rejects points outside all`() {
        val a = StateShape("A", listOf(listOf(square)))
        val b = StateShape(
            "B",
            listOf(listOf(listOf(
                doubleArrayOf(20.0, 20.0), doubleArrayOf(30.0, 20.0),
                doubleArrayOf(30.0, 30.0), doubleArrayOf(20.0, 30.0), doubleArrayOf(20.0, 20.0),
            ))),
        )
        val resolver = StateResolver(listOf(1 to a, 2 to b))
        assertEquals(1, resolver.resolve(5.0, 5.0))
        assertEquals(2, resolver.resolve(25.0, 25.0))
        assertNull(resolver.resolve(50.0, 50.0))
    }
}
