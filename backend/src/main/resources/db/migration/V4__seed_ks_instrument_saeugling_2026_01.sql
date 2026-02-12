BEGIN;

-- ============================================================
-- Instrument upsert
-- ============================================================
INSERT INTO ks_instrumente (
    code, titel, typ, version, aktiv,
    min_age_months, max_age_months,
    requires_school_context, requires_kita_context
)
VALUES (
           'DL-0-12M-01',
           'Checkliste / Dokumentationsbogen - Altersgruppe 0 bis unter 12 Monate – Säugling',
           'DOKUBOGEN',
           '2026-01',
           TRUE,
           0, 11,
           FALSE, FALSE
       )
    ON CONFLICT (code, version)
DO UPDATE SET
    titel = EXCLUDED.titel,
           typ = EXCLUDED.typ,
           aktiv = EXCLUDED.aktiv,
           min_age_months = EXCLUDED.min_age_months,
           max_age_months = EXCLUDED.max_age_months,
           requires_school_context = EXCLUDED.requires_school_context,
           requires_kita_context = EXCLUDED.requires_kita_context;

-- ============================================================
-- Sections upsert
-- ============================================================
WITH inst AS (
    SELECT id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
)
INSERT INTO ks_sections (instrument_id, parent_id, section_no, title, order_index, hint_text)
SELECT inst.id, NULL, s.section_no, s.title, s.order_index, s.hint_text
FROM inst
         JOIN (VALUES
                   ('1.0', 'Kontext der Beobachtung und Einschätzung',  1, NULL),

                   ('2.0', 'Äußeres Erscheinungsbild des Säuglings',      2, '(Bitte zutreffende Beschreibungen markieren bzw. unter Anmerkungen ergänzen!)'),
                   ('2.1', 'Ausreichende Körperpflege?',                  3, NULL),
                   ('2.2', 'Schützende Kleidung?',                        4, NULL),
                   ('2.3', 'Altersgemäße Ernährung?',                     5, NULL),
                   ('2.4', 'Medizinische Versorgung / Behandlung?',       6, NULL),
                   ('2.5', 'Besondere körperliche Auffälligkeiten?',      7, NULL),
                   ('2.6', 'Anmerkungen / Ergänzungen',                   8, '(Bitte ID-Nr angeben, falls möglich)'),

                   ('3.0', 'Verhalten des Säuglings',                      9, '(Bitte unzutreffende Beschreibungen durchstreichen und falls notwendig Anmerkungen hinzufügen!)'),
                   ('3.1', 'Lernverhalten',                               10, NULL),
                   ('3.2', 'Soziales Verhalten / Emotionales Verhalten',   11, NULL),
                   ('3.3', 'Anmerkungen / Ergänzungen',                   12, '(Bitte ID-Nr angeben, falls möglich)'),

                   ('4.0', 'Äußeres Erscheinungsbild der Erziehungspersonen', 13,
                    '(Mutter – Vater – Dritte Personen? Bitte unzutreffende Beschreibungen durchstreichen und falls notwendig Anmerkungen hinzufügen!)'),
                   ('4.1', 'Äußeres Erscheinungsbild (Items 4.1 bis 4.5)', 14, NULL),
                   ('4.6', 'Anmerkungen / Ergänzungen',                   15, '(Bitte ID-Nr angeben, falls möglich)'),

                   ('5.0', 'Verhalten Erziehungspersonen',                16,
                    '(Mutter – Vater – Dritte Personen. Bitte unzutreffende Beschreibungen durchstreichen und falls notwendig Anmerkungen hinzufügen!)'),
                   ('5.1', 'Zärtlichkeit, Anerkennung und Bestätigung?',  17, NULL),
                   ('5.2', 'Sicherheit und Geborgenheit?',                18, NULL),
                   ('5.3', 'Schutz vor Gefahren?',                        19, NULL),
                   ('5.4', 'Gewalt gegen das Kind? (familiäres/soziales Umfeld)', 20, NULL),
                   ('5.5', 'Individualität und Selbstbestimmung?',        21, NULL),
                   ('5.6', 'Ansprache / Entwicklungsförderung?',          22, NULL),
                   ('5.7', 'Verlässliche Betreuung?',                     23, NULL),
                   ('5.8', 'Kooperationsbereitschaft der Mutter/des Vaters/weiterer Bezugs- bzw. Pflegepersonen?', 24,
                    '(Bitte unzutreffende Beschreibungen durchstreichen!)'),
                   ('5.9', 'Anmerkungen / Ergänzungen',                   25, '(Bitte ID-Nr angeben, falls möglich)'),

                   ('6.0', 'Familiäre Situation / Risiko-Faktoren',       26,
                    '(Hinweis: Faktoren erhöhen das Risiko der Vernachlässigung. Mehrere Faktoren bedeuten nicht zwangsläufig Vernachlässigung.)'),
                   ('6.1', 'Zur persönlichen Situation der Mutter/des Vaters/weiterer Bezugs- bzw. Pflegepersonen?', 27,
                    '(Bitte unzutreffende Beschreibungen durchstreichen!)'),
                   ('6.2', 'Zur Situation der Familie?',                  28, NULL),
                   ('6.3', 'Wahrnehmung kindlicher Bedürfnisse und Ressourcen durch Mutter/Vater/Pflegeperson?', 29, NULL),
                   ('6.4', 'Erwachsenenkonflikte um das Kind?',           30, NULL),
                   ('6.5', 'Anmerkungen / Ergänzungen',                   31, '(Bitte ID-Nr angeben, falls möglich)'),

                   ('7.0', 'Wohnsituation: Geeigneter Wach- und Schlafplatz?', 32,
                    '(Bitte unzutreffende Beschreibungen durchstreichen und falls notwendig Anmerkungen hinzufügen!)'),
                   ('7.1', 'Geeigneter Wach- und Schlafplatz?',           33, NULL),

                   ('8.1', 'Zusätzliche Beschreibungen / Anmerkungen / Ergänzungen', 34, NULL)
) AS s(section_no, title, order_index, hint_text) ON TRUE
    ON CONFLICT (instrument_id, section_no)
