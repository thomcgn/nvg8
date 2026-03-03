CREATE TABLE IF NOT EXISTS fall_meldung_version_seq (
                                                        falloeffnung_id BIGINT PRIMARY KEY,
                                                        next_value INTEGER NOT NULL,
                                                        CONSTRAINT fk_fmvs_fall
                                                            FOREIGN KEY (falloeffnung_id) REFERENCES falloeffnungen(id)
                                                                ON DELETE CASCADE
);

-- Backfill: next_value = max(version_no)+1, sonst 1
INSERT INTO fall_meldung_version_seq (falloeffnung_id, next_value)
SELECT f.id, COALESCE(MAX(m.version_no), 0) + 1
FROM falloeffnungen f
         LEFT JOIN meldungen m ON m.falloeffnung_id = f.id
GROUP BY f.id
ON CONFLICT (falloeffnung_id) DO NOTHING;