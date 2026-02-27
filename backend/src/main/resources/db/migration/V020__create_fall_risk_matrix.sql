-- Flyway migration V020

-- ============================================
-- 1) Anlass am Fall (Mehrfachauswahl)
-- ============================================
CREATE TABLE IF NOT EXISTS falloeffnung_anlaesse (
                                                     falloeffnung_id BIGINT      NOT NULL,
                                                     code            VARCHAR(80) NOT NULL,
                                                     created_at      TIMESTAMPTZ NOT NULL,
                                                     updated_at      TIMESTAMPTZ NOT NULL,

                                                     CONSTRAINT pk_fall_anlass PRIMARY KEY (falloeffnung_id, code),
                                                     CONSTRAINT fk_fall_anlass_fall FOREIGN KEY (falloeffnung_id) REFERENCES falloeffnungen(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_fall_anlass_code ON falloeffnung_anlaesse (code);

-- ============================================
-- 2) Notiz-Tags (Anlass + 0..n Indikator/Severity)
-- ============================================
CREATE TABLE IF NOT EXISTS falloeffnung_notiz_tags (
                                                       id         BIGSERIAL PRIMARY KEY,
                                                       notiz_id   BIGINT      NOT NULL,
                                                       anlass_code VARCHAR(80),
                                                       indicator_id VARCHAR(80),
                                                       severity   INT,
                                                       created_at TIMESTAMPTZ NOT NULL,
                                                       updated_at TIMESTAMPTZ NOT NULL,

                                                       CONSTRAINT fk_fall_notiz_tag_notiz FOREIGN KEY (notiz_id) REFERENCES falloeffnung_notizen(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_fall_notiz_tag_notiz    ON falloeffnung_notiz_tags (notiz_id);
CREATE INDEX IF NOT EXISTS ix_fall_notiz_tag_anlass   ON falloeffnung_notiz_tags (anlass_code);
CREATE INDEX IF NOT EXISTS ix_fall_notiz_tag_indicator ON falloeffnung_notiz_tags (indicator_id);

-- ============================================
-- 3) Traeger-Config (versioniert, aktiv)
-- ============================================
CREATE TABLE IF NOT EXISTS traeger_risk_matrix_configs (
                                                           id                BIGSERIAL PRIMARY KEY,
                                                           traeger_id        BIGINT      NOT NULL,
                                                           version           VARCHAR(40) NOT NULL,
                                                           active            BOOLEAN     NOT NULL DEFAULT FALSE,
                                                           config_json       TEXT        NOT NULL,
                                                           created_by_user_id BIGINT     NOT NULL,

                                                           created_at        TIMESTAMPTZ NOT NULL,
                                                           updated_at        TIMESTAMPTZ NOT NULL,

                                                           CONSTRAINT fk_tr_cfg_traeger FOREIGN KEY (traeger_id) REFERENCES traeger(id) ON DELETE CASCADE,
                                                           CONSTRAINT fk_tr_cfg_createdby FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS ix_tr_cfg_traeger ON traeger_risk_matrix_configs (traeger_id);
CREATE INDEX IF NOT EXISTS ix_tr_cfg_active  ON traeger_risk_matrix_configs (traeger_id, active);

-- ============================================
-- 4) Risk-Snapshots (auditierbar)
-- ============================================
CREATE TABLE IF NOT EXISTS falloeffnung_risk_snapshots (
                                                           id                  BIGSERIAL PRIMARY KEY,
                                                           falloeffnung_id     BIGINT      NOT NULL,
                                                           config_id           BIGINT,
                                                           config_version      VARCHAR(40) NOT NULL,
                                                           raw_score           NUMERIC(8,1) NOT NULL,
                                                           protective_reduction NUMERIC(8,1) NOT NULL,
                                                           final_score         NUMERIC(8,1) NOT NULL,
                                                           traffic_light       VARCHAR(10) NOT NULL,
                                                           rationale_json      TEXT,
                                                           hard_hits_json      TEXT,
                                                           dimensions_json     TEXT,

                                                           created_at          TIMESTAMPTZ NOT NULL,
                                                           updated_at          TIMESTAMPTZ NOT NULL,

                                                           CONSTRAINT fk_fall_risk_fall FOREIGN KEY (falloeffnung_id) REFERENCES falloeffnungen(id) ON DELETE CASCADE,
                                                           CONSTRAINT fk_fall_risk_config FOREIGN KEY (config_id) REFERENCES traeger_risk_matrix_configs(id)
);

CREATE INDEX IF NOT EXISTS ix_fall_risk_fall ON falloeffnung_risk_snapshots (falloeffnung_id, created_at DESC);