-- Add soft-delete support to bezugspersonen table
ALTER TABLE bezugspersonen
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS ix_bezug_traeger_deleted ON bezugspersonen (traeger_id, deleted_at);
CREATE INDEX IF NOT EXISTS ix_bezug_einr_deleted ON bezugspersonen (owner_einrichtung_org_unit_id, deleted_at);
