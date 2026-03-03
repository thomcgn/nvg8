-- Optimistic Locking (JPA @Version)
ALTER TABLE meldungen
    ADD COLUMN row_version BIGINT NOT NULL DEFAULT 0;
