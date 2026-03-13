-- Schutzplan nach §8a SGB VIII
-- Strukturiertes Dokument mit Schutzmaßnahmen, Zuständigkeiten und Überprüfungsterminen.

CREATE TABLE schutzplaene (
    id                      BIGSERIAL    PRIMARY KEY,
    falloeffnung_id         BIGINT       NOT NULL REFERENCES falloeffnungen(id),
    traeger_id              BIGINT       NOT NULL REFERENCES traeger(id),
    einrichtung_org_unit_id BIGINT       NOT NULL REFERENCES org_units(id),

    erstellt_am             DATE         NOT NULL,
    gueltig_bis             DATE,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'AKTIV',  -- AKTIV, ABGESCHLOSSEN

    gefaehrdungssituation   TEXT,
    vereinbarungen          TEXT,
    beteiligte              TEXT,          -- freie Aufzählung beteiligter Personen
    naechster_termin        DATE,
    gesamtfreitext          TEXT,

    created_by_user_id      BIGINT       NOT NULL REFERENCES users(id),
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_schutzplan_fall    ON schutzplaene (falloeffnung_id);
CREATE INDEX ix_schutzplan_traeger ON schutzplaene (traeger_id, einrichtung_org_unit_id);

-- Einzelne Schutzmaßnahmen innerhalb eines Schutzplans
CREATE TABLE schutzplan_massnahmen (
    id              BIGSERIAL    PRIMARY KEY,
    schutzplan_id   BIGINT       NOT NULL REFERENCES schutzplaene(id) ON DELETE CASCADE,
    position        SMALLINT     NOT NULL,
    massnahme       TEXT         NOT NULL,
    verantwortlich  VARCHAR(200),
    bis_datum       DATE,
    status          VARCHAR(20)  NOT NULL DEFAULT 'OFFEN'  -- OFFEN, IN_UMSETZUNG, ERLEDIGT, NICHT_ERLEDIGT
);

CREATE INDEX ix_schutzplan_massnahme_plan ON schutzplan_massnahmen (schutzplan_id);
