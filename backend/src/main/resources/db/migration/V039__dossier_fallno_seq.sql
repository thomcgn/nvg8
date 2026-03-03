-- Race-safe fall_no pro Dossier via Sequenz-Tabelle + Locking
-- Postgres

-- 1) Sequenz-Tabelle pro Dossier
CREATE TABLE IF NOT EXISTS dossier_fallno_seq (
    dossier_id BIGINT PRIMARY KEY,
    next_value INTEGER NOT NULL,
    CONSTRAINT fk_dossier_fallno_seq_dossier
        FOREIGN KEY (dossier_id) REFERENCES kind_dossiers(id) ON DELETE CASCADE
);

-- 2) Backfill: für bestehende Dossiers next_value = max(fall_no)+1, sonst 1
INSERT INTO dossier_fallno_seq (dossier_id, next_value)
SELECT
    d.id AS dossier_id,
    COALESCE(MAX(f.fall_no), 0) + 1 AS next_value
FROM kind_dossiers d
LEFT JOIN falloeffnungen f ON f.dossier_id = d.id
GROUP BY d.id
ON CONFLICT (dossier_id) DO NOTHING;

-- 3) Safety-Net: Unique pro Dossier + fall_no
-- (Falls das bereits existiert, harmless)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uk_falloeffnungen_dossier_fallno'
    ) THEN
        ALTER TABLE falloeffnungen
            ADD CONSTRAINT uk_falloeffnungen_dossier_fallno UNIQUE (dossier_id, fall_no);
    END IF;
END $$;