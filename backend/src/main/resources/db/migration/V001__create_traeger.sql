-- Flyway migration V001
-- Schema: public (assumed by default search_path)

CREATE TABLE IF NOT EXISTS traeger (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  slug          VARCHAR(80)  NOT NULL,
  akten_prefix  VARCHAR(200) NOT NULL,
  enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
  kurzcode      VARCHAR(40),
  created_at    TIMESTAMPTZ  NOT NULL,
  updated_at    TIMESTAMPTZ  NOT NULL,
  CONSTRAINT uk_traeger_slug UNIQUE (slug)
);
