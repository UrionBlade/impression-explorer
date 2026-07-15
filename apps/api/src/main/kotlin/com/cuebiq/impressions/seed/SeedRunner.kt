package com.cuebiq.impressions.seed

import org.postgresql.PGConnection
import org.postgresql.copy.PGCopyOutputStream
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.CommandLineRunner
import com.cuebiq.impressions.impression.Rollups
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import java.io.BufferedWriter
import java.io.File
import java.io.OutputStreamWriter
import java.sql.Connection
import java.time.Instant
import javax.sql.DataSource

private const val EXPECTED_HEADER = "device_id,lat,lng,timestamp"

/**
 * One-shot seed: load US states from GeoJSON, then stream the impressions CSV,
 * resolving each row's US state by point-in-polygon and bulk-loading via COPY.
 * The whole load runs in one transaction (truncate-and-reload), so it is
 * idempotent and all-or-nothing. Activated with the `seed` profile; the app
 * runs this and exits.
 */
@Component
@Profile("seed")
class SeedRunner(
    private val dataSource: DataSource,
    private val objectMapper: ObjectMapper,
    @param:Value("\${SEED_STATES_GEOJSON:assets/map.json}") private val statesPath: String,
    @param:Value("\${SEED_IMPRESSIONS_CSV:assets/impressions.csv}") private val csvPath: String,
) : CommandLineRunner {
    private val log = LoggerFactory.getLogger(javaClass)

    override fun run(vararg args: String) {
        val states = parseStates(File(statesPath))
        log.info("Parsed {} states from {}", states.size, statesPath)

        dataSource.connection.use { conn ->
            conn.autoCommit = false
            try {
                conn.createStatement().use { it.execute("TRUNCATE impressions, states RESTART IDENTITY CASCADE") }
                val resolver = insertStates(conn, states)
                val (total, unattributed) = copyImpressions(conn, resolver)
                conn.commit()
                refreshRollups(conn)
                conn.commit()
                val pct = if (total == 0L) 0.0 else unattributed * 100.0 / total
                log.info(
                    "Seed complete: {} states, {} impressions ({} unattributed to a state, {}%)",
                    states.size, total, unattributed, String.format(java.util.Locale.ROOT, "%.2f", pct),
                )
            } catch (e: Throwable) {
                runCatching { conn.rollback() }
                throw e
            }
        }
    }

    /** Recompute the pre-aggregated rollups from the freshly loaded data. */
    private fun refreshRollups(conn: Connection) {
        conn.createStatement().use { st ->
            for (view in Rollups.VIEWS) st.execute("REFRESH MATERIALIZED VIEW $view")
        }
        log.info("Refreshed {} rollup views", Rollups.VIEWS.size)
    }

    /** Insert every state name and return a resolver keyed by the generated ids. */
    private fun insertStates(conn: Connection, states: Map<String, List<List<Ring>>>): StateResolver {
        val nameToId = LinkedHashMap<String, Int>()
        conn.prepareStatement("INSERT INTO states(name) VALUES (?) RETURNING id").use { ps ->
            for (name in states.keys) {
                ps.setString(1, name)
                ps.executeQuery().use { rs ->
                    rs.next()
                    nameToId[name] = rs.getInt(1)
                }
            }
        }
        return StateResolver(states.map { (name, polys) -> nameToId.getValue(name) to StateShape(name, polys) })
    }

    /** Stream the CSV, geo-join each row, and bulk-load via COPY. Returns (total, unattributed). */
    private fun copyImpressions(conn: Connection, resolver: StateResolver): Pair<Long, Long> {
        val pg = conn.unwrap(PGConnection::class.java)
        val copy = PGCopyOutputStream(pg, "COPY impressions(device_id,lat,lng,ts,state_id) FROM STDIN WITH (FORMAT csv)")
        val out = BufferedWriter(OutputStreamWriter(copy, Charsets.UTF_8))
        var total = 0L
        var unattributed = 0L
        try {
            File(csvPath).bufferedReader().use { reader ->
                var lineNo = 0
                reader.forEachLine { line ->
                    lineNo++
                    if (lineNo == 1) {
                        require(line.trim() == EXPECTED_HEADER) {
                            "Unexpected CSV header at line 1: '${line.trim()}' (expected '$EXPECTED_HEADER')"
                        }
                        return@forEachLine
                    }
                    if (line.isBlank()) return@forEachLine
                    val f = line.split(',')
                    require(f.size == 4) { "Malformed row at line $lineNo: expected 4 fields, got ${f.size}" }
                    val deviceId = f[0].trim().toLongOrNull() ?: error("Bad device_id at line $lineNo: '${f[0]}'")
                    val lat = f[1].trim().toDoubleOrNull() ?: error("Bad lat at line $lineNo: '${f[1]}'")
                    val lng = f[2].trim().toDoubleOrNull() ?: error("Bad lng at line $lineNo: '${f[2]}'")
                    val epoch = f[3].trim().toLongOrNull() ?: error("Bad timestamp at line $lineNo: '${f[3]}'")
                    val stateId = resolver.resolve(lng, lat)
                    if (stateId == null) unattributed++
                    total++
                    out.append(deviceId.toString()).append(',')
                        .append(lat.toString()).append(',')
                        .append(lng.toString()).append(',')
                        .append(Instant.ofEpochSecond(epoch).toString()).append(',')
                        .append(stateId?.toString() ?: "").append('\n')
                    if (total % 50_000 == 0L) log.info("… {} rows processed", total)
                }
            }
            out.close() // completes the COPY (endCopy)
        } catch (e: Throwable) {
            // Abort the COPY so it does not flush partial rows; the caller rolls back.
            runCatching { copy.cancelCopy() }
            throw e
        }
        return total to unattributed
    }

    /** Group GeoJSON features by state name, accumulating each state's polygons. */
    private fun parseStates(file: File): LinkedHashMap<String, MutableList<List<Ring>>> {
        val root = objectMapper.readTree(file)
        val byName = LinkedHashMap<String, MutableList<List<Ring>>>()
        for ((featureIndex, feature) in root.get("features").withIndex()) {
            val props = feature.get("properties")
            val name = (props.get("level1") ?: props.get("name"))?.asString()
                ?: error("GeoJSON feature #$featureIndex has neither a level1 nor a name property")
            val geometry = feature.get("geometry")
            val coords = geometry.get("coordinates")
            val polygons: List<List<Ring>> = when (geometry.get("type").asString()) {
                "Polygon" -> listOf(parsePolygon(coords))
                "MultiPolygon" -> (0 until coords.size()).map { parsePolygon(coords.get(it)) }
                else -> emptyList()
            }
            byName.getOrPut(name) { mutableListOf() }.addAll(polygons)
        }
        return byName
    }

    private fun parsePolygon(node: JsonNode): List<Ring> =
        (0 until node.size()).map { r -> parseRing(node.get(r)) }

    private fun parseRing(node: JsonNode): Ring =
        (0 until node.size()).map { i ->
            val pt = node.get(i)
            doubleArrayOf(pt.get(0).asDouble(), pt.get(1).asDouble())
        }
}
