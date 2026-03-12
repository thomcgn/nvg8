-- ═══════════════════════════════════════════════════════════════════════════
-- KIDOC Demo-Seed  (Repeatable Migration – idempotent, DELETE + INSERT)
-- §8a SGB VIII Fallbeispiele – Villa Kunterbunt / Musterträger e.V.
-- Vollständig: alle Felder des Meldung-Wizards
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Aufräumen (FK-Reihenfolge) ───────────────────────────────────────────────

DELETE FROM meldung_observation_tags WHERE observation_id IN (
    SELECT mo.id FROM meldung_observations mo
    JOIN meldungen m ON m.id = mo.meldung_id
    JOIN falloeffnungen f ON f.id = m.falloeffnung_id
    JOIN kind_dossiers d ON d.id = f.dossier_id
    JOIN kinder k ON k.id = d.kind_id
    WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM meldung_observations WHERE meldung_id IN (
    SELECT m.id FROM meldungen m
    JOIN falloeffnungen f ON f.id = m.falloeffnung_id
    JOIN kind_dossiers d ON d.id = f.dossier_id
    JOIN kinder k ON k.id = d.kind_id
    WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM meldung_anlass_codes WHERE meldung_id IN (
    SELECT m.id FROM meldungen m
    JOIN falloeffnungen f ON f.id = m.falloeffnung_id
    JOIN kind_dossiers d ON d.id = f.dossier_id
    JOIN kinder k ON k.id = d.kind_id
    WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM meldung_contacts WHERE meldung_id IN (
    SELECT m.id FROM meldungen m
    JOIN falloeffnungen f ON f.id = m.falloeffnung_id
    JOIN kind_dossiers d ON d.id = f.dossier_id
    JOIN kinder k ON k.id = d.kind_id
    WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM meldung_jugendamt WHERE meldung_id IN (
    SELECT m.id FROM meldungen m
    JOIN falloeffnungen f ON f.id = m.falloeffnung_id
    JOIN kind_dossiers d ON d.id = f.dossier_id
    JOIN kinder k ON k.id = d.kind_id
    WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM meldung_extern WHERE meldung_id IN (
    SELECT m.id FROM meldungen m
    JOIN falloeffnungen f ON f.id = m.falloeffnung_id
    JOIN kind_dossiers d ON d.id = f.dossier_id
    JOIN kinder k ON k.id = d.kind_id
    WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM meldungen WHERE falloeffnung_id IN (
    SELECT f.id FROM falloeffnungen f
    JOIN kind_dossiers d ON d.id = f.dossier_id
    JOIN kinder k ON k.id = d.kind_id
    WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM falloeffnungen WHERE dossier_id IN (
    SELECT d.id FROM kind_dossiers d
    JOIN kinder k ON k.id = d.kind_id
    WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM kind_dossiers
    WHERE kind_id IN (SELECT id FROM kinder WHERE traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM kind_bezugspersonen
    WHERE kind_id IN (SELECT id FROM kinder WHERE traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM kinder         WHERE traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger');
DELETE FROM bezugspersonen WHERE traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger');

DELETE FROM user_org_roles WHERE user_id IN (SELECT id FROM users WHERE email IN ('demo@kidoc.local','admin@kidoc.io'));
DELETE FROM users          WHERE email IN ('demo@kidoc.local','admin@kidoc.io');
DELETE FROM org_units      WHERE traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger');
DELETE FROM traeger        WHERE slug = 'demo-traeger';

-- ─── Demo-Träger ──────────────────────────────────────────────────────────────

INSERT INTO traeger (name, slug, akten_prefix, enabled, kurzcode, created_at, updated_at)
VALUES ('Musterträger e.V.', 'demo-traeger', 'MST', true, 'MST', now(), now());

INSERT INTO org_units (traeger_id, type, name, parent_id, enabled, created_at, updated_at)
VALUES ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        'TRAEGER', 'Musterträger e.V.', NULL, true, now(), now());

INSERT INTO org_units (traeger_id, type, name, parent_id, enabled, created_at, updated_at)
VALUES ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        'EINRICHTUNG', 'Villa Kunterbunt',
        (SELECT id FROM org_units WHERE name = 'Musterträger e.V.' AND type = 'TRAEGER'),
        true, now(), now());

-- ─── Benutzer ─────────────────────────────────────────────────────────────────

INSERT INTO users (email, password_hash, enabled, system_admin, default_traeger_id, default_org_unit_id, created_at, updated_at, vorname, nachname)
VALUES ('admin@kidoc.io', '$2b$10$ttZ/gNAS8sSgJ3NRk8rnv.WfTxcbyyRPER0.XGeSNv1wSSWDUG3Gq',
        true, true, NULL, NULL, now(), now(), 'KIDOC', 'Admin');

INSERT INTO users (email, password_hash, enabled, system_admin, default_traeger_id, default_org_unit_id, created_at, updated_at, vorname, nachname)
VALUES ('demo@kidoc.local', '$2b$10$ttZ/gNAS8sSgJ3NRk8rnv.WfTxcbyyRPER0.XGeSNv1wSSWDUG3Gq',
        true, false,
        (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
        now(), now(), 'D.', 'Emo');

INSERT INTO user_org_roles (user_id, org_unit_id, role, enabled, created_at, updated_at) VALUES (
    (SELECT id FROM users WHERE email = 'demo@kidoc.local'),
    (SELECT id FROM org_units WHERE name = 'Musterträger e.V.' AND type = 'TRAEGER'),
    'TRAEGER_ADMIN', true, now(), now());

INSERT INTO user_org_roles (user_id, org_unit_id, role, enabled, created_at, updated_at) VALUES (
    (SELECT id FROM users WHERE email = 'demo@kidoc.local'),
    (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
    'EINRICHTUNG_ADMIN', true, now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- KINDER
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO kinder (traeger_id, owner_einrichtung_org_unit_id, vorname, nachname, geburtsdatum, gender,
                    foerderbedarf, gesundheits_hinweise, created_at, updated_at)
VALUES ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
        'Lena', 'Müller', '2018-03-14', 'WEIBLICH', false,
        'Hämatome an Armen und Rücken dokumentiert (14.01.2025). Kinderärztin informiert.',
        now(), now());

INSERT INTO kinder (traeger_id, owner_einrichtung_org_unit_id, vorname, nachname, geburtsdatum, gender,
                    foerderbedarf, foerderbedarf_details, gesundheits_hinweise, created_at, updated_at)
VALUES ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
        'Max', 'Schmidt', '2017-07-22', 'MAENNLICH', true,
        'Sprachentwicklungsverzögerung, Förderung durch Logopädie seit Sept. 2024.',
        'Untergewicht (KMI 14,1, Hausarzt Dr. Bergmann, 07.10.2024). Kind kommt häufig ohne Mahlzeit.',
        now(), now());

INSERT INTO kinder (traeger_id, owner_einrichtung_org_unit_id, vorname, nachname, geburtsdatum, gender,
                    foerderbedarf, foerderbedarf_details, gesundheits_hinweise, created_at, updated_at)
VALUES ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
        'Sofia', 'Weber', '2019-11-05', 'WEIBLICH', true,
        'Motorische Entwicklungsverzögerung, heilpädagogische Frühförderung beantragt.',
        'Schlafstörungen und Verhaltensauffälligkeiten nach Heimkehr vom Vater beobachtet.',
        now(), now());

INSERT INTO kinder (traeger_id, owner_einrichtung_org_unit_id, vorname, nachname, geburtsdatum, gender,
                    foerderbedarf, gesundheits_hinweise, created_at, updated_at)
VALUES ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
        'Noah', 'Fischer', '2016-01-30', 'MAENNLICH', false,
        'Soziale Isolation. Kind berichtet, regelmäßig am Wochenende allein gelassen zu werden.',
        now(), now());

INSERT INTO kinder (traeger_id, owner_einrichtung_org_unit_id, vorname, nachname, geburtsdatum, gender,
                    foerderbedarf, gesundheits_hinweise, created_at, updated_at)
VALUES ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
        'Emilia', 'Bauer', '2020-06-18', 'WEIBLICH', false,
        'Bindungsstörung beobachtet. Einnässen (neu seit Feb 2025), Daumenlutschen wieder aufgenommen. Stresssymptomatik.',
        now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- BEZUGSPERSONEN
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO bezugspersonen (traeger_id, owner_einrichtung_org_unit_id, vorname, nachname, geburtsdatum,
    telefon, kontakt_email, beziehung, gender, strasse, hausnummer, plz, ort, created_at, updated_at)
VALUES
  ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
   (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
   'Anna', 'Müller', '1991-06-20', '0151 11223344', 'anna.mueller@example.de',
   'MUTTER', 'WEIBLICH', 'Rosenstraße', '12', '50667', 'Köln', now(), now()),

  ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
   (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
   'Thomas', 'Müller', '1988-11-03', '0151 55667788', NULL,
   'VATER', 'MAENNLICH', 'Rosenstraße', '12', '50667', 'Köln', now(), now()),

  ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
   (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
   'Inge', 'Müller', '1958-04-15', '0221 8847261', NULL,
   'GROSSMUTTER', 'WEIBLICH', 'Ahornweg', '5', '50858', 'Köln', now(), now()),

  ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
   (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
   'Petra', 'Schmidt', '1990-02-28', '0162 99887766', NULL,
   'MUTTER', 'WEIBLICH', 'Birkenallee', '33', '50679', 'Köln', now(), now()),

  ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
   (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
   'Klaus', 'Weber', '1983-08-17', '0170 12345678', NULL,
   'VATER', 'MAENNLICH', 'Industriestraße', '7', '51065', 'Köln', now(), now()),

  ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
   (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
   'Gerda', 'Weber', '1952-12-01', '0221 4453112', 'gerda.weber@example.de',
   'GROSSMUTTER', 'WEIBLICH', 'Gartenstraße', '18', '51063', 'Köln', now(), now()),

  ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
   (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
   'Maria', 'Fischer', '1985-09-11', '0176 87654321', 'maria.fischer@example.de',
   'MUTTER', 'WEIBLICH', 'Lindenplatz', '2A', '50823', 'Köln', now(), now()),

  ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
   (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
   'Jürgen', 'Hartmann', '1981-05-25', '0173 3344556', NULL,
   'STIEFVATER', 'MAENNLICH', 'Lindenplatz', '2A', '50823', 'Köln', now(), now()),

  ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
   (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
   'Sandra', 'Bauer', '1993-07-04', '0160 55443322', 'sandra.bauer@example.de',
   'MUTTER', 'WEIBLICH', 'Hauptstraße', '45', '50733', 'Köln', now(), now()),

  ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
   (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
   'Michael', 'Bauer', '1989-01-19', '0152 66778899', NULL,
   'VATER', 'MAENNLICH', 'Neusser Straße', '88', '50733', 'Köln', now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- KIND-BEZUGSPERSON-VERKNÜPFUNGEN
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO kind_bezugspersonen (kind_id, bezugsperson_id, beziehung, sorgerecht, valid_from, hauptkontakt, lebt_im_haushalt, enabled, created_at, updated_at)
VALUES
  ((SELECT id FROM kinder WHERE vorname='Lena' AND nachname='Müller'),
   (SELECT id FROM bezugspersonen WHERE vorname='Anna' AND nachname='Müller'),
   'MUTTER', 'GEMEINSAM', '2018-03-14', true, true, true, now(), now()),

  ((SELECT id FROM kinder WHERE vorname='Lena' AND nachname='Müller'),
   (SELECT id FROM bezugspersonen WHERE vorname='Thomas' AND nachname='Müller'),
   'VATER', 'GEMEINSAM', '2018-03-14', false, true, true, now(), now()),

  ((SELECT id FROM kinder WHERE vorname='Lena' AND nachname='Müller'),
   (SELECT id FROM bezugspersonen WHERE vorname='Inge' AND nachname='Müller'),
   'GROSSMUTTER', 'KEIN', '2025-01-20', false, false, true, now(), now()),

  ((SELECT id FROM kinder WHERE vorname='Max' AND nachname='Schmidt'),
   (SELECT id FROM bezugspersonen WHERE vorname='Petra' AND nachname='Schmidt'),
   'MUTTER', 'ALLEIN', '2017-07-22', true, true, true, now(), now()),

  ((SELECT id FROM kinder WHERE vorname='Sofia' AND nachname='Weber'),
   (SELECT id FROM bezugspersonen WHERE vorname='Klaus' AND nachname='Weber'),
   'VATER', 'ALLEIN', '2019-11-05', false, false, true, now(), now()),

  ((SELECT id FROM kinder WHERE vorname='Sofia' AND nachname='Weber'),
   (SELECT id FROM bezugspersonen WHERE vorname='Gerda' AND nachname='Weber'),
   'GROSSMUTTER', 'KEIN', '2025-02-10', true, true, true, now(), now()),

  ((SELECT id FROM kinder WHERE vorname='Noah' AND nachname='Fischer'),
   (SELECT id FROM bezugspersonen WHERE vorname='Maria' AND nachname='Fischer'),
   'MUTTER', 'GEMEINSAM', '2016-01-30', true, true, true, now(), now()),

  ((SELECT id FROM kinder WHERE vorname='Noah' AND nachname='Fischer'),
   (SELECT id FROM bezugspersonen WHERE vorname='Jürgen' AND nachname='Hartmann'),
   'STIEFVATER', 'KEIN', '2022-06-01', false, true, true, now(), now()),

  ((SELECT id FROM kinder WHERE vorname='Emilia' AND nachname='Bauer'),
   (SELECT id FROM bezugspersonen WHERE vorname='Sandra' AND nachname='Bauer'),
   'MUTTER', 'GEMEINSAM', '2020-06-18', true, true, true, now(), now()),

  ((SELECT id FROM kinder WHERE vorname='Emilia' AND nachname='Bauer'),
   (SELECT id FROM bezugspersonen WHERE vorname='Michael' AND nachname='Bauer'),
   'VATER', 'GEMEINSAM', '2020-06-18', false, false, true, now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- KIND-DOSSIERS
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO kind_dossiers (traeger_id, einrichtung_org_unit_id, kind_id, enabled, created_at, updated_at)
SELECT (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
       (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG'),
       k.id, true, now(), now()
FROM kinder k WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger');

-- ═══════════════════════════════════════════════════════════════════════════
-- FALLÖFFNUNGEN
-- ═══════════════════════════════════════════════════════════════════════════

-- Lena: Fall 1 – Hämatome (ABGESCHLOSSEN)
INSERT INTO falloeffnungen (dossier_id, traeger_id, einrichtung_org_unit_id, status, titel,
    kurzbeschreibung, created_by_user_id, aktenzeichen, fall_no, opened_at, closed_at, created_at, updated_at)
VALUES (
    (SELECT d.id FROM kind_dossiers d JOIN kinder k ON k.id=d.kind_id WHERE k.vorname='Lena' AND k.nachname='Müller'),
    (SELECT id FROM traeger WHERE slug='demo-traeger'),
    (SELECT id FROM org_units WHERE name='Villa Kunterbunt' AND type='EINRICHTUNG'),
    'ABGESCHLOSSEN', 'Verdacht körperliche Misshandlung – Lena M.',
    'Erzieherin Kamps beobachtete am 14.01.2025 Hämatome an Oberarmen und Rücken. Kind reagierte ängstlich bei Berührungen. Vater Thomas M. bekannt wegen Alkohol und häuslicher Gewalt.',
    (SELECT id FROM users WHERE email='demo@kidoc.local'),
    'MST-2024-001', 1, '2025-01-15 09:00:00+01', '2025-02-28 16:30:00+01', now(), now());

-- Lena: Fall 2 – Verlaufskontrolle Familienhilfe (IN_PRUEFUNG)
INSERT INTO falloeffnungen (dossier_id, traeger_id, einrichtung_org_unit_id, status, titel,
    kurzbeschreibung, created_by_user_id, aktenzeichen, fall_no, opened_at, created_at, updated_at)
VALUES (
    (SELECT d.id FROM kind_dossiers d JOIN kinder k ON k.id=d.kind_id WHERE k.vorname='Lena' AND k.nachname='Müller'),
    (SELECT id FROM traeger WHERE slug='demo-traeger'),
    (SELECT id FROM org_units WHERE name='Villa Kunterbunt' AND type='EINRICHTUNG'),
    'IN_PRUEFUNG', 'Verlaufskontrolle Familienhilfe – Lena M.',
    'Ambulante Familienhilfe seit 01.03.2025 im Einsatz. Wöchentliche Hausbesuche. Vater hat Beratungsangebot angenommen.',
    (SELECT id FROM users WHERE email='demo@kidoc.local'),
    'MST-2025-002', 2, '2025-03-01 10:00:00+01', now(), now());

-- Max: Vernachlässigung (IN_PRUEFUNG)
INSERT INTO falloeffnungen (dossier_id, traeger_id, einrichtung_org_unit_id, status, titel,
    kurzbeschreibung, created_by_user_id, aktenzeichen, fall_no, opened_at, created_at, updated_at)
VALUES (
    (SELECT d.id FROM kind_dossiers d JOIN kinder k ON k.id=d.kind_id WHERE k.vorname='Max' AND k.nachname='Schmidt'),
    (SELECT id FROM traeger WHERE slug='demo-traeger'),
    (SELECT id FROM org_units WHERE name='Villa Kunterbunt' AND type='EINRICHTUNG'),
    'IN_PRUEFUNG', 'Verdacht Vernachlässigung – Max S.',
    'Max erscheint seit Sept. 2024 regelmäßig ohne Frühstück, mit ungewaschener Kleidung. Mutter Petra S. auf Bewährung (Drogendelikt). Hausarzt bestätigte Untergewicht.',
    (SELECT id FROM users WHERE email='demo@kidoc.local'),
    'MST-2024-003', 1, '2024-10-07 11:30:00+02', now(), now());

-- Sofia: Häusliche Gewalt / Notunterbringung (ABGESCHLOSSEN)
INSERT INTO falloeffnungen (dossier_id, traeger_id, einrichtung_org_unit_id, status, titel,
    kurzbeschreibung, created_by_user_id, aktenzeichen, fall_no, opened_at, closed_at, created_at, updated_at)
VALUES (
    (SELECT d.id FROM kind_dossiers d JOIN kinder k ON k.id=d.kind_id WHERE k.vorname='Sofia' AND k.nachname='Weber'),
    (SELECT id FROM traeger WHERE slug='demo-traeger'),
    (SELECT id FROM org_units WHERE name='Villa Kunterbunt' AND type='EINRICHTUNG'),
    'ABGESCHLOSSEN', 'Häusliche Gewalt / Inobhutnahme – Sofia W.',
    'Polizeieinsatz 08.02.2025 wegen häuslicher Gewalt im Beisein des Kindes. Vater Klaus W. alkoholkrank (1,8 Promille). Sofortige Inobhutnahme durch ASD. Kind bei Großmutter Gerda W.',
    (SELECT id FROM users WHERE email='demo@kidoc.local'),
    'MST-2025-004', 1, '2025-02-08 20:00:00+01', '2025-03-05 14:00:00+01', now(), now());

-- Noah: Psychisch belastete Familie (OFFEN)
INSERT INTO falloeffnungen (dossier_id, traeger_id, einrichtung_org_unit_id, status, titel,
    kurzbeschreibung, created_by_user_id, aktenzeichen, fall_no, opened_at, created_at, updated_at)
VALUES (
    (SELECT d.id FROM kind_dossiers d JOIN kinder k ON k.id=d.kind_id WHERE k.vorname='Noah' AND k.nachname='Fischer'),
    (SELECT id FROM traeger WHERE slug='demo-traeger'),
    (SELECT id FROM org_units WHERE name='Villa Kunterbunt' AND type='EINRICHTUNG'),
    'OFFEN', 'Mangelnde Aufsicht / psychisch belastete Familie – Noah F.',
    'Noah berichtet, am Wochenende regelmäßig allein gelassen zu werden. Mutter stationär (Depression Feb. 2025). Stiefvater reagiert aggressiv auf Nachfragen.',
    (SELECT id FROM users WHERE email='demo@kidoc.local'),
    'MST-2025-005', 1, '2025-03-03 14:00:00+01', now(), now());

-- Emilia: Sorgerechtsstreit (OFFEN)
INSERT INTO falloeffnungen (dossier_id, traeger_id, einrichtung_org_unit_id, status, titel,
    kurzbeschreibung, created_by_user_id, aktenzeichen, fall_no, opened_at, created_at, updated_at)
VALUES (
    (SELECT d.id FROM kind_dossiers d JOIN kinder k ON k.id=d.kind_id WHERE k.vorname='Emilia' AND k.nachname='Bauer'),
    (SELECT id FROM traeger WHERE slug='demo-traeger'),
    (SELECT id FROM org_units WHERE name='Villa Kunterbunt' AND type='EINRICHTUNG'),
    'OFFEN', 'Erstmeldung – Kindeswohlgefährdung im Sorgerechtsstreit – Emilia B.',
    'Polizeimeldung 05.03.2025: Streit im Beisein des Kindes. Eltern im Trennungskonflikt. Emilia zeigt Regressions- und Bindungsstörungszeichen.',
    (SELECT id FROM users WHERE email='demo@kidoc.local'),
    'MST-2025-006', 1, '2025-03-05 16:00:00+01', now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- MELDUNGEN (alle Felder des Wizards)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── M1: Lena / MST-2024-001 / v1 / ERSTMELDUNG / ROT / ABGESCHLOSSEN ─────────
INSERT INTO meldungen (falloeffnung_id, version_no, current, row_version, status, type,
    erfasst_von_rolle, meldeweg, meldende_stelle_kontakt,
    dringlichkeit, datenbasis,
    einwilligung_vorhanden, schweigepflichtentbindung_vorhanden,
    kurzbeschreibung, fach_ampel, fach_text,
    abweichung_zur_auto,
    akut_gefahr_im_verzug, akut_begruendung, akut_notruf_erforderlich, akut_kind_sicher_untergebracht,
    naechste_ueberpruefung_am, zusammenfassung,
    created_by_user_id, created_by_display_name,
    submitted_at, submitted_by_user_id, submitted_by_display_name,
    info_effective_at, created_at, updated_at)
VALUES (
    (SELECT id FROM falloeffnungen WHERE aktenzeichen='MST-2024-001'),
    1, false, 1, 'ABGESCHLOSSEN', 'ERSTMELDUNG',
    'EINRICHTUNGSLEITUNG', 'PERSOENLICH', 'Erzieherin Sabine Kamps, Villa Kunterbunt, Tel. 0221 4712345',
    'ZEITNAH_24_48H', 'BEOBACHTUNG',
    false, false,
    'Erzieherin Frau Kamps beobachtete am 14.01.2025 beim Anziehen Hämatome an beiden Oberarmen (je ca. 4–5 cm, bläulich-grün) und am oberen Rücken (ca. 8 cm, gelblich-grün) von Lena Müller (6 J.). Das Kind zog sich bei Körperkontakt zurück und verweigerte Erklärungen. Mutter Anna M. holte das Kind schweigend ab. Vater Thomas M. ist wegen Alkoholmissbrauch und häuslicher Gewalt vorbekannt.',
    'ROT',
    'Die Verletzungen sind nicht mit einem Unfall vereinbar. Lokalisation und Muster (bilateral Oberarme, Rücken) deuten auf wiederholte körperliche Übergriffe hin. Das Verhalten des Kindes (Rückzug, Angst, Schonhaltung) verstärkt den Verdacht erheblich. Die Mutter erscheint überfordert und schützend gegenüber dem Vater. Eine unmittelbare Lebensgefahr liegt nicht vor, da das Kind tagsüber beaufsichtigt ist. Die Gefährdung im häuslichen Umfeld ist jedoch als hoch einzuschätzen. ASD-Einschaltung und kinderärztliche Begutachtung sind unverzüglich einzuleiten.',
    'GLEICH',
    false, 'Kind befindet sich tagsüber unter Aufsicht in der Einrichtung. Gefährdung besteht vornehmlich im häuslichen Umfeld. Eltern wurden informiert, aber noch nicht umfassend konfrontiert. ASD-Meldung unmittelbar eingeleitet.', false, 'JA',
    '2025-02-01',
    'Hämatome dokumentiert und fotografiert. Mutter über Wahrnehmung informiert – Reaktion defensiv. ASD Herr Nowak telefonisch informiert, Hausbesuch 22.01. vereinbart. Kinderärztin Dr. Behrens zur Begutachtung einbezogen. Familienhilfe als Hilfe zur Erziehung empfohlen.',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo',
    '2025-01-16 11:00:00+01', (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo',
    '2025-01-14 14:30:00+01', now(), now());

-- ── M2: Lena / MST-2024-001 / v2 / VERLAUF / GELB / ABGESCHLOSSEN ────────────
INSERT INTO meldungen (falloeffnung_id, version_no, current, row_version, status, type,
    erfasst_von_rolle, meldeweg, meldende_stelle_kontakt,
    dringlichkeit, datenbasis,
    einwilligung_vorhanden, schweigepflichtentbindung_vorhanden,
    kurzbeschreibung, fach_ampel, fach_text,
    abweichung_zur_auto, change_reason,
    akut_gefahr_im_verzug, akut_notruf_erforderlich, akut_kind_sicher_untergebracht,
    naechste_ueberpruefung_am, zusammenfassung,
    created_by_user_id, created_by_display_name,
    submitted_at, submitted_by_user_id, submitted_by_display_name,
    info_effective_at, created_at, updated_at)
VALUES (
    (SELECT id FROM falloeffnungen WHERE aktenzeichen='MST-2024-001'),
    2, true, 1, 'ABGESCHLOSSEN', 'MELDUNG',
    'SOZIALPAEDAGOGIN', 'TELEFON', 'ASD Herr Nowak, Jugendamt Köln-Innenstadt, Tel. 0221 2212345',
    'BEOBACHTEN', 'ERZAEHLUNG',
    true, true,
    'Rückmeldung ASD nach Hausbesuch 22.01.2025: Vater hat Beratungsangebot angenommen (Fachstelle Sucht Köln). Keine weiteren Verletzungen feststellbar. Lena wirkt im Kita-Alltag entspannter. Familienhilfe ab 01.02.2025 bewilligt.',
    'GELB',
    'Situation hat sich nach ASD-Intervention stabilisiert. Vater zeigt Kooperationsbereitschaft und hat Kontakt zur Suchtberatungsstelle aufgenommen. Mutter berichtet, häusliche Konflikte hätten nachgelassen. Lena wirkt im Kindergartenalltag weniger ängstlich. Familienhilfe als präventive Maßnahme sinnvoll. Lage weiter engmaschig begleiten. Abschluss in 6 Wochen angestrebt sofern keine Rückfälle.',
    'GLEICH', 'UPDATE',
    false, false, 'JA',
    '2025-02-28',
    'Situation stabilisiert. Familienhilfe eingeleitet. Wöchentliche Überprüfung in der Einrichtung durch Erzieherin Kamps.',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo',
    '2025-01-23 14:00:00+01', (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo',
    '2025-01-22 16:00:00+01', now(), now());

-- ── M3: Lena / MST-2025-002 / v1 / VERLAUF / GRÜN / IN_BEARBEITUNG ───────────
INSERT INTO meldungen (falloeffnung_id, version_no, current, row_version, status, type,
    erfasst_von_rolle, meldeweg,
    dringlichkeit, datenbasis,
    einwilligung_vorhanden, schweigepflichtentbindung_vorhanden,
    kurzbeschreibung, fach_ampel, fach_text,
    abweichung_zur_auto,
    akut_gefahr_im_verzug, akut_notruf_erforderlich, akut_kind_sicher_untergebracht,
    naechste_ueberpruefung_am,
    created_by_user_id, created_by_display_name,
    info_effective_at, created_at, updated_at)
VALUES (
    (SELECT id FROM falloeffnungen WHERE aktenzeichen='MST-2025-002'),
    1, true, 0, 'IN_BEARBEITUNG', 'MELDUNG',
    'EINRICHTUNGSLEITUNG', 'PERSOENLICH',
    'BEOBACHTEN', 'BEOBACHTUNG',
    true, true,
    'Familienhilfe läuft seit 01.03.2025. Erzieherin beobachtet positive Entwicklung: Lena kommt regelmäßig, wirkt ausgeruht und gepflegt. Vater erscheint pünktlich zur Abholung. Großmutter Inge M. besucht Familie wöchentlich als unterstützende Ressource.',
    'GRUEN',
    'Schutzmaßnahmen greifen. Kind zeigt keine neuen Auffälligkeiten. Zusammenarbeit mit der Familie ist konstruktiv. Familienhelferin Frau Berger berichtet von deutlicher Verbesserung der Haushaltsführung und des Erziehungsverhaltens. Weiterer Verlauf positiv – Abschluss in 8 Wochen angestrebt, sofern keine Rückfälle auftreten.',
    'GLEICH',
    false, false, 'JA',
    '2026-04-15',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo',
    '2025-03-10 09:00:00+01', now(), now());

-- ── M4: Max / MST-2024-003 / v1 / ERSTMELDUNG / GELB / ABGESCHLOSSEN ─────────
INSERT INTO meldungen (falloeffnung_id, version_no, current, row_version, status, type,
    erfasst_von_rolle, meldeweg, meldende_stelle_kontakt,
    dringlichkeit, datenbasis,
    einwilligung_vorhanden, schweigepflichtentbindung_vorhanden,
    kurzbeschreibung, fach_ampel, fach_text,
    abweichung_zur_auto, abweichungs_begruendung,
    akut_gefahr_im_verzug, akut_notruf_erforderlich, akut_kind_sicher_untergebracht,
    naechste_ueberpruefung_am, zusammenfassung,
    created_by_user_id, created_by_display_name,
    submitted_at, submitted_by_user_id, submitted_by_display_name,
    info_effective_at, created_at, updated_at)
VALUES (
    (SELECT id FROM falloeffnungen WHERE aktenzeichen='MST-2024-003'),
    1, false, 1, 'ABGESCHLOSSEN', 'ERSTMELDUNG',
    'ERZIEHERIN', 'PERSOENLICH', 'Erzieherin Renate Hölzel, Villa Kunterbunt Köln, Tel. 0221 4712345',
    'ZEITNAH_24_48H', 'BEOBACHTUNG',
    false, false,
    'Max Schmidt (7 J.) erscheint seit mindestens 6 Wochen regelmäßig ohne Frühstück in der Einrichtung, Kleidung unrein und nicht witterungsgerecht. Hausarzt Dr. Bergmann bestätigt Untergewicht (KMI 14,1). Mutter Petra S. steht unter Bewährungsstrafe wegen Drogenbesitzes. Kind zeigt aggressive Ausbrüche und Konzentrationsprobleme.',
    'GELB',
    'Klare Zeichen chronischer Vernachlässigung (Ernährung, Hygiene, Kleidung) über min. 6 Wochen. Situation ist nicht akut lebensbedrohlich, aber eine Kindeswohlgefährdung nach §8a SGB VIII liegt nahe. Mutter befindet sich in prekärer Lebenssituation (Sucht, Bewährung). Kooperationsbereitschaft fraglich. ASD-Meldung und Hausbesuch erforderlich.',
    'HOEHER', 'Das automatische System bewertet primär nach sichtbarem Körperbefund. Die chronische Vernachlässigung (Ernährung, Kleidung, Hygiene über >6 Wochen) kombiniert mit Suchtproblematik der Mutter erfordert nach fachlicher Einschätzung eine höhere Dringlichkeitsstufe als der Algorithmus ausweist.',
    false, false, 'UNKLAR',
    '2024-12-01',
    'ASD informiert, Hausbesuch für 15.10.2024 terminiert. Einrichtung versorgt Kind mit Frühstück. Logopädie-Förderung läuft.',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo',
    '2024-10-08 10:00:00+02', (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo',
    '2024-10-07 11:30:00+02', now(), now());

-- ── M5: Max / MST-2024-003 / v2 / VERLAUF / GELB / IN_BEARBEITUNG ────────────
INSERT INTO meldungen (falloeffnung_id, version_no, current, row_version, status, type,
    erfasst_von_rolle, meldeweg, meldende_stelle_kontakt,
    dringlichkeit, datenbasis,
    einwilligung_vorhanden, schweigepflichtentbindung_vorhanden,
    kurzbeschreibung, fach_ampel, fach_text,
    abweichung_zur_auto, change_reason,
    akut_gefahr_im_verzug, akut_notruf_erforderlich, akut_kind_sicher_untergebracht,
    naechste_ueberpruefung_am,
    created_by_user_id, created_by_display_name,
    info_effective_at, created_at, updated_at)
VALUES (
    (SELECT id FROM falloeffnungen WHERE aktenzeichen='MST-2024-003'),
    2, true, 0, 'IN_BEARBEITUNG', 'MELDUNG',
    'SOZIALPAEDAGOGIN', 'TELEFON', 'ASD Frau Kleinert, Jugendamt Köln-Poll, Tel. 0221 9876543',
    'BEOBACHTEN', 'ERZAEHLUNG',
    false, false,
    'ASD-Hausbesuch 15.10.2024: Wohnung verwahrlost, kaum Lebensmittel vorhanden. Mutter wechselnd kooperativ, Drogenscreening positiv (Cannabis, Amphetamine). Hilfeplan wird erstellt. Max erhält ab sofort tägliches Mittagessen in der Einrichtung über Bildungspaket.',
    'GELB',
    'Lage bleibt kritisch. Mutter zeigt keine ausreichende Einsicht. Hilfeplan notwendig, Mitwirkungsbereitschaft gering. Max macht im Kita-Kontext Fortschritte (Sprache, soziale Integration). Situation muss engmaschig begleitet werden. Entzug der elterlichen Sorge nur als letztes Mittel – zunächst alle Hilfen ausschöpfen.',
    'GLEICH', 'UPDATE',
    false, false, 'UNKLAR',
    '2026-04-30',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo',
    '2024-10-15 16:00:00+02', now(), now());

-- ── M6: Sofia / MST-2025-004 / v1 / ERSTMELDUNG / ROT / ABGESCHLOSSEN ────────
INSERT INTO meldungen (falloeffnung_id, version_no, current, row_version, status, type,
    erfasst_von_rolle, meldeweg, meldende_stelle_kontakt,
    dringlichkeit, datenbasis,
    einwilligung_vorhanden, schweigepflichtentbindung_vorhanden,
    kurzbeschreibung, fach_ampel, fach_text,
    abweichung_zur_auto,
    akut_gefahr_im_verzug, akut_begruendung, akut_notruf_erforderlich, akut_kind_sicher_untergebracht,
    zusammenfassung,
    created_by_user_id, created_by_display_name,
    submitted_at, submitted_by_user_id, submitted_by_display_name,
    info_effective_at, created_at, updated_at)
VALUES (
    (SELECT id FROM falloeffnungen WHERE aktenzeichen='MST-2025-004'),
    1, true, 1, 'ABGESCHLOSSEN', 'ERSTMELDUNG',
    'EINRICHTUNGSLEITUNG', 'TELEFON', 'Polizeibeamter KHK Meyer, Polizei Köln, Einsatzbericht Nr. 2025-KOE-0432, Tel. 0221 2290',
    'BEOBACHTEN', 'BEOBACHTUNG',
    false, false,
    'Polizei informiert Einrichtung am 08.02.2025 über Einsatz in der Wohnung von Klaus Weber. Sofia (5 J.) war direkt bei häuslicher Gewalt-Eskalation anwesend. Vater stark alkoholisiert (1,8 Promille laut Polizeibericht). Mutter Susanne W. seit 2023 unbekannten Aufenthalts. Kind wurde durch die Polizei zur Großmutter Gerda Weber (Köln-Buchheim) gebracht. Inobhutnahme durch ASD erfolgt. Fall abgeschlossen – Kind dauerhaft bei Großmutter untergebracht.',
    'GELB',
    'Situation ist dauerhaft stabilisiert. Kind lebt seit Februar 2025 bei Großmutter Gerda W. in stabilen und sicheren Verhältnissen. Vater befindet sich in stationärer Therapie (Alkohol). Gerichtlicher Beschluss zur Unterbringung bei der Großmutter liegt vor. Keine weiteren Kindeswohlgefährdungshinweise. Fall kann abgeschlossen werden.',
    'GLEICH',
    false,
    null,
    false, 'JA',
    'Kind bei Großmutter dauerhaft und sicher untergebracht. Gerichtsbeschluss rechtskräftig. Vater in Therapie. Fall abgeschlossen.',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo',
    '2025-02-09 08:30:00+01', (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo',
    '2025-02-08 21:00:00+01', now(), now());

-- ── M7: Noah / MST-2025-005 / v1 / ERSTMELDUNG / GELB / IN_BEARBEITUNG ───────
INSERT INTO meldungen (falloeffnung_id, version_no, current, row_version, status, type,
    erfasst_von_rolle, meldeweg, meldende_stelle_kontakt,
    dringlichkeit, datenbasis,
    einwilligung_vorhanden, schweigepflichtentbindung_vorhanden,
    kurzbeschreibung, fach_ampel, fach_text,
    abweichung_zur_auto,
    akut_gefahr_im_verzug, akut_notruf_erforderlich, akut_kind_sicher_untergebracht,
    naechste_ueberpruefung_am,
    created_by_user_id, created_by_display_name,
    info_effective_at, created_at, updated_at)
VALUES (
    (SELECT id FROM falloeffnungen WHERE aktenzeichen='MST-2025-005'),
    1, true, 0, 'IN_BEARBEITUNG', 'ERSTMELDUNG',
    'ERZIEHERIN', 'PERSOENLICH', 'Erzieherin Martina Schulz, Villa Kunterbunt Köln, Tel. 0221 4712345',
    'ZEITNAH_24_48H', 'ERZAEHLUNG',
    false, false,
    'Noah Fischer (8 J.) berichtet der Erzieherin am 03.03.2025 spontan, dass er am Wochenende „oft alleine ist, weil Mama schläft und Jürgen weggeht". Mutter Maria F. war laut Entlassungsbericht im Februar 2025 stationär wegen schwerer depressiver Episode. Stiefvater Jürgen H. reagierte auf Nachfragen der Einrichtungsleitung laut und bedrohlich.',
    'GELB',
    'Betreuungssituation für Noah ist nicht gesichert. Psychische Erkrankung der Mutter beeinträchtigt die Erziehungsfähigkeit erheblich. Stiefvater zeigt aggressive Abwehr gegenüber Fachkräften – deutliches Warnsignal. Noah zeigt keine körperlichen Verletzungszeichen, aber sozio-emotionale Belastungsanzeichen (Müdigkeit, erhöhtes Bindungsbedürfnis). Priorität: verlässliche Betreuung sicherstellen, ASD einschalten.',
    'GLEICH',
    false, false, 'UNKLAR',
    '2026-03-26',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo',
    '2025-03-03 14:30:00+01', now(), now());

-- ── M8: Emilia / MST-2025-006 / v1 / ERSTMELDUNG / GELB / ENTWURF ────────────
INSERT INTO meldungen (falloeffnung_id, version_no, current, row_version, status, type,
    erfasst_von_rolle, meldeweg, meldende_stelle_kontakt,
    dringlichkeit, datenbasis,
    einwilligung_vorhanden, schweigepflichtentbindung_vorhanden,
    kurzbeschreibung, fach_ampel, fach_text,
    abweichung_zur_auto, abweichungs_begruendung,
    akut_gefahr_im_verzug, akut_notruf_erforderlich, akut_kind_sicher_untergebracht,
    created_by_user_id, created_by_display_name,
    info_effective_at, created_at, updated_at)
VALUES (
    (SELECT id FROM falloeffnungen WHERE aktenzeichen='MST-2025-006'),
    1, true, 0, 'ENTWURF', 'ERSTMELDUNG',
    'EINRICHTUNGSLEITUNG', 'TELEFON', 'Sachbearbeiterin Frau Löwenthal, Polizei Köln, Tel. 0221 2290',
    'ZEITNAH_24_48H', 'ERZAEHLUNG',
    false, false,
    'Polizei übermittelt am 06.03.2025 Meldung über Vorfall vom 05.03.2025: Nachbarin rief Polizei wegen lautem Streit. Emilia Bauer (4 J.) anwesend. Eltern im Trennungskonflikt, Sorgerechtsverfahren läuft. Emilia zeigt seit Wochen Regressionsverhalten (Einnässen), Daumenlutschen und klagt über Bauchschmerzen.',
    'GELB',
    'Situation noch nicht abschließend beurteilbar. Regressionsverhalten und Bindungsstörung sind als Stresssymptomatik im Kontext des Trennungskonflikts zu werten. Akute körperliche Gefährdung liegt nicht vor, aber psychische Belastung des Kindes ist erheblich. Beide Elternteile müssen befragt werden. Familiengerichtsverfahren abwarten, gleichzeitig eigene Einschätzung dokumentieren.',
    'NIEDRIGER', 'Automatisches System bewertet bei Elternkonflikt mit Polizeieinsatz höher. Fachliche Einschätzung: aktuell keine direkte körperliche Gefährdung. Psychische Belastung real, aber situativ. Lage noch nicht vollständig beurteilbar – bewusst konservative Einschätzung bis Elterngespräche geführt sind.',
    false, false, 'UNKLAR',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo',
    '2025-03-05 20:00:00+01', now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- ANLASSCODES
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO meldung_anlass_codes (meldung_id, code) VALUES
  -- M1: Lena Erstmeldung ROT
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1), 'BODY_INJURY_VISIBLE'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1), 'BODY_BRUISES_PATTERNED'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1), 'BODY_INJURY_EXPLANATION_ODD'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1), 'BODY_PUNISHMENT_HINT'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1), 'FAMILY_DOMESTIC_VIOLENCE'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1), 'PARENT_SUBSTANCE_IMPAIRED_CARE'),
  -- M2: Lena Verlauf GELB
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=2), 'BODY_INJURY_VISIBLE'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=2), 'FAMILY_DOMESTIC_VIOLENCE'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=2), 'PARENT_SUBSTANCE_IMPAIRED_CARE'),
  -- M3: Lena Verlaufskontrolle GRÜN
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-002' AND m.version_no=1), 'FAMILY_DOMESTIC_VIOLENCE'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-002' AND m.version_no=1), 'FAMILY_PREVIOUS_PROTECTION_CASE'),
  -- M4: Max Erstmeldung GELB
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1), 'NEGLECT_FOOD'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1), 'NEGLECT_HYGIENE'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1), 'NEGLECT_CLOTHING'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1), 'NEGLECT_CHRONIC'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1), 'BODY_MALNUTRITION'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1), 'PARENT_SUBSTANCE_IMPAIRED_CARE'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1), 'FAMILY_SUBSTANCE_ABUSE'),
  -- M5: Max Verlauf
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=2), 'NEGLECT_FOOD'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=2), 'PARENT_SUBSTANCE_IMPAIRED_CARE'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=2), 'PARENT_UNCOOPERATIVE'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=2), 'FAMILY_SUBSTANCE_ABUSE'),
  -- M6: Sofia ROT
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1), 'ACUTE_IMMEDIATE_DANGER'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1), 'FAMILY_DOMESTIC_VIOLENCE'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1), 'ACUTE_INTOXICATED_CAREGIVER'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1), 'ACUTE_VIOLENCE_ESCALATION'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1), 'ACUTE_CAREGIVER_UNREACHABLE'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1), 'FAMILY_NO_SUPPORT_NETWORK'),
  -- M7: Noah GELB
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1), 'SUPERVISION_LEFT_ALONE'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1), 'SUPERVISION_NIGHT_UNATTENDED'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1), 'PARENT_PSYCH_IMPAIRED_CARE'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1), 'PARENT_OVERWHELMED'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1), 'CHILD_DISCLOSES_NEGLECT'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1), 'FAMILY_MENTAL_ILLNESS'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1), 'PARENT_UNCOOPERATIVE'),
  -- M8: Emilia GELB ENTWURF
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-006' AND m.version_no=1), 'PSYCH_REGRESSION'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-006' AND m.version_no=1), 'FAMILY_SEPARATION_CRISIS'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-006' AND m.version_no=1), 'FAMILY_ESCALATING_CONFLICT'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-006' AND m.version_no=1), 'BODY_PSYCHOSOMATIC'),
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-006' AND m.version_no=1), 'PSYCH_SLEEP_DISTURBANCE');

