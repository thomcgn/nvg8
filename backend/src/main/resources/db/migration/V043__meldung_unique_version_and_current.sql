-- V043__meldung_unique_version_and_current.sql
-- PostgreSQL / Flyway
--
-- In V024 exists already: unique (falloeffnung_id, version_no)
-- Missing: only ONE current=true per fall (partial unique)

CREATE UNIQUE INDEX IF NOT EXISTS ux_meldungen_fall_current_true
    ON meldungen (falloeffnung_id)
    WHERE current IS TRUE;