DO UPDATE SET
    title = EXCLUDED.title,
           order_index = EXCLUDED.order_index,
           hint_text = EXCLUDED.hint_text;

-- ============================================================
-- Parent-Hierarchie setzen
-- ============================================================

-- 2.x unter 2.0
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     p AS (
         SELECT s.id AS parent_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='2.0'
     )
UPDATE ks_sections s
SET parent_id = p.parent_id
    FROM inst, p
WHERE s.instrument_id = inst.instrument_id
  AND s.section_no IN ('2.1','2.2','2.3','2.4','2.5','2.6');

-- 3.x unter 3.0
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     p AS (
         SELECT s.id AS parent_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='3.0'
     )
UPDATE ks_sections s
SET parent_id = p.parent_id
    FROM inst, p
WHERE s.instrument_id = inst.instrument_id
  AND s.section_no IN ('3.1','3.2','3.3');

-- 4.x unter 4.0
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     p AS (
         SELECT s.id AS parent_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='4.0'
     )
UPDATE ks_sections s
SET parent_id = p.parent_id
    FROM inst, p
WHERE s.instrument_id = inst.instrument_id
  AND s.section_no IN ('4.1','4.6');

-- 5.x unter 5.0
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     p AS (
         SELECT s.id AS parent_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.0'
     )
UPDATE ks_sections s
SET parent_id = p.parent_id
    FROM inst, p
WHERE s.instrument_id = inst.instrument_id
  AND s.section_no IN ('5.1','5.2','5.3','5.4','5.5','5.6','5.7','5.8','5.9');

-- 6.x unter 6.0
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     p AS (
         SELECT s.id AS parent_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='6.0'
     )
UPDATE ks_sections s
SET parent_id = p.parent_id
    FROM inst, p
WHERE s.instrument_id = inst.instrument_id
  AND s.section_no IN ('6.1','6.2','6.3','6.4','6.5');

-- 7.1 unter 7.0
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     p AS (
         SELECT s.id AS parent_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='7.0'
     )
UPDATE ks_sections s
SET parent_id = p.parent_id
    FROM inst, p
WHERE s.instrument_id = inst.instrument_id
  AND s.section_no IN ('7.1');

-- ============================================================
-- Items upsert (NORMALISIERT: Item-Nr = section_no + ".<laufendeNr>")
-- ============================================================

