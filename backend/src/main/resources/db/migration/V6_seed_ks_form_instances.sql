-- ============================================================
-- Ausgefüllte Form-Instanz je Fall + Instrument-Version
-- ============================================================
CREATE TABLE IF NOT EXISTS ks_form_instances (
                                                 id BIGSERIAL PRIMARY KEY,
                                                 fall_id BIGINT NOT NULL REFERENCES kinderschutz_faelle(id) ON DELETE CASCADE,

                                                 instrument_code VARCHAR(64) NOT NULL,
                                                 instrument_version VARCHAR(32) NOT NULL,

                                                 status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',

                                                 created_at TIMESTAMP NOT NULL DEFAULT now(),
                                                 created_by BIGINT NULL,
                                                 updated_at TIMESTAMP NOT NULL DEFAULT now(),
                                                 updated_by BIGINT NULL
);

CREATE INDEX IF NOT EXISTS idx_ks_form_instances_fall ON ks_form_instances(fall_id);
CREATE INDEX IF NOT EXISTS idx_ks_form_instances_instr ON ks_form_instances(instrument_code, instrument_version);


-- ============================================================
-- Antworten je Item
-- tri_state: 'JA' | 'NEIN' | 'UNBEKANNT'
-- value_* je nach AnswerType
-- ============================================================
CREATE TABLE IF NOT EXISTS ks_form_answers (
                                               id BIGSERIAL PRIMARY KEY,
                                               instance_id BIGINT NOT NULL REFERENCES ks_form_instances(id) ON DELETE CASCADE,
                                               item_id BIGINT NOT NULL REFERENCES ks_items(id) ON DELETE RESTRICT,

                                               tri_state VARCHAR(16) NULL,
                                               value_text TEXT NULL,
                                               value_date DATE NULL,
                                               value_user_ref VARCHAR(255) NULL,

                                               comment TEXT NULL,

                                               updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ks_form_answers_instance_item
    ON ks_form_answers(instance_id, item_id);
