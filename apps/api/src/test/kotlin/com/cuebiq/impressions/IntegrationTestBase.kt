package com.cuebiq.impressions

import org.springframework.boot.test.context.SpringBootTest
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
 */
@SpringBootTest
abstract class IntegrationTestBase {
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
