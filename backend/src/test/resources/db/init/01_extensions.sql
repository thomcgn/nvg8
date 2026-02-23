-- FILE: src/test/resources/db/init/01_extensions.sql
-- Runs BEFORE Flyway migrations (because we call withInitScript from Testcontainers)

CREATE EXTENSION IF NOT EXISTS pgcrypto;