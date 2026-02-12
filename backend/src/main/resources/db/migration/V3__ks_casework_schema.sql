BEGIN;

-- ========================================
-- CASEWORK: InstrumentUse (Instanz im Fall)
-- ========================================
CREATE TABLE IF NOT EXISTS ks_instrument_use (
                                                 id BIGSERIAL PRIMARY KEY,

                                                 einschaetzung_id BIGINT NOT NULL,
                                                 instrument_id BIGINT NOT NULL REFERENCES ks_instrumente(id) ON DELETE RESTRICT,

    fachkraft_user_id BIGINT, -- optional (Kopfbereich "Fachkraft")

    started_at TIMESTAMP,
    completed_at TIMESTAMP
    );

-- FK auf deine bestehende Tabelle "gefaehrdung_einschaetzungen"
-- (Wenn die Tabelle anders heißt, hier anpassen!)
DO $$ BEGIN
ALTER TABLE ks_instrument_use
    ADD CONSTRAINT fk_ks_use_einschaetzung
        FOREIGN KEY (einschaetzung_id)
            REFERENCES gefaehrdung_einschaetzungen(id)
            ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- FK auf users
DO $$ BEGIN
ALTER TABLE ks_instrument_use
    ADD CONSTRAINT fk_ks_use_fachkraft
        FOREIGN KEY (fachkraft_user_id)
            REFERENCES users(id)
            ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Du willst pro Einschätzung ein Instrument i.d.R. nur einmal verwenden:
DO $$ BEGIN
ALTER TABLE ks_instrument_use
    ADD CONSTRAINT uq_ks_use_unique_per_einschaetzung UNIQUE (einschaetzung_id, instrument_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS ix_ks_use_einschaetzung ON ks_instrument_use(einschaetzung_id);
CREATE INDEX IF NOT EXISTS ix_ks_use_instrument ON ks_instrument_use(instrument_id);
CREATE INDEX IF NOT EXISTS ix_ks_use_fachkraft ON ks_instrument_use(fachkraft_user_id);

-- ========================================
-- CASEWORK: Item Answers
-- ========================================
CREATE TABLE IF NOT EXISTS ks_item_answers (
                                               id BIGSERIAL PRIMARY KEY,

                                               instrument_use_id BIGINT NOT NULL REFERENCES ks_instrument_use(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES ks_items(id) ON DELETE RESTRICT,

    -- Für TRI_STATE (JA/NEIN/UNBEKANNT)
    tri_state TEXT,

    -- Für TEXT/DATE/etc. (wir nutzen TEXT universell; Datum kann als ISO-String gespeichert werden,
    -- oder du ergänzt später ein echtes date_value Feld)
    text_value TEXT,

    kommentar TEXT,

    datenquelle TEXT,
    erhoben_am DATE
    );

-- Pro InstrumentUse genau eine Antwort pro Item:
DO $$ BEGIN
ALTER TABLE ks_item_answers
    ADD CONSTRAINT uq_ks_answer_unique_item UNIQUE (instrument_use_id, item_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS ix_ks_answers_use ON ks_item_answers(instrument_use_id);
CREATE INDEX IF NOT EXISTS ix_ks_answers_item ON ks_item_answers(item_id);

COMMIT;