-- 1.0 Kopfbereich (neutral)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='1.0'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, 'NEUTRAL'
FROM sec
         JOIN (VALUES
                   ('1.0.1', 'Fachkraft (Name, Vorname, Funktion, Einrichtung)', 'USER_REF', 1),
                   ('1.0.2', 'Datum (Zeitpunkt der Einschätzung)', 'DATE', 2),
                   ('1.0.3', 'Anlass', 'TEXT', 3),
                   ('1.0.4', 'Zeitraum der Beobachtung', 'TEXT', 4)
) AS i(item_no, text, answer_type, order_index) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text = EXCLUDED.text,
           answer_type = EXCLUDED.answer_type,
           order_index = EXCLUDED.order_index,
           polarity = EXCLUDED.polarity;

-- 2.1 Körperpflege (RISIKO: Ja=Problem)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='2.1'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, 'RISIKO'
FROM sec
         JOIN (VALUES
                   ('2.1.1','Trifft man das Kind ständig in durchnässten, herabhängenden Windeln an? Sind größere Teile der Hautoberfläche entzündet?',1),
                   ('2.1.2','Finden sich regelmäßig Dreck- und Stuhlreste in den Hautfalten (Genital- und Gesäßbereich)?',2),
                   ('2.1.3','Fällt der Säugling durch üblen Körpergeruch auf?',3),
                   ('2.1.5','Der Säugling wird nicht regelmäßig gebadet und gewaschen?',4),
                   ('2.1.6','Dauerhafter, unbehandelter Ungezieferbefall (z.B. Flöhe, Läuse)?',5)
) AS i(item_no,text,order_index) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 2.2 Kleidung (gemischt)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='2.2'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, i.polarity
FROM sec
         JOIN (VALUES
                   ('2.2.1','Bietet die Kleidung hinreichend Schutz vor Hitze, Sonne, Kälte und Nässe?',1,'SCHUTZ'),
                   ('2.2.2','Ist das Kind der Jahreszeit entsprechend gekleidet oder wird es oft schwitzend oder frierend angetroffen?',2,'RISIKO'),
                   ('2.2.3','Ist die Bewegungsfreiheit des Kindes in seiner Kleidung gewährleistet oder ist es zu eng eingeschnürt, sind Kleidungsstücke zu klein oder viel zu groß?',3,'RISIKO'),
                   ('2.2.4','Keine Schuhe (Socken) oder keine passenden Schuhe (Socken), nicht witterungsgemäß?',4,'RISIKO'),
                   ('2.2.5','Achten Mutter/Vater/Bezugsperson auf regelmäßiges Wechseln der Kleidung / saubere Kleidung?',5,'SCHUTZ')
) AS i(item_no,text,order_index,polarity) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 2.3 Ernährung (SCHUTZ)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='2.3'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, 'SCHUTZ'
FROM sec
         JOIN (VALUES
                   ('2.3.1','Gibt es eine stete Gewichtszunahme (Gewichtskurve im Vorsorgeheft)?',1),
                   ('2.3.2','Reicht die Flüssigkeitsmenge?',2),
                   ('2.3.3','Ist die Ernährung (Essen und Trinken) altersentsprechend und gesund sowie ausreichend und regelmäßig?',3),
                   ('2.3.4','Wird auf Reinigung der Flasche / sauberes Geschirr / saubere Kochgerätschaften (hygienische Mindeststandards) geachtet?',4)
) AS i(item_no,text,order_index) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 2.4 Medizinische Versorgung (gemischt)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='2.4'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, i.polarity
FROM sec
         JOIN (VALUES
                   ('2.4.1','Vorsorgeuntersuchungen werden regelmäßig durchgeführt (U-Heft: U1 bis U6)?',1,'SCHUTZ'),
                   ('2.4.2','Ist das Recht des Kindes auf Vorsorge (z.B. Impfungen) gewährleistet?',2,'SCHUTZ'),
                   ('2.4.3','Werden Krankheiten des Kindes nicht oder zu spät erkannt?',3,'RISIKO'),
                   ('2.4.4','Bei Erkrankungen des Kindes und in Notsituationen erfolgen Arztbesuche?',4,'SCHUTZ'),
                   ('2.4.5','Verschriebene Medikamente werden besorgt und regelmäßig verabreicht?',5,'SCHUTZ'),
                   ('2.4.6','Werden Entwicklungsverzögerungen oder Behinderungen nicht erkannt und/oder unsachgemäß behandelt?',6,'RISIKO'),
                   ('2.4.8','Besteht für das Kind eine Krankenversicherung? Bemühen sich Mutter/Vater darum?',7,'SCHUTZ'),
                   ('2.4.9','Gleichgültigkeit der Mutter/des Vaters und keinerlei Interesse an Gesundheitsfragen um das Kind?',8,'RISIKO')
) AS i(item_no,text,order_index,polarity) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 2.5 Körperliche Auffälligkeiten (gemischt)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='2.5'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity, akut_kriterium)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, i.polarity, i.akut
FROM sec
         JOIN (VALUES
                   ('2.5.1','Früh-, Mangel-, Mehrlingsgeburt?',1,'NEUTRAL',FALSE),
                   ('2.5.2','Chronische Krankheiten, Behinderungen (wenn ja, bitte angeben)?',2,'NEUTRAL',FALSE),
                   ('2.5.3','Krankheitsanfälligkeit / viele Krankenhausaufenthalte oder auffallend wenige Infektionen / seltene Arztbesuche?',3,'NEUTRAL',FALSE),
                   ('2.5.4','Auffällige Hämatome (z.B. am Rücken, Brust, Bauch, Po, geformte Hämatome), Striemen, Mehrfachverletzungen in verschiedenen Heilungsstadien?',4,'RISIKO',TRUE),
                   ('2.5.6','Knochenbrüche, Verbrennungen, Verbrühungen?',5,'RISIKO',TRUE),
                   ('2.5.7','Auffällige Rötungen / Entzündungen im Anal- und Genitalbereich?',6,'RISIKO',TRUE),
                   ('2.5.8','Massive und/oder wiederholte Zeichen von Verletzungen – insbesondere bei unklarer oder nicht nachvollziehbarer Ursache?',7,'RISIKO',TRUE),
                   ('2.5.10','Lassen sich Zeichen von Fehl-, Unter- bzw. Überernährung erkennen?',8,'RISIKO',FALSE)
) AS i(item_no,text,order_index,polarity,akut) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity, akut_kriterium=EXCLUDED.akut_kriterium;

