-- Hausbesuchsprotokoll für §8a SGB VIII Fallarbeit
-- Strukturierte Dokumentation von Hausbesuchen mit Beobachtungen zu Wohnsituation,
-- Kind und Bezugspersonen sowie Gesamteinschätzung.

CREATE TABLE hausbesuche (
    id                      BIGSERIAL    PRIMARY KEY,
    falloeffnung_id         BIGINT       NOT NULL REFERENCES falloeffnungen(id),
    traeger_id              BIGINT       NOT NULL REFERENCES traeger(id),
    einrichtung_org_unit_id BIGINT       NOT NULL REFERENCES org_units(id),

    besuchsdatum            DATE         NOT NULL,
    besuchszeit_von         TIME,
    besuchszeit_bis         TIME,
    anwesende               TEXT,

    -- Wohnsituation
    whg_ordnung             VARCHAR(20),  -- GUT, AUSREICHEND, MANGELHAFT
    whg_hygiene             VARCHAR(20),  -- GUT, AUSREICHEND, MANGELHAFT
    whg_nahrungsversorgung  VARCHAR(20),  -- GUT, AUSREICHEND, MANGELHAFT
    whg_unfallgefahren      TEXT,
    whg_sonstiges           TEXT,

    -- Kind-Beobachtungen
    kind_erscheinungsbild   TEXT,
    kind_verhalten          TEXT,
    kind_stimmung           VARCHAR(30),  -- FREUDIG, AUSGEGLICHEN, ZURUECKGEZOGEN, AENGSTLICH, AUFFAELLIG
    kind_aeusserungen       TEXT,
    kind_hinweise_gefaehrdung TEXT,

    -- Bezugspersonen-Beobachtungen
    bp_erscheinungsbild     TEXT,
    bp_verhalten            TEXT,
    bp_umgang_kind          TEXT,
    bp_kooperation          VARCHAR(20),  -- GUT, EINGESCHRAENKT, VERWEIGERT

    -- Gesamteinschätzung
    einschaetzung_ampel     VARCHAR(10),  -- GRUEN, GELB, ROT
    einschaetzung_text      TEXT,
    naechste_schritte       TEXT,
    naechster_termin        DATE,

    created_by_user_id      BIGINT       NOT NULL REFERENCES users(id),
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_hausbesuch_fall    ON hausbesuche (falloeffnung_id);
CREATE INDEX ix_hausbesuch_traeger ON hausbesuche (traeger_id, einrichtung_org_unit_id);
