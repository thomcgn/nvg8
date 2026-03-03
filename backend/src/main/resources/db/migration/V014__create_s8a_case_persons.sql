-- Flyway migration V014

CREATE TABLE IF NOT EXISTS s8a_case_persons (
  id             BIGSERIAL PRIMARY KEY,
  s8a_case_id    BIGINT       NOT NULL,
  person_type    VARCHAR(20)  NOT NULL,
  display_name   VARCHAR(250) NOT NULL,
  first_name     VARCHAR(120),
  last_name      VARCHAR(120),
  date_of_birth  VARCHAR(20),
  notes          VARCHAR(4000),
  external_person_ref BIGINT,

  created_at     TIMESTAMPTZ NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL,

  CONSTRAINT fk_s8a_cp_case FOREIGN KEY (s8a_case_id) REFERENCES s8a_cases(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_s8a_case_person_case ON s8a_case_persons (s8a_case_id);
CREATE INDEX IF NOT EXISTS ix_s8a_case_person_type ON s8a_case_persons (person_type);