-- 2.6 Anmerkungen (neutral) -> 2.6.1
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='2.6'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, '2.6.1', 'Anmerkungen / Ergänzungen (Bitte ID-Nr angeben, falls möglich)', 'TEXT', 1, 'NEUTRAL'
FROM sec
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 3.1 Lernverhalten (RISIKO)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='3.1'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, 'RISIKO'
FROM sec
         JOIN (VALUES
                   ('3.1.1','Zeigt das Kind einen deutlich altersunangemessenen körperlichen Entwicklungsstand (Motorik, Koordination, Gleichgewicht)?',1),
                   ('3.1.2','Zeigt das Kind einen deutlich altersunangemessenen Entwicklungsstand der Sprache / des Hörens (Lautbildung / Reaktion auf Geräusche)?',2),
                   ('3.1.5','Zeigt das Kind einen deutlich altersunangemessenen sozialen Entwicklungsstand (Interaktion mit Umwelt/Menschen)?',3),
                   ('3.1.6','Zeigt das Kind Schlafstörungen?',4),
                   ('3.1.7','Zeigt das Kind Essstörungen?',5)
) AS i(item_no,text,order_index) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 3.2 Sozial/Emotional (RISIKO)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='3.2'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, 'RISIKO'
FROM sec
         JOIN (VALUES
                   ('3.2.1','Wirkt das Kind auffallend zurückgezogen, ruhig und/oder teilnahmslos?',1),
                   ('3.2.2','Wirkt das Kind stark verängstigt und zurückgezogen?',2),
                   ('3.2.4','Zeigt das Kind mangelndes Interesse an der Umwelt?',3),
                   ('3.2.5','Jaktationen (Schaukelbewegungen) / anhaltendes Schreien?',4)
) AS i(item_no,text,order_index) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 3.3 Anmerkungen -> 3.3.1
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='3.3'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, '3.3.1', 'Anmerkungen / Ergänzungen (Bitte ID-Nr angeben, falls möglich)', 'TEXT', 1, 'NEUTRAL'
FROM sec
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 4.1 Eltern-Auffälligkeiten (RISIKO) -> normalisiert 4.1.1..4.1.5
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='4.1'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, 'RISIKO'
FROM sec
         JOIN (VALUES
                   ('4.1.1','Fehlende oder erschwerte Ansprechbarkeit?',1),
                   ('4.1.2','Übererregtheit, Verwirrtheit?',2),
                   ('4.1.3','Häufige Benommenheit?',3),
                   ('4.1.4','Mangelnde Fähigkeit zur Kontrolle von Aggression und Wut?',4),
                   ('4.1.5','Auffallende Vergesslichkeiten bzw. Erinnerungslücken?',5)
) AS i(item_no,text,order_index) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 4.6 Anmerkungen -> 4.6.1
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='4.6'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, '4.6.1', 'Anmerkungen / Ergänzungen (Bitte ID-Nr angeben, falls möglich)', 'TEXT', 1, 'NEUTRAL'
FROM sec
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 5.1 (gemischt)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.1'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity, akut_kriterium)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, i.polarity, i.akut
FROM sec
         JOIN (VALUES
                   ('5.1.1','Wird dem Kind altersgerecht Kontakt und Ansprache (Körperkontakt, Blickkontakt & Sprechen) geboten?',1,'SCHUTZ',FALSE),
                   ('5.1.2','Wird das Kind beim Füttern in den Arm genommen oder bekommt es lediglich eine Flasche, die es allein trinken muss?',2,'SCHUTZ',FALSE),
                   ('5.1.3','Erfolgt das Wickeln grob und ohne Ansprache?',3,'RISIKO',FALSE),
                   ('5.1.4','Wird dem Kind bei Krankheit oder Verletzung Trost verweigert?',4,'RISIKO',FALSE),
                   ('5.1.5','Wird das Kind in Familienaktivitäten miteinbezogen?',5,'SCHUTZ',FALSE),
                   ('5.1.6','Wird der Säugling bei unerwünschtem Verhalten (z.B. Strampeln beim Wickeln) gezüchtigt, geschlagen, gekniffen, geschüttelt usw.?',6,'RISIKO',TRUE),
                   ('5.1.7','Werden Medien (TV, Video, PC, Smartphone, Audio-CDs, Zeitschriften, PC-/Konsolen-/Smartphone- und Videospiele) als Beschäftigungsersatz genutzt?',7,'RISIKO',FALSE)
) AS i(item_no,text,order_index,polarity,akut) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity, akut_kriterium=EXCLUDED.akut_kriterium;