-- ═══════════════════════════════════════════════════════════════════════════
-- BEOBACHTUNGEN (alle Felder: zeitraum, ort, quelle, woertliches_zitat, verhalten_bezug …)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Beobachtungen zu M1 (Lena, Erstmeldung ROT) ──────────────────────────────

INSERT INTO meldung_observations
    (meldung_id, zeitpunkt, zeitraum, ort, quelle, sichtbarkeit,
     text, koerperbefund, verhalten_kind,
     created_by_user_id, created_by_display_name, created_at)
VALUES (
    (SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1),
    '2025-01-14 08:45:00+01', 'EINMALIG', 'SCHULE_KITA', 'EIGENE_WAHRNEHMUNG', 'INTERN',
    'Beim Anziehen für den Morgenkreis wurden Hämatome an beiden Oberarmen (je ca. 4–5 cm, bläulich-grün) und am oberen Rücken (ca. 8 cm, gelblich-grün) festgestellt. Das Kind hat die Verletzungen nicht erklärt und zog sich bei jeder Berührungsannäherung zurück.',
    'Hämatome Oberarme beidseits und oberer Rücken. Kein frisches Blut. Das ältere Hämatom am Rücken (gelblich) deutet auf eine min. 5–7 Tage alte Verletzung hin. Alle Verletzungen im nicht-unfallkonformen Bereich.',
    'Lena zog sich bei der Körperpflege zurück und zuckte zusammen, als die Erzieherin die Schulter berührte. Auf Nachfrage schwieg das Kind. Kein Augenkontakt. Schonhaltung beim Anziehen.',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo', now());

INSERT INTO meldung_observations
    (meldung_id, zeitpunkt, zeitraum, ort, quelle, sichtbarkeit,
     text, verhalten_kind, verhalten_bezug, woertliches_zitat,
     created_by_user_id, created_by_display_name, created_at)
VALUES (
    (SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1),
    '2025-01-14 16:30:00+01', 'EINMALIG', 'SCHULE_KITA', 'DRITTE', 'INTERN',
    'Gespräch mit Mutter Anna M. bei Abholung. Mutter mit den beobachteten Hämatomen konfrontiert. Reaktion: ausweichend, defensiv, keine konstruktive Auseinandersetzung. Gespräch dauerte ca. 4 Minuten.',
    'Lena klammerte sich bei Ankunft der Mutter an die Erzieherin. Ging erst nach mehrmaligem Rufen der Mutter zur Tür. Kein freudiges Begrüßungsverhalten.',
    'Mutter Anna M. wirkte nervös und angespannt. Blockte Nachfragen ab mit ausweichenden Antworten. Verließ die Einrichtung nach kurzem Gespräch schnell. Kein Augenkontakt mit der Erzieherin.',
    '"Die ist halt rumgefallen, die ist so ungeschickt immer." (Mutter Anna M., auf die Hämatome angesprochen, 14.01.2025, 16:32 Uhr)',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo', now());

-- ── Beobachtungen zu M2 (Lena, Verlauf GELB) ─────────────────────────────────

INSERT INTO meldung_observations
    (meldung_id, zeitpunkt, zeitraum, ort, quelle, sichtbarkeit,
     text, verhalten_kind,
     created_by_user_id, created_by_display_name, created_at)
VALUES (
    (SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=2),
    '2025-01-22 14:00:00+01', 'EINMALIG', 'SCHULE_KITA', 'DRITTE', 'INTERN',
    'Rückmeldung ASD Herr Nowak nach Hausbesuch 22.01.2025: Keine neuen Verletzungen. Vater hat Termin in Suchtberatungsstelle bestätigt. Haushalt geordnet. Mutter kooperiert mit Familienhilfe.',
    'Lena lacht wieder beim Morgenkreis. Zuckt bei Berührungen nicht mehr zusammen. Sucht Nähe zu vertrauten Erzieherinnen, aber ohne Angstkomponente. Spielt aktiver mit anderen Kindern.',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo', now());

-- ── Beobachtungen zu M3 (Lena, Verlaufskontrolle GRÜN) ───────────────────────

INSERT INTO meldung_observations
    (meldung_id, zeitpunkt, zeitraum, ort, quelle, sichtbarkeit,
     text, verhalten_kind, verhalten_bezug,
     created_by_user_id, created_by_display_name, created_at)
VALUES (
    (SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-002' AND m.version_no=1),
    '2025-03-07 09:00:00+01', 'WIEDERHOLT', 'SCHULE_KITA', 'EIGENE_WAHRNEHMUNG', 'INTERN',
    'Mehrwöchige Verlaufsbeobachtung (01.03.–07.03.2025): Lena kommt täglich pünktlich, wirkt ausgeruht, Kleidung sauber und witterungsgerecht. Keine Auffälligkeiten im Verhalten. Freundschaft mit Emma geschlossen.',
    'Lena spielt aktiv in der Gruppe. Keine Rückzugstendenzen. Keine Schonhaltung oder Schreckreaktionen mehr beobachtbar. Bringt Mal- und Bastelarbeiten aus dem Wochenende mit.',
    'Vater Thomas M. erscheint täglich pünktlich zur Abholung, ist ansprechbar und freundlich. Wirkt nüchtern und gefasst. Kein Alkoholgeruch. Hat Kontakt zur Erzieherin gesucht und positiv rückgemeldet.',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo', now());

-- ── Beobachtungen zu M4 (Max, Erstmeldung GELB) ──────────────────────────────

INSERT INTO meldung_observations
    (meldung_id, zeitpunkt, zeitraum, ort, quelle, sichtbarkeit,
     text, verhalten_kind, koerperbefund,
     created_by_user_id, created_by_display_name, created_at)
VALUES (
    (SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1),
    '2024-10-07 08:00:00+02', 'WIEDERHOLT', 'SCHULE_KITA', 'EIGENE_WAHRNEHMUNG', 'INTERN',
    'Max kam erneut ohne Brotzeit. Kleidung riecht nach Rauch, Socken mit Löchern, Jacke für Herbst ungeeignet (Sommerjacke bei 10°C). Diese Beobachtungen wurden seit min. 6 Wochen regelmäßig dokumentiert.',
    'Max war beim Ankommen deutlich unruhig und aufgedreht. Biss einem anderen Kind in den Arm ohne erkennbaren Auslöser. Nach dem Frühstück (vom Haus bereitgestellt) deutlich ruhiger und konzentrierter.',
    'Keine sichtbaren Verletzungen. Kind wirkt blass und erschöpft. Augenscheinlich deutlich zu dünn für sein Alter. Hausarzt Dr. Bergmann bestätigte KMI 14,1 (07.10.2024).',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo', now());

INSERT INTO meldung_observations
    (meldung_id, zeitpunkt, zeitraum, ort, quelle, sichtbarkeit,
     text, verhalten_kind, woertliches_zitat,
     created_by_user_id, created_by_display_name, created_at)
VALUES (
    (SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1),
    '2024-10-07 10:30:00+02', 'EINMALIG', 'SCHULE_KITA', 'KIND', 'INTERN',
    'Einzelgespräch mit Max auf Initiative von Erzieherin Hölzel. Max berichtete spontan über die Versorgungssituation zuhause, ohne direkt befragt zu werden. Keine Suggestivfragen gestellt.',
    'Max schaute beim Erzählen zur Seite und knetete seine Hände. Wechselte das Thema schnell. Zeigte keine sichtbare emotionale Belastung beim Erzählen, aber Blickkontakt fehlte.',
    '"Mama schläft manchmal ganz lange und dann gibt es kein Essen. Aber ich darf sie nicht wecken, hat Jens (Mutters Freund) gesagt." (Max S., 07.10.2024, ca. 10:35 Uhr)',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo', now());

-- ── Beobachtungen zu M5 (Max, Verlauf) ───────────────────────────────────────

INSERT INTO meldung_observations
    (meldung_id, zeitpunkt, zeitraum, ort, quelle, sichtbarkeit,
     text, verhalten_bezug,
     created_by_user_id, created_by_display_name, created_at)
VALUES (
    (SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=2),
    '2024-10-15 16:00:00+02', 'EINMALIG', 'ZUHAUSE', 'DRITTE', 'INTERN',
    'Rückmeldung ASD-Hausbesuch vom 15.10.2024: Wohnung verwahrlost, kaum Lebensmittel vorhanden, Küche verschmutzt. Mutter Petra S. öffnete nach langem Klingeln, wirkte benommen. Drogenscreening positiv (Cannabis und Amphetamine laut ASD-Bericht).',
    'Mutter Petra S. war wechselnd kooperativ und feindseelig. Beschuldigte die Einrichtung, sich einzumischen. Zeigte kein adäquates Problembewusstsein. Unterschrieb Hilfeplan-Einleitung erst nach ausführlicher Überzeugungsarbeit durch ASD.',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo', now());

-- ── Beobachtungen zu M6 (Sofia, ROT, Notunterbringung) ───────────────────────

INSERT INTO meldung_observations
    (meldung_id, zeitpunkt, zeitraum, ort, quelle, sichtbarkeit,
     text, verhalten_kind, koerperbefund, woertliches_zitat,
     created_by_user_id, created_by_display_name, created_at)
VALUES (
    (SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1),
    '2025-02-09 09:00:00+01', 'EINMALIG', 'SCHULE_KITA', 'DRITTE', 'INTERN',
    'Sofia wurde am Morgen des 09.02.2025 von Großmutter Gerda W. in die Einrichtung gebracht. Großmutter berichtete über den Polizeieinsatz vom Vorabend und den Aufenthalt bei ihr. Kind schläft bei ihr seit gestern Abend.',
    'Sofia wirkte still und in sich gekehrt. Keine spontane Sprache, kein Lächeln beim Ankommen. Klammerte sich an ihren Teddybären. Ließ sich von vertrauten Erzieherinnen trösten und spielte nach ca. 1 Stunde ruhig alleine in der Puppenküche.',
    'Keine äußerlichen Verletzungen feststellbar. Kind wirkt erschöpft, Augen leicht gerötet vom Weinen. Keine Anzeichen von körperlicher Misshandlung.',
    '"Papa hat geschrien und Sachen geworfen. Dann ist der Mann in Blau gekommen und hat mich zu Oma gebracht." (Sofia W., auf Nachfrage der Erzieherin, 09.02.2025, ca. 09:20 Uhr)',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo', now());

INSERT INTO meldung_observations
    (meldung_id, zeitpunkt, zeitraum, ort, quelle, sichtbarkeit,
     text, verhalten_bezug,
     created_by_user_id, created_by_display_name, created_at)
VALUES (
    (SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1),
    '2025-02-09 09:15:00+01', 'EINMALIG', 'SCHULE_KITA', 'DRITTE', 'INTERN',
    'Gespräch mit Großmutter Gerda Weber (69) bei Übergabe. Frau Weber schilderte den Ablauf des Vortages detailliert und glaubhaft. Polizeibeamter KHK Meyer hatte sie um 22:00 Uhr kontaktiert.',
    'Großmutter Gerda W. wirkte besorgt, aber gefasst und belastbar. Kooperiert vollständig mit der Einrichtung und dem ASD. Erklärt ausdrücklich, sie sei bereit, Sofia dauerhaft bei sich aufzunehmen solange nötig. Positive, liebevolle Beziehung zu Sofia beobachtbar.',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo', now());

-- ── Beobachtungen zu M7 (Noah, GELB) ─────────────────────────────────────────

INSERT INTO meldung_observations
    (meldung_id, zeitpunkt, zeitraum, ort, quelle, sichtbarkeit,
     text, verhalten_kind, woertliches_zitat,
     created_by_user_id, created_by_display_name, created_at)
VALUES (
    (SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1),
    '2025-03-03 10:30:00+01', 'WIEDERHOLT', 'SCHULE_KITA', 'KIND', 'INTERN',
    'Noah berichtete der Erzieherin Schulz am Morgen spontan über sein Wochenende. Keine Suggestivfragen, Kind erzählte ohne Aufforderung. Dies ist das dritte Mal in 4 Wochen, dass Noah ähnliche Schilderungen macht.',
    'Noah kam mit nicht gebürsteten Haaren und in derselben Kleidung wie am Freitag. Wirkte müde und abgelenkt. Bat die Erzieherin mehrfach um eine Umarmung – für ihn ungewöhnlich. Beim Freispiel zog er sich von der Gruppe zurück.',
    '"Jürgen war am Wochenende weg und Mama hat immer geschlafen. Ich hab mir Kekse geholt weil es nichts anderes gab. Ich hab auch selber Licht gemacht weil es dunkel war." (Noah F., 03.03.2025, ca. 10:35 Uhr)',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo', now());

INSERT INTO meldung_observations
    (meldung_id, zeitpunkt, zeitraum, ort, quelle, sichtbarkeit,
     text, verhalten_bezug, woertliches_zitat,
     created_by_user_id, created_by_display_name, created_at)
VALUES (
    (SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1),
    '2025-03-03 16:45:00+01', 'EINMALIG', 'SCHULE_KITA', 'DRITTE', 'INTERN',
    'Einrichtungsleitung versuchte Stiefvater Jürgen H. bei der Abholung anzusprechen, um die geschilderte Situation zu klären und über Unterstützungsangebote zu informieren.',
    'Jürgen H. reagierte sofort laut und einschüchternd. Körpersprache aggressiv (aufgerichtet, Finger zeigend). Nahm Noah unverzüglich und verließ die Einrichtung. Kooperation vollständig verweigert.',
    '"Das geht Sie gar nichts an. Wenn Sie meinen Stiefsohn weiter ausfragen, höre ich davon." (Jürgen H., 03.03.2025, 16:48 Uhr, auf Ansprache zur Versorgungssituation)',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo', now());

-- ── Beobachtungen zu M8 (Emilia, GELB ENTWURF) ───────────────────────────────

INSERT INTO meldung_observations
    (meldung_id, zeitpunkt, zeitraum, ort, quelle, sichtbarkeit,
     text, verhalten_kind, woertliches_zitat,
     created_by_user_id, created_by_display_name, created_at)
VALUES (
    (SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-006' AND m.version_no=1),
    '2025-03-04 08:30:00+01', 'WIEDERHOLT', 'SCHULE_KITA', 'EIGENE_WAHRNEHMUNG', 'INTERN',
    'Verlaufsbeobachtung über ca. 4 Wochen (Feb.–März 2025): Emilia zeigt zunehmendes Regressionsverhalten. Einnässen (war seit Nov. 2024 trocken), Daumenlutschen wieder aufgenommen, häufige Klagen über Bauchschmerzen ohne organischen Befund (Kinderärztin Dr. Meißner, 28.02.2025).',
    'Emilia klammert sich morgens beim Abgeben. Weint mehrfach täglich ohne erkennbaren Auslöser. Spielt kaum in der Gruppe, bevorzugt Einzelspiel in der Puppenküche mit Wiederholungsmustern (immer dieselbe Szene: Eltern streiten, Kind versteckt sich). Schlafbedürftig nach dem Mittagessen.',
    '"Ich will nicht nach Hause. Mama und Papa streiten immer und dann muss ich auf mein Zimmer." (Emilia B., auf die Frage was sie nach Hause wünscht, 04.03.2025, 08:40 Uhr)',
    (SELECT id FROM users WHERE email='demo@kidoc.local'), 'D. Emo', now());

-- ═══════════════════════════════════════════════════════════════════════════
-- OBSERVATION TAGS
-- ═══════════════════════════════════════════════════════════════════════════

-- M1 Obs1 (Lena Körperbefund)
INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'BODY_INJURY_VISIBLE', 2, 'Hämatome bilateral Oberarme und oberer Rücken, bläulich-grün und gelblich-grün'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1 AND mo.zeitpunkt='2025-01-14 08:45:00+01';

INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'BODY_BRUISES_PATTERNED', 3, 'Bilaterales Muster an Oberarmen und Rücken – nicht unfallkonform, deutet auf manuelle Einwirkung'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1 AND mo.zeitpunkt='2025-01-14 08:45:00+01';

-- M1 Obs2 (Lena Muttergespräch)
INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'PARENT_FAILURE_TO_PROTECT', 2, 'Mutter reagiert defensiv, bagatellisiert Verletzungen, schützend gegenüber Vater'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1 AND mo.zeitpunkt='2025-01-14 16:30:00+01';

INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'FAMILY_DOMESTIC_VIOLENCE', 2, 'Vater vorbekannt wegen Alkohol und häuslicher Gewalt'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1 AND mo.zeitpunkt='2025-01-14 16:30:00+01';

-- M4 Obs1 (Max chronische Vernachlässigung)
INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'NEGLECT_FOOD', 2, 'Chronisch ohne Mahlzeit, min. 6 Wochen dokumentiert'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1 AND mo.zeitpunkt='2024-10-07 08:00:00+02';

INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'NEGLECT_CLOTHING', 2, 'Kleidung unrein, nicht witterungsgerecht (Sommerjacke bei 10°C)'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1 AND mo.zeitpunkt='2024-10-07 08:00:00+02';

INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'BODY_MALNUTRITION', 2, 'KMI 14,1 – ärztlich bestätigt'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1 AND mo.zeitpunkt='2024-10-07 08:00:00+02';

-- M4 Obs2 (Max Kinderzitat)
INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'CHILD_DISCLOSES_NEGLECT', 2, 'Kind schildert Versorgungsdefizit spontan, ohne Suggestivfragen'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1 AND mo.zeitpunkt='2024-10-07 10:30:00+02';

INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'SUPERVISION_LEFT_ALONE', 2, 'Kind beschreibt, allein gelassen zu werden, nicht wecken zu dürfen'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1 AND mo.zeitpunkt='2024-10-07 10:30:00+02';

-- M6 Obs1 (Sofia Notunterbringung)
INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'ACUTE_IMMEDIATE_DANGER', 3, 'Kind direkt anwesend bei häuslicher Gewalt-Eskalation'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1 AND mo.zeitpunkt='2025-02-09 09:00:00+01';

INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'PSYCH_TRAUMA_SIGNS', 2, 'Traumareaktion: Stille, Klammern, fehlendes Begrüßungsverhalten'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1 AND mo.zeitpunkt='2025-02-09 09:00:00+01';

-- M6 Obs2 (Sofia Großmuttergespräch)
INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'ACUTE_INTOXICATED_CAREGIVER', 3, 'Vater mit 1,8 Promille Atemalkohol – Polizeibericht bestätigt'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1 AND mo.zeitpunkt='2025-02-09 09:15:00+01';

-- M7 Obs1 (Noah Kinderzitat)
INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'SUPERVISION_LEFT_ALONE', 2, 'Kind beschreibt regelmäßiges Alleinsein an Wochenenden'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1 AND mo.zeitpunkt='2025-03-03 10:30:00+01';

INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'CHILD_DISCLOSES_NEGLECT', 2, 'Kind schildert Versorgungsdefizit spontan und wiederholt'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1 AND mo.zeitpunkt='2025-03-03 10:30:00+01';

-- M7 Obs2 (Noah Stiefvater)
INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'PARENT_UNCOOPERATIVE', 2, 'Stiefvater reagiert laut und einschüchternd, verweigert jede Kooperation'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1 AND mo.zeitpunkt='2025-03-03 16:45:00+01';

-- M8 Obs (Emilia Regression)
INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'PSYCH_REGRESSION', 2, 'Einnässen (war trocken) und Daumenlutschen seit ca. 4 Wochen'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2025-006' AND m.version_no=1;

INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'FAMILY_SEPARATION_CRISIS', 2, 'Kind äußert explizit Angst vor dem Heimweg wegen elterlichem Streit'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2025-006' AND m.version_no=1;

INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'BODY_PSYCHOSOMATIC', 1, 'Häufige Bauchschmerzen ohne organischen Befund (Kinderärztin 28.02.2025)'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='MST-2025-006' AND m.version_no=1;

-- ═══════════════════════════════════════════════════════════════════════════
-- KONTAKTE
-- ═══════════════════════════════════════════════════════════════════════════

-- M1: Lena Erstmeldung
INSERT INTO meldung_contacts (meldung_id, kontakt_mit, kontakt_am, status, ergebnis, notiz, created_at, updated_at)
VALUES
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1),
   'KIND', '2025-01-14 09:00:00+01', 'ERREICHT',
   'Kind sprach nicht über Ursache. Nonverbale Schutzreaktion bei Berührungsannäherung. Kein Augenkontakt.',
   'Erzieherin Kamps führte einfühlsames Gespräch ohne Druck. Kind nickte auf Frage, ob es wehtut.',
   now(), now()),

  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1),
   'MUTTER', '2025-01-14 16:30:00+01', 'ERREICHT',
   'Mutter verneinte Vorfälle, bezeichnete Verletzungen als Unfallfolge. Gespräch nach 4 Minuten beendet.',
   'Mutter über Beobachtung informiert. Empfehlung Kinderarztermin ausgesprochen. Mutter stimmte ausweichend zu.',
   now(), now()),

  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1),
   'JUGENDAMT', '2025-01-15 10:30:00+01', 'ERREICHT',
   'ASD Herr Nowak informiert. Hausbesuch für 22.01.2025 vereinbart.',
   'Telefonische Meldung mit detaillierter Schilderung der Beobachtungen und Verletzungsmuster.',
   now(), now());

-- M2: Lena Verlauf
INSERT INTO meldung_contacts (meldung_id, kontakt_mit, kontakt_am, status, ergebnis, notiz, created_at, updated_at)
VALUES
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=2),
   'VATER', '2025-01-22 16:00:00+01', 'ERREICHT',
   'Vater bestätigt Termin in Suchtberatungsstelle. Keine weiteren Vorfälle laut eigener Aussage.',
   'Kurze Rückmeldung per Telefon nach ASD-Hausbesuch. Ton kooperativ.',
   now(), now()),

  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=2),
   'ARZT', '2025-01-23 11:00:00+01', 'ERREICHT',
   'Dr. Behrens: keine neuen Verletzungen, Kind in gutem Allgemeinzustand.',
   '',
   now(), now());

-- M3: Lena Verlaufskontrolle
INSERT INTO meldung_contacts (meldung_id, kontakt_mit, kontakt_am, status, ergebnis, notiz, created_at, updated_at)
VALUES
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-002' AND m.version_no=1),
   'MUTTER', '2025-03-08 09:00:00+01', 'ERREICHT',
   'Positives Gespräch. Mutter: Vater hält Beratungstermine ein, Atmosphäre zuhause deutlich ruhiger.',
   '',
   now(), now()),

  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-002' AND m.version_no=1),
   'SONSTIGE', '2025-03-07 14:00:00+01', 'ERREICHT',
   'Familienhelferin Frau Berger: wöchentliche Hausbesuche konstruktiv. Haushalt geordnet, ausreichend Lebensmittel.',
   'Familienhelferin berichtete von deutlicher Verbesserung der Haushaltsführung.',
   now(), now());

-- M4: Max Erstmeldung
INSERT INTO meldung_contacts (meldung_id, kontakt_mit, kontakt_am, status, ergebnis, notiz, created_at, updated_at)
VALUES
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1),
   'MUTTER', '2024-10-07 17:00:00+02', 'NICHT_ERREICHT',
   null,
   'Dreimal angerufen (17:00, 17:30, 18:00 Uhr). Kein Abnehmen, keine Rückrufantwort.',
   now(), now()),

  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1),
   'MUTTER', '2024-10-08 09:00:00+02', 'ERREICHT',
   'Mutter kurz ansprechbar, sehr unruhig. Stellte Termin in der Einrichtung in Aussicht, erschien dann nicht.',
   '',
   now(), now()),

  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1),
   'JUGENDAMT', '2024-10-08 10:00:00+02', 'ERREICHT',
   'ASD informiert. Hausbesuch für 15.10.2024 terminiert.',
   'Telefonische Meldung mit Schilderung der Vernachlässigungszeichen und Untergewichtsbefund.',
   now(), now());

-- M5: Max Verlauf
INSERT INTO meldung_contacts (meldung_id, kontakt_mit, kontakt_am, status, ergebnis, notiz, created_at, updated_at)
VALUES
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=2),
   'MUTTER', '2024-10-15 15:00:00+02', 'ERREICHT',
   'Mutter erschien nach ASD-Aufforderung kurz in der Einrichtung. Gespräch sehr schwierig, Mutter unkooperativ.',
   'Hilfeplan-Gespräch für 05.11.2024 geplant.',
   now(), now()),

  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=2),
   'JUGENDAMT', '2024-10-16 09:00:00+02', 'ERREICHT',
   'ASD Frau Kleinert: Hilfeplan wird erstellt, Mitwirkungsbereitschaft der Mutter gering.',
   '',
   now(), now());

-- M6: Sofia Notunterbringung
INSERT INTO meldung_contacts (meldung_id, kontakt_mit, kontakt_am, status, ergebnis, notiz, created_at, updated_at)
VALUES
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1),
   'SONSTIGE', '2025-02-08 21:00:00+01', 'ERREICHT',
   'KHK Meyer übermittelte Einsatzbericht und bestätigte Inobhutnahme durch ASD.',
   'Polizei informierte Einrichtung telefonisch nach Abschluss des Einsatzes.',
   now(), now()),

  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1),
   'JUGENDAMT', '2025-02-09 08:00:00+01', 'ERREICHT',
   'ASD Frau Dr. Maurer: Inobhutnahme formal bestätigt. Gerichtsbeschluss zur vorläufigen Unterbringung beantragt.',
   '',
   now(), now()),

  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1),
   'BEZUGSPERSON', '2025-02-09 09:00:00+01', 'ERREICHT',
   'Großmutter Gerda W. kooperiert vollständig. Bereit zur dauerhaften Betreuung. Liebevolle Beziehung zu Sofia beobachtet.',
   '',
   now(), now());

-- M7: Noah
INSERT INTO meldung_contacts (meldung_id, kontakt_mit, kontakt_am, status, ergebnis, notiz, created_at, updated_at)
VALUES
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1),
   'KIND', '2025-03-03 10:30:00+01', 'ERREICHT',
   'Noah berichtete spontan über Versorgungssituation zuhause. Kein Anzeichen körperlicher Verletzung.',
   'Erzieherin Schulz hörte aktiv zu, keine Suggestivfragen.',
   now(), now()),

  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1),
   'SONSTIGE', '2025-03-03 16:45:00+01', 'ERREICHT',
   'Stiefvater reagierte aggressiv und bedrohlich. Gespräch nicht möglich.',
   'Verhalten dokumentiert. Einrichtungsleitung anwesend als Zeugin.',
   now(), now()),

  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1),
   'JUGENDAMT', '2025-03-04 09:30:00+01', 'ERREICHT',
   'ASD Frau Wenzel informiert. Hausbesuch wird zeitnah eingeleitet.',
   '',
   now(), now());

-- M8: Emilia (Entwurf – Kontakte geplant)
INSERT INTO meldung_contacts (meldung_id, kontakt_mit, kontakt_am, status, ergebnis, notiz, created_at, updated_at)
VALUES
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-006' AND m.version_no=1),
   'MUTTER', '2025-03-06 17:00:00+01', 'GEPLANT',
   null,
   'Elterngespräch mit Mutter Sandra B. für 06.03.2025 anberaumt.',
   now(), now()),

  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-006' AND m.version_no=1),
   'VATER', '2025-03-07 17:00:00+01', 'GEPLANT',
   null,
   'Separates Gespräch mit Vater Michael B. für 07.03.2025 anberaumt. Beide Elternteile getrennt befragen.',
   now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- JUGENDAMT
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO meldung_jugendamt (meldung_id, informiert, kontakt_am, kontaktart, aktenzeichen, begruendung, created_at, updated_at)
VALUES
  -- M1: Lena Erstmeldung
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1),
   'JA', '2025-01-15 10:30:00+01', 'TELEFON', 'ASD-KW-2025-0047',
   'Körperliche Verletzungen mit unfallinkonfomem Muster. Vater Thomas M. vorbekannt wegen Alkohol und Gewalt. Mutter kooperiert nicht. Unmittelbare Einschätzung durch ASD erforderlich.',
   now(), now()),

  -- M4: Max Erstmeldung
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1),
   'JA', '2024-10-08 10:00:00+02', 'TELEFON', 'ASD-KW-2024-0312',
   'Chronische Vernachlässigung (Ernährung, Hygiene, Kleidung). Mutter auf Bewährung wegen Drogendelikt. Untergewicht ärztlich bestätigt (KMI 14,1). Kooperationsbereitschaft fraglich.',
   now(), now()),

  -- M5: Max Verlauf (eigener Eintrag)
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=2),
   'JA', '2024-10-16 09:00:00+02', 'TELEFON', 'ASD-KW-2024-0312',
   'Update: ASD bestätigt Vernachlässigungsbefund. Hilfeplan für Familie wird erstellt. Mutter zeigt geringe Kooperationsbereitschaft – Unterstützung durch Drogenberatung beantragt.',
   now(), now()),

  -- M6: Sofia ROT
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1),
   'JA', '2025-02-09 08:00:00+01', 'TELEFON', 'ASD-ION-2025-0073',
   'Akute Kindeswohlgefährdung nach häuslicher Gewalt-Eskalation. Vater alkoholisiert (1,8 Promille), handlungsunfähig. Mutter seit 2023 unerreichbar. Inobhutnahme nach §42 SGB VIII eingeleitet.',
   now(), now()),

  -- M7: Noah
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-005' AND m.version_no=1),
   'JA', '2025-03-04 09:30:00+01', 'TELEFON', null,
   'Mangelnde Aufsicht und Versorgung, psychisch erkrankte Mutter, aggressiver Stiefvater verweigert Kooperation. Sofortige Einschätzung durch ASD erbeten.',
   now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- EXTERNE MELDUNGEN
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO meldung_extern (meldung_id, stelle, am, begruendung, ergebnis, created_at, updated_at)
VALUES
  -- M1: Lena – Arzt
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-001' AND m.version_no=1),
   'ARZT_KLINIK', '2025-01-16 11:00:00+01',
   'Kinderärztin Dr. Leonie Behrens, Praxis Köln-Lindenthal, zur Begutachtung und Dokumentation der Verletzungen informiert.',
   'Verletzungen fotografisch dokumentiert. Körperliche Misshandlung nicht ausschließbar – Dokumentation für ASD-Akte gesichert.',
   now(), now()),

  -- M4: Max – Arzt
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2024-003' AND m.version_no=1),
   'ARZT_KLINIK', '2024-10-09 10:00:00+02',
   'Hausarzt Dr. Bergmann, Praxis Birkenallee Köln-Deutz, über Vernachlässigungsbefund informiert und um Dokumentation gebeten.',
   'KMI 14,1 bestätigt. Empfehlung: monatliche Gewichtskontrolle und Ernährungsprotokoll. Bericht liegt ASD vor.',
   now(), now()),

  -- M6: Sofia – Polizei
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1),
   'POLIZEI', '2025-02-08 22:00:00+01',
   'Polizei Köln hat Sofia nach häuslicher Gewalt-Eskalation aus der väterlichen Wohnung in Sicherheit gebracht. Einsatzbericht Nr. 2025-KOE-0432.',
   'Strafanzeige gegen Klaus Weber wegen Körperverletzung erstattet. Einsatzbericht liegt ASD und Einrichtung vor.',
   now(), now()),

  -- M6: Sofia – Arzt
  ((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='MST-2025-004' AND m.version_no=1),
   'ARZT_KLINIK', '2025-02-09 10:00:00+01',
   'Kindernotaufnahme Uniklinik Köln zur Ausschlussuntersuchung nach Polizeieinsatz.',
   'Keine körperlichen Verletzungen. Kind psychisch belastet. Kinderpsychologin empfohlen. Befundbericht in der Akte.',
   now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- SEQUENZ-BACKFILLS (Backfill nach Insert)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO dossier_fallno_seq (dossier_id, next_value)
SELECT d.id, COALESCE(MAX(f.fall_no), 0) + 1
FROM kind_dossiers d
         LEFT JOIN falloeffnungen f ON f.dossier_id = d.id
WHERE d.einrichtung_org_unit_id = (SELECT id FROM org_units WHERE name = 'Villa Kunterbunt' AND type = 'EINRICHTUNG')
GROUP BY d.id
ON CONFLICT (dossier_id) DO UPDATE SET next_value = EXCLUDED.next_value;

INSERT INTO fall_meldung_version_seq (falloeffnung_id, next_value)
SELECT f.id, COALESCE(MAX(m.version_no), 0) + 1
FROM falloeffnungen f
         LEFT JOIN meldungen m ON m.falloeffnung_id = f.id
WHERE f.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger')
GROUP BY f.id
ON CONFLICT (falloeffnung_id) DO UPDATE SET next_value = EXCLUDED.next_value;
