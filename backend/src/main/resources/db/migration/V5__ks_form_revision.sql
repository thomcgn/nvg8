BEGIN;

CREATE TABLE IF NOT EXISTS ks_form_answer_revisions (
                                                        id BIGSERIAL PRIMARY KEY,

                                                        instance_id BIGINT NOT NULL REFERENCES ks_form_instances(id) ON DELETE CASCADE,
                                                        instance_version BIGINT NOT NULL,

                                                        item_id BIGINT NOT NULL REFERENCES ks_items(id) ON DELETE RESTRICT,

                                                        value_string TEXT,
                                                        changed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ks_far_instance_version
    ON ks_form_answer_revisions (instance_id, instance_version);

CREATE INDEX IF NOT EXISTS idx_ks_far_item
    ON ks_form_answer_revisions (item_id);

COMMIT;