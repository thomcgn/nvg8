-- V020: Risk-Indikatoren pro Träger (konfigurierbar)

CREATE TABLE IF NOT EXISTS traeger_risk_indicators (
                                                       id            BIGSERIAL PRIMARY KEY,
                                                       traeger_id    BIGINT NOT NULL REFERENCES traeger(id) ON DELETE CASCADE,

    -- stabiler Key (wird in Observations/Tags referenziert)
                                                       indicator_id  VARCHAR(120) NOT NULL,

                                                       label         VARCHAR(220) NOT NULL,
                                                       description   TEXT,
                                                       category      VARCHAR(120),
                                                       enabled       BOOLEAN NOT NULL DEFAULT TRUE,
                                                       sort_order    INTEGER NOT NULL DEFAULT 0,

    -- optionaler Default (0..3), nur UI-Hilfe
                                                       default_severity SMALLINT,

                                                       created_at    TIMESTAMPTZ NOT NULL,
                                                       updated_at    TIMESTAMPTZ NOT NULL,

                                                       CONSTRAINT uk_traeger_indicator UNIQUE (traeger_id, indicator_id)
);

CREATE INDEX IF NOT EXISTS ix_tri_traeger ON traeger_risk_indicators(traeger_id);
CREATE INDEX IF NOT EXISTS ix_tri_traeger_enabled ON traeger_risk_indicators(traeger_id, enabled);
CREATE INDEX IF NOT EXISTS ix_tri_traeger_sort ON traeger_risk_indicators(traeger_id, sort_order);