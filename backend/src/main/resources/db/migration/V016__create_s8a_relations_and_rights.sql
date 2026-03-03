-- Flyway migration V016

CREATE TABLE IF NOT EXISTS s8a_case_person_relations (
  id             BIGSERIAL PRIMARY KEY,
  s8a_case_id    BIGINT      NOT NULL,
  from_person_id BIGINT      NOT NULL,
  to_person_id   BIGINT      NOT NULL,
  relation_type  VARCHAR(40) NOT NULL,
  notes          VARCHAR(2000),
  created_at     TIMESTAMPTZ NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL,

  CONSTRAINT fk_s8a_rel_case FOREIGN KEY (s8a_case_id) REFERENCES s8a_cases(id) ON DELETE CASCADE,
  CONSTRAINT fk_s8a_rel_from FOREIGN KEY (from_person_id) REFERENCES s8a_case_persons(id) ON DELETE CASCADE,
  CONSTRAINT fk_s8a_rel_to   FOREIGN KEY (to_person_id)   REFERENCES s8a_case_persons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_s8a_rel_case ON s8a_case_person_relations (s8a_case_id);
CREATE INDEX IF NOT EXISTS ix_s8a_rel_from ON s8a_case_person_relations (from_person_id);
CREATE INDEX IF NOT EXISTS ix_s8a_rel_to   ON s8a_case_person_relations (to_person_id);

CREATE TABLE IF NOT EXISTS s8a_custody_records (
  id                     BIGSERIAL PRIMARY KEY,
  s8a_case_id             BIGINT      NOT NULL,
  child_person_id         BIGINT      NOT NULL,
  right_holder_person_id  BIGINT      NOT NULL,

  custody_type            VARCHAR(30) NOT NULL,
  residence_right         VARCHAR(40) NOT NULL,

  valid_from              VARCHAR(20),
  valid_to                VARCHAR(20),

  source_title            VARCHAR(250),
  source_reference        VARCHAR(120),
  notes                   VARCHAR(2000),

  source_order_id         BIGINT,
  supersedes_id           BIGINT,

  created_at              TIMESTAMPTZ NOT NULL,
  updated_at              TIMESTAMPTZ NOT NULL,

  CONSTRAINT fk_s8a_cust_case   FOREIGN KEY (s8a_case_id)            REFERENCES s8a_cases(id) ON DELETE CASCADE,
  CONSTRAINT fk_s8a_cust_child  FOREIGN KEY (child_person_id)        REFERENCES s8a_case_persons(id) ON DELETE CASCADE,
  CONSTRAINT fk_s8a_cust_holder FOREIGN KEY (right_holder_person_id) REFERENCES s8a_case_persons(id) ON DELETE CASCADE,
  CONSTRAINT fk_s8a_cust_order  FOREIGN KEY (source_order_id)        REFERENCES s8a_orders(id),
  CONSTRAINT fk_s8a_cust_supersedes FOREIGN KEY (supersedes_id)      REFERENCES s8a_custody_records(id)
);

CREATE INDEX IF NOT EXISTS ix_s8a_cust_case   ON s8a_custody_records (s8a_case_id);
CREATE INDEX IF NOT EXISTS ix_s8a_cust_child  ON s8a_custody_records (child_person_id);
CREATE INDEX IF NOT EXISTS ix_s8a_cust_holder ON s8a_custody_records (right_holder_person_id);

CREATE TABLE IF NOT EXISTS s8a_contact_restrictions (
  id                 BIGSERIAL PRIMARY KEY,
  s8a_case_id         BIGINT      NOT NULL,
  child_person_id     BIGINT      NOT NULL,
  other_person_id     BIGINT      NOT NULL,

  restriction_type    VARCHAR(40) NOT NULL,
  reason              VARCHAR(2000),

  valid_from          VARCHAR(20),
  valid_to            VARCHAR(20),

  source_title        VARCHAR(250),
  source_reference    VARCHAR(120),
  source_order_id     BIGINT,

  supersedes_id       BIGINT,

  created_at          TIMESTAMPTZ NOT NULL,
  updated_at          TIMESTAMPTZ NOT NULL,

  CONSTRAINT fk_s8a_contact_case  FOREIGN KEY (s8a_case_id)     REFERENCES s8a_cases(id) ON DELETE CASCADE,
  CONSTRAINT fk_s8a_contact_child FOREIGN KEY (child_person_id) REFERENCES s8a_case_persons(id) ON DELETE CASCADE,
  CONSTRAINT fk_s8a_contact_other FOREIGN KEY (other_person_id) REFERENCES s8a_case_persons(id) ON DELETE CASCADE,
  CONSTRAINT fk_s8a_contact_order FOREIGN KEY (source_order_id) REFERENCES s8a_orders(id),
  CONSTRAINT fk_s8a_contact_supersedes FOREIGN KEY (supersedes_id) REFERENCES s8a_contact_restrictions(id)
);

CREATE INDEX IF NOT EXISTS ix_s8a_contact_case  ON s8a_contact_restrictions (s8a_case_id);
CREATE INDEX IF NOT EXISTS ix_s8a_contact_child ON s8a_contact_restrictions (child_person_id);
CREATE INDEX IF NOT EXISTS ix_s8a_contact_other ON s8a_contact_restrictions (other_person_id);
