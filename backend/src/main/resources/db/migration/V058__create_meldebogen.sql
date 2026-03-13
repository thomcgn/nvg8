-- Strukturierter Eingangserfassungsbogen für Kindeswohlgefährdungsmeldungen
-- nach DJI-Prüfbogen (Kindler et al. 2006), Fragen 48 und 68.
-- Ergänzt die bestehende Meldung-Dokumentation um ein standardisiertes Triage-Formular.

CREATE TABLE meldeboegen (
    id                              BIGSERIAL    PRIMARY KEY,
    falloeffnung_id                 BIGINT       NOT NULL REFERENCES falloeffnungen(id),
    traeger_id                      BIGINT       NOT NULL REFERENCES traeger(id),
    einrichtung_org_unit_id         BIGINT       NOT NULL REFERENCES org_units(id),

    -- Eingang
    eingangsdatum                   DATE         NOT NULL,
    erfassende_fachkraft            VARCHAR(200),

    -- Melder
    meldungart                      VARCHAR(30),   -- PERSOENLICH, TELEFONISCH, SCHRIFTLICH, EMAIL, ANONYM
    melder_name                     VARCHAR(200),
    melder_kontakt                  TEXT,
    melder_beziehung_kind           VARCHAR(200),
    melder_glaubwuerdigkeit         VARCHAR(20),   -- GUT, MITTEL, GERING

    -- Inhalt der Meldung
    schilderung                     TEXT,
    kind_aktueller_aufenthalt       TEXT,

    -- Belastungsmerkmale der Sorgeberechtigten (beobachtet / berichtet)
    belastung_koerperl_erkrankung   BOOLEAN      NOT NULL DEFAULT FALSE,
    belastung_psych_erkrankung      BOOLEAN      NOT NULL DEFAULT FALSE,
    belastung_sucht                 BOOLEAN      NOT NULL DEFAULT FALSE,
    belastung_haeusliche_gewalt     BOOLEAN      NOT NULL DEFAULT FALSE,
    belastung_suizidgefahr          BOOLEAN      NOT NULL DEFAULT FALSE,
    belastung_gewalttaetige_erz     BOOLEAN      NOT NULL DEFAULT FALSE,
    belastung_soziale_isolation     BOOLEAN      NOT NULL DEFAULT FALSE,
    belastung_sonstiges             TEXT,

    -- Ersteinschätzung Fachkraft
    ersteinschaetzung               VARCHAR(30),   -- KEINE, GERING, AKUT, CHRONISCH
    handlungsdringlichkeit          VARCHAR(30),   -- SOFORT, INNERHALB_24H, INNERHALB_WOCHE, SPAETER
    ersteinschaetzung_freitext      TEXT,

    created_by_user_id              BIGINT       NOT NULL REFERENCES users(id),
    created_at                      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_meldebogen_fall    ON meldeboegen (falloeffnung_id);
CREATE INDEX ix_meldebogen_traeger ON meldeboegen (traeger_id, einrichtung_org_unit_id);
