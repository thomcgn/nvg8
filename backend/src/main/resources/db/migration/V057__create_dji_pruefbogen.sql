-- DJI-Prüfbögen nach §8a SGB VIII (Kindler et al., DJI 2006)
-- Strukturierte klinische Einschätzungsinstrumente für Kinderschutzfallarbeit.
--
-- form_typ-Werte: SICHERHEITSEINSCHAETZUNG, RISIKOEINSCHAETZUNG,
--   ERZIEHUNGSFAEHIGKEIT_PFLEGE, ERZIEHUNGSFAEHIGKEIT_BINDUNG,
--   ERZIEHUNGSFAEHIGKEIT_REGELN, ERZIEHUNGSFAEHIGKEIT_FOERDERUNG,
--   BEDUERFNIS_SCHEMA, FOERDERUNGSBEDARF, RESSOURCEN_KIND, VERAENDERUNGSBEREITSCHAFT

CREATE TABLE dji_assessments (
    id                      BIGSERIAL    PRIMARY KEY,
    falloeffnung_id         BIGINT       NOT NULL REFERENCES falloeffnungen(id),
    traeger_id              BIGINT       NOT NULL REFERENCES traeger(id),
    einrichtung_org_unit_id BIGINT       NOT NULL REFERENCES org_units(id),
    form_typ                VARCHAR(60)  NOT NULL,
    bewertungsdatum         DATE         NOT NULL,
    gesamteinschaetzung     VARCHAR(60),
    gesamtfreitext          TEXT,
    created_by_user_id      BIGINT       NOT NULL REFERENCES users(id),
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_dji_assessment_fall    ON dji_assessments (falloeffnung_id);
CREATE INDEX ix_dji_assessment_traeger ON dji_assessments (traeger_id, einrichtung_org_unit_id);

-- Eine Zeile pro Kriterium / Domäne innerhalb eines Assessments.
-- bewertung_bool: für binäre Kriterien (Sicherheitseinschätzung)
-- bewertung_stufe: 0–5 für die 6-stufige Skala (Bedürfnis-Schema)
-- belege: Freitextfeld für Belege / fachliche Begründung (alle Formulare)
CREATE TABLE dji_positionen (
    id              BIGSERIAL    PRIMARY KEY,
    assessment_id   BIGINT       NOT NULL REFERENCES dji_assessments(id) ON DELETE CASCADE,
    position_code   VARCHAR(80)  NOT NULL,
    belege          TEXT,
    bewertung_bool  BOOLEAN,
    bewertung_stufe SMALLINT     CHECK (bewertung_stufe BETWEEN 0 AND 5),
    CONSTRAINT uk_dji_pos_assessment_code UNIQUE (assessment_id, position_code)
);

CREATE INDEX ix_dji_position_assessment ON dji_positionen (assessment_id);
