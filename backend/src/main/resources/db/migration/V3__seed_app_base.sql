-- V3__seed_app_base.sql
-- Default Facility + Admin + Beispiel-Entities + optional Team + Zuordnung

-- 1) Default Facility
INSERT INTO public.facilities (name)
VALUES ('Default')
ON CONFLICT (name) DO NOTHING;

-- 2) Admin user (bcrypt in SQL)
INSERT INTO public.users (
    enabled, email, password_hash, role,
    vorname, nachname, ort,
    coda_status, dolmetsch_bedarf, hoer_status,
    staatsangehoerigkeit_gruppe, staatsangehoerigkeit_sonderfall,
    facility_id
)
SELECT
    true,
    'admin@nvg8.de',
    crypt('adminNVG8', gen_salt('bf', 10)),
    'ADMIN',
    'Admin', 'NVG8', 'Berlin',
    'UNBEKANNT', 'UNGEKLAERT', 'UNBEKANNT',
    'UNBEKANNT', 'UNBEKANNT',
    f.id
FROM public.facilities f
WHERE f.name = 'Default'
ON CONFLICT (email) DO UPDATE
    SET enabled = EXCLUDED.enabled,
        role = EXCLUDED.role,
        password_hash = EXCLUDED.password_hash,
        facility_id = EXCLUDED.facility_id;

-- 3) Beispiel-Kind
INSERT INTO public.kinder (
    vorname, nachname, geburtsdatum, braucht_dolmetsch,
    ort, plz, strasse, hausnummer,
    coda_status, dolmetsch_bedarf, hoer_status,
    staatsangehoerigkeit_gruppe, staatsangehoerigkeit_sonderfall
)
VALUES
    ('Mila','Beispiel','2016-08-12', false, 'Berlin','10115','Invalidenstraße','1',
     'UNBEKANNT','KEIN','HOEREND','DE','KEINER')
ON CONFLICT DO NOTHING;

-- 4) Bezugsperson
INSERT INTO public.bezugspersonen (
    vorname, nachname, telefon, kontakt_email,
    ort, plz, strasse, hausnummer,
    coda_status, dolmetsch_bedarf, hoer_status,
    staatsangehoerigkeit_gruppe, staatsangehoerigkeit_sonderfall
)
VALUES
    ('Sara','Beispiel','+49 30 000000','sara.beispiel@example.test',
     'Berlin','10115','Invalidenstraße','1',
     'UNBEKANNT','KEIN','HOEREND','DE','KEINER')
ON CONFLICT DO NOTHING;

-- 5) Relation Kind <-> Bezugsperson
INSERT INTO public.kind_bezugsperson_relation (
    kind_id, bezugsperson_id, beziehungstyp, rolle_im_alltag, sorge_status, lebt_im_haushalt, gueltig_von,
    datenquelle
)
SELECT
    k.id,
    b.id,
    'MUTTER',
    'ELTERNTEIL',
    'VOLL',
    true,
    CURRENT_DATE - INTERVAL '5 years',
    'JUGENDAMT'
FROM public.kinder k
         JOIN public.bezugspersonen b ON b.kontakt_email = 'sara.beispiel@example.test'
WHERE k.vorname = 'Mila' AND k.nachname = 'Beispiel'
ON CONFLICT DO NOTHING;

-- 6) Ein Fall (Kinderschutz)
INSERT INTO public.kinderschutz_faelle (
    kind_id, aktenzeichen, status, kurzbeschreibung,
    gericht_eingeschaltet, iefk_pflichtig, inobhutnahme_erfolgt,
    created_at, updated_at, letzte_einschaetzung,
    zustaendige_fachkraft_id, teamleitung_id, version
)
SELECT
    k.id,
    'NVG8-2026-0001',
    'IN_PRUEFUNG',
    'Hinweise aus Schule, wiederholte Fehlzeiten und Sorge um Versorgung.',
    false, false, false,
    now(), now(), 'UNKLAR_WEITERE_ABKLAERUNG',
    u.id, u.id, 1
FROM public.kinder k
         JOIN public.users u ON u.email = 'admin@nvg8.de'
WHERE k.vorname='Mila' AND k.nachname='Beispiel'
ON CONFLICT (aktenzeichen) DO NOTHING;

