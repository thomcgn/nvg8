-- V2__seed_kws_base.sql
-- Minimaler KWS Seed, damit V3 (AH-3-01b, A01, N01) sicher läuft.

INSERT INTO public.kws_template (active, min_age_months, max_age_months, code, audience, title, version)
VALUES (true, 0, 216, 'AH-3-01b', 'ALL', 'Basisprüfung (Demo)', '1.0')
ON CONFLICT (code) DO UPDATE
    SET active = EXCLUDED.active,
        min_age_months = EXCLUDED.min_age_months,
        max_age_months = EXCLUDED.max_age_months,
        audience = EXCLUDED.audience,
        title = EXCLUDED.title,
        version = EXCLUDED.version;

WITH tpl AS (
    SELECT id FROM public.kws_template WHERE code = 'AH-3-01b'
)
INSERT INTO public.kws_template_section (template_id, section_key, title, sort)
SELECT tpl.id, 'A', 'Allgemein', 1 FROM tpl
ON CONFLICT DO NOTHING;

WITH sec AS (
    SELECT s.id
    FROM public.kws_template_section s
             JOIN public.kws_template t ON t.id = s.template_id
    WHERE t.code = 'AH-3-01b' AND s.section_key = 'A'
)
INSERT INTO public.kws_template_item (section_id, answer_type, item_key, label, sort)
SELECT sec.id, 'TRI_STATE', 'A01', 'Beispiel Item A01', 1 FROM sec
ON CONFLICT DO NOTHING;

WITH sec AS (
    SELECT s.id
    FROM public.kws_template_section s
             JOIN public.kws_template t ON t.id = s.template_id
    WHERE t.code = 'AH-3-01b' AND s.section_key = 'A'
)
INSERT INTO public.kws_template_item (section_id, answer_type, item_key, label, sort)
SELECT sec.id, 'TEXT', 'N01', 'Beispiel Notiz N01', 2 FROM sec
ON CONFLICT DO NOTHING;