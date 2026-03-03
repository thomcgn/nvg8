-- KindDossiers/Akten: von "Traeger-scope" auf "Einrichtungs-scope" umstellen.
-- Ziel: Kita kann nicht ohne weiteres Schulakten sehen, obwohl beide unter demselben Traeger liegen.

-- 1) Neue Spalte
ALTER TABLE kind_dossiers
    ADD COLUMN einrichtung_org_unit_id BIGINT;

-- 2) Backfill: bevorzugt über Kind.owner_einrichtung_org_unit_id (falls vorhanden)
UPDATE kind_dossiers d
SET einrichtung_org_unit_id = k.owner_einrichtung_org_unit_id
FROM kinder k
WHERE k.id = d.kind_id
  AND k.owner_einrichtung_org_unit_id IS NOT NULL
  AND d.einrichtung_org_unit_id IS NULL;

-- 3) Fallback: wenn Kind keine owner_einrichtung hat, nimm "erste" EINRICHTUNG-OrgUnit des Traegers
-- (dev-/seed-freundlich; in Prod solltest du hier sauber migrieren)
UPDATE kind_dossiers d
SET einrichtung_org_unit_id = (
    SELECT ou.id
    FROM org_units ou
    WHERE ou.traeger_id = d.traeger_id
      AND ou.type = 'EINRICHTUNG'
    ORDER BY ou.id
    LIMIT 1
)
WHERE d.einrichtung_org_unit_id IS NULL;

-- 4) NOT NULL + FK
ALTER TABLE kind_dossiers
    ALTER COLUMN einrichtung_org_unit_id SET NOT NULL;

ALTER TABLE kind_dossiers
    ADD CONSTRAINT fk_kind_dossiers_einrichtung_org_unit
        FOREIGN KEY (einrichtung_org_unit_id) REFERENCES org_units(id);

-- 5) Alte Unique/Index (Traeger) entfernen
ALTER TABLE kind_dossiers
    DROP CONSTRAINT IF EXISTS uk_dossier_traeger_kind;

DROP INDEX IF EXISTS ix_dossier_traeger;

-- 6) Neue Unique/Index (Einrichtung)
ALTER TABLE kind_dossiers
    ADD CONSTRAINT uk_dossier_einrichtung_kind
        UNIQUE (einrichtung_org_unit_id, kind_id);

CREATE INDEX IF NOT EXISTS ix_dossier_einrichtung
    ON kind_dossiers(einrichtung_org_unit_id);

-- 7) OPTIONAL: traeger_id in kind_dossiers entfernen, wenn du wirklich nur noch EINRICHTUNG scopen willst.
-- ACHTUNG: erst ausführen, wenn du sicher bist, dass kein Code/SQL mehr traeger_id nutzt.
-- ALTER TABLE kind_dossiers DROP COLUMN traeger_id;