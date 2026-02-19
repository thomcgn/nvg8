-- V2__seed_kws_base.sql
-- Minimal aber sinnvoll: 1 Template (AH-3-01b) + Sections + Items

INSERT INTO public.kws_template (code, version, title, audience, active, min_age_months, max_age_months, created_at)
VALUES
    ('AH-3-01b', '2026-01', 'Mögliche Hinweise / Gewichtige Anhaltspunkte – Kindeswohlgefährdung (AH-3-01b)', 'ALL', true, 12, 35, now())
ON CONFLICT (code) DO NOTHING;

-- Sections
WITH t AS (
    SELECT id FROM public.kws_template WHERE code = 'AH-3-01b'
)
INSERT INTO public.kws_template_section (template_id, section_key, title, sort)
SELECT t.id, s.section_key, s.title, s.sort
FROM t
         JOIN (VALUES
                   ('allgemein', 'Allgemeine Hinweise', 10),
                   ('eltern', 'Eltern / Bezugspersonen', 20),
                   ('kind', 'Kindbezogene Hinweise', 30),
                   ('umfeld', 'Umfeld / Lebenslage', 40)
) AS s(section_key, title, sort) ON true
ON CONFLICT DO NOTHING;

-- Items
WITH sec AS (
    SELECT id, section_key
    FROM public.kws_template_section
    WHERE template_id = (SELECT id FROM public.kws_template WHERE code = 'AH-3-01b')
)
INSERT INTO public.kws_template_item (section_id, item_key, label, answer_type, sort)
SELECT sec.id, i.item_key, i.label, i.answer_type, i.sort
FROM sec
         JOIN (VALUES
                   ('allgemein','A01','Es gibt Hinweise auf akute Gefährdung (z.B. Verletzungen, Gewaltvorfälle).','TRI_STATE',10),
                   ('allgemein','A02','Es bestehen wiederholte Auffälligkeiten / Eskalationen im Verlauf.','TRI_STATE',20),
                   ('eltern','E01','Überforderung / fehlende Fürsorge erkennbar.','TRI_STATE',10),
                   ('eltern','E02','Substanzkonsum im Haushalt wirkt sich negativ aus.','TRI_STATE',20),
                   ('kind','K01','Kind wirkt verängstigt / zurückgezogen / auffällig belastet.','TRI_STATE',10),
                   ('kind','K02','Kind berichtet selbst von Gewalt / Missbrauch / Vernachlässigung.','TRI_STATE',20),
                   ('umfeld','U01','Instabile Wohn-/Lebenssituation (z.B. häufige Umzüge, Obdachlosigkeit).','TRI_STATE',10),
                   ('umfeld','U02','Keine verlässlichen Unterstützungsnetzwerke vorhanden.','TRI_STATE',20),
                   ('allgemein','N01','Freitext Notizen / Kontext','TEXT',999)
) AS i(section_key, item_key, label, answer_type, sort)
              ON i.section_key = sec.section_key
ON CONFLICT DO NOTHING;