-- 7) Gefährdungsbereiche
INSERT INTO public.fall_gefaehrdungsbereiche (fall_id, bereich)
SELECT f.id, x.bereich
FROM public.kinderschutz_faelle f
         JOIN (VALUES ('VERNACHLAESSIGUNG'), ('UNKLAR')) AS x(bereich) ON true
WHERE f.aktenzeichen='NVG8-2026-0001'
ON CONFLICT DO NOTHING;

-- 8) Kontakt/Ereignis
INSERT INTO public.kontakt_ereignisse (fall_id, zeitpunkt, art, beteiligte_kurz)
SELECT f.id, now() - INTERVAL '2 days', 'TELEFONAT', 'Schule (Klassenleitung)'
FROM public.kinderschutz_faelle f
WHERE f.aktenzeichen='NVG8-2026-0001'
ON CONFLICT DO NOTHING;

-- 9) Maßnahme
INSERT INTO public.massnahmen (fall_id, faellig_am, status, titel, typ, verantwortlich)
SELECT f.id, CURRENT_DATE + INTERVAL '7 days', 'OFFEN', 'Hausbesuch terminieren', 'ABKLAERUNG', 'Jugendamt'
FROM public.kinderschutz_faelle f
WHERE f.aktenzeichen='NVG8-2026-0001'
ON CONFLICT DO NOTHING;

-- 10) Meldung/Hinweis
INSERT INTO public.meldungen_hinweise (fall_id, eingang_am, meldende_stelle, meldungsweg, kontakt_info)
SELECT f.id, CURRENT_DATE - INTERVAL '3 days', 'Schule', 'TELEFON', 'Klassenleitung, Tel. intern'
FROM public.kinderschutz_faelle f
WHERE f.aktenzeichen='NVG8-2026-0001'
ON CONFLICT DO NOTHING;

-- 11) Beispiel KWS Run + Antworten (setzt V2 voraus!)
WITH admin_u AS (
    SELECT id FROM public.users WHERE email='admin@nvg8.de'
),
     k AS (
         SELECT id FROM public.kinder WHERE vorname='Mila' AND nachname='Beispiel' ORDER BY id LIMIT 1
     ),
     t AS (
         SELECT id FROM public.kws_template WHERE code='AH-3-01b'
     )
INSERT INTO public.kws_run (assessment_date, next_review_date, created_at, created_by_user_id, kind_id, template_id, status, reason)
SELECT CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', now(), admin_u.id, k.id, t.id, 'DRAFT', 'Erstaufnahme / Basisprüfung'
FROM admin_u, k, t
ON CONFLICT DO NOTHING;

WITH r AS (
    SELECT id FROM public.kws_run ORDER BY id DESC LIMIT 1
),
     i1 AS (
         SELECT id FROM public.kws_template_item WHERE item_key='A01' ORDER BY id LIMIT 1
     )
INSERT INTO public.kws_answer (run_id, item_id, updated_at, tri_state)
SELECT r.id, i1.id, now(), 'KEINE_ANGABE' FROM r, i1
ON CONFLICT DO NOTHING;

WITH r AS (
    SELECT id FROM public.kws_run ORDER BY id DESC LIMIT 1
),
     i2 AS (
         SELECT id FROM public.kws_template_item WHERE item_key='N01' ORDER BY id LIMIT 1
     )
INSERT INTO public.kws_answer (run_id, item_id, updated_at, text_value)
SELECT r.id, i2.id, now(), 'Initiale Anlage. Weitere Infos folgen.'
FROM r, i2
ON CONFLICT DO NOTHING;

-- 12) Optional: Default Team + Admin zuordnen (damit Team-Dropdowns nie leer sind)
INSERT INTO public.teams (name, facility_id)
SELECT 'Default Team', f.id
FROM public.facilities f
WHERE f.name = 'Default'
ON CONFLICT (facility_id, name) DO NOTHING;

INSERT INTO public.user_teams (user_id, team_id)
SELECT u.id, t.id
FROM public.users u
         JOIN public.facilities f ON f.id = u.facility_id
         JOIN public.teams t ON t.facility_id = f.id AND t.name = 'Default Team'
WHERE u.email = 'admin@nvg8.de'
ON CONFLICT (user_id, team_id) DO NOTHING;