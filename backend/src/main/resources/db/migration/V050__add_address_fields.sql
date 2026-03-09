-- V050: Adress- und Kontaktfelder für Träger und OrgUnits

-- akten_prefix nullable machen (war fälschlicherweise NOT NULL ohne Default)
ALTER TABLE traeger ALTER COLUMN akten_prefix DROP NOT NULL;

-- Träger: Adresse + Kontakt
ALTER TABLE traeger ADD COLUMN IF NOT EXISTS strasse          VARCHAR(200);
ALTER TABLE traeger ADD COLUMN IF NOT EXISTS hausnummer       VARCHAR(20);
ALTER TABLE traeger ADD COLUMN IF NOT EXISTS plz              VARCHAR(10);
ALTER TABLE traeger ADD COLUMN IF NOT EXISTS ort              VARCHAR(100);
ALTER TABLE traeger ADD COLUMN IF NOT EXISTS leitung          VARCHAR(200);
ALTER TABLE traeger ADD COLUMN IF NOT EXISTS ansprechpartner  VARCHAR(200);

-- OrgUnits: Adresse + Kontakt (sinnvoll für Einrichtungen und Standorte)
ALTER TABLE org_units ADD COLUMN IF NOT EXISTS strasse          VARCHAR(200);
ALTER TABLE org_units ADD COLUMN IF NOT EXISTS hausnummer       VARCHAR(20);
ALTER TABLE org_units ADD COLUMN IF NOT EXISTS plz              VARCHAR(10);
ALTER TABLE org_units ADD COLUMN IF NOT EXISTS ort              VARCHAR(100);
ALTER TABLE org_units ADD COLUMN IF NOT EXISTS leitung          VARCHAR(200);
ALTER TABLE org_units ADD COLUMN IF NOT EXISTS ansprechpartner  VARCHAR(200);
