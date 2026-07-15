package com.cuebiq.impressions

import com.cuebiq.impressions.impression.Rollups
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.PostgreSQLContainer

/**
 * Base for integration tests: a real PostgreSQL via Testcontainers, migrated by
 * Flyway from the shared db/migrations.
 *
 * The container is a singleton started once for the whole test JVM (not managed
 * by @Testcontainers, which would stop it after the first test class and leave
 * later classes unable to connect). Ryuk reaps it on JVM exit.
 *
 * These tests exercise the rollup path, and materialized views read *committed*
 * data — so the old rollback-per-test isolation no longer fits. Instead each test
 * starts from a truncated, freshly-refreshed (empty) baseline, inserts committed
 * rows, calls [refreshRollups], then asserts. That also makes the tests verify the
 * real production path: the view definitions and the refresh.
 */
@SpringBootTest
abstract class IntegrationTestBase {
    @Autowired
    protected lateinit var jdbcClient: JdbcClient

    /** Reset to an empty, refreshed baseline before every test. */
    @BeforeEach
    fun resetToEmpty() {
        jdbcClient.sql("TRUNCATE impressions, states RESTART IDENTITY CASCADE").update()
        Rollups.refresh(jdbcClient)
    }

    /** Recompute the rollups so just-inserted rows become visible to the reads. */
    protected fun refreshRollups() = Rollups.refresh(jdbcClient)

    companion object {
        @JvmStatic
        val postgres: PostgreSQLContainer<*> = PostgreSQLContainer("postgres:16").apply { start() }

        @DynamicPropertySource
        @JvmStatic
        fun properties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
            // The app leaves Flyway to the dedicated migration step; enable it here
            // and point it at the shared migrations so the test DB gets the schema.
            registry.add("spring.flyway.enabled") { "true" }
            registry.add("spring.flyway.locations") { "filesystem:../../db/migrations" }
        }
    }
}
