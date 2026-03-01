-- Flyway migration V034
-- Add fall_no per dossier (Akte) to support multiple cases per child in a stable order.

ALTER TABLE falloeffnungen
ADD COLUMN IF NOT EXISTS fall_no INTEGER;

-- Backfill fall_no for existing rows:
-- Number cases per dossier by opened_at (then id) starting at 1.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY dossier_id ORDER BY opened_at ASC, id ASC) AS rn
  FROM falloeffnungen
  WHERE fall_no IS NULL
)
UPDATE falloeffnungen f
SET fall_no = ranked.rn
FROM ranked
WHERE f.id = ranked.id;

-- Make fall_no mandatory
ALTER TABLE falloeffnungen
ALTER COLUMN fall_no SET NOT NULL;

-- Ensure uniqueness per dossier
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_fall_dossier_fallno'
  ) THEN
    ALTER TABLE falloeffnungen
    ADD CONSTRAINT uk_fall_dossier_fallno UNIQUE (dossier_id, fall_no);
  END IF;
END $$;

-- Helpful index for listing cases per Akte
CREATE INDEX IF NOT EXISTS ix_falloeffnungen_dossier_opened
ON falloeffnungen(dossier_id, opened_at DESC, id DESC);

-- Helpful index for “all cases of a child within traeger”
CREATE INDEX IF NOT EXISTS ix_falloeffnungen_traeger_dossier
ON falloeffnungen(traeger_id, dossier_id);