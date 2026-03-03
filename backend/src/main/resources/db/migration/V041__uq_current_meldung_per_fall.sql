-- Nur eine current Meldung pro Fall (Postgres partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS uq_meldung_current_per_fall
    ON meldungen (falloeffnung_id)
    WHERE current = true;