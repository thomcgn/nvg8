-- Flyway migration V009

CREATE TABLE IF NOT EXISTS traeger_aktennummer_seq (
  id         BIGSERIAL PRIMARY KEY,
  traeger_id BIGINT NOT NULL,
  year       INT    NOT NULL,
  next_value BIGINT NOT NULL DEFAULT 1,

  CONSTRAINT uk_seq_traeger_year UNIQUE (traeger_id, year),
  CONSTRAINT fk_seq_traeger FOREIGN KEY (traeger_id) REFERENCES traeger(id)
);
