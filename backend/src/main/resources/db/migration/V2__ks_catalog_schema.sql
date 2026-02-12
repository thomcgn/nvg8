BEGIN;

-- =========================
-- KATALOG: Instrumente
-- =========================
CREATE TABLE IF NOT EXISTS ks_instrumente (
                                              id BIGSERIAL PRIMARY KEY,

                                              code TEXT NOT NULL,            -- z.B. "DL-0-12M-01" oder "AH-3-03"
                                              titel TEXT NOT NULL,
                                              typ TEXT NOT NULL,             -- DOKUBOGEN / CHECKLISTE / ...
                                              version TEXT NOT NULL,         -- z.B. "2026-01"
                                              aktiv BOOLEAN NOT NULL DEFAULT TRUE,

    -- ApplicabilityRule (Alter in Monaten)
                                              min_age_months INT,
                                              max_age_months INT,
                                              requires_school_context BOOLEAN,
                                              requires_kita_context BOOLEAN,

    -- Meta optional
                                              herausgeber TEXT,
                                              quellen_hinweis TEXT,
                                              dokument_url TEXT
);

DO $$ BEGIN
ALTER TABLE ks_instrumente
    ADD CONSTRAINT uq_ks_instrument_code_version UNIQUE (code, version);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS ix_ks_instrumente_aktiv ON ks_instrumente(aktiv);
CREATE INDEX IF NOT EXISTS ix_ks_instrumente_code ON ks_instrumente(code);

-- =========================
-- KATALOG: Sections (hierarchisch)
-- =========================
CREATE TABLE IF NOT EXISTS ks_sections (
                                           id BIGSERIAL PRIMARY KEY,

                                           instrument_id BIGINT NOT NULL REFERENCES ks_instrumente(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES ks_sections(id) ON DELETE SET NULL,

    section_no TEXT NOT NULL,      -- "2.1"
    title TEXT NOT NULL,
    hint_text TEXT,

    order_index INT NOT NULL DEFAULT 0
    );

DO $$ BEGIN
ALTER TABLE ks_sections
    ADD CONSTRAINT uq_ks_section UNIQUE (instrument_id, section_no);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS ix_ks_sections_instrument ON ks_sections(instrument_id);
CREATE INDEX IF NOT EXISTS ix_ks_sections_parent ON ks_sections(parent_id);

-- =========================
-- KATALOG: Items
-- =========================
CREATE TABLE IF NOT EXISTS ks_items (
                                        id BIGSERIAL PRIMARY KEY,

                                        section_id BIGINT NOT NULL REFERENCES ks_sections(id) ON DELETE CASCADE,

    item_no TEXT NOT NULL,         -- "2.1.1"
    text TEXT NOT NULL,
    answer_type TEXT NOT NULL,     -- TRI_STATE / TEXT / DATE / USER_REF

    order_index INT NOT NULL DEFAULT 0,

    -- Scoring (optional)
    gewicht INT NOT NULL DEFAULT 1,
    akut_kriterium BOOLEAN NOT NULL DEFAULT FALSE
    );

DO $$ BEGIN
ALTER TABLE ks_items
    ADD CONSTRAINT uq_ks_item UNIQUE (section_id, item_no);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS ix_ks_items_section ON ks_items(section_id);

COMMIT;