-- 5.2
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.2'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity, akut_kriterium)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, i.polarity, i.akut
FROM sec
         JOIN (VALUES
                   ('5.2.1','Bleibt das Kind trotz anhaltenden Schreiens unbeachtet?',1,'RISIKO',FALSE),
                   ('5.2.2','Ist das Kind einer gewalttätigen Atmosphäre ausgesetzt?',2,'RISIKO',TRUE),
                   ('5.2.3','Machen Mutter/Vater dem Kind durch Anschreien, Drohungen, grobes Anfassen, Schütteln, Schlagen oder Nichtbeachten/Alleinlassen Angst?',3,'RISIKO',TRUE),
                   ('5.2.4','Erlebt das Kind einen geregelten Tagesablauf?',4,'SCHUTZ',FALSE)
) AS i(item_no,text,order_index,polarity,akut) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity, akut_kriterium=EXCLUDED.akut_kriterium;

-- 5.3 (gemischt)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.3'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, i.polarity
FROM sec
         JOIN (VALUES
                   ('5.3.1','Wird die Aufsicht nicht alters- und situationsangemessen wahrgenommen (z.B. ohne Aufsicht auf Wickeltisch oder in Badewanne)?',1,'RISIKO'),
                   ('5.3.2','Wird das Kind für sein Alter zu lange allein gelassen?',2,'RISIKO'),
                   ('5.3.3','Werden Gefahren im Haushalt übersehen (defekte Stromkabel, Steckdosen, ungesicherte Treppen, gefährliches Spielzeug etc.)?',3,'RISIKO'),
                   ('5.3.4','Werden gefährliche Gegenstände (Medikamente, Putzmittel, Alkohol, Drogen, Waffen u.a.) sicher aufgehoben?',4,'SCHUTZ'),
                   ('5.3.5','Werden Haustiere sicher und für das Kind ohne Gesundheitsgefährdung gehalten?',5,'SCHUTZ'),
                   ('5.3.6','Werden Gefahren im Wohnumfeld (Spielplatz, Garten, …) erkannt und behoben?',6,'SCHUTZ'),
                   ('5.3.7','Wird das Kind einer gefährdenden Umgebung (Bierzelt, verrauchte Kneipe, Haus-Party, …) ausgesetzt?',7,'RISIKO'),
                   ('5.3.8','Sicherheit im Auto/Fahrrad: Kein altersgerechter Kindersitz, keine Kindersicherung?',8,'RISIKO'),
                   ('5.3.9','Unangemessener Umgang mit Medien?',9,'RISIKO'),
                   ('5.3.10','Unangemessene Geräuschkulisse durch Medien (s.o.) und/oder Besucher?',10,'RISIKO'),
                   ('5.3.11','Sind Eltern durch psychische Beeinträchtigungen, Suchtabhängigkeit, intellektuelle Beeinträchtigungen o.ä. in Wahrnehmung oder Verantwortungsfähigkeit eingeschränkt?',11,'RISIKO')
) AS i(item_no,text,order_index,polarity) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 5.4 Gewalt (RISIKO + akut)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.4'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity, akut_kriterium)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, 'RISIKO', TRUE
FROM sec
         JOIN (VALUES
                   ('5.4.1','Körperliche Gewalt (Verdachtsmomente / konkrete Hinweise)?',1),
                   ('5.4.2','Seelische Gewalt (Verdachtsmomente / konkrete Hinweise)?',2),
                   ('5.4.3','Sexuelle Grenzverletzungen / sexuelle Gewalt (Verdachtsmomente / konkrete Hinweise)?',3),
                   ('5.4.4','Miterleben häuslicher Gewalt (Verdachtsmomente / konkrete Hinweise)?',4),
                   ('5.4.5','Erwachsenenkonflikte um das Kind (Verdachtsmomente / konkrete Hinweise)?',5)
) AS i(item_no,text,order_index) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity, akut_kriterium=EXCLUDED.akut_kriterium;

