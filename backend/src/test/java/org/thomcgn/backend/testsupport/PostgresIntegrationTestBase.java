// FILE: src/test/java/org/thomcgn/backend/testsupport/PostgresIntegrationTestBase.java
package org.thomcgn.backend.testsupport;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Base class for integration tests that need a real PostgreSQL.
 *
 * Behavior:
 * - If Docker is available: starts a Postgres Testcontainer and wires Spring datasource props.
 * - If Docker is NOT available: skips tests (does not crash the JVM via static init errors).
 */
public abstract class PostgresIntegrationTestBase {

    private static final DockerImageName POSTGRES_IMAGE = DockerImageName.parse("postgres:16-alpine");

    private static PostgreSQLContainer<?> postgres;

    @BeforeAll
    static void startPostgresOrSkip() {
        boolean dockerAvailable = isDockerAvailable();

        // Skip entire test class if Docker isn't available
        Assumptions.assumeTrue(dockerAvailable, "Docker not available: skipping PostgreSQL integration tests.");

        if (postgres == null) {
            postgres = new PostgreSQLContainer<>(POSTGRES_IMAGE)
                    .withDatabaseName("testdb")
                    .withUsername("test")
                    .withPassword("test");
            postgres.start();
        }
    }

    @DynamicPropertySource
    static void datasourceProps(DynamicPropertyRegistry registry) {
        boolean dockerAvailable = isDockerAvailable();
        Assumptions.assumeTrue(dockerAvailable, "Docker not available: skipping PostgreSQL integration tests.");

        registry.add("spring.datasource.url", () -> postgres.getJdbcUrl());
        registry.add("spring.datasource.username", () -> postgres.getUsername());
        registry.add("spring.datasource.password", () -> postgres.getPassword());

        // Optional but often useful in tests
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
    }

    private static boolean isDockerAvailable() {
        try {
            DockerClientFactory.instance().client();
            return true;
        } catch (Throwable ignored) {
            return false;
        }
    }
}