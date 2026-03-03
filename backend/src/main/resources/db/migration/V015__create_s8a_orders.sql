-- Flyway migration V015

CREATE TABLE IF NOT EXISTS s8a_orders (
  id         BIGSERIAL PRIMARY KEY,
  s8a_case_id BIGINT      NOT NULL,

  order_type VARCHAR(80)  NOT NULL,
  title      VARCHAR(250) NOT NULL,
  issued_by  VARCHAR(200),
  issued_at  VARCHAR(20),
  expires_at VARCHAR(20),
  reference  VARCHAR(120),
  notes      VARCHAR(4000),

  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,

  CONSTRAINT fk_s8a_order_case FOREIGN KEY (s8a_case_id) REFERENCES s8a_cases(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_s8a_order_case ON s8a_orders (s8a_case_id);
CREATE INDEX IF NOT EXISTS ix_s8a_order_type ON s8a_orders (order_type);
