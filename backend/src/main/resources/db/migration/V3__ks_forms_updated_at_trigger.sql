BEGIN;

CREATE OR REPLACE FUNCTION set_updated_at_ts()
    RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ks_form_instances_updated_at ON ks_form_instances;
CREATE TRIGGER trg_ks_form_instances_updated_at
    BEFORE UPDATE ON ks_form_instances
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at_ts();

COMMIT;
