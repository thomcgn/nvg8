INSERT INTO traeger (name, slug, akten_prefix, enabled, kurzcode, created_at, updated_at)
VALUES ('KIDOC', 'demo-traeger', 'KID', true, 'DEMO', now(), now());

INSERT INTO org_units (traeger_id, type, name, parent_id, enabled, created_at, updated_at)
VALUES (
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    'TRAEGER',
    'KIDOC',
    NULL,
    true,
    now(),
    now()
);

INSERT INTO org_units (traeger_id, type, name, parent_id, enabled, created_at, updated_at)
VALUES (
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    'EINRICHTUNG',
    'Villa Kunterbunt',
    (SELECT id FROM org_units WHERE name = 'KIDOC' AND type = 'TRAEGER'),
    true,
    now(),
    now()
);

INSERT INTO users (
    email,
    password_hash,
    enabled,
    default_traeger_id,
    default_org_unit_id,
    created_at,
    updated_at,
    vorname,
    nachname
)
VALUES (
    'demo@kidoc.local',
    '$2b$10$ttZ/gNAS8sSgJ3NRk8rnv.WfTxcbyyRPER0.XGeSNv1wSSWDUG3Gq',
    true,
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
    now(),
    now(),
    'D.',
    'Emo'
);

INSERT INTO user_org_roles (user_id, org_unit_id, role, enabled, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE email = 'demo@kidoc.local'),
    (SELECT id FROM org_units WHERE name = 'KIDOC' AND type = 'TRAEGER'),
    'TRAEGER_ADMIN',
    true,
    now(),
    now()
);