-- V056: Stuttgarter Kinderschutzbogen Assessments

CREATE TABLE kinderschutzbogen_assessments (
    id                              BIGSERIAL PRIMARY KEY,
    falloeffnung_id                 BIGINT NOT NULL REFERENCES falloeffnungen(id),
    traeger_id                      BIGINT NOT NULL REFERENCES traeger(id),
    einrichtung_org_unit_id         BIGINT NOT NULL REFERENCES org_units(id),
    altersgruppe                    VARCHAR(20) NOT NULL,
    bewertungsdatum                 DATE NOT NULL,
    gesamteinschaetzung_manuell     SMALLINT,
    gesamteinschaetzung_freitext    TEXT,
    created_by_user_id              BIGINT NOT NULL REFERENCES users(id),
    created_at                      TIMESTAMPTZ NOT NULL,
    updated_at                      TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_skb_assessment_fall    ON kinderschutzbogen_assessments (falloeffnung_id);
CREATE INDEX ix_skb_assessment_traeger ON kinderschutzbogen_assessments (traeger_id, einrichtung_org_unit_id);

CREATE TABLE kinderschutzbogen_bewertungen (
    id            BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT      NOT NULL REFERENCES kinderschutzbogen_assessments(id) ON DELETE CASCADE,
    item_code     VARCHAR(60) NOT NULL,
    rating        SMALLINT,      -- -2, -1, 1, 2 oder NULL (nicht bewertet)
    notiz         TEXT,
    CONSTRAINT uk_skb_bew_assessment_item UNIQUE (assessment_id, item_code),
    CONSTRAINT ck_skb_rating CHECK (rating IN (-2, -1, 1, 2))
);

CREATE INDEX ix_skb_bewertung_assessment ON kinderschutzbogen_bewertungen (assessment_id);
