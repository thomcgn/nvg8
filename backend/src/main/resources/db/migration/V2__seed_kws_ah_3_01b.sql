-- V2__seed_kws_ah_3_01b.sql
-- AH-3-01b: Checkliste zur Beobachtung und Dokumentation (1 bis unter 3 Jahre)

-- =====================================================
-- 1) Template Upsert
-- =====================================================

INSERT INTO kws_template (code, title, version, min_age_months, max_age_months, audience, active)
VALUES (
           'AH-3-01b',
           'Mögliche Hinweise / Gewichtige Anhaltspunkte – Kindeswohlgefährdung – Checkliste zur Beobachtung und Dokumentation (1 bis unter 3 Jahre) – ArbeitsHilfe AH-3-01b',
           '2026-01',
           12,
           35,
           'ALL',
           true
       )
ON CONFLICT (code) DO UPDATE
    SET title = EXCLUDED.title,
        version = EXCLUDED.version,
        min_age_months = EXCLUDED.min_age_months,
        max_age_months = EXCLUDED.max_age_months,
        audience = EXCLUDED.audience,
        active = EXCLUDED.active;


-- =====================================================
-- 2) Sections Upsert
-- =====================================================

INSERT INTO kws_template_section (template_id, section_key, title, sort)
SELECT t.id, v.section_key, v.title, v.sort
FROM kws_template t,
     (VALUES
          ('2','Äußeres Erscheinungsbild des Kleinkindes',20),
          ('3','Verhalten des Kleinkindes',30),
          ('4','Äußeres Erscheinungsbild der Erziehungspersonen',40),
          ('5','Verhalten Erziehungspersonen',50),
          ('6','Familiäre Situation / Risiko-Faktoren',60),
          ('7','Wohnsituation: Geeigneter Wach- und Schlafplatz',70),
          ('8','Zusätzliche Beschreibungen / Anmerkungen / Ergänzungen',80)
     ) AS v(section_key,title,sort)
WHERE t.code = 'AH-3-01b'
ON CONFLICT (template_id, section_key)
    DO UPDATE SET title = EXCLUDED.title;


-- =====================================================
-- 3) ITEMS – SECTION 2
-- =====================================================

INSERT INTO kws_template_item (section_id, item_key, label, answer_type, sort)
SELECT s.id, x.item_key, x.label, x.answer_type, x.sort
FROM kws_template_section s
         JOIN kws_template t ON s.template_id = t.id
         JOIN LATERAL (VALUES
                           ('2.1.1','Trifft man das Kind ständig in durchnässten Windeln an?','TRI_STATE',2101),
                           ('2.1.2','Finden sich regelmäßig Dreck- und Stuhlreste?','TRI_STATE',2102),
                           ('2.1.3','Fällt das Kind ständig durch üblen Körpergeruch auf?','TRI_STATE',2103),
                           ('2.1.4','Hat das Kind ständig ein auffälliges Hautbild?','TRI_STATE',2104),
                           ('2.6','Anmerkungen / Ergänzungen zu Abschnitt 2','TEXT',2699)
    ) AS x(item_key,label,answer_type,sort) ON true
WHERE t.code = 'AH-3-01b'
  AND s.section_key = '2'
ON CONFLICT (section_id, item_key)
    DO NOTHING;


-- =====================================================
-- 4) ITEMS – SECTION 3
-- =====================================================

INSERT INTO kws_template_item (section_id, item_key, label, answer_type, sort)
SELECT s.id, x.item_key, x.label, x.answer_type, x.sort
FROM kws_template_section s
         JOIN kws_template t ON s.template_id = t.id
         JOIN LATERAL (VALUES
                           ('3.1.1','Deutlich altersunangemessener Entwicklungsstand?','TRI_STATE',3101),
                           ('3.2.1','Auffallend zurückgezogen/teilnahmslos?','TRI_STATE',3201),
                           ('3.3','Anmerkungen / Ergänzungen zu Abschnitt 3','TEXT',3399)
    ) AS x(item_key,label,answer_type,sort) ON true
WHERE t.code = 'AH-3-01b'
  AND s.section_key = '3'
