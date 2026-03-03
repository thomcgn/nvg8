-- Kinder: owner_einrichtung_org_unit_id darf NULL sein
ALTER TABLE kinder
    ALTER COLUMN owner_einrichtung_org_unit_id DROP NOT NULL;

-- falls du traeger_id auch nullable machen willst (meist NICHT sinnvoll):
-- ALTER TABLE kinder
--   ALTER COLUMN traeger_id DROP NOT NULL;