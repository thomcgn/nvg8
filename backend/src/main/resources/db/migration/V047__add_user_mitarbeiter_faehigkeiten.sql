ALTER TABLE users
    ADD COLUMN IF NOT EXISTS kann_kinder_dolmetschen boolean NOT NULL DEFAULT false;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS kann_bezugspersonen_dolmetschen boolean NOT NULL DEFAULT false;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS mitarbeiter_sprach_hinweise varchar(500);