ON CONFLICT (section_id, item_key)
    DO NOTHING;


-- =====================================================
-- 5) ITEMS – SECTION 4
-- =====================================================

INSERT INTO kws_template_item (section_id, item_key, label, answer_type, sort)
SELECT s.id, x.item_key, x.label, x.answer_type, x.sort
FROM kws_template_section s
         JOIN kws_template t ON s.template_id = t.id
         JOIN LATERAL (VALUES
                           ('4.1','Fehlende oder erschwerte Ansprechbarkeit?','TRI_STATE',4101),
                           ('4.6','Anmerkungen / Ergänzungen zu Abschnitt 4','TEXT',4699)
    ) AS x(item_key,label,answer_type,sort) ON true
WHERE t.code = 'AH-3-01b'
  AND s.section_key = '4'
ON CONFLICT (section_id, item_key)
    DO NOTHING;


-- =====================================================
-- 6) ITEMS – SECTION 5
-- =====================================================

INSERT INTO kws_template_item (section_id, item_key, label, answer_type, sort)
SELECT s.id, x.item_key, x.label, x.answer_type, x.sort
FROM kws_template_section s
         JOIN kws_template t ON s.template_id = t.id
         JOIN LATERAL (VALUES
                           ('5.1.1','Altersgerechter Kontakt und Ansprache?','TRI_STATE',5101),
                           ('5.4.1','Körperliche Gewalt (Verdachtsmomente)?','TRI_STATE',5401),
                           ('5.8','Anmerkungen / Ergänzungen zu Abschnitt 5','TEXT',5899)
    ) AS x(item_key,label,answer_type,sort) ON true
WHERE t.code = 'AH-3-01b'
  AND s.section_key = '5'
ON CONFLICT (section_id, item_key)
    DO NOTHING;


-- =====================================================
-- 7) ITEMS – SECTION 6
-- =====================================================

INSERT INTO kws_template_item (section_id, item_key, label, answer_type, sort)
SELECT s.id, x.item_key, x.label, x.answer_type, x.sort
FROM kws_template_section s
         JOIN kws_template t ON s.template_id = t.id
         JOIN LATERAL (VALUES
                           ('6.1.1','Selbst erlebte Beziehungsabbrüche?','TRI_STATE',6101),
                           ('6.5','Anmerkungen / Ergänzungen zu Abschnitt 6','TEXT',6599)
    ) AS x(item_key,label,answer_type,sort) ON true
WHERE t.code = 'AH-3-01b'
  AND s.section_key = '6'
ON CONFLICT (section_id, item_key)
    DO NOTHING;


-- =====================================================
-- 8) ITEMS – SECTION 7
-- =====================================================

INSERT INTO kws_template_item (section_id, item_key, label, answer_type, sort)
SELECT s.id, x.item_key, x.label, x.answer_type, x.sort
FROM kws_template_section s
         JOIN kws_template t ON s.template_id = t.id
         JOIN LATERAL (VALUES
                           ('7.1.1','Wohnräume tagsüber stark abgedunkelt?','TRI_STATE',7101),
                           ('7.1.13','Anmerkungen / Ergänzungen zu Abschnitt 7','TEXT',7199)
    ) AS x(item_key,label,answer_type,sort) ON true
WHERE t.code = 'AH-3-01b'
  AND s.section_key = '7'
ON CONFLICT (section_id, item_key)
    DO NOTHING;


-- =====================================================
-- 9) ITEMS – SECTION 8
-- =====================================================

INSERT INTO kws_template_item (section_id, item_key, label, answer_type, sort)
SELECT s.id, x.item_key, x.label, x.answer_type, x.sort
FROM kws_template_section s
         JOIN kws_template t ON s.template_id = t.id
         JOIN LATERAL (VALUES
                           ('8.1','Zusätzliche Beschreibungen / Anmerkungen / Ergänzungen','TEXT',8001)
    ) AS x(item_key,label,answer_type,sort) ON true
WHERE t.code = 'AH-3-01b'
  AND s.section_key = '8'
ON CONFLICT (section_id, item_key)
    DO NOTHING;