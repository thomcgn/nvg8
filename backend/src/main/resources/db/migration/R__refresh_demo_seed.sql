-- ═══════════════════════════════════════════════════════════════════════════
-- KIDOC Demo-Seed  (Repeatable Migration – idempotent, DELETE + INSERT)
-- §8a SGB VIII Fallbeispiele – Kinderschutzzentrum Köln e.V.
-- Vollständig: alle Felder des Editors (Meldung, SKB, DJI, Meldebogen,
--              Schutzplan, Hausbesuch) + Pool Mitarbeiter/Fachbereiche/Teams
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Demo-User-Pool (alle Emails die dieser Seed verwaltet) ──────────────────
-- Genutzt in den DELETE-Blöcken weiter unten.

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

DELETE FROM meldung_changes WHERE meldung_id IN (
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

DELETE FROM falloeffnung_notizen WHERE falloeffnung_id IN (
    SELECT f.id FROM falloeffnungen f
    JOIN kind_dossiers d ON d.id = f.dossier_id
    JOIN kinder k ON k.id = d.kind_id
    WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM case_share_requests WHERE falloeffnung_id IN (
    SELECT f.id FROM falloeffnungen f
    JOIN kind_dossiers d ON d.id = f.dossier_id
    JOIN kinder k ON k.id = d.kind_id
    WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM fall_meldung_version_seq WHERE falloeffnung_id IN (
    SELECT f.id FROM falloeffnungen f
    JOIN kind_dossiers d ON d.id = f.dossier_id
    JOIN kinder k ON k.id = d.kind_id
    WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

-- Bögen (V056–V060): FK auf falloeffnungen ohne CASCADE → vor falloeffnungen löschen

DELETE FROM kinderschutzbogen_bewertungen WHERE assessment_id IN (
    SELECT ka.id FROM kinderschutzbogen_assessments ka
    JOIN falloeffnungen f ON f.id = ka.falloeffnung_id
    WHERE f.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM kinderschutzbogen_assessments WHERE falloeffnung_id IN (
    SELECT f.id FROM falloeffnungen f
    JOIN kind_dossiers d ON d.id = f.dossier_id
    JOIN kinder k ON k.id = d.kind_id
    WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM dji_positionen WHERE assessment_id IN (
    SELECT da.id FROM dji_assessments da
    JOIN falloeffnungen f ON f.id = da.falloeffnung_id
    WHERE f.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM dji_assessments WHERE falloeffnung_id IN (
    SELECT f.id FROM falloeffnungen f
    JOIN kind_dossiers d ON d.id = f.dossier_id
    JOIN kinder k ON k.id = d.kind_id
    WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM meldeboegen WHERE falloeffnung_id IN (
    SELECT f.id FROM falloeffnungen f
    JOIN kind_dossiers d ON d.id = f.dossier_id
    JOIN kinder k ON k.id = d.kind_id
    WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM schutzplan_massnahmen WHERE schutzplan_id IN (
    SELECT sp.id FROM schutzplaene sp
    JOIN falloeffnungen f ON f.id = sp.falloeffnung_id
    WHERE f.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM schutzplaene WHERE falloeffnung_id IN (
    SELECT f.id FROM falloeffnungen f
    JOIN kind_dossiers d ON d.id = f.dossier_id
    JOIN kinder k ON k.id = d.kind_id
    WHERE k.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger'));

DELETE FROM hausbesuche WHERE falloeffnung_id IN (
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

DELETE FROM org_unit_memberships WHERE user_id IN (
    SELECT id FROM users WHERE email IN (
        'demo@kidoc.local', 'admin@kidoc.io',
        'k.bremmer@ksz-koeln.de',   'j.neumann@ksz-koeln.de',
        's.vogt@ksz-koeln.de',      't.hofmann@ksz-koeln.de',
        'p.kleinschmidt@ksz-koeln.de', 'n.schreiber@ksz-koeln.de',
        'm.engel@ksz-koeln.de'
    ));

DELETE FROM audit_events   WHERE traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger');
DELETE FROM invites        WHERE traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger');
DELETE FROM messages       WHERE sender_id IN (
    SELECT id FROM users WHERE email IN (
        'demo@kidoc.local', 'admin@kidoc.io',
        'k.bremmer@ksz-koeln.de',   'j.neumann@ksz-koeln.de',
        's.vogt@ksz-koeln.de',      't.hofmann@ksz-koeln.de',
        'p.kleinschmidt@ksz-koeln.de', 'n.schreiber@ksz-koeln.de',
        'm.engel@ksz-koeln.de'
    ));
DELETE FROM support_tickets WHERE created_by_user_id IN (
    SELECT id FROM users WHERE email IN (
        'demo@kidoc.local', 'admin@kidoc.io',
        'k.bremmer@ksz-koeln.de',   'j.neumann@ksz-koeln.de',
        's.vogt@ksz-koeln.de',      't.hofmann@ksz-koeln.de',
        'p.kleinschmidt@ksz-koeln.de', 'n.schreiber@ksz-koeln.de',
        'm.engel@ksz-koeln.de'
    ));

DELETE FROM users WHERE email IN (
    'demo@kidoc.local', 'admin@kidoc.io',
    'k.bremmer@ksz-koeln.de',   'j.neumann@ksz-koeln.de',
    's.vogt@ksz-koeln.de',      't.hofmann@ksz-koeln.de',
    'p.kleinschmidt@ksz-koeln.de', 'n.schreiber@ksz-koeln.de',
    'm.engel@ksz-koeln.de'
);

DELETE FROM org_units      WHERE traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger');
DELETE FROM traeger_aktennummer_seq WHERE traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger');
DELETE FROM traeger        WHERE slug = 'demo-traeger';

-- ═══════════════════════════════════════════════════════════════════════════
-- TRÄGER
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO traeger (name, slug, akten_prefix, enabled, kurzcode, created_at, updated_at)
VALUES ('Kinderschutzzentrum Köln e.V.', 'demo-traeger', 'KSZ', true, 'KSZ', now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- ORGANISATIONSEINHEITEN
-- Hierarchie: TRAEGER → EINRICHTUNG / ABTEILUNG → TEAM
-- ═══════════════════════════════════════════════════════════════════════════

-- Träger-Root
INSERT INTO org_units (traeger_id, type, name, parent_id, enabled, created_at, updated_at)
VALUES ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        'TRAEGER', 'Kinderschutzzentrum Köln e.V.', NULL, true, now(), now());

-- Einrichtungen
INSERT INTO org_units (traeger_id, type, name, parent_id, enabled, created_at, updated_at)
VALUES ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        'EINRICHTUNG', 'KiTa Sonnenschein',
        (SELECT id FROM org_units WHERE name = 'Kinderschutzzentrum Köln e.V.' AND type = 'TRAEGER'),
        true, now(), now());

INSERT INTO org_units (traeger_id, type, name, parent_id, enabled, created_at, updated_at)
VALUES ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        'EINRICHTUNG', 'KiTa Regenbogen',
        (SELECT id FROM org_units WHERE name = 'Kinderschutzzentrum Köln e.V.' AND type = 'TRAEGER'),
        true, now(), now());

-- Fachbereich
INSERT INTO org_units (traeger_id, type, name, parent_id, enabled, created_at, updated_at)
VALUES ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        'ABTEILUNG', 'Fachbereich Kinderschutz & Frühe Hilfen',
        (SELECT id FROM org_units WHERE name = 'Kinderschutzzentrum Köln e.V.' AND type = 'TRAEGER'),
        true, now(), now());

-- Teams
INSERT INTO org_units (traeger_id, type, name, parent_id, enabled, created_at, updated_at)
VALUES ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        'TEAM', 'Team §8a Sonnenschein',
        (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
        true, now(), now());

INSERT INTO org_units (traeger_id, type, name, parent_id, enabled, created_at, updated_at)
VALUES ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        'TEAM', 'Team §8a Regenbogen',
        (SELECT id FROM org_units WHERE name = 'KiTa Regenbogen' AND type = 'EINRICHTUNG'),
        true, now(), now());

INSERT INTO org_units (traeger_id, type, name, parent_id, enabled, created_at, updated_at)
VALUES ((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        'TEAM', 'Koordinationsteam Kinderschutz',
        (SELECT id FROM org_units WHERE name = 'Fachbereich Kinderschutz & Frühe Hilfen' AND type = 'ABTEILUNG'),
        true, now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- BENUTZER
-- Passwort-Hash: 'demo123' (bcrypt)
-- ═══════════════════════════════════════════════════════════════════════════

-- System-Admin (kein Träger-Bezug)
INSERT INTO users (email, password_hash, enabled, system_admin,
                   default_traeger_id, default_org_unit_id,
                   vorname, nachname,
                   created_at, updated_at)
VALUES ('admin@kidoc.io', '$2b$10$ttZ/gNAS8sSgJ3NRk8rnv.WfTxcbyyRPER0.XGeSNv1wSSWDUG3Gq',
        true, true, NULL, NULL, 'KIDOC', 'Admin', now(), now());

-- Demo-User (Einrichtungsleitung KiTa Sonnenschein)
INSERT INTO users (email, password_hash, enabled, system_admin,
                   default_traeger_id, default_org_unit_id,
                   vorname, nachname,
                   strasse, hausnummer, plz, ort, telefon,
                   created_at, updated_at)
VALUES ('demo@kidoc.local', '$2b$10$ttZ/gNAS8sSgJ3NRk8rnv.WfTxcbyyRPER0.XGeSNv1wSSWDUG3Gq',
        true, false,
        (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
        'D.', 'Emo',
        'Aachener Straße', '200', '50931', 'Köln', '0221 9200000',
        now(), now());

-- Katharina Bremmer – Einrichtungsleitung KiTa Sonnenschein
INSERT INTO users (email, password_hash, enabled, system_admin,
                   default_traeger_id, default_org_unit_id,
                   vorname, nachname,
                   strasse, hausnummer, plz, ort, telefon, kontakt_email,
                   kp_muttersprache_code, kp_bevorzugte_sprache_code,
                   kp_dolmetsch_bedarf,
                   kann_kinder_dolmetschen, kann_bezugspersonen_dolmetschen,
                   created_at, updated_at)
VALUES ('k.bremmer@ksz-koeln.de', '$2b$10$ttZ/gNAS8sSgJ3NRk8rnv.WfTxcbyyRPER0.XGeSNv1wSSWDUG3Gq',
        true, false,
        (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
        'Katharina', 'Bremmer',
        'Venloer Straße', '47', '50672', 'Köln', '0221 9200101', 'k.bremmer@ksz-koeln.de',
        'de', 'de', 'KEIN',
        false, false,
        now(), now());

-- Julia Neumann – Sozialpädagogin / Kinderschutzfachkraft KiTa Sonnenschein
INSERT INTO users (email, password_hash, enabled, system_admin,
                   default_traeger_id, default_org_unit_id,
                   vorname, nachname,
                   strasse, hausnummer, plz, ort, telefon, kontakt_email,
                   kp_muttersprache_code, kp_bevorzugte_sprache_code,
                   kp_dolmetsch_bedarf,
                   kann_kinder_dolmetschen, kann_bezugspersonen_dolmetschen,
                   mitarbeiter_sprach_hinweise,
                   created_at, updated_at)
VALUES ('j.neumann@ksz-koeln.de', '$2b$10$ttZ/gNAS8sSgJ3NRk8rnv.WfTxcbyyRPER0.XGeSNv1wSSWDUG3Gq',
        true, false,
        (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
        'Julia', 'Neumann',
        'Subbelrather Straße', '15', '50823', 'Köln', '0221 9200102', 'j.neumann@ksz-koeln.de',
        'de', 'de', 'KEIN',
        true, true,
        'Grundkenntnisse Arabisch und Türkisch (Alltagssprache). Dolmetschen in einfachen Gesprächssituationen möglich.',
        now(), now());

-- Sandra Vogt – Erzieherin KiTa Sonnenschein
INSERT INTO users (email, password_hash, enabled, system_admin,
                   default_traeger_id, default_org_unit_id,
                   vorname, nachname,
                   strasse, hausnummer, plz, ort, telefon, kontakt_email,
                   kp_muttersprache_code, kp_bevorzugte_sprache_code,
                   kp_dolmetsch_bedarf,
                   kann_kinder_dolmetschen, kann_bezugspersonen_dolmetschen,
                   created_at, updated_at)
VALUES ('s.vogt@ksz-koeln.de', '$2b$10$ttZ/gNAS8sSgJ3NRk8rnv.WfTxcbyyRPER0.XGeSNv1wSSWDUG3Gq',
        true, false,
        (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
        'Sandra', 'Vogt',
        'Ehrenfeldgürtel', '82', '50823', 'Köln', '0221 9200103', 's.vogt@ksz-koeln.de',
        'de', 'de', 'KEIN',
        false, false,
        now(), now());

-- Tim Hofmann – Erzieher KiTa Sonnenschein
INSERT INTO users (email, password_hash, enabled, system_admin,
                   default_traeger_id, default_org_unit_id,
                   vorname, nachname,
                   strasse, hausnummer, plz, ort, telefon, kontakt_email,
                   kp_muttersprache_code, kp_bevorzugte_sprache_code,
                   kp_dolmetsch_bedarf,
                   kann_kinder_dolmetschen, kann_bezugspersonen_dolmetschen,
                   created_at, updated_at)
VALUES ('t.hofmann@ksz-koeln.de', '$2b$10$ttZ/gNAS8sSgJ3NRk8rnv.WfTxcbyyRPER0.XGeSNv1wSSWDUG3Gq',
        true, false,
        (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
        'Tim', 'Hofmann',
        'Körnerstraße', '22', '50823', 'Köln', '0221 9200104', 't.hofmann@ksz-koeln.de',
        'de', 'de', 'KEIN',
        false, false,
        now(), now());

-- Petra Kleinschmidt – Einrichtungsleitung KiTa Regenbogen
INSERT INTO users (email, password_hash, enabled, system_admin,
                   default_traeger_id, default_org_unit_id,
                   vorname, nachname,
                   strasse, hausnummer, plz, ort, telefon, kontakt_email,
                   kp_muttersprache_code, kp_bevorzugte_sprache_code,
                   kp_dolmetsch_bedarf,
                   kann_kinder_dolmetschen, kann_bezugspersonen_dolmetschen,
                   created_at, updated_at)
VALUES ('p.kleinschmidt@ksz-koeln.de', '$2b$10$ttZ/gNAS8sSgJ3NRk8rnv.WfTxcbyyRPER0.XGeSNv1wSSWDUG3Gq',
        true, false,
        (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        (SELECT id FROM org_units WHERE name = 'KiTa Regenbogen' AND type = 'EINRICHTUNG'),
        'Petra', 'Kleinschmidt',
        'Mülheimer Freiheit', '12', '51063', 'Köln', '0221 9200201', 'p.kleinschmidt@ksz-koeln.de',
        'de', 'de', 'KEIN',
        false, false,
        now(), now());

-- Nadine Schreiber – Sozialpädagogin / Kinderschutzfachkraft KiTa Regenbogen
INSERT INTO users (email, password_hash, enabled, system_admin,
                   default_traeger_id, default_org_unit_id,
                   vorname, nachname,
                   strasse, hausnummer, plz, ort, telefon, kontakt_email,
                   kp_muttersprache_code, kp_bevorzugte_sprache_code,
                   kp_dolmetsch_bedarf,
                   kann_kinder_dolmetschen, kann_bezugspersonen_dolmetschen,
                   mitarbeiter_sprach_hinweise,
                   created_at, updated_at)
VALUES ('n.schreiber@ksz-koeln.de', '$2b$10$ttZ/gNAS8sSgJ3NRk8rnv.WfTxcbyyRPER0.XGeSNv1wSSWDUG3Gq',
        true, false,
        (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        (SELECT id FROM org_units WHERE name = 'KiTa Regenbogen' AND type = 'EINRICHTUNG'),
        'Nadine', 'Schreiber',
        'Keupstraße', '55', '51063', 'Köln', '0221 9200202', 'n.schreiber@ksz-koeln.de',
        'de', 'de', 'KEIN',
        true, false,
        'Fließend Russisch (Muttersprache Deutsch, Mutter russischsprachig). Kindesgespräche auf Russisch möglich.',
        now(), now());

-- Markus Engel – Kinderschutzfachkraft / Fachbereichsleitung
INSERT INTO users (email, password_hash, enabled, system_admin,
                   default_traeger_id, default_org_unit_id,
                   vorname, nachname,
                   strasse, hausnummer, plz, ort, telefon, kontakt_email,
                   kp_muttersprache_code, kp_bevorzugte_sprache_code,
                   kp_dolmetsch_bedarf,
                   kann_kinder_dolmetschen, kann_bezugspersonen_dolmetschen,
                   created_at, updated_at)
VALUES ('m.engel@ksz-koeln.de', '$2b$10$ttZ/gNAS8sSgJ3NRk8rnv.WfTxcbyyRPER0.XGeSNv1wSSWDUG3Gq',
        true, false,
        (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
        (SELECT id FROM org_units WHERE name = 'Fachbereich Kinderschutz & Frühe Hilfen' AND type = 'ABTEILUNG'),
        'Markus', 'Engel',
        'Zülpicher Straße', '241', '50937', 'Köln', '0221 9200300', 'm.engel@ksz-koeln.de',
        'de', 'de', 'KEIN',
         false, false,
        now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- MITGLIEDSCHAFTEN / ROLLEN
-- ═══════════════════════════════════════════════════════════════════════════

-- demo@kidoc.local: Träger-Admin + Einrichtungsleitung Sonnenschein
INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'demo@kidoc.local'),
        (SELECT id FROM org_units WHERE name = 'Kinderschutzzentrum Köln e.V.' AND type = 'TRAEGER'),
        'TRAEGER_ADMIN', NULL, false, true, now(), now());

INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'demo@kidoc.local'),
        (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
        'EINRICHTUNG_ADMIN', NULL, true, true, now(), now());

-- Katharina Bremmer: Einrichtungsleitung Sonnenschein + Team §8a SS (LEITUNG)
INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'k.bremmer@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
        'EINRICHTUNG_ADMIN', NULL, true, true, now(), now());

INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'k.bremmer@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'Team §8a Sonnenschein' AND type = 'TEAM'),
        'TEAMLEITUNG', 'LEITUNG', false, true, now(), now());

-- Julia Neumann: Fachkraft Sonnenschein + Team §8a SS (MITGLIED)
INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'j.neumann@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
        'FACHKRAFT', NULL, true, true, now(), now());

INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'j.neumann@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'Team §8a Sonnenschein' AND type = 'TEAM'),
        'FACHKRAFT', 'MITGLIED', false, true, now(), now());

INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'j.neumann@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'Koordinationsteam Kinderschutz' AND type = 'TEAM'),
        'FACHKRAFT', 'MITGLIED', false, true, now(), now());

-- Sandra Vogt: Erzieherin Sonnenschein + Team §8a SS
INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 's.vogt@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
        'FACHKRAFT', NULL, true, true, now(), now());

INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 's.vogt@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'Team §8a Sonnenschein' AND type = 'TEAM'),
        'FACHKRAFT', 'MITGLIED', false, true, now(), now());

-- Tim Hofmann: Erzieher Sonnenschein + Team §8a SS
INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 't.hofmann@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
        'FACHKRAFT', NULL, true, true, now(), now());

INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 't.hofmann@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'Team §8a Sonnenschein' AND type = 'TEAM'),
        'FACHKRAFT', 'MITGLIED', false, true, now(), now());

-- Petra Kleinschmidt: Einrichtungsleitung Regenbogen + Team §8a RB (LEITUNG)
INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'p.kleinschmidt@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'KiTa Regenbogen' AND type = 'EINRICHTUNG'),
        'EINRICHTUNG_ADMIN', NULL, true, true, now(), now());

INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'p.kleinschmidt@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'Team §8a Regenbogen' AND type = 'TEAM'),
        'TEAMLEITUNG', 'LEITUNG', false, true, now(), now());

-- Nadine Schreiber: Fachkraft Regenbogen + Team §8a RB (MITGLIED)
INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'n.schreiber@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'KiTa Regenbogen' AND type = 'EINRICHTUNG'),
        'FACHKRAFT', NULL, true, true, now(), now());

INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'n.schreiber@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'Team §8a Regenbogen' AND type = 'TEAM'),
        'FACHKRAFT', 'MITGLIED', false, true, now(), now());

INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'n.schreiber@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'Koordinationsteam Kinderschutz' AND type = 'TEAM'),
        'FACHKRAFT', 'MITGLIED', false, true, now(), now());

-- Markus Engel: Träger-Admin + Fachbereichsleitung + Koordinationsteam (LEITUNG)
INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'm.engel@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'Kinderschutzzentrum Köln e.V.' AND type = 'TRAEGER'),
        'TRAEGER_ADMIN', NULL, false, true, now(), now());

INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'm.engel@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'Fachbereich Kinderschutz & Frühe Hilfen' AND type = 'ABTEILUNG'),
        'EINRICHTUNG_ADMIN', NULL, true, true, now(), now());

INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'm.engel@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'Koordinationsteam Kinderschutz' AND type = 'TEAM'),
        'TEAMLEITUNG', 'LEITUNG', false, true, now(), now());

-- Koordinationsteam: Katharina Bremmer als externe Mitglied
INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'k.bremmer@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'Koordinationsteam Kinderschutz' AND type = 'TEAM'),
        'FACHKRAFT', 'EXTERN', false, true, now(), now());

INSERT INTO org_unit_memberships (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'p.kleinschmidt@ksz-koeln.de'),
        (SELECT id FROM org_units WHERE name = 'Koordinationsteam Kinderschutz' AND type = 'TEAM'),
        'FACHKRAFT', 'EXTERN', false, true, now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- KINDER  (alle Felder: Adresse, Förder­bedarf, Gesundheits­hinweise)
-- ═══════════════════════════════════════════════════════════════════════════

-- 5 vollständige Kinderfälle für die neue Demo-Welt
INSERT INTO kinder (traeger_id, owner_einrichtung_org_unit_id,
                    vorname, nachname, geburtsdatum, gender,
                    strasse, hausnummer, plz, ort,
                    foerderbedarf, foerderbedarf_details, gesundheits_hinweise,
                    created_at, updated_at)
VALUES
((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
 (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
 'Nika', 'Darwish', '2020-07-12', 'WEIBLICH',
 'Helmholtzstraße', '13', '50825', 'Köln',
 true,
 'Sprachförderbedarf, logopädische Therapie seit Januar 2025 in Planung.',
 'Gewichtsverlust (-1,4 kg in 6 Wochen), häufige Müdigkeit laut Kinderärztin.',
 now(), now()),

((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
 (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
 'Mika', 'Schröder', '2019-02-05', 'MAENNLICH',
 'Subbelrather Straße', '301', '50825', 'Köln',
 true,
 'Lerntherapie wegen Konzentrationsschwierigkeiten (Empfehlung Schulpsychologin 10/2024).',
 'Regelmäßige Bauchschmerzen vor Unterrichtsbeginn, Schulärztin beobachtet Stresssymptome.',
 now(), now()),

((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
 (SELECT id FROM org_units WHERE name = 'KiTa Regenbogen' AND type = 'EINRICHTUNG'),
 'Elena', 'Paredes', '2021-05-22', 'WEIBLICH',
 'Mülheimer Freiheit', '90', '51063', 'Köln',
 false, NULL,
 'Keine chronischen Erkrankungen. Seit Februar 2025 in Bereitschaftspflege der Stadt Köln.',
 now(), now()),

((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
 (SELECT id FROM org_units WHERE name = 'KiTa Regenbogen' AND type = 'EINRICHTUNG'),
 'Tariq', 'Mansour', '2018-11-18', 'MAENNLICH',
 'Berliner Straße', '12', '51063', 'Köln',
 true,
 'Emotionale Unterstützungsbedarfe, strukturierter Tagesplan durch SPFh empfohlen.',
 'Leichte chronische Bronchitis; Medikamente werden zuverlässig eingenommen.',
 now(), now()),

((SELECT id FROM traeger WHERE slug = 'demo-traeger'),
 (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
 'Lena', 'Vogt', '2022-08-09', 'WEIBLICH',
 'Aachener Straße', '210', '50931', 'Köln',
 false, NULL,
 'Brandverletzung 2. Grades rechter Hand (01.03.2025) abgeheilt, Hautpflege fortlaufend.',
 now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- BEZUGSPERSONEN  (alle Felder inkl. Adresse + beziehung)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO bezugspersonen
    (traeger_id, owner_einrichtung_org_unit_id,
     vorname, nachname, geburtsdatum, gender,
     telefon, kontakt_email, beziehung,
     strasse, hausnummer, plz, ort, created_at, updated_at)
VALUES
((SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
 'Leila', 'Darwish', '1991-03-04', 'WEIBLICH',
 '0176 99887722', 'leila.darwish@example.de', 'MUTTER',
 'Helmholtzstraße', '13', '50825', 'Köln', now(), now()),

((SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
 'Karim', 'Darwish', '1988-12-19', 'MAENNLICH',
 '0173 4455667', 'karim.darwish@example.de', 'VATER',
 'Venloer Straße', '221', '50823', 'Köln', now(), now()),

((SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
 'Anna', 'Schröder', '1990-07-08', 'WEIBLICH',
 '0221 9200450', 'anna.schroeder@example.de', 'MUTTER',
 'Subbelrather Straße', '301', '50825', 'Köln', now(), now()),

((SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
 'Jens', 'Schröder', '1988-01-30', 'MAENNLICH',
 '0172 5551188', 'jens.schroeder@example.de', 'VATER',
 'Widdersdorfer Straße', '180', '50825', 'Köln', now(), now()),

((SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
 'Ingrid', 'Schröder', '1959-05-11', 'WEIBLICH',
 '0221 552200', 'ingrid.schroeder@example.de', 'GROSSMUTTER',
 'Bickendorfer Straße', '5', '50825', 'Köln', now(), now()),

((SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Regenbogen' AND type='EINRICHTUNG'),
 'Isabella', 'Paredes', '1993-09-01', 'WEIBLICH',
 '0163 4400771', 'isabella.paredes@example.de', 'MUTTER',
 'Mülheimer Freiheit', '90', '51063', 'Köln', now(), now()),

((SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Regenbogen' AND type='EINRICHTUNG'),
 'Mateo', 'Paredes', '1991-02-14', 'MAENNLICH',
 '0178 2200443', 'mateo.paredes@example.de', 'VATER',
 'Keupstraße', '3', '51063', 'Köln', now(), now()),

((SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Regenbogen' AND type='EINRICHTUNG'),
 'Lucia', 'Torres', '1995-04-25', 'WEIBLICH',
 '0157 3344550', 'lucia.torres@example.de', 'TANTE',
 'Frankfurter Straße', '122', '51065', 'Köln', now(), now()),

((SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Regenbogen' AND type='EINRICHTUNG'),
 'Samir', 'Mansour', '1986-06-02', 'MAENNLICH',
 '0171 8800665', 'samir.mansour@example.de', 'VATER',
 'Berliner Straße', '12', '51063', 'Köln', now(), now()),

((SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Regenbogen' AND type='EINRICHTUNG'),
 'Farah', 'Mansour', '1990-08-17', 'WEIBLICH',
 '0160 1112244', 'farah.mansour@example.de', 'TANTE',
 'Severinstraße', '8', '50678', 'Köln', now(), now()),

((SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
 'Claudia', 'Vogt', '1992-11-09', 'WEIBLICH',
 '0221 770880', 'claudia.vogt@example.de', 'MUTTER',
 'Aachener Straße', '210', '50931', 'Köln', now(), now()),

((SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
 'Robert', 'Vogt', '1989-04-02', 'MAENNLICH',
 '0176 2000998', 'robert.vogt@example.de', 'VATER',
 'Aachener Straße', '210', '50931', 'Köln', now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- KIND-BEZUGSPERSON-VERKNÜPFUNGEN
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO kind_bezugspersonen
    (kind_id, bezugsperson_id, beziehung, sorgerecht, valid_from,
     hauptkontakt, lebt_im_haushalt, enabled, created_at, updated_at)
VALUES
((SELECT id FROM kinder WHERE vorname='Nika' AND nachname='Darwish'),
 (SELECT id FROM bezugspersonen WHERE vorname='Leila' AND nachname='Darwish'),
 'MUTTER', 'GEMEINSAM', '2020-07-12', true, true, true, now(), now()),

((SELECT id FROM kinder WHERE vorname='Nika' AND nachname='Darwish'),
 (SELECT id FROM bezugspersonen WHERE vorname='Karim' AND nachname='Darwish'),
 'VATER', 'GEMEINSAM', '2020-07-12', false, false, true, now(), now()),

((SELECT id FROM kinder WHERE vorname='Mika' AND nachname='Schröder'),
 (SELECT id FROM bezugspersonen WHERE vorname='Anna' AND nachname='Schröder'),
 'MUTTER', 'ALLEIN', '2019-02-05', true, true, true, now(), now()),

((SELECT id FROM kinder WHERE vorname='Mika' AND nachname='Schröder'),
 (SELECT id FROM bezugspersonen WHERE vorname='Jens' AND nachname='Schröder'),
 'VATER', 'GEMEINSAM', '2019-02-05', false, false, true, now(), now()),

((SELECT id FROM kinder WHERE vorname='Mika' AND nachname='Schröder'),
 (SELECT id FROM bezugspersonen WHERE vorname='Ingrid' AND nachname='Schröder'),
 'GROSSMUTTER', 'KEIN', '2024-10-01', false, false, true, now(), now()),

((SELECT id FROM kinder WHERE vorname='Elena' AND nachname='Paredes'),
 (SELECT id FROM bezugspersonen WHERE vorname='Isabella' AND nachname='Paredes'),
 'MUTTER', 'GEMEINSAM', '2021-05-22', true, false, true, now(), now()),

((SELECT id FROM kinder WHERE vorname='Elena' AND nachname='Paredes'),
 (SELECT id FROM bezugspersonen WHERE vorname='Mateo' AND nachname='Paredes'),
 'VATER', 'GEMEINSAM', '2021-05-22', false, false, true, now(), now()),

((SELECT id FROM kinder WHERE vorname='Elena' AND nachname='Paredes'),
 (SELECT id FROM bezugspersonen WHERE vorname='Lucia' AND nachname='Torres'),
 'TANTE', 'KEIN', '2025-02-04', false, false, true, now(), now()),

((SELECT id FROM kinder WHERE vorname='Tariq' AND nachname='Mansour'),
 (SELECT id FROM bezugspersonen WHERE vorname='Samir' AND nachname='Mansour'),
 'VATER', 'ALLEIN', '2018-11-18', true, true, true, now(), now()),

((SELECT id FROM kinder WHERE vorname='Tariq' AND nachname='Mansour'),
 (SELECT id FROM bezugspersonen WHERE vorname='Farah' AND nachname='Mansour'),
 'TANTE', 'KEIN', '2024-09-01', false, false, true, now(), now()),

((SELECT id FROM kinder WHERE vorname='Lena' AND nachname='Vogt'),
 (SELECT id FROM bezugspersonen WHERE vorname='Claudia' AND nachname='Vogt'),
 'MUTTER', 'GEMEINSAM', '2022-08-09', true, true, true, now(), now()),

((SELECT id FROM kinder WHERE vorname='Lena' AND nachname='Vogt'),
 (SELECT id FROM bezugspersonen WHERE vorname='Robert' AND nachname='Vogt'),
 'VATER', 'GEMEINSAM', '2022-08-09', false, true, true, now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- KIND-DOSSIERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Sonnenschein-Dossiers
INSERT INTO kind_dossiers (traeger_id, einrichtung_org_unit_id, kind_id, enabled, created_at, updated_at)
SELECT (SELECT id FROM traeger WHERE slug='demo-traeger'),
       (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
       k.id, true, now(), now()
FROM kinder k
WHERE k.owner_einrichtung_org_unit_id = (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG');

-- Regenbogen-Dossiers
INSERT INTO kind_dossiers (traeger_id, einrichtung_org_unit_id, kind_id, enabled, created_at, updated_at)
SELECT (SELECT id FROM traeger WHERE slug='demo-traeger'),
       (SELECT id FROM org_units WHERE name='KiTa Regenbogen' AND type='EINRICHTUNG'),
       k.id, true, now(), now()
FROM kinder k
WHERE k.owner_einrichtung_org_unit_id = (SELECT id FROM org_units WHERE name='KiTa Regenbogen' AND type='EINRICHTUNG');

-- ═══════════════════════════════════════════════════════════════════════════
-- FALLÖFFNUNGEN  (alle Felder inkl. team_org_unit_id, fall_no, aktenzeichen)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO falloeffnungen
    (dossier_id, traeger_id, einrichtung_org_unit_id, team_org_unit_id,
     status, titel, kurzbeschreibung,
     created_by_user_id, aktenzeichen, fall_no,
     opened_at, closed_at, created_at, updated_at)
VALUES
((SELECT d.id FROM kind_dossiers d JOIN kinder k ON k.id=d.kind_id WHERE k.vorname='Nika' AND k.nachname='Darwish'),
 (SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
 (SELECT id FROM org_units WHERE name='Team §8a Sonnenschein' AND type='TEAM'),
    'ABGESCHLOSSEN', 'Akute Vernachlässigung – Nika D.',
 'Anonyme Nachbarin meldete nächtliche Alleinlassung. Mutter alkoholisiert, Kind kam mehrfach hungrig in der Einrichtung an. ASD veranlasste Sofortschutz, Alkoholtherapie sowie Familienhilfe.',
 (SELECT id FROM users WHERE email='k.bremmer@ksz-koeln.de'),
 'KSZ-S-2025-011', 1,
 '2025-01-12 08:30:00+01', '2025-02-28 16:00:00+01', now(), now()),

((SELECT d.id FROM kind_dossiers d JOIN kinder k ON k.id=d.kind_id WHERE k.vorname='Mika' AND k.nachname='Schröder'),
 (SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
 (SELECT id FROM org_units WHERE name='Team §8a Sonnenschein' AND type='TEAM'),
    'ABGESCHLOSSEN', 'Chronische Unterversorgung – Mika S.',
 'Mika erscheint regelmäßig ohne Frühstück, Kleidung ungepflegt, Hausaufgaben unvollständig. Eltern überfordert, Großmutter übernimmt Betreuung am Nachmittag. Struktur- und Lernplan etabliert, Fall erfolgreich abgeschlossen.',
 (SELECT id FROM users WHERE email='j.neumann@ksz-koeln.de'),
 'KSZ-S-2024-014', 1,
 '2024-11-05 09:15:00+01', '2025-01-15 15:00:00+01', now(), now()),

((SELECT d.id FROM kind_dossiers d JOIN kinder k ON k.id=d.kind_id WHERE k.vorname='Elena' AND k.nachname='Paredes'),
 (SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Regenbogen' AND type='EINRICHTUNG'),
 (SELECT id FROM org_units WHERE name='Team §8a Regenbogen' AND type='TEAM'),
    'ABGESCHLOSSEN', 'Sexualisierte Gewalt – Elena P.',
 'Elena offenbarte sexualisierte Übergriffe eines Bekannten der Familie. Polizei, ASD und Psychologin eingebunden. Kind lebt aktuell in Bereitschaftspflege. Maßnahmen vollständig umgesetzt.',
 (SELECT id FROM users WHERE email='n.schreiber@ksz-koeln.de'),
 'KSZ-R-2025-021', 1,
 '2025-02-03 14:20:00+01', '2025-03-10 10:30:00+01', now(), now()),

((SELECT d.id FROM kind_dossiers d JOIN kinder k ON k.id=d.kind_id WHERE k.vorname='Tariq' AND k.nachname='Mansour'),
 (SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Regenbogen' AND type='EINRICHTUNG'),
 (SELECT id FROM org_units WHERE name='Team §8a Regenbogen' AND type='TEAM'),
    'ABGESCHLOSSEN', 'Parentifizierung – Tariq M.',
 'Vater arbeitet nachts, Tariq übernimmt Versorgung zweier Geschwister. SPFh, Tagesstruktur und schulische Betreuung eingerichtet. Nachweislich entlastete Familie, Fall beendet.',
 (SELECT id FROM users WHERE email='n.schreiber@ksz-koeln.de'),
 'KSZ-R-2024-019', 1,
 '2024-09-18 07:45:00+02', '2025-02-20 12:00:00+01', now(), now()),

((SELECT d.id FROM kind_dossiers d JOIN kinder k ON k.id=d.kind_id WHERE k.vorname='Lena' AND k.nachname='Vogt'),
 (SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
 (SELECT id FROM org_units WHERE name='Team §8a Sonnenschein' AND type='TEAM'),
    'ABGESCHLOSSEN', 'Brandverletzung dokumentieren – Lena V.',
 'Kinderarzt meldete Brandverletzung an rechter Hand. Eltern kooperativ, Ursache plausibel aber dokumentationspflichtig. Schutzplan stellte Brandschutztraining und Nachkontrolle sicher.',
 (SELECT id FROM users WHERE email='k.bremmer@ksz-koeln.de'),
 'KSZ-S-2025-017', 1,
 '2025-03-01 08:10:00+01', '2025-03-12 13:00:00+01', now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- MELDUNGEN  (alle Felder: Basis, Einschätzung, Akut, Planung, Versioning)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO meldungen (falloeffnung_id, version_no, current, row_version, status, type,
    erfasst_von_rolle, meldeweg, meldende_stelle_kontakt,
    dringlichkeit, datenbasis,
    einwilligung_vorhanden, schweigepflichtentbindung_vorhanden,
    kurzbeschreibung, fach_ampel, fach_text,
    abweichung_zur_auto,
    akut_gefahr_im_verzug, akut_begruendung, akut_notruf_erforderlich, akut_kind_sicher_untergebracht,
    verantwortliche_fachkraft_user_id,
    naechste_ueberpruefung_am, zusammenfassung,
    created_by_user_id, created_by_display_name,
    submitted_at, submitted_by_user_id, submitted_by_display_name,
    freigabe_am, freigabe_von_user_id,
    info_effective_at, reason_text,
    created_at, updated_at)
VALUES
((SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-S-2025-011'),
 1, true, 1, 'ABGESCHLOSSEN', 'ERSTMELDUNG',
 'ERZIEHERIN', 'PERSOENLICH', 'Erzieherin Julia Neumann, KiTa Sonnenschein, Tel. 0221 9200102',
 'AKUT_HEUTE', 'BEOBACHTUNG',
 false, false,
 'Nika erschien an vier aufeinanderfolgenden Tagen hungrig, roch nach Rauch und berichtete, nachts allein zu sein. Mutter Leila wirkte wiederholt alkoholisiert.',
 'ROT',
 'Eindeutige Unterversorgung und fehlende Aufsicht. Mutter alkoholbedingt nicht handlungsfähig. Sofortige Schutzmaßnahmen erforderlich.',
 'GLEICH',
 true, 'Kind schlief laut Nachbarin allein, Mutter alkoholbedingt handlungsunfähig.', false, 'JA',
 (SELECT id FROM users WHERE email='j.neumann@ksz-koeln.de'),
 '2025-02-10',
 'ASD, Familienhilfe und Alkoholtherapie greifen. Großmutter begleitet Übergaben. Situation stabil – Fall geschlossen.',
 (SELECT id FROM users WHERE email='j.neumann@ksz-koeln.de'), 'J. Neumann',
 '2025-01-13 10:00:00+01', (SELECT id FROM users WHERE email='j.neumann@ksz-koeln.de'), 'J. Neumann',
 '2025-01-13 11:15:00+01', (SELECT id FROM users WHERE email='m.engel@ksz-koeln.de'),
 '2025-01-12 19:00:00+01', 'Abschluss nach bestätigtem Schutzplan mit ASD Köln-Ehrenfeld.',
 now(), now()),

((SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-S-2024-014'),
 1, true, 1, 'ABGESCHLOSSEN', 'MELDUNG',
 'SOZIALPAEDAGOGIN', 'TELEFON', 'Schulsozialarbeiterin Frau Jansen, GGS Ehrenfeld, Tel. 0221 221-27044',
 'ZEITNAH_24_48H', 'ERZAEHLUNG',
 true, true,
 'Schule meldet wiederkehrende Unterversorgung (kein Frühstück, ungepflegte Kleidung, fehlende Aufgaben). Mutter erschöpft, Vater getrennt lebend, Großmutter bietet Hilfe an.',
 'GELB',
 'Chronische Vernachlässigung ohne akute Lebensgefahr, aber mit erheblichen Entwicklungsrisiken – strukturierter Unterstützungsplan erforderlich.',
 'GLEICH',
 false, NULL, false, 'JA',
 (SELECT id FROM users WHERE email='j.neumann@ksz-koeln.de'),
 '2025-03-01',
 'Tagesstruktur, Lernförderung und Großmuttervereinbarung greifen. Gewicht stabil, Schulbesuch regelmäßig.',
 (SELECT id FROM users WHERE email='j.neumann@ksz-koeln.de'), 'J. Neumann',
 '2024-11-06 15:30:00+01', (SELECT id FROM users WHERE email='j.neumann@ksz-koeln.de'), 'J. Neumann',
 '2024-11-07 09:00:00+01', (SELECT id FROM users WHERE email='k.bremmer@ksz-koeln.de'),
 '2024-11-05 08:45:00+01', 'Fall nach Umsetzung des Schutzplans geschlossen.',
 now(), now()),

((SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-R-2025-021'),
 1, true, 1, 'ABGESCHLOSSEN', 'ERSTMELDUNG',
 'SOZIALPAEDAGOGIN', 'PERSOENLICH', 'Sozialpädagogin Nadine Schreiber, KiTa Regenbogen, Tel. 0221 9200202',
 'AKUT_HEUTE', 'KIND',
 false, false,
 'Elena schilderte sexualisierte Übergriffe eines Bekannten („Onkel Luis“). Kind zeigte Schutzreaktionen und bat um Geheimhaltung.',
 'ROT',
 'Kind benennt Täterperson, zeigt sexualisiertes Verhalten sowie Geheimhaltungsdruck. Sofortige Inobhutnahme und Ermittlungen zwingend.',
 'GLEICH',
 true, 'Täter hatte bis zur Meldung freien Zugang zur Wohnung.', true, 'JA',
 (SELECT id FROM users WHERE email='n.schreiber@ksz-koeln.de'),
 '2025-03-24',
 'Kind lebt in Bereitschaftspflege, Täterkontakt rechtlich untersagt, Traumaambulanz angebunden.',
 (SELECT id FROM users WHERE email='n.schreiber@ksz-koeln.de'), 'N. Schreiber',
 '2025-02-04 11:45:00+01', (SELECT id FROM users WHERE email='n.schreiber@ksz-koeln.de'), 'N. Schreiber',
 '2025-02-04 13:10:00+01', (SELECT id FROM users WHERE email='m.engel@ksz-koeln.de'),
 '2025-02-03 16:00:00+01', 'Abschluss nach Übergabe an ASD, Polizei und KJP.',
 now(), now()),

((SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-R-2024-019'),
 1, true, 1, 'ABGESCHLOSSEN', 'MELDUNG',
 'EINRICHTUNGSLEITUNG', 'PERSOENLICH', 'Einrichtungsleitung Petra Kleinschmidt, KiTa Regenbogen, Tel. 0221 9200201',
 'ZEITNAH_24_48H', 'BEOBACHTUNG',
 true, true,
 'Tariq (7) brachte regelmäßig seine Geschwister mit, erledigte Haushaltstätigkeiten und zeigte Erschöpfung. Vater Samir arbeitet nachts und ist strukturell überfordert.',
 'GELB',
 'Parentifizierung mit struktureller Überforderung. Versorgung nicht altersgerecht, aber Eltern kooperationsbereit.',
 'GLEICH',
 false, NULL, false, 'JA',
 (SELECT id FROM users WHERE email='n.schreiber@ksz-koeln.de'),
 '2025-04-15',
 'SPFh, Tagesstrukturplan und Hortplatz sichern Versorgung. Vater nutzt Entlastungsangebote.',
 (SELECT id FROM users WHERE email='n.schreiber@ksz-koeln.de'), 'N. Schreiber',
 '2024-09-20 14:30:00+02', (SELECT id FROM users WHERE email='n.schreiber@ksz-koeln.de'), 'N. Schreiber',
 '2024-09-20 16:00:00+02', (SELECT id FROM users WHERE email='p.kleinschmidt@ksz-koeln.de'),
 '2024-09-18 08:00:00+02', 'Fall geschlossen nach Umsetzung des Schutzplans.',
 now(), now()),

((SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-S-2025-017'),
 1, true, 1, 'ABGESCHLOSSEN', 'ERSTMELDUNG',
 'EINRICHTUNGSLEITUNG', 'PERSOENLICH', 'Einrichtungsleitung Katharina Bremmer, KiTa Sonnenschein, Tel. 0221 9200101',
 'ZEITNAH_24_48H', 'DRITTE',
 true, true,
 'Kinderarzt meldete Brandverletzung rechter Handfläche von Lena (2). Eltern gaben stimmige Erklärung (Teekanne umgestoßen) und baten um Unterstützung bei Sicherheitstraining.',
 'GELB',
 'Keine Hinweise auf absichtliche Verletzung, aber Dokumentations- und Nachsorgepflicht zur Sicherung des Schutzes.',
 'NIEDRIGER',
 false, NULL, false, 'JA',
 (SELECT id FROM users WHERE email='j.neumann@ksz-koeln.de'),
 '2025-04-05',
 'Brandschutzschulung, Hausbesuch und Hautversorgung abgeschlossen. Keine weiteren Auffälligkeiten.',
 (SELECT id FROM users WHERE email='k.bremmer@ksz-koeln.de'), 'K. Bremmer',
 '2025-03-02 09:40:00+01', (SELECT id FROM users WHERE email='k.bremmer@ksz-koeln.de'), 'K. Bremmer',
 '2025-03-02 11:05:00+01', (SELECT id FROM users WHERE email='m.engel@ksz-koeln.de'),
 '2025-03-01 08:30:00+01', 'Fall dokumentiert und nach Nachkontrolle geschlossen.',
 now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- ANLASSCODES
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO meldung_anlass_codes (meldung_id, code) VALUES
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-011'), 'NEGLECT_FOOD'),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-011'), 'NEGLECT_HYGIENE'),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-011'), 'PARENT_SUBSTANCE_IMPAIRED_CARE'),

((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2024-014'), 'NEGLECT_CHRONIC'),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2024-014'), 'NEGLECT_CLOTHING'),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2024-014'), 'SUPERVISION_LEFT_ALONE'),

((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2025-021'), 'SEXUAL_ABUSE_SUSPECTED'),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2025-021'), 'CHILD_DISCLOSES_ABUSE'),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2025-021'), 'ACUTE_IMMEDIATE_DANGER'),

((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2024-019'), 'PARENT_OVERWHELMED'),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2024-019'), 'NEGLECT_FOOD'),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2024-019'), 'FAMILY_PREVIOUS_PROTECTION_CASE'),

((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-017'), 'BODY_BURN_SUSPECTED'),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-017'), 'BODY_INJURY_VISIBLE'),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-017'), 'BODY_INJURY_EXPLANATION_ODD');

-- ═══════════════════════════════════════════════════════════════════════════
-- BEOBACHTUNGEN  (alle Felder: zeitpunkt, zeitraum, ort, quelle, sichtbarkeit,
--                 text, koerperbefund, verhalten_kind, verhalten_bezug, woertliches_zitat)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO meldung_observations (meldung_id, zeitpunkt, zeitraum, ort, quelle, sichtbarkeit,
    text, koerperbefund, verhalten_kind, verhalten_bezug, woertliches_zitat,
    created_by_user_id, created_by_display_name, created_at)
VALUES
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-011'),
 '2025-01-11 09:10:00+01', 'WIEDERHOLT', 'SCHULE_KITA', 'EIGENE_WAHRNEHMUNG', 'INTERN',
 'Nika kam erneut ohne Frühstück in die Gruppe, roch stark nach kaltem Rauch und berichtete, dass "Mama schon wieder geschlafen" habe.',
 'Augenringe deutlich sichtbar, Kleidung riecht nach Rauch, kein Frühstück dabei.',
 'Wirkte müde, hielt sich an Erzieherin fest, antwortete leise.', NULL, '"Ich habe nur einen Apfel vom Nachbarn bekommen."',
 (SELECT id FROM users WHERE email='j.neumann@ksz-koeln.de'), 'J. Neumann', now()),

((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2024-014'),
 '2024-11-05 12:20:00+01', 'WIEDERHOLT', 'SCHULE_KITA', 'DRITTE', 'INTERN',
 'Rückmeldung Schulsozialarbeit: Mika erscheint regelmäßig ohne belegtes Brot und schläft im Unterricht ein.',
 NULL,
 'Kind wirkt erschöpft, legt Kopf oft auf den Tisch.', NULL, NULL,
 (SELECT id FROM users WHERE email='j.neumann@ksz-koeln.de'), 'J. Neumann', now()),

((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2025-021'),
 '2025-02-02 15:40:00+01', 'EINMALIG', 'SCHULE_KITA', 'KIND', 'INTERN',
 'Elena beschrieb beim Abholen ein "geheimes Spiel" mit Onkel Luis und zeigte dabei auf ihre Hose.',
 NULL,
 'Wirkte angespannt, hielt Blickkontakt nur kurz.', NULL, '"Onkel sagt, ich darf das niemandem erzählen."',
 (SELECT id FROM users WHERE email='n.schreiber@ksz-koeln.de'), 'N. Schreiber', now()),

((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2024-019'),
 '2024-09-19 07:20:00+02', 'WIEDERHOLT', 'SCHULE_KITA', 'EIGENE_WAHRNEHMUNG', 'INTERN',
 'Tariq brachte erneut seine Geschwister mit und erklärte, dass Vater noch schläft, weil er nachts gearbeitet habe.',
 NULL,
 'Tariq wirkt übermüdet, übernimmt Verantwortung für jüngere Kinder.', NULL, NULL,
 (SELECT id FROM users WHERE email='p.kleinschmidt@ksz-koeln.de'), 'P. Kleinschmidt', now()),

((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-017'),
 '2025-03-01 08:35:00+01', 'EINMALIG', 'SCHULE_KITA', 'EIGENE_WAHRNEHMUNG', 'INTERN',
 'Lena wurde mit frisch verbundenem rechten Handrücken gebracht. Verband sauber, Eltern sehr kooperativ.',
 'Brandblase (ca. 2x3 cm) rechte Handfläche, Verband fachgerecht angelegt.',
 'Kind wirkt ruhig, zeigt Verband ohne Scheu.', NULL, '"Papa hat mir erklärt, dass wir jetzt Tee anders machen."',
 (SELECT id FROM users WHERE email='k.bremmer@ksz-koeln.de'), 'K. Bremmer', now());

-- ═══════════════════════════════════════════════════════════════════════════
-- OBSERVATION TAGS
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'NEGLECT_HYGIENE', 2, 'Starker Rauchgeruch und ungepflegte Kleidung an mehreren Tagen'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='KSZ-S-2025-011' AND mo.zeitpunkt='2025-01-11 09:10:00+01';
INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'NEGLECT_FOOD', 3, 'Kind kommt wiederholt ohne Frühstück und berichtet von fehlendem Essen'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='KSZ-S-2025-011' AND mo.zeitpunkt='2025-01-11 09:10:00+01';
INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'NEGLECT_CHRONIC', 2, 'Schulsozialarbeit berichtet über dauerhafte Unterversorgung und Müdigkeit'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='KSZ-S-2024-014' AND mo.zeitpunkt='2024-11-05 12:20:00+01';
INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'SEXUAL_ABUSE_SUSPECTED', 3, 'Kind benennt Täterperson und schildert geheimes Spiel'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='KSZ-R-2025-021' AND mo.zeitpunkt='2025-02-02 15:40:00+01';
INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'PARENT_OVERWHELMED', 2, 'Kind übernimmt Versorgung der Geschwister wegen nächtlicher Arbeit des Vaters'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='KSZ-R-2024-019' AND mo.zeitpunkt='2024-09-19 07:20:00+02';
INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'BODY_BURN_SUSPECTED', 2, 'Frische Brandblase dokumentiert, Nachsorge erforderlich'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='KSZ-S-2025-017' AND mo.zeitpunkt='2025-03-01 08:35:00+01';
INSERT INTO meldung_observation_tags (observation_id, anlass_code, severity, comment)
SELECT mo.id, 'BODY_INJURY_VISIBLE', 1, 'Verband fachgerecht angelegt, Verletzung dokumentiert'
FROM meldung_observations mo JOIN meldungen m ON m.id=mo.meldung_id JOIN falloeffnungen f ON f.id=m.falloeffnung_id
WHERE f.aktenzeichen='KSZ-S-2025-017' AND mo.zeitpunkt='2025-03-01 08:35:00+01';
-- ═══════════════════════════════════════════════════════════════════════════
-- KONTAKTE
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO meldung_contacts (meldung_id, kontakt_mit, kontakt_am, status, ergebnis, notiz, created_at, updated_at)
VALUES
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-011'),
 'KIND', '2025-01-11 09:15:00+01', 'ERREICHT',
 'Kind schildert Hunger, bittet um Brot.',
 'Gespräch in ruhiger Ecke geführt, ohne Druck. Kind aß sofort belegtes Brot.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-011'),
 'JUGENDAMT', '2025-01-12 12:45:00+01', 'ERREICHT',
 'ASD Köln-Ehrenfeld nimmt Sofortmeldung auf, vereinbart Hausbesuch.',
 'Telefonische Weitergabe aller Beobachtungen, inklusive Fotos.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2024-014'),
 'MUTTER', '2024-11-06 08:10:00+01', 'ERREICHT',
 'Mutter wirkt erschöpft, stimmt Familienhilfe zu.',
 'Gespräch gemeinsam mit Großmutter geführt, Motivation hoch.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2024-014'),
 'JUGENDAMT', '2024-11-06 16:00:00+01', 'ERREICHT',
 'ASD bestätigt Unterstützung, bittet um Lernstandsberichte alle 4 Wochen.',
 'Vereinbarung zur Rückmeldung bis Januar 2025 dokumentiert.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2025-021'),
 'SONSTIGE', '2025-02-03 17:10:00+01', 'ERREICHT',
 'Polizei Köln nimmt Aussage der Fachkraft auf, Ermittlungsnummer K-25-1187.',
 'Protokoll übergeben, Fachkraft als Zeugin benannt.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2025-021'),
 'JUGENDAMT', '2025-02-04 12:00:00+01', 'ERREICHT',
 'ASD veranlasst Inobhutnahme, Bereitschaftspflege informiert.',
 'Aktenzeichen ASD-KR-2025-77, wöchentliche Rückmeldung vereinbart.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2024-019'),
 'VATER', '2024-09-19 07:30:00+02', 'ERREICHT',
 'Vater bittet um Hilfe bei Organisation der Morgenroutine.',
 'Hinweis auf SPFh gegeben, Vater stimmt sofort zu.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2024-019'),
 'SONSTIGE', '2024-09-25 10:00:00+02', 'ERREICHT',
 'SPFh AWO bestätigt Starttermin und berichtet von positiver erster Einheit.',
 'Telefonische Rückmeldung, nächste Evaluation in 4 Wochen.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-017'),
 'MUTTER', '2025-03-01 08:40:00+01', 'ERREICHT',
 'Mutter schildert Unfallhergang ruhig, zeigt Bereitschaft zur Zusammenarbeit.',
 'Brandschutzflyer übergeben, Mutter bedankt sich.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-017'),
 'JUGENDAMT', '2025-03-01 10:30:00+01', 'ERREICHT',
 'ASD bittet um Dokumentation der Nachsorge, keine weiteren Maßnahmen erforderlich.',
 'Bericht per E-Mail an ASD übermittelt.', now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- JUGENDAMT-EINTRÄGE
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO meldung_jugendamt (meldung_id, informiert, kontakt_am, kontaktart, aktenzeichen, begruendung, created_at, updated_at)
VALUES
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-011'),
 'JA', '2025-01-12 12:45:00+01', 'TELEFON', 'ASD-EF-2025-011',
 'Kind nachts unbeaufsichtigt, Mutter alkoholkrank. Sofortiger Hausbesuch und Schutzplan erforderlich.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2024-014'),
 'JA', '2024-11-06 16:00:00+01', 'TELEFON', 'ASD-EF-2024-214',
 'Chronische Unterversorgung, Eltern überlastet. Familie benötigt SPFh und Lernförderung.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2025-021'),
 'JA', '2025-02-04 12:00:00+01', 'TELEFON', 'ASD-KR-2025-077',
 'Kind benennt sexualisierte Gewalt, sofortige Inobhutnahme und Ermittlungen veranlasst.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2024-019'),
 'JA', '2024-09-25 10:00:00+02', 'TELEFON', NULL,
 'Parentifizierung durch alleinerziehenden Vater; SPFh gestartet, ASD erhält Verlaufsberichte.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-017'),
 'JA', '2025-03-01 10:30:00+01', 'TELEFON', 'ASD-EF-2025-030',
 'Brandverletzung dokumentiert, Eltern kooperativ. ASD begleitet Nachsorge, keine weiteren Maßnahmen.', now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- EXTERNE MELDUNGEN
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO meldung_extern (meldung_id, stelle, am, begruendung, ergebnis, created_at, updated_at)
VALUES
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-011'),
 'ARZT_KLINIK', '2025-01-13 14:00:00+01',
 'Kinderärztin Dr. Özdemir dokumentiert Gewichtsverlust und erstellt Attest für ASD.',
 'Befund bestätigt Unterversorgung, monatliche Gewichtskontrolle vereinbart.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2024-014'),
 'SONSTIGE', '2024-11-10 09:00:00+01',
 'Schulpsychologin Frau Salim wird eingebunden, um Konzentrationsprobleme zu bewerten.',
 'Empfehlung: Lernförderung + Entlastung durch Großmutter, Bericht liegt vor.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2025-021'),
 'POLIZEI', '2025-02-03 17:10:00+01',
 'Kriminalpolizei Köln (Dezernat 12) informiert, Ermittlungsnummer K-25-1187.',
 'Vernehmung im KIND-Interviewzentrum geplant, Kontaktverbot ausgesprochen.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-R-2024-019'),
 'SONSTIGE', '2024-09-28 11:30:00+02',
 'SPFh AWO meldet Start der Familienhilfe und regelmäßige Besuche.',
 'Familie nimmt Termine wahr, nächste Auswertung 26.10.2024.', now(), now()),
((SELECT m.id FROM meldungen m JOIN falloeffnungen f ON f.id=m.falloeffnung_id WHERE f.aktenzeichen='KSZ-S-2025-017'),
 'ARZT_KLINIK', '2025-03-01 09:00:00+01',
 'Kinderarzt Dr. Werner dokumentiert Brandverletzung und schult Eltern in Erster Hilfe.',
 'Nachsorge alle drei Tage, Wundheilung komplikationslos.', now(), now());

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4a: KINDERSCHUTZBOGEN ASSESSMENTS + BEWERTUNGEN
-- ═══════════════════════════════════════════════════════════════════════════

-- SKB-1: Nika Darwish / KSZ-S-2025-011 / ALTER_3_6
INSERT INTO kinderschutzbogen_assessments
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     altersgruppe, bewertungsdatum,
     gesamteinschaetzung_manuell, gesamteinschaetzung_freitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-S-2025-011'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
    'ALTER_3_6', '2025-01-20',
    -1,
    'Kind zeigt Unterversorgung und Müdigkeit, reagiert aber positiv auf strukturierte Hilfen.',
    (SELECT id FROM users WHERE email = 'j.neumann@ksz-koeln.de'),
    '2025-01-20 14:00:00+01', '2025-01-20 14:00:00+01';
INSERT INTO kinderschutzbogen_bewertungen (assessment_id, item_code, rating, notiz)
SELECT a.id, v.code, v.rating::smallint, v.notiz
FROM kinderschutzbogen_assessments a,
     (VALUES
        ('GV_ERN_QUALITAET',        -1, 'Unregelmäßige Mahlzeiten, Kind kommt hungrig in die KiTa'),
        ('GV_KP_HYGIENE',           -1, 'Starker Rauchgeruch, Kleidung selten gewechselt'),
        ('INT_TAGESABLAUF',         -2, 'Nachts unbeaufsichtigt, kein verlässlicher Schlafrhythmus'),
        ('KOOP_ANNAHME_HILFEN',      1, 'Mutter nimmt Alkoholtherapie und SPFh an')
     ) AS v(code, rating, notiz)
WHERE a.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-S-2025-011');
-- SKB-2: Mika Schröder / KSZ-S-2024-014 / ALTER_6_14
INSERT INTO kinderschutzbogen_assessments
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     altersgruppe, bewertungsdatum,
     gesamteinschaetzung_manuell, gesamteinschaetzung_freitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-S-2024-014'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
    'ALTER_6_14', '2024-11-12',
    0,
    'Versorgung zeitweise unzureichend, aber Ressourcen über Großmutter vorhanden.',
    (SELECT id FROM users WHERE email = 'j.neumann@ksz-koeln.de'),
    '2024-11-12 13:00:00+01', '2024-11-12 13:00:00+01';
INSERT INTO kinderschutzbogen_bewertungen (assessment_id, item_code, rating, notiz)
SELECT a.id, v.code, v.rating::smallint, v.notiz
FROM kinderschutzbogen_assessments a,
     (VALUES
        ('GV_ERN_ALTERSGEM',        -1, 'Frühstück fehlt häufig, warmes Essen nur sporadisch'),
        ('GV_SCHLAFPLATZ',           1, 'Eigenes Bett vorhanden, Großmutter sorgt für Ordnung'),
        ('INT_AUFMERKSAMKEIT',      -1, 'Mutter emotional erschöpft, reagiert verzögert'),
        ('KOOP_ANNAHME_HILFEN',      2, 'Familie akzeptiert SPFh und Lernförderung konsequent')
     ) AS v(code, rating, notiz)
WHERE a.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-S-2024-014');
-- SKB-3: Elena Paredes / KSZ-R-2025-021 / ALTER_3_6
INSERT INTO kinderschutzbogen_assessments
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     altersgruppe, bewertungsdatum,
     gesamteinschaetzung_manuell, gesamteinschaetzung_freitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-R-2025-021'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Regenbogen' AND type = 'EINRICHTUNG'),
    'ALTER_3_6', '2025-02-10',
    -2,
    'Konkreter Hinweis auf sexualisierte Gewalt, Kind aktuell in Bereitschaftspflege.',
    (SELECT id FROM users WHERE email = 'n.schreiber@ksz-koeln.de'),
    '2025-02-10 10:30:00+01', '2025-02-10 10:30:00+01';
INSERT INTO kinderschutzbogen_bewertungen (assessment_id, item_code, rating, notiz)
SELECT a.id, v.code, v.rating::smallint, v.notiz
FROM kinderschutzbogen_assessments a,
     (VALUES
        ('GV_SCHUTZ_SEX',          -2, 'Kind benennt Täterperson, Schutz im Haushalt nicht gegeben'),
        ('GV_BEAUFSICHTIGUNG',     -1, 'Täter hatte regelmäßigen Zugang zum Kind'),
        ('KOOP_JUGENDAMT',          2, 'Eltern kooperieren nach Meldung vollständig'),
        ('KOOP_SCHUTZVEREINBARUNGEN', 1, 'Kontaktverbot wird eingehalten, Pflegefamilie informiert')
     ) AS v(code, rating, notiz)
WHERE a.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-R-2025-021');
-- SKB-4: Tariq Mansour / KSZ-R-2024-019 / ALTER_6_14
INSERT INTO kinderschutzbogen_assessments
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     altersgruppe, bewertungsdatum,
     gesamteinschaetzung_manuell, gesamteinschaetzung_freitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-R-2024-019'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Regenbogen' AND type = 'EINRICHTUNG'),
    'ALTER_6_14', '2024-10-05',
    -1,
    'Tariq übernimmt viele Aufgaben, Vater kooperiert, aber Stabilität muss aufgebaut werden.',
    (SELECT id FROM users WHERE email = 'p.kleinschmidt@ksz-koeln.de'),
    '2024-10-05 11:00:00+02', '2024-10-05 11:00:00+02';
INSERT INTO kinderschutzbogen_bewertungen (assessment_id, item_code, rating, notiz)
SELECT a.id, v.code, v.rating::smallint, v.notiz
FROM kinderschutzbogen_assessments a,
     (VALUES
        ('GV_BEAUFSICHTIGUNG',     -1, 'Kind begleitet jüngere Geschwister regelmäßig allein'),
        ('INT_TAGESABLAUF',        -1, 'Morgenroutine unsicher, Vater schläft nach Nachtschicht'),
        ('KOOP_ANNAHME_HILFEN',     1, 'Vater nimmt SPFh-Angebote wahr'),
        ('KOOP_VERANTWORTUNG',      1, 'Vater erkennt Belastung, braucht aber Strukturhilfe')
     ) AS v(code, rating, notiz)
WHERE a.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-R-2024-019');
-- SKB-5: Lena Vogt / KSZ-S-2025-017 / ALTER_3_6
INSERT INTO kinderschutzbogen_assessments
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     altersgruppe, bewertungsdatum,
     gesamteinschaetzung_manuell, gesamteinschaetzung_freitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-S-2025-017'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
    'ALTER_3_6', '2025-03-05',
    1,
    'Brandverletzung plausibel erklärt, Eltern kooperativ, Schutzvereinbarung umgesetzt.',
    (SELECT id FROM users WHERE email = 'k.bremmer@ksz-koeln.de'),
    '2025-03-05 09:00:00+01', '2025-03-05 09:00:00+01';
INSERT INTO kinderschutzbogen_bewertungen (assessment_id, item_code, rating, notiz)
SELECT a.id, v.code, v.rating::smallint, v.notiz
FROM kinderschutzbogen_assessments a,
     (VALUES
        ('GV_SCHUTZ_KOERPERL',      1, 'Eltern reagieren schnell, lassen Wunde kontrollieren'),
        ('GV_BEAUFSICHTIGUNG',      1, 'Aufsicht grundsätzlich gegeben, aber Schulung notwendig'),
        ('KOOP_PROBLEMEINSICHT',    2, 'Eltern setzen Sicherheitsmaßnahmen konsequent um'),
        ('KOOP_SCHUTZVEREINBARUNGEN', 2, 'Brandschutzplan unterschrieben und überprüft')
     ) AS v(code, rating, notiz)
WHERE a.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-S-2025-017');
-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4b: DJI ASSESSMENTS + POSITIONEN
-- ═══════════════════════════════════════════════════════════════════════════

-- DJI-1: Nika Darwish / KSZ-S-2025-011 / RISIKOEINSCHAETZUNG
INSERT INTO dji_assessments
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     form_typ, bewertungsdatum, gesamteinschaetzung, gesamtfreitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-S-2025-011'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
    'RISIKOEINSCHAETZUNG', '2025-01-22',
    'MITTLERES_RISIKO',
    'Versorgungssituation verbessert sich mit Hilfen, Rückfallrisiko bei Alkoholkonsum der Mutter bleibt.',
    (SELECT id FROM users WHERE email = 'j.neumann@ksz-koeln.de'),
    '2025-01-22 09:30:00+01', '2025-01-22 09:30:00+01';
INSERT INTO dji_positionen (assessment_id, position_code, belege, bewertung_bool)
SELECT a.id, v.code, v.belege, v.bval
FROM dji_assessments a,
     (VALUES
        ('RISI_LEBENSWELT',      'Wohnung stabil, Nachbarschaft unterstützt, aber keine Nachtaufsicht', NULL::boolean),
        ('RISI_PSYCH_GESUNDHEIT', 'Mutter in Therapie, Abstinenzphase begonnen, Risiko Rückfall vorhanden', NULL::boolean),
        ('RISI_KIND',             'Kind reagiert positiv auf Struktur, bleibt jedoch schnell erschöpft', NULL::boolean)
     ) AS v(code, belege, bval)
WHERE a.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-S-2025-011')
  AND a.form_typ = 'RISIKOEINSCHAETZUNG';
-- DJI-2: Mika Schröder / KSZ-S-2024-014 / ERZIEHUNGSFAEHIGKEIT_PFLEGE
INSERT INTO dji_assessments
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     form_typ, bewertungsdatum, gesamteinschaetzung, gesamtfreitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-S-2024-014'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
    'ERZIEHUNGSFAEHIGKEIT_PFLEGE', '2024-11-20',
    'EINGESCHRAENKT',
    'Pflege gelingt mit Unterstützung, ohne Großmutter wäre Versorgung unzureichend.',
    (SELECT id FROM users WHERE email = 'k.bremmer@ksz-koeln.de'),
    '2024-11-20 11:00:00+01', '2024-11-20 11:00:00+01';
INSERT INTO dji_positionen (assessment_id, position_code, belege)
SELECT a.id, v.code, v.belege
FROM dji_assessments a,
     (VALUES
        ('ERZ_PF_PFLEGEZUSTAND', 'Kind erscheint oft hungrig, Kleidung sauberer seit Großmutter unterstützt'),
        ('ERZ_PF_PFLEGEVERHALTEN', 'Mutter kocht selten, verlässt sich auf Fertiggerichte, Großmutter übernimmt Kochen'),
        ('ERZ_PF_VERAENDERUNG', 'Nach SPFh-Beginn deutlich strukturierter Tagesablauf beobachtet')
     ) AS v(code, belege)
WHERE a.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-S-2024-014')
  AND a.form_typ = 'ERZIEHUNGSFAEHIGKEIT_PFLEGE';
-- DJI-3: Elena Paredes / KSZ-R-2025-021 / SICHERHEITSEINSCHAETZUNG
INSERT INTO dji_assessments
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     form_typ, bewertungsdatum, gesamteinschaetzung, gesamtfreitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-R-2025-021'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Regenbogen' AND type = 'EINRICHTUNG'),
    'SICHERHEITSEINSCHAETZUNG', '2025-02-04',
    'HANDLUNGSBEDARF_SOFORT',
    'Kind benennt Täter, Geheimhaltungsgebot vorhanden. Sofortige Sicherung erforderlich.',
    (SELECT id FROM users WHERE email = 'n.schreiber@ksz-koeln.de'),
    '2025-02-04 15:00:00+01', '2025-02-04 15:00:00+01';
INSERT INTO dji_positionen (assessment_id, position_code, belege, bewertung_bool)
SELECT a.id, v.code, v.belege, v.bval
FROM dji_assessments a,
     (VALUES
        ('SICH_K1', 'Kind beschreibt Übergriff detailliert', TRUE),
        ('SICH_K5', 'Täter hatte unkontrollierten Zugang bis zur Meldung', TRUE),
        ('SICH_K4', 'Kind jetzt in Bereitschaftspflege, erreichbar', FALSE)
     ) AS v(code, belege, bval)
WHERE a.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-R-2025-021')
  AND a.form_typ = 'SICHERHEITSEINSCHAETZUNG';
-- DJI-4: Elena Paredes / KSZ-R-2025-021 / RISIKOEINSCHAETZUNG
INSERT INTO dji_assessments
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     form_typ, bewertungsdatum, gesamteinschaetzung, gesamtfreitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-R-2025-021'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Regenbogen' AND type = 'EINRICHTUNG'),
    'RISIKOEINSCHAETZUNG', '2025-02-18',
    'HOHES_RISIKO',
    'Traumaaufarbeitung läuft, Rückfallrisiko besteht solange Kontaktverbote nicht gerichtlich gesichert sind.',
    (SELECT id FROM users WHERE email = 'n.schreiber@ksz-koeln.de'),
    '2025-02-18 10:00:00+01', '2025-02-18 10:00:00+01';
INSERT INTO dji_positionen (assessment_id, position_code, belege)
SELECT a.id, v.code, v.belege
FROM dji_assessments a,
     (VALUES
        ('RISI_PERSOENLICHKEIT', 'Eltern reflektiert, reagieren konsequent'),
        ('RISI_LEBENSWELT', 'Bereitschaftspflege stabil, Ziel Rückführung nach Therapie'),
        ('RISI_KIND', 'Kind zeigt traumatische Symptome, benötigt Therapie')
     ) AS v(code, belege)
WHERE a.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-R-2025-021')
  AND a.form_typ = 'RISIKOEINSCHAETZUNG';
-- DJI-5: Tariq Mansour / KSZ-R-2024-019 / RISIKOEINSCHAETZUNG
INSERT INTO dji_assessments
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     form_typ, bewertungsdatum, gesamteinschaetzung, gesamtfreitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-R-2024-019'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Regenbogen' AND type = 'EINRICHTUNG'),
    'RISIKOEINSCHAETZUNG', '2024-10-12',
    'MITTLERES_RISIKO',
    'Überforderungssituation entschärft sich mit SPFh, dennoch bleibt Strukturabhängigkeit.',
    (SELECT id FROM users WHERE email = 'n.schreiber@ksz-koeln.de'),
    '2024-10-12 09:30:00+02', '2024-10-12 09:30:00+02';
INSERT INTO dji_positionen (assessment_id, position_code, belege)
SELECT a.id, v.code, v.belege
FROM dji_assessments a,
     (VALUES
        ('RISI_LEBENSGESCH', 'Alleinerziehender Vater ohne Netzwerk, arbeitet nachts'),
        ('RISI_KIND', 'Tariq wirkt erschöpft, übernimmt Verantwortung'),
        ('RISI_VORFAELLE', 'Keine Gewalt, aber wiederkehrende Vernachlässigungstendenzen')
     ) AS v(code, belege)
WHERE a.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-R-2024-019')
  AND a.form_typ = 'RISIKOEINSCHAETZUNG';
-- DJI-6: Lena Vogt / KSZ-S-2025-017 / SICHERHEITSEINSCHAETZUNG
INSERT INTO dji_assessments
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     form_typ, bewertungsdatum, gesamteinschaetzung, gesamtfreitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-S-2025-017'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
    'SICHERHEITSEINSCHAETZUNG', '2025-03-02',
    'HANDLUNGSBEDARF_SOFORT',
    'Brandverletzung musste abgeklärt werden, Eltern kooperieren, Nachsorge implementiert.',
    (SELECT id FROM users WHERE email = 'k.bremmer@ksz-koeln.de'),
    '2025-03-02 13:00:00+01', '2025-03-02 13:00:00+01';
INSERT INTO dji_positionen (assessment_id, position_code, belege, bewertung_bool)
SELECT a.id, v.code, v.belege, v.bval
FROM dji_assessments a,
     (VALUES
        ('SICH_K1', 'Verletzungsmuster musste ärztlich geklärt werden', TRUE),
        ('SICH_K4', 'Kind verbleibt in Betreuung, Eltern kooperieren', FALSE),
        ('SICH_K5', 'Keine Hinweise auf Hilfeverweigerung, Schutzplan umgesetzt', FALSE)
     ) AS v(code, belege, bval)
WHERE a.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-S-2025-017')
  AND a.form_typ = 'SICHERHEITSEINSCHAETZUNG';
-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4c: MELDEBOEGEN
-- ═══════════════════════════════════════════════════════════════════════════

-- MB-1: Nika Darwish / KSZ-S-2025-011
INSERT INTO meldeboegen
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     eingangsdatum, erfassende_fachkraft,
     meldungart, melder_name, melder_kontakt, melder_beziehung_kind, melder_glaubwuerdigkeit,
     schilderung, kind_aktueller_aufenthalt,
     belastung_koerperl_erkrankung, belastung_psych_erkrankung, belastung_sucht,
     belastung_haeusliche_gewalt, belastung_suizidgefahr, belastung_gewalttaetige_erz,
     belastung_soziale_isolation, belastung_sonstiges,
     ersteinschaetzung, handlungsdringlichkeit, ersteinschaetzung_freitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-S-2025-011'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
    '2025-01-13', 'Julia Neumann',
    'PERSOENLICH',
    'Anonyme Nachbarin',
    'Nicht genannt – Briefkastenmeldung',
    'Nachbarin',
    'GUT',
    'Nachbarin meldet, dass Mutter häufig alkoholisiert sei und Kind nachts allein lasse.',
    'Wohnung Helmholtzstraße 13, Köln; tagsüber KiTa Sonnenschein.',
    FALSE, FALSE, TRUE,
    FALSE, FALSE, FALSE,
    TRUE,
    'Überforderung, keine Nachtaufsicht, Mutter konsumiert Alkohol.',
    'AKUT', 'AKUT_HEUTE',
    'Sofortige ASD-Information und Hausbesuch erforderlich, Versorgung aktuell nicht gesichert.',
    (SELECT id FROM users WHERE email = 'j.neumann@ksz-koeln.de'),
    '2025-01-13 10:30:00+01', '2025-01-13 10:30:00+01';
-- MB-2: Mika Schröder / KSZ-S-2024-014
INSERT INTO meldeboegen
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     eingangsdatum, erfassende_fachkraft,
     meldungart, melder_name, melder_kontakt, melder_beziehung_kind, melder_glaubwuerdigkeit,
     schilderung, kind_aktueller_aufenthalt,
     belastung_koerperl_erkrankung, belastung_psych_erkrankung, belastung_sucht,
     belastung_haeusliche_gewalt, belastung_suizidgefahr, belastung_gewalttaetige_erz,
     belastung_soziale_isolation, belastung_sonstiges,
     ersteinschaetzung, handlungsdringlichkeit, ersteinschaetzung_freitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-S-2024-014'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
    '2024-11-05', 'Katharina Bremmer',
    'TELEFONISCH',
    'Frau Jansen (Schulsozialarbeiterin)',
    'GGS Ehrenfeld, Tel. 0221 221-27044',
    'Schule',
    'GUT',
    'Mika erscheint häufig hungrig und ohne Materialien, Mutter wirkt erschöpft.',
    'Wohnung Subbelrather Straße 301, tagsüber Schule/KiTa.',
    FALSE, FALSE, FALSE,
    FALSE, FALSE, FALSE,
    TRUE,
    'Alleinerziehende Mutter ohne Netz, Vater nur sporadisch präsent.',
    'CHRONISCH', 'INNERHALB_WOCHE',
    'Familie benötigt zeitnahe SPFh und Lernförderung.',
    (SELECT id FROM users WHERE email = 'k.bremmer@ksz-koeln.de'),
    '2024-11-05 12:00:00+01', '2024-11-05 12:00:00+01';
-- MB-3: Elena Paredes / KSZ-R-2025-021
INSERT INTO meldeboegen
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     eingangsdatum, erfassende_fachkraft,
     meldungart, melder_name, melder_kontakt, melder_beziehung_kind, melder_glaubwuerdigkeit,
     schilderung, kind_aktueller_aufenthalt,
     belastung_koerperl_erkrankung, belastung_psych_erkrankung, belastung_sucht,
     belastung_haeusliche_gewalt, belastung_suizidgefahr, belastung_gewalttaetige_erz,
     belastung_soziale_isolation, belastung_sonstiges,
     ersteinschaetzung, handlungsdringlichkeit, ersteinschaetzung_freitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-R-2025-021'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Regenbogen' AND type = 'EINRICHTUNG'),
    '2025-02-03', 'Nadine Schreiber',
    'PERSOENLICH',
    'Elena Paredes (Kind)',
    'KiTa Regenbogen – Gespräch in kindgerechtem Setting',
    'Kind',
    'GUT',
    'Kind berichtet von sexualisierten Handlungen durch „Onkel Luis“.',
    'Bereitschaftspflege Köln, bis weitere Abklärung erfolgt.',
    FALSE, TRUE, FALSE,
    TRUE, FALSE, TRUE,
    TRUE,
    'Familie ohne erweitertes Netzwerk, Täter aus Bekanntenkreis.',
    'AKUT', 'AKUT_HEUTE',
    'Unverzügliche Inobhutnahme und polizeiliche Einschaltung durchgeführt.',
    (SELECT id FROM users WHERE email = 'n.schreiber@ksz-koeln.de'),
    '2025-02-03 16:30:00+01', '2025-02-03 16:30:00+01';
-- MB-4: Tariq Mansour / KSZ-R-2024-019
INSERT INTO meldeboegen
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     eingangsdatum, erfassende_fachkraft,
     meldungart, melder_name, melder_kontakt, melder_beziehung_kind, melder_glaubwuerdigkeit,
     schilderung, kind_aktueller_aufenthalt,
     belastung_koerperl_erkrankung, belastung_psych_erkrankung, belastung_sucht,
     belastung_haeusliche_gewalt, belastung_suizidgefahr, belastung_gewalttaetige_erz,
     belastung_soziale_isolation, belastung_sonstiges,
     ersteinschaetzung, handlungsdringlichkeit, ersteinschaetzung_freitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-R-2024-019'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Regenbogen' AND type = 'EINRICHTUNG'),
    '2024-09-18', 'Petra Kleinschmidt',
    'PERSOENLICH',
    'Fachkraft Petra Kleinschmidt',
    'KiTa Regenbogen, Tel. 0221 9200201',
    'Einrichtungsleitung',
    'GUT',
    'Tariq bringt täglich Geschwister mit, Vater schläft nach Nachtschicht – Kind wirkt überlastet.',
    'Berliner Straße 12, Köln – Kinder tagsüber in KiTa/Schule.',
    FALSE, FALSE, FALSE,
    FALSE, FALSE, FALSE,
    TRUE,
    'Kein familiäres Netzwerk vor Ort, Vater alleinverantwortlich.',
    'CHRONISCH', 'INNERHALB_WOCHE',
    'SPFh und Hortplatz zwingend erforderlich, um Parentifizierung zu stoppen.',
    (SELECT id FROM users WHERE email = 'p.kleinschmidt@ksz-koeln.de'),
    '2024-09-18 09:00:00+02', '2024-09-18 09:00:00+02';
-- MB-5: Lena Vogt / KSZ-S-2025-017
INSERT INTO meldeboegen
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     eingangsdatum, erfassende_fachkraft,
     meldungart, melder_name, melder_kontakt, melder_beziehung_kind, melder_glaubwuerdigkeit,
     schilderung, kind_aktueller_aufenthalt,
     belastung_koerperl_erkrankung, belastung_psych_erkrankung, belastung_sucht,
     belastung_haeusliche_gewalt, belastung_suizidgefahr, belastung_gewalttaetige_erz,
     belastung_soziale_isolation, belastung_sonstiges,
     ersteinschaetzung, handlungsdringlichkeit, ersteinschaetzung_freitext,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen = 'KSZ-S-2025-017'),
    (SELECT id FROM traeger WHERE slug = 'demo-traeger'),
    (SELECT id FROM org_units WHERE name = 'KiTa Sonnenschein' AND type = 'EINRICHTUNG'),
    '2025-03-01', 'Katharina Bremmer',
    'PERSOENLICH',
    'Dr. Werner (Kinderarzt)',
    'Praxis Dr. Werner, Tel. 0221 554400',
    'Kinderarzt',
    'GUT',
    'Brandverletzung an rechter Hand, Eltern erklären Unfall durch umgefallene Teekanne.',
    'Wohnung Aachener Straße 210, Köln; Kind besucht KiTa Sonnenschein.',
    FALSE, FALSE, FALSE,
    FALSE, FALSE, FALSE,
    FALSE,
    'Familie gut vernetzt, beide Eltern anwesend.',
    'AKUT', 'INNERHALB_24H',
    'Medizinische Abklärung und Nachsorge sicherstellen, Dokumentationspflicht erfüllen.',
    (SELECT id FROM users WHERE email = 'k.bremmer@ksz-koeln.de'),
    '2025-03-01 11:00:00+01', '2025-03-01 11:00:00+01';
-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4d: SCHUTZPLAENE + MASSNAHMEN
-- ═══════════════════════════════════════════════════════════════════════════

-- Schutzplan Nika Darwish
INSERT INTO schutzplaene
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     erstellt_am, gueltig_bis, status, vereinbarungen, beteiligte,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-S-2025-011'),
    (SELECT id FROM traeger WHERE slug='demo-traeger'),
    (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
    '2025-01-25', '2025-06-30', 'ABGESCHLOSSEN',
    'Mutter nimmt Alkoholtherapie wahr, Großmutter übernimmt Nachtdienste, wöchentliche SPFh-Besuche.',
    'Mutter Leila, Großmutter, ASD, KiTa, Familienhilfe',
    (SELECT id FROM users WHERE email='j.neumann@ksz-koeln.de'),
    '2025-01-25 09:00:00+01', '2025-02-28 16:00:00+01';
INSERT INTO schutzplan_massnahmen
    (schutzplan_id, position, massnahme, verantwortlich, bis_datum, status)
SELECT sp.id, v.pos, v.massnahme, v.verantwortlich, v.bis, v.status
FROM schutzplaene sp,
     (VALUES
        (1, 'Alkoholtherapie bei Caritas Köln fortführen', 'Leila Darwish', DATE '2025-01-31', 'IN_UMSETZUNG'),
        (2, 'Nachtdienste rotierend durch Großmutter koordinieren', 'Großmutter Ingrid', DATE '2025-02-05', 'ABGESCHLOSSEN'),
        (3, 'SPFh dokumentiert jede Woche den Versorgungsstand', 'Familienhilfe AWO', DATE '2025-02-28', 'ABGESCHLOSSEN')
     ) AS v(pos, massnahme, verantwortlich, bis, status)
WHERE sp.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-S-2025-011');
-- Schutzplan Mika Schröder
INSERT INTO schutzplaene
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     erstellt_am, gueltig_bis, status, vereinbarungen, beteiligte,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-S-2024-014'),
    (SELECT id FROM traeger WHERE slug='demo-traeger'),
    (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
    '2024-11-12', '2025-04-30', 'ABGESCHLOSSEN',
    'Großmutter übernimmt Frühstück und Hausaufgaben, Mutter erhält Wochenplan von SPFh.',
    'Mutter Anna, Großmutter Ingrid, SPFh, KiTa',
    (SELECT id FROM users WHERE email='k.bremmer@ksz-koeln.de'),
    '2024-11-12 10:00:00+01', '2025-01-15 15:00:00+01';
INSERT INTO schutzplan_massnahmen
    (schutzplan_id, position, massnahme, verantwortlich, bis_datum, status)
SELECT sp.id, v.pos, v.massnahme, v.verantwortlich, v.bis, v.status
FROM schutzplaene sp,
     (VALUES
        (1, 'Frühstücksplan in Küche aushängen und abhaken', 'Großmutter Ingrid', DATE '2024-11-15', 'ABGESCHLOSSEN'),
        (2, 'Lernförderung 2x pro Woche organisieren', 'Schulsozialarbeit / Einrichtung', DATE '2024-12-01', 'ABGESCHLOSSEN'),
        (3, 'Mutter nimmt Entlastungsberatung wahr', 'Anna Schröder', DATE '2024-12-20', 'IN_UMSETZUNG')
     ) AS v(pos, massnahme, verantwortlich, bis, status)
WHERE sp.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-S-2024-014');
-- Schutzplan Elena Paredes
INSERT INTO schutzplaene
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     erstellt_am, gueltig_bis, status, vereinbarungen, beteiligte,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-R-2025-021'),
    (SELECT id FROM traeger WHERE slug='demo-traeger'),
    (SELECT id FROM org_units WHERE name='KiTa Regenbogen' AND type='EINRICHTUNG'),
    '2025-02-06', '2025-08-31', 'ABGESCHLOSSEN',
    'Kontaktverbot, Traumaambulanz, Pflegefamilie informiert, Polizei und ASD tauschen wöchentlich Infos aus.',
    'Eltern, Pflegefamilie, ASD, Polizei, KiTa',
    (SELECT id FROM users WHERE email='n.schreiber@ksz-koeln.de'),
    '2025-02-06 11:00:00+01', '2025-03-10 10:30:00+01';
INSERT INTO schutzplan_massnahmen
    (schutzplan_id, position, massnahme, verantwortlich, bis_datum, status)
SELECT sp.id, v.pos, v.massnahme, v.verantwortlich, v.bis, v.status
FROM schutzplaene sp,
     (VALUES
        (1, 'Kontaktverbot schriftlich fixieren und überprüfen', 'ASD Köln', DATE '2025-02-07', 'ABGESCHLOSSEN'),
        (2, 'Traumatherapieplätze sichern', 'Traumaambulanz Köln', DATE '2025-02-15', 'IN_UMSETZUNG'),
        (3, 'Pflegefamilie erhält wöchentlichen Fachberatungstermin', 'Pflegekinderdienst', DATE '2025-03-05', 'ABGESCHLOSSEN')
     ) AS v(pos, massnahme, verantwortlich, bis, status)
WHERE sp.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-R-2025-021');
-- Schutzplan Tariq Mansour
INSERT INTO schutzplaene
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     erstellt_am, gueltig_bis, status, vereinbarungen, beteiligte,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-R-2024-019'),
    (SELECT id FROM traeger WHERE slug='demo-traeger'),
    (SELECT id FROM org_units WHERE name='KiTa Regenbogen' AND type='EINRICHTUNG'),
    '2024-09-25', '2025-05-31', 'ABGESCHLOSSEN',
    'Vater erhält Wochenplan, Hortplatz und Nachtbereitschaft durch Tante Farah.',
    'Vater Samir, Tante Farah, SPFh, KiTa',
    (SELECT id FROM users WHERE email='n.schreiber@ksz-koeln.de'),
    '2024-09-25 12:00:00+02', '2025-02-20 12:00:00+01';
INSERT INTO schutzplan_massnahmen
    (schutzplan_id, position, massnahme, verantwortlich, bis_datum, status)
SELECT sp.id, v.pos, v.massnahme, v.verantwortlich, v.bis, v.status
FROM schutzplaene sp,
     (VALUES
        (1, 'Hortplatz sichern und Eingewöhnung begleiten', 'SPFh AWO', DATE '2024-10-15', 'ABGESCHLOSSEN'),
        (2, 'Tante übernimmt zwei Nachmittage pro Woche', 'Farah Mansour', DATE '2024-10-01', 'IN_UMSETZUNG'),
        (3, 'Vater dokumentiert Tagesplan auf Whiteboard', 'Samir Mansour', DATE '2024-10-05', 'ABGESCHLOSSEN')
     ) AS v(pos, massnahme, verantwortlich, bis, status)
WHERE sp.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-R-2024-019');
-- Schutzplan Lena Vogt
INSERT INTO schutzplaene
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     erstellt_am, gueltig_bis, status, vereinbarungen, beteiligte,
     created_by_user_id, created_at, updated_at)
SELECT
    (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-S-2025-017'),
    (SELECT id FROM traeger WHERE slug='demo-traeger'),
    (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
    '2025-03-03', '2025-07-31', 'ABGESCHLOSSEN',
    'Eltern führen Brandschutztraining durch, KiTa dokumentiert Verletzungskontrolle.',
    'Eltern Claudia & Robert, Kinderarzt, KiTa',
    (SELECT id FROM users WHERE email='k.bremmer@ksz-koeln.de'),
    '2025-03-03 09:00:00+01', '2025-03-12 13:00:00+01';
INSERT INTO schutzplan_massnahmen
    (schutzplan_id, position, massnahme, verantwortlich, bis_datum, status)
SELECT sp.id, v.pos, v.massnahme, v.verantwortlich, v.bis, v.status
FROM schutzplaene sp,
     (VALUES
        (1, 'Brandschutzschulung KiTa/Eltern organisieren', 'Katharina Bremmer', DATE '2025-03-05', 'ABGESCHLOSSEN'),
        (2, 'Kinderarzt kontrolliert Wunde im 3-Tage-Rhythmus', 'Dr. Werner', DATE '2025-03-06', 'ABGESCHLOSSEN'),
        (3, 'Eltern dokumentieren Heißgetränke-Regeln sichtbar in Küche', 'Familie Vogt', DATE '2025-03-04', 'IN_UMSETZUNG')
     ) AS v(pos, massnahme, verantwortlich, bis, status)
WHERE sp.falloeffnung_id = (SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-S-2025-017');
-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4e: HAUSBESUCHE
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO hausbesuche
    (falloeffnung_id, traeger_id, einrichtung_org_unit_id,
     besuchsdatum, besuchszeit_von, besuchszeit_bis, anwesende,
     whg_ordnung, whg_hygiene, whg_nahrungsversorgung, whg_unfallgefahren, whg_sonstiges,
     kind_erscheinungsbild, kind_verhalten, kind_stimmung, kind_aeusserungen, kind_hinweise_gefaehrdung,
     bp_erscheinungsbild, bp_verhalten, bp_umgang_kind, bp_kooperation,
     einschaetzung_ampel, einschaetzung_text, naechste_schritte, naechster_termin,
     created_by_user_id, created_at, updated_at)
VALUES
((SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-S-2025-011'),
 (SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
 '2025-01-18', '09:00', '10:15',
 'Leila Darwish, Nika Darwish, Julia Neumann, ASD Frau Hahn',
 'MANGELHAFT', 'MANGELHAFT', 'AUSREICHEND',
 'Putzmittel offen, Balkon ohne Sicherung',
 'Kühlschrank fast leer, Thermoskanne mit altem Tee',
 'Nika ungekämmte Haare, Augenringe, Kleidung sauber aber dünn.',
 'Zurückhaltend, sucht Körperkontakt zur Fachkraft.',
 'AENGSTLICH', '"Ich habe gestern Cornflakes ohne Milch gegessen."',
 'Kind berichtet, dass Mutter schläft, wenn sie Hunger hat.',
 'Mutter ungepflegt, alkoholgeruch.',
 'Wirkt erschöpft, weicht Blickkontakt aus.',
 'Kind wird freundlich angesprochen, aber wenig Struktur.',
 'KOOPERATIV',
 'GELB', 'Lage verbessert sich erst nach Umsetzung des Schutzplans.',
 'Alkoholtherapie starten, Lebensmittelgutscheine, tägliche Check-in-Anrufe.', '2025-01-25',
 (SELECT id FROM users WHERE email='j.neumann@ksz-koeln.de'),
 now(), now()),
((SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-S-2024-014'),
 (SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
 '2024-11-20', '16:00', '17:10',
 'Anna Schröder, Mika Schröder, Großmutter Ingrid, SPFh Herr Czajka',
 'AUSREICHEND', 'GUT', 'GUT',
 'Keine akuten Gefahren, Steckdosen gesichert',
 'Gemeinschaftsplaner an Wand, Vorräte aufgefüllt',
 'Mika frisch geduscht, Kleidung ordentlich.',
 'Redet mehr, zeigt Hausaufgaben.',
 'ZUVERSICHTLICH', '"Oma macht morgens Frühstück, Mama schläft danach noch."',
 'Keine Hinweise',
 'Mutter müde aber freundlich.',
 'Wirkt bemüht, lässt Großmutter Aufgaben übernehmen.',
 'Liebevoll, bittet Mika um Hilfe beim Tischdecken.',
 'KOOPERATIV',
 'GRUEN', 'Schutzplan greift, Familienentlastung sichtbar.',
 'Fortsetzung SPFh, Lerntherapie organisieren.', '2025-01-05',
 (SELECT id FROM users WHERE email='k.bremmer@ksz-koeln.de'),
 now(), now()),
((SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-R-2025-021'),
 (SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Regenbogen' AND type='EINRICHTUNG'),
 '2025-02-12', '14:30', '15:45',
 'Pflegeeltern Familie König, Elena Paredes, Nadine Schreiber, ASD Frau Lutz',
 'SEHR_GUT', 'SEHR_GUT', 'GUT',
 'Keine Gefahren erkannt',
 'Pflegefamilie erstellt Sicherheitsregeln sichtbar',
 'Elena sauber gekleidet, leichte Kratzer abgeheilt.',
 'Vorsichtig, aber lacht beim Spielen mit Pflegebruder.',
 'WECHSELHAFT', '"Ich darf Onkel Luis nicht sehen. Das ist gut."',
 'Keine aktuellen Gefährdungshinweise, Kind benennt Sicherheit.',
 'Pflegeeltern sehr strukturiert.',
 'Ruhig, wertschätzend.',
 'Empathisch, erklärt Regeln altersgerecht.',
 'KOOPERATIV',
 'GELB', 'Sicherheit aktuell gewährleistet, Traumaarbeit nötig.',
 'Traumatherapie starten, Gerichtstermin begleiten.', '2025-02-26',
 (SELECT id FROM users WHERE email='n.schreiber@ksz-koeln.de'),
 now(), now()),
((SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-R-2024-019'),
 (SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Regenbogen' AND type='EINRICHTUNG'),
 '2024-10-10', '07:15', '08:20',
 'Samir Mansour, Tariq Mansour, Geschwister, Tante Farah, SPFh Frau Sommer',
 'AUSREICHEND', 'AUSREICHEND', 'AUSREICHEND',
 'Küche unaufgeräumt, Stolperfallen Spielzeug',
 'Tagesplan am Kühlschrank, Hortvertrag unterschrieben',
 'Tariq trägt saubere Kleidung, leichte Augenringe.',
 'Hilft Geschwister anziehen, wirkt routiniert.',
 'NEUTRAL', '"Ich mache das schnell, Papa muss gleich schlafen."',
 'Übernahme Erwachsenentätigkeiten weiterhin sichtbar.',
 'Vater gepflegt, aber sehr müde.',
 'Wirkt dankbar für Unterstützung, stellt Fragen.',
 'Warmherzig, bittet Tariq um Pause.',
 'KOOPERATIV',
 'GELB', 'Struktur im Aufbau, Monitoring weiter nötig.',
 'Hortstart begleiten, Tante in SPFh einbinden.', '2024-11-05',
 (SELECT id FROM users WHERE email='p.kleinschmidt@ksz-koeln.de'),
 now(), now()),
((SELECT id FROM falloeffnungen WHERE aktenzeichen='KSZ-S-2025-017'),
 (SELECT id FROM traeger WHERE slug='demo-traeger'),
 (SELECT id FROM org_units WHERE name='KiTa Sonnenschein' AND type='EINRICHTUNG'),
 '2025-03-04', '08:30', '09:20',
 'Claudia und Robert Vogt, Lena Vogt, Katharina Bremmer',
 'GUT', 'GUT', 'GUT',
 'Heißgetränke stehen nun außerhalb der Reichweite',
 'Brandschutzhinweise laminiert an Küchenschrank',
 'Lena wirkt entspannt, Verband sauber.',
 'Spielt mit Bauklötzen, sucht Blickkontakt.',
 'FRÖHLICH', '"Ich darf beim Tee pusten."',
 'Keine Hinweise auf Gefährdung, Eltern erklären neue Regeln.',
 'Eltern gepflegt.',
 'Offen, zeigen die neue Kannenposition.',
 'Zugetan, loben Lena fürs Vorsichtsein.',
 'KOOPERATIV',
 'GRUEN', 'Gefährdung ausgeräumt, Dokumentation abgeschlossen.',
 'Verbandkontrollen weiter dokumentieren.', '2025-03-10',
 (SELECT id FROM users WHERE email='k.bremmer@ksz-koeln.de'),
 now(), now());
-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4f: SEQUENZ-BACKFILLS
-- ═══════════════════════════════════════════════════════════════════════════
-- ON CONFLICT DO UPDATE stellt sicher, dass die Sequenzen nach den INSERTs
-- der Demo-Daten korrekt gesetzt sind (ueberschreibt das DO NOTHING aus V039/V040).

-- dossier_fallno_seq: next_value = max(fall_no)+1 pro Demo-Dossier
INSERT INTO dossier_fallno_seq (dossier_id, next_value)
SELECT
    d.id,
    COALESCE(MAX(f.fall_no), 0) + 1
FROM kind_dossiers d
LEFT JOIN falloeffnungen f ON f.dossier_id = d.id
WHERE d.kind_id IN (
    SELECT id FROM kinder WHERE traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger')
)
GROUP BY d.id
ON CONFLICT (dossier_id) DO UPDATE SET next_value = EXCLUDED.next_value;

-- fall_meldung_version_seq: next_value = max(version_no)+1 pro Demo-Fallöffnung
INSERT INTO fall_meldung_version_seq (falloeffnung_id, next_value)
SELECT
    f.id,
    COALESCE(MAX(m.version_no), 0) + 1
FROM falloeffnungen f
LEFT JOIN meldungen m ON m.falloeffnung_id = f.id
WHERE f.traeger_id = (SELECT id FROM traeger WHERE slug = 'demo-traeger')
GROUP BY f.id
ON CONFLICT (falloeffnung_id) DO UPDATE SET next_value = EXCLUDED.next_value;

-- Klassische Sequenzen (Serial) auf die aktuellen MAX(id)-Werte der Demo-Welt synchronisieren
DO $$
DECLARE
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'traeger',
        'org_units',
        'users',
        'org_unit_memberships',
        'kinder',
        'bezugspersonen',
        'kind_bezugspersonen',
        'kind_dossiers',
        'falloeffnungen',
        'meldungen',
        'meldung_observations',
        'meldung_contacts',
        'meldung_extern',
        'kinderschutzbogen_assessments',
        'kinderschutzbogen_bewertungen',
        'dji_assessments',
        'dji_positionen',
        'meldeboegen',
        'schutzplaene',
        'schutzplan_massnahmen',
        'hausbesuche'
    ] LOOP
        EXECUTE format(
            'SELECT setval(pg_get_serial_sequence(''%s'',''id''), COALESCE((SELECT MAX(id) FROM %s), 1), true);',
            tbl, tbl
        );
    END LOOP;
END $$;

