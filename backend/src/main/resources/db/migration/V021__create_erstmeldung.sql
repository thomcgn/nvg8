-- Flyway migration V021 - §8a Erstmeldung (versioniert) + Child-Tabellen
-- Postgres required (partial unique index)

-- ============================================================
-- 1) Haupttabelle: Erstmeldungen (versioniert, current-Flag)
-- ============================================================
CREATE TABLE IF NOT EXISTS falloeffnung_erstmeldungen (
                                                          id BIGSERIAL PRIMARY KEY,

                                                          falloeffnung_id BIGINT NOT NULL REFERENCES falloeffnungen(id) ON DELETE CASCADE,

                                                          version_no INT NOT NULL,
                                                          is_current BOOLEAN NOT NULL DEFAULT FALSE,

                                                          supersedes_id BIGINT NULL REFERENCES falloeffnung_erstmeldungen(id),

                                                          status VARCHAR(40) NOT NULL, -- ENTWURF|IN_BEARBEITUNG|ABGESCHLOSSEN

                                                          erfasst_am TIMESTAMPTZ NOT NULL,
                                                          erfasst_von_user_id BIGINT NOT NULL REFERENCES users(id),

                                                          erfasst_von_rolle VARCHAR(80) NOT NULL,
                                                          meldeweg VARCHAR(80) NOT NULL,
                                                          meldeweg_sonstiges TEXT NULL,
                                                          meldende_stelle_kontakt TEXT NULL,
                                                          dringlichkeit VARCHAR(40) NOT NULL,

                                                          datenbasis VARCHAR(80) NOT NULL,
                                                          einwilligung_vorhanden BOOLEAN NULL,
                                                          schweigepflichtentbindung_vorhanden BOOLEAN NULL,

                                                          kurzbeschreibung TEXT NOT NULL,

    -- Fachliche Einschätzung
                                                          fach_ampel VARCHAR(20) NULL, -- GRUEN|GELB|ROT|UNKLAR
                                                          fach_text TEXT NULL,
                                                          abweichung_zur_auto VARCHAR(40) NULL, -- KEINE|HOEHERE_DRINGLICHKEIT|GERINGERE_DRINGLICHKEIT
                                                          abweichungs_begruendung TEXT NULL,

    -- Akutcheck
                                                          akut_gefahr_im_verzug BOOLEAN NOT NULL DEFAULT FALSE,
                                                          akut_begruendung TEXT NULL,
                                                          akut_notruf_erforderlich BOOLEAN NULL,
                                                          akut_kind_sicher_untergebracht VARCHAR(20) NULL, -- JA|NEIN|UNKLAR

    -- Auto-Bewertung Snapshot (optional)
                                                          auto_risk_snapshot_id BIGINT NULL REFERENCES falloeffnung_risk_snapshots(id),

    -- Abschluss / Verantwortlichkeit
                                                          submitted_at TIMESTAMPTZ NULL,
                                                          submitted_by_user_id BIGINT NULL REFERENCES users(id),
                                                          freigabe_am TIMESTAMPTZ NULL,
                                                          freigabe_von_user_id BIGINT NULL REFERENCES users(id),
                                                          verantwortliche_fachkraft_user_id BIGINT NULL REFERENCES users(id),
                                                          naechste_ueberpruefung_am DATE NULL,
                                                          zusammenfassung TEXT NULL,

                                                          created_at TIMESTAMPTZ NOT NULL,
                                                          updated_at TIMESTAMPTZ NOT NULL,

                                                          CONSTRAINT uq_erstmeldung_version UNIQUE (falloeffnung_id, version_no)
);

-- Pro Fall max. eine aktuelle Version (Partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS uq_erstmeldung_current_per_fall
    ON falloeffnung_erstmeldungen (falloeffnung_id)
    WHERE is_current = TRUE;

CREATE INDEX IF NOT EXISTS ix_erstmeldung_fall_version_desc
    ON falloeffnung_erstmeldungen (falloeffnung_id, version_no DESC);

CREATE INDEX IF NOT EXISTS ix_erstmeldung_fall_current
    ON falloeffnung_erstmeldungen (falloeffnung_id, is_current);

-- ============================================================
-- 2) Anlass-Zuordnung je Erstmeldung
-- ============================================================
CREATE TABLE IF NOT EXISTS falloeffnung_erstmeldung_anlaesse (
                                                                 erstmeldung_id BIGINT NOT NULL REFERENCES falloeffnung_erstmeldungen(id) ON DELETE CASCADE,
                                                                 code VARCHAR(80) NOT NULL,
                                                                 created_at TIMESTAMPTZ NOT NULL,
                                                                 updated_at TIMESTAMPTZ NOT NULL,
                                                                 CONSTRAINT pk_erstmeldung_anlass PRIMARY KEY (erstmeldung_id, code)
);

CREATE INDEX IF NOT EXISTS ix_erstmeldung_anlass_code
    ON falloeffnung_erstmeldung_anlaesse (code);