-- 5.5 Individualität (gemischt)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.5'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, i.polarity
FROM sec
         JOIN (VALUES
                   ('5.5.1','Wird das Kind als Besitz betrachtet, über den man nach Belieben verfügen kann?',1,'RISIKO'),
                   ('5.5.2','Lassen Mutter/Vater/Bezugsperson dem Kind Raum und „klammern“ nicht?',2,'SCHUTZ'),
                   ('5.5.3','Existiert ein Platz, an dem das Kind zur Ruhe kommen kann bzw. in Ruhe gelassen wird?',3,'SCHUTZ'),
                   ('5.5.4','Schenken Mutter/Vater/Bezugsperson dem Kind Aufmerksamkeit, wenn es sich mitteilen möchte?',4,'SCHUTZ'),
                   ('5.5.5','Wird das Kind zur Selbstständigkeit ermutigt?',5,'SCHUTZ'),
                   ('5.5.6','Wird das Kind in seiner Bewegungsfreiheit unangemessen eingeschränkt?',6,'RISIKO'),
                   ('5.5.7','Wird mit dem Kind nur dann geschmust, wenn das eigene Bedürfnis befriedigt werden soll?',7,'RISIKO'),
                   ('5.5.8','Ignoranz der kindlichen Bedürfnisse / altersentsprechenden Autonomiebedürfnisse?',8,'RISIKO')
) AS i(item_no,text,order_index,polarity) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 5.6 Entwicklungsförderung (gemischt)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.6'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, i.polarity
FROM sec
         JOIN (VALUES
                   ('5.6.1','Wird das Kind immer wieder angeschaut (Blickkontakt)?',1,'SCHUTZ'),
                   ('5.6.2','Wird nicht oder kaum mit dem Kind gesprochen?',2,'RISIKO'),
                   ('5.6.3','Wird nicht oder kaum mit dem Kind gespielt?',3,'RISIKO'),
                   ('5.6.4','Steht kein altersentsprechendes Beschäftigungsmaterial für das Kind zur Verfügung?',4,'RISIKO'),
                   ('5.6.5','Wird dem Kind kein ausreichender Körperkontakt angeboten?',5,'RISIKO'),
                   ('5.6.6','Nicht kindgerechte emotionale Interaktion (z.B. schroffer/kühler Umgangston)?',6,'RISIKO'),
                   ('5.6.7','Wird notwendiger zusätzlicher Förderbedarf erkannt und Zusatzförderung in Anspruch genommen (z.B. Logopädie, Ergotherapie, Frühförderung, Heilpädagogik)?',7,'SCHUTZ')
) AS i(item_no,text,order_index,polarity) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 5.7 Betreuung (RISIKO)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.7'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, 'RISIKO'
FROM sec
         JOIN (VALUES
                   ('5.7.1','Wird das Kind ständig verschiedenen Personen zur Betreuung überlassen?',1),
                   ('5.7.2','Gefährdende Aufsichtspersonen (z.B. Geschwister unter 12 Jahren, Betrunkene, Fremde)?',2),
                   ('5.7.3','Hat das Kind keine verantwortungsfähige Bezugsperson, die beabsichtigt, langfristig für das Kind zu sorgen?',3)
) AS i(item_no,text,order_index) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 5.8 Kooperation (SCHUTZ)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.8'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, 'SCHUTZ'
FROM sec
         JOIN (VALUES
                   ('5.8.1','Wünscht Hilfe?',1),
                   ('5.8.2','Teilt die Problemsicht der Fachkraft?',2),
                   ('5.8.3','Teilt die Ansicht der Fachkraft hinsichtlich Lösungs- und Hilfeansätzen?',3),
                   ('5.8.4','Hält sich an getroffene Vereinbarung (zu 75%)?',4),
                   ('5.8.5','Kontaktaufnahme: Adress-/Telefondaten sind aktuell bzw. werden aktualisiert?',5),
                   ('5.8.6','Hausbesuche sind möglich (Name am Briefkasten, Klingel funktioniert, öffnet bei angekündigtem/unangekündigtem Hausbesuch)?',6),
                   ('5.8.7','Termine und Kontaktabsprachen werden eingehalten?',7),
                   ('5.8.8','Beteiligt sich aktiv und kompromissbereit am Aushandlungsprozess?',8),
                   ('5.8.9','Reagiert im Kontakt nicht aggressiv, distanzlos und/oder ablehnend?',9),
                   ('5.8.10','Übernimmt Verantwortung für das Kind in allen Fragen?',10)
) AS i(item_no,text,order_index) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 5.9 Anmerkungen -> 5.9.1
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.9'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, '5.9.1', 'Anmerkungen / Ergänzungen (Bitte ID-Nr angeben, falls möglich)', 'TEXT', 1, 'NEUTRAL'
FROM sec
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 6.1 Risiko-Faktoren (RISIKO)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='6.1'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, 'RISIKO'
FROM sec
         JOIN (VALUES
                   ('6.1.1','Selbst erlebte häufige Beziehungsabbrüche, Fremdunterbringung, Mangelerfahrungen in der Kindheit?',1),
                   ('6.1.2','Ausgeprägt negative Emotionalität (intensive Gefühle von Trauer/Niedergeschlagenheit) und/oder hohe Impulsivität?',2),
                   ('6.1.3','Problemvermeidend / geringe Planungsfähigkeit / unstrukturiert / fehlende Selbststeuerung bzw. Selbstbeherrschung?',3),
                   ('6.1.4','Ausgeprägte Bindungsstörungen?',4),
                   ('6.1.5','Psychische Erkrankungen (z.B. depressive Störungen)?',5),
                   ('6.1.6','Hinweise auf Drogen-, Alkohol- und Medikamentenmissbrauch bzw. Sucht?',6),
                   ('6.1.7','Gewalt unter Erwachsenen / Partnerschaftskonflikte / häusliche Gewalt?',7)
) AS i(item_no,text,order_index) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 6.2 (RISIKO)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='6.2'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, 'RISIKO'
FROM sec
         JOIN (VALUES
                   ('6.2.1','Finanzielle Probleme (Armut, Arbeitslosigkeit, Trennung, Schulden, …)?',1),
                   ('6.2.2','Mangelnde soziale Unterstützung und Entlastung innerhalb und außerhalb der Familie?',2),
                   ('6.2.3','Familiäre Überforderungssituationen?',3),
                   ('6.2.4','Fehlen basaler familiärer Organisation (z.B. Einkauf, Kochen, Waschen/Putzen, Müllentsorgung)?',4),
                   ('6.2.5','Soziale Isolierung?',5)
) AS i(item_no,text,order_index) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 6.3 (RISIKO)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='6.3'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, 'RISIKO'
FROM sec
         JOIN (VALUES
                   ('6.3.1','Unkenntnis von Pflege- und Fürsorgebedürfnissen von Kindern?',1),
                   ('6.3.2','Überschätzung kindlicher Selbsthilfepotentiale?',2),
                   ('6.3.3','Mangel an erzieherischer Kompetenz (Erziehungsstil/Alltags-Management/Wertschätzung/Autonomie/Struktur/Grenzen/Vorbild/Förderung)?',3),
                   ('6.3.4','Erkennt altersentsprechende Autonomiebestrebungen des Kindes nicht bzw. ermöglicht sie nicht?',4)
) AS i(item_no,text,order_index) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 6.4 (RISIKO)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='6.4'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, 'TRI_STATE', i.order_index, 'RISIKO'
FROM sec
         JOIN (VALUES
                   ('6.4.1','Steht das Kind in einem Loyalitätskonflikt zwischen den Bezugspersonen?',1),
                   ('6.4.2','Wird das Kind von einer Bezugsperson für einen Erwachsenenkonflikt genutzt/missbraucht?',2),
                   ('6.4.3','Kann das Kind keine angemessene Beziehung zu beiden Elternteilen (bzw. Eltern/Großeltern) pflegen?',3),
                   ('6.4.4','Ist das Kind parentifiziert (übernimmt Rolle eines Elternteils/eines Erwachsenen)?',4),
                   ('6.4.5','Darf das Kind in der Familie sein Kind-Sein nicht leben?',5)
) AS i(item_no,text,order_index) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 6.5 Anmerkungen -> 6.5.1
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='6.5'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, '6.5.1', 'Anmerkungen / Ergänzungen (Bitte ID-Nr angeben, falls möglich)', 'TEXT', 1, 'NEUTRAL'
FROM sec
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 7.1 Wohnsituation (RISIKO) + 7.1.13 Text (NEUTRAL)
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='7.1'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec
         JOIN (VALUES
                   ('7.1.1','Wohnräume sind tagsüber stundenlang abgedunkelt oder künstlich beleuchtet / erhalten kaum Tageslicht?','TRI_STATE',1,'RISIKO'),
                   ('7.1.2','Schlafort: wechselnder Schlafplatz, verraucht, laut, Zugluft, nicht beheizbar?','TRI_STATE',2,'RISIKO'),
                   ('7.1.3','Schlafplatz/Bett/Matratze/Bettzeug: Dreck, Feuchtigkeit/Nässe, Ungeziefer, Schimmel beobachtbar und/oder muffiger Geruch?','TRI_STATE',3,'RISIKO'),
                   ('7.1.5','Matratze oder Bett entsprechen nicht der Körpergröße des Kindes?','TRI_STATE',4,'RISIKO'),
                   ('7.1.6','Wohnung ist nicht mit ausreichenden und funktionstüchtigen Möbeln ausgestattet?','TRI_STATE',5,'RISIKO'),
                   ('7.1.7','Wohnung/Wachplatz: dunkel, laut (TV ständig), verraucht, Zugluft, nicht beheizbar/überheizt, Unsauberkeit, Dreck, Müll, Feuchtigkeit/Nässe, Ungeziefer, Schimmel beobachtbar und/oder muffiger Geruch?','TRI_STATE',6,'RISIKO'),
                   ('7.1.8','Entwicklungs- bzw. altersangemessenes Spielzeug fehlt?','TRI_STATE',7,'RISIKO'),
                   ('7.1.9','Wohnung: Nichtbeseitigung erheblicher Gefahren im Haushalt (z.B. defekte Stromkabel)?','TRI_STATE',8,'RISIKO'),
                   ('7.1.10','Keine Möglichkeiten zum Kochen und Kühlen?','TRI_STATE',9,'RISIKO'),
                   ('7.1.11','Wohnung zeigt Spuren äußerer Gewaltanwendung?','TRI_STATE',10,'RISIKO'),
                   ('7.1.12','Obdachlosigkeit oder extrem kleine bzw. gesundheitsgefährdende Unterkunft?','TRI_STATE',11,'RISIKO'),
                   ('7.1.13','Anmerkungen / Ergänzungen (Bitte ID-Nr angeben, falls möglich)','TEXT',12,'NEUTRAL')
) AS i(item_no,text,answer_type,order_index,polarity) ON TRUE
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- 8.1 Zusatztext (neutral) -> 8.1.1
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='DL-0-12M-01' AND version='2026-01'
),
     sec AS (
         SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='8.1'
     )
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, '8.1.1', 'Zusätzliche Beschreibungen / Anmerkungen / Ergänzungen', 'TEXT', 1, 'NEUTRAL'
FROM sec
    ON CONFLICT (section_id, item_no)
DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

COMMIT;
