-- Flyway migration V017

CREATE TABLE IF NOT EXISTS s8a_assessments (
  id                   BIGSERIAL PRIMARY KEY,
  s8a_case_id           BIGINT      NOT NULL,
  version              INT         NOT NULL,

  gefaehrdungsart      VARCHAR(50) NOT NULL DEFAULT 'UNKLAR',
  kindesanhoerung      BOOLEAN     NOT NULL DEFAULT FALSE,
  iefk_beteiligt       BOOLEAN     NOT NULL DEFAULT FALSE,
  jugendamt_informiert BOOLEAN     NOT NULL DEFAULT FALSE,

  created_by_user_id   BIGINT      NOT NULL,

  created_at           TIMESTAMPTZ NOT NULL,
  updated_at           TIMESTAMPTZ NOT NULL,

  CONSTRAINT uk_s8a_assessment_case_version UNIQUE (s8a_case_id, version),
  CONSTRAINT fk_s8a_ass_case FOREIGN KEY (s8a_case_id) REFERENCES s8a_cases(id) ON DELETE CASCADE,
  CONSTRAINT fk_s8a_ass_createdby FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS ix_s8a_assessment_case         ON s8a_assessments (s8a_case_id);
CREATE INDEX IF NOT EXISTS ix_s8a_assessment_case_version ON s8a_assessments (s8a_case_id, version);

CREATE TABLE IF NOT EXISTS s8a_assessment_participants (
  id                 BIGSERIAL PRIMARY KEY,
  assessment_id      BIGINT      NOT NULL,
  case_person_id     BIGINT      NOT NULL,

  role_in_assessment VARCHAR(80) NOT NULL,
  custody_snapshot   VARCHAR(2000),
  residence_right_snapshot VARCHAR(2000),
  contact_snapshot   VARCHAR(2000),
  restriction_snapshot VARCHAR(2000),
  notes              VARCHAR(2000),

  created_at         TIMESTAMPTZ NOT NULL,
  updated_at         TIMESTAMPTZ NOT NULL,

  CONSTRAINT fk_s8a_ap_assessment FOREIGN KEY (assessment_id)  REFERENCES s8a_assessments(id) ON DELETE CASCADE,
  CONSTRAINT fk_s8a_ap_person     FOREIGN KEY (case_person_id) REFERENCES s8a_case_persons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_s8a_ap_assessment ON s8a_assessment_participants (assessment_id);
CREATE INDEX IF NOT EXISTS ix_s8a_ap_person     ON s8a_assessment_participants (case_person_id);