-- ============================================================
-- 3) Observations (strukturierte Erstbeobachtungen)
-- ============================================================
CREATE TABLE IF NOT EXISTS falloeffnung_erstmeldung_observations (
                                                                     id BIGSERIAL PRIMARY KEY,
                                                                     erstmeldung_id BIGINT NOT NULL REFERENCES falloeffnung_erstmeldungen(id) ON DELETE CASCADE,

                                                                     zeitpunkt TIMESTAMPTZ NULL,
                                                                     zeitraum VARCHAR(40) NULL,
                                                                     ort VARCHAR(40) NULL,
                                                                     ort_sonstiges TEXT NULL,
                                                                     quelle VARCHAR(40) NOT NULL,
                                                                     text TEXT NOT NULL,
                                                                     woertliches_zitat TEXT NULL,
                                                                     koerperbefund TEXT NULL,
                                                                     verhalten_kind TEXT NULL,
                                                                     verhalten_bezug TEXT NULL,
                                                                     sichtbarkeit VARCHAR(40) NOT NULL,

                                                                     linked_notiz_id BIGINT NULL REFERENCES falloeffnung_notizen(id),

                                                                     created_at TIMESTAMPTZ NOT NULL,
                                                                     updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_erstmeldung_obs_erstmeldung
    ON falloeffnung_erstmeldung_observations (erstmeldung_id);

-- ============================================================
-- 4) Observation Tags (Anlass + 0..n Indikator/Severity)
-- ============================================================
CREATE TABLE IF NOT EXISTS falloeffnung_erstmeldung_observation_tags (
                                                                         id BIGSERIAL PRIMARY KEY,
                                                                         observation_id BIGINT NOT NULL REFERENCES falloeffnung_erstmeldung_observations(id) ON DELETE CASCADE,

                                                                         anlass_code VARCHAR(80) NULL,
                                                                         indicator_id VARCHAR(80) NULL,
                                                                         severity INT NULL,
                                                                         comment TEXT NULL,

                                                                         created_at TIMESTAMPTZ NOT NULL,
                                                                         updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_erstmeldung_obs_tag_obs
    ON falloeffnung_erstmeldung_observation_tags (observation_id);

CREATE INDEX IF NOT EXISTS ix_erstmeldung_obs_tag_anlass
    ON falloeffnung_erstmeldung_observation_tags (anlass_code);

CREATE INDEX IF NOT EXISTS ix_erstmeldung_obs_tag_indicator
    ON falloeffnung_erstmeldung_observation_tags (indicator_id);

-- ============================================================
-- 5) Kontakte / Gespräche
-- ============================================================
CREATE TABLE IF NOT EXISTS falloeffnung_erstmeldung_contacts (
                                                                 id BIGSERIAL PRIMARY KEY,
                                                                 erstmeldung_id BIGINT NOT NULL REFERENCES falloeffnung_erstmeldungen(id) ON DELETE CASCADE,

                                                                 kontakt_mit VARCHAR(40) NOT NULL,
                                                                 kontakt_am TIMESTAMPTZ NULL,
                                                                 status VARCHAR(40) NOT NULL,
                                                                 notiz TEXT NULL,
                                                                 ergebnis TEXT NULL,

                                                                 created_at TIMESTAMPTZ NOT NULL,
                                                                 updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_erstmeldung_contacts_erstmeldung
    ON falloeffnung_erstmeldung_contacts (erstmeldung_id);

-- ============================================================
-- 6) Jugendamt-Entscheidung (0..1)
-- ============================================================
CREATE TABLE IF NOT EXISTS falloeffnung_erstmeldung_jugendamt (
                                                                  erstmeldung_id BIGINT PRIMARY KEY REFERENCES falloeffnung_erstmeldungen(id) ON DELETE CASCADE,

                                                                  informiert VARCHAR(40) NOT NULL, -- JA|NEIN|NOCH_NICHT_ENTSCHIEDEN
                                                                  kontakt_am TIMESTAMPTZ NULL,
                                                                  kontaktart VARCHAR(40) NULL,
                                                                  aktenzeichen TEXT NULL,
                                                                  begruendung TEXT NULL,

                                                                  created_at TIMESTAMPTZ NOT NULL,
                                                                  updated_at TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- 7) Externe Stellen informiert
-- ============================================================
CREATE TABLE IF NOT EXISTS falloeffnung_erstmeldung_extern (
                                                               id BIGSERIAL PRIMARY KEY,
                                                               erstmeldung_id BIGINT NOT NULL REFERENCES falloeffnung_erstmeldungen(id) ON DELETE CASCADE,

                                                               stelle VARCHAR(40) NOT NULL,
                                                               stelle_sonstiges TEXT NULL,
                                                               am TIMESTAMPTZ NULL,
                                                               begruendung TEXT NULL,
                                                               ergebnis TEXT NULL,

                                                               created_at TIMESTAMPTZ NOT NULL,
                                                               updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_erstmeldung_extern_erstmeldung
    ON falloeffnung_erstmeldung_extern (erstmeldung_id);

-- ============================================================
-- 8) Attachments (optional)
--   file_id absichtlich ohne FK, damit ihr eure Storage-Tabelle frei lassen könnt.
-- ============================================================
CREATE TABLE IF NOT EXISTS falloeffnung_erstmeldung_attachments (
                                                                    id BIGSERIAL PRIMARY KEY,
                                                                    erstmeldung_id BIGINT NOT NULL REFERENCES falloeffnung_erstmeldungen(id) ON DELETE CASCADE,

                                                                    file_id BIGINT NOT NULL,
                                                                    typ VARCHAR(40) NOT NULL,
                                                                    titel TEXT NULL,
                                                                    beschreibung TEXT NULL,
                                                                    sichtbarkeit VARCHAR(40) NOT NULL,
                                                                    rechtsgrundlage_hinweis TEXT NULL,

                                                                    created_at TIMESTAMPTZ NOT NULL,
                                                                    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_erstmeldung_attachments_erstmeldung
    ON falloeffnung_erstmeldung_attachments (erstmeldung_id);