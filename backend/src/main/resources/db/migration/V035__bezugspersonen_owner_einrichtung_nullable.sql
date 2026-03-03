-- Bezugspersonen: owner_einrichtung_org_unit_id darf NULL sein
ALTER TABLE bezugspersonen
  ALTER COLUMN owner_einrichtung_org_unit_id DROP NOT NULL;

-- falls traeger_id auch nullable sein soll (meist NICHT empfehlenswert):
-- ALTER TABLE bezugspersonen
--   ALTER COLUMN traeger_id DROP NOT NULL;