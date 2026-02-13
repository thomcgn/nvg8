BEGIN;

-- ============================================================
-- ks_form_instances (passt zu KSFormInstance extends AuditableEntity)
-- ============================================================
CREATE TABLE IF NOT EXISTS ks_form_instances (
                                                 id BIGSERIAL PRIMARY KEY,

    -- Optimistic Lock (JPA @Version)
                                                 version BIGINT,

                                                 fall_id BIGINT NOT NULL,
                                                 instrument_id BIGINT NOT NULL,

                                                 status TEXT NOT NULL DEFAULT 'DRAFT',

    -- AuditableEntity (createdAt/updatedAt -> created_at/updated_at bei Standard Naming)
                                                 created_at TIMESTAMP,
                                                 updated_at TIMESTAMP,

                                                 CONSTRAINT fk_ks_form_instance_fall
                                                     FOREIGN KEY (fall_id) REFERENCES kinderschutz_faelle(id) ON DELETE CASCADE,

                                                 CONSTRAINT fk_ks_form_instance_instrument
                                                     FOREIGN KEY (instrument_id) REFERENCES ks_instrumente(id) ON DELETE RESTRICT,

                                                 CONSTRAINT uq_ks_form_instance_fall_instrument UNIQUE (fall_id, instrument_id),

                                                 CONSTRAINT chk_ks_form_instances_status CHECK (status IN ('DRAFT','SUBMITTED','LOCKED'))
);

CREATE INDEX IF NOT EXISTS idx_ks_form_instances_fall
    ON ks_form_instances (fall_id);

CREATE INDEX IF NOT EXISTS idx_ks_form_instances_instrument
    ON ks_form_instances (instrument_id);


-- ============================================================
-- ks_form_answers (passt zu KSFormAnswer)
-- ============================================================
CREATE TABLE IF NOT EXISTS ks_form_answers (
                                               id BIGSERIAL PRIMARY KEY,

                                               instance_id BIGINT NOT NULL REFERENCES ks_form_instances(id) ON DELETE CASCADE,
                                               item_id     BIGINT NOT NULL REFERENCES ks_items(id) ON DELETE RESTRICT,

    -- @Lob String -> TEXT
                                               value_string TEXT,

                                               CONSTRAINT uq_instance_item UNIQUE (instance_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_ks_form_answers_instance
    ON ks_form_answers (instance_id);

CREATE INDEX IF NOT EXISTS idx_ks_form_answers_item
    ON ks_form_answers (item_id);

COMMIT;
