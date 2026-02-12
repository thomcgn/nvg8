BEGIN;

-- Instrument upsert
INSERT INTO ks_instrumente (code, titel, typ, version, aktiv, min_age_months, max_age_months, requires_school_context, requires_kita_context)
VALUES ('AH-3-01b', 'Checkliste/Dokumentationsbogen – Altersgruppe 12 bis unter 36 Monate – Kleinkind', 'DOKUBOGEN', '2015-09', TRUE, 12, 35, FALSE, FALSE)
    ON CONFLICT (code, version) DO UPDATE SET
    titel=EXCLUDED.titel,
                                       typ=EXCLUDED.typ,
                                       aktiv=EXCLUDED.aktiv,
                                       min_age_months=EXCLUDED.min_age_months,
                                       max_age_months=EXCLUDED.max_age_months,
                                       requires_school_context=EXCLUDED.requires_school_context,
                                       requires_kita_context=EXCLUDED.requires_kita_context;

-- Sections upsert (flach aus risk_checklist_subsection)
WITH inst AS (SELECT id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09')
INSERT INTO ks_sections (instrument_id, parent_id, section_no, title, order_index, hint_text)
SELECT inst.id, NULL, s.section_no, s.title, s.order_index, NULL
FROM inst JOIN (VALUES

                    ('1.0', 'Kontext / Stammdaten', 1),
                    ('2.0', 'Äußeres Erscheinungsbild des Kleinkindes', 2),
                    ('2.1', 'Ausreichende Körperpflege?', 3),
                    ('2.2', 'Schützende Kleidung?', 4),
                    ('2.3', 'Altersgemäße Ernährung?', 5),
                    ('2.4', 'Behandlung von Krankheiten und Entwicklungsstörungen bzw. Sicherung der medizinischen Versorgung?', 6),
                    ('2.5', 'Besondere körperliche Auffälligkeiten?', 7),
                    ('3.0', 'Verhalten des Kleinkindes', 8),
                    ('3.1', 'Lernverhalten / Leistungsverhalten Zeigt das Kind einen deutlich altersunangemessenen körperlichen Ent', 9),
                    ('3.2', 'Soziales Verhalten / Emotionales Verhalten', 10),
                    ('4.0', 'Äußeres Erscheinungsbild der Erziehungspersonen', 11),
                    ('5.0', 'Verhalten der Erziehungspersonen', 12),
                    ('5.1', 'Zärtlichkeit, Anerkennung und Bestätigung?', 13),
                    ('5.2', 'Sicherheit und Geborgenheit?', 14),
                    ('5.3', 'Schutz vor Gefahren?', 15),
                    ('5.4', 'Gewalt gegen das Kind? (Familiäres bzw. soziales Umfeld)', 16),
                    ('5.5', 'Individualität und Selbstbestimmung?', 17),
                    ('5.6', 'Ansprache / Entwicklungsförderung?', 18),
                    ('5.7', 'Verlässliche Betreuung?', 19),
                    ('5.9', 'Kooperationsbereitschaft der Mutter / des Vaters / weiterer Bezugs- bzw. Pflegepersonen? (Bitte unzutreffende Beschreibungen durchstreichen!)', 20),
                    ('6.0', 'Familiäre Situation / Risikofaktoren', 21),
                    ('6.1', '(Bitte unzutreffende Beschreibungen durchstreichen!)', 22),
                    ('6.2', 'Zur Situation der Familie?', 23),
                    ('6.3', 'Wahrnehmung kindlicher Bedürfnisse und Ressourcen durch die Mutter / den Vater / die Pflegeperson?', 24),
                    ('6.4', 'Erwachsenenkonflikte um das Kind?', 25),
                    ('7.0', 'Wohnsituation', 26),
                    ('8.0', 'Zusätzliche Beschreibungen / Anmerkungen', 27)
) AS s(section_no, title, order_index) ON TRUE
    ON CONFLICT (instrument_id, section_no) DO UPDATE SET
    title=EXCLUDED.title, order_index=EXCLUDED.order_index, hint_text=EXCLUDED.hint_text;


-- ============================================================
-- Parent-Hierarchie setzen (Container-Struktur wie Säugling)
-- ============================================================

-- 2.x unter 2.0
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'
),
     p AS (
         SELECT s.id AS parent_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='2.0'
     )
UPDATE ks_sections s
SET parent_id = p.parent_id
    FROM inst, p
WHERE s.instrument_id = inst.instrument_id
  AND s.section_no IN ('2.1','2.2','2.3','2.4','2.5');

-- 3.x unter 3.0
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'
),
     p AS (
         SELECT s.id AS parent_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='3.0'
     )
UPDATE ks_sections s
SET parent_id = p.parent_id
    FROM inst, p
WHERE s.instrument_id = inst.instrument_id
  AND s.section_no IN ('3.1','3.2');

-- 5.x unter 5.0
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'
),
     p AS (
         SELECT s.id AS parent_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.0'
     )
UPDATE ks_sections s
SET parent_id = p.parent_id
    FROM inst, p
WHERE s.instrument_id = inst.instrument_id
  AND s.section_no IN ('5.1','5.2','5.3','5.4','5.5','5.6','5.7','5.9');

-- 6.x unter 6.0
WITH inst AS (
    SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'
),
     p AS (
         SELECT s.id AS parent_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='6.0'
     )
UPDATE ks_sections s
SET parent_id = p.parent_id
    FROM inst, p
WHERE s.instrument_id = inst.instrument_id
  AND s.section_no IN ('6.1','6.2','6.3','6.4');


-- Items upsert
-- subsection META: Kontext / Stammdaten
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='1.0')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('1.0', '(Name, Vorname, Funktion, Einrichtung) (Zeitpunkt der Einschätzung) Anlass: ________________________________________________________________ _________________________ (Zeitraum der Beobachtung) ID-Nr.. Angaben zum Kleinkind Name Vorname Geschlecht Geburts-Datum Alter[Jahre;Monat]', 'TEXT', 1, 'NEUTRAL'),
                   ('1.1', '____________________ _______________ □ □ ________ ___________ weiblich männlich Äußeres Erscheinungsbild des Kleinkindes ID-Nr.. (Bitte zutreffende Beschreibungen durch unterstreichen oder einkreisen markieren bzw. unter Anmerkungen ergänzen!)', 'TEXT', 2, 'NEUTRAL'),
                   ('2.4.4', 'Keine Schuhe (Socken) oder keine passenden Schuhe (Socken), nichtwitterungsgemäß?', 'TEXT', 13, 'RISIKO'),
                   ('2.4.5', 'Kleidung?', 'TEXT', 14, 'NEUTRAL'),
                   ('2.6', 'Anmerkungen / Ergänzungen? (Bitte ID-Nr angeben, falls möglich) 2 / 8 § 8a SGB VIII – Kooperationsvereinbarung Kinderschutz – Arbeitshilfen Version Handlungsanleitung zur Sicherung des Kindeswohls - Landkreis Mansfeld-Südharz – Jugendamt 2015-09 Ar A b H e - it 3 s - H 0 i 1 lf b e n WE C R h K e Z c E kl U is G te E /D – o M ku ö m g e lic n h ta e t i H on in s w b e o i g s e e n / - G A e l w te i r c s h g t r ig u e p p A e n 1 h 2 a lt b s i p s u u n n k t t e e r - 3 K 6 i M nd o e n s a w te o h – l g K e l f e ä in h k rd in u d n g - 3 / 8 Verhalten des Kleinkindes 3. (Bitte unzutreffende Beschreibungen durchstreichen und falls notwendig Anmerkungen hinzufügen!)', 'TEXT', 39, 'SCHUTZ'),
                   ('3.3', 'Anmerkungen / Ergänzungen? (Bitte ID-Nr angeben, falls möglich) Version § 8a SGB VIII – Kooperationsvereinbarung Kinderschutz – Arbeitshilfen 3 / 8 2015-09 Handlungsanleitung zur Sicherung des Kindeswohls - Landkreis Mansfeld-Südharz – Jugendamt 4 / 8 WERKZEUGE – Mögliche Hinweise / Gewichtige Anhaltspunkte - Kindeswohlgefährdung - Arbeits Hilfen Checkliste/Dokumentationsbogen - Altersgruppe 12 bis unter 36 Monate – Kleinkind AH-3-01b Äußeres Erscheinungsbild der Erziehungspersonen: Mutter – Vater – Dritte 4. Personen? (Bitte unzutreffende Beschreibungen durchstreichen und falls notwendig Anmerkungen hinzufügen!)', 'TEXT', 55, 'RISIKO')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 2.1: Ausreichende Körperpflege?
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='2.1')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('2.1.1', 'Trifft man das Kind ständig in durchnässten, herabhängenden Windeln an? Sind größere Teile der Hautoberfläche entzündet?', 'TRI_STATE', 3, 'RISIKO'),
                   ('2.1.2', 'Finden sich regelmäßig Dreck- und Stuhlreste in den Hautfalten (Genital- und Gesäßbereich)?', 'TRI_STATE', 4, 'RISIKO'),
                   ('2.1.3', 'Fällt das Kind ständig durch üblen Körpergeruch auf?', 'TRI_STATE', 5, 'NEUTRAL'),
                   ('2.1.4', 'Hat das Kind ständig ein auffälliges Hautbild?', 'TRI_STATE', 6, 'RISIKO'),
                   ('2.1.5', 'Wird das Kind regelmäßig gebadet und gewaschen?', 'TRI_STATE', 7, 'SCHUTZ'),
                   ('2.1.6', 'Dauerhafter, Unbehandelter Ungezieferbefall (z.B. Flöhe, Läuse)?', 'TRI_STATE', 8, 'RISIKO'),
                   ('2.1.7', 'Erfolgt eine altersgemäße Sauberkeitserziehung (Toilettengang, Waschen,Zähneputzen)?', 'TRI_STATE', 9, 'SCHUTZ')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 2.2: Schützende Kleidung?
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='2.2')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('2.2.1', 'Bietet die Kleidung hinreichend Schutz vor Hitze, Sonne, Kälte und Nässe?', 'TRI_STATE', 10, 'SCHUTZ'),
                   ('2.2.2', 'Ist das Kind der Jahreszeit entsprechend gekleidet oder wird es oft schwitzendoder frierend angetroffen?', 'TRI_STATE', 11, 'NEUTRAL'),
                   ('2.2.3', 'Ist die Bewegungsfreiheit des Kindes in seiner Kleidung gewährleistet oder istes zu eng eingeschnürt, sind Kleidungsstücke zu klein oder viel zu groß?', 'TRI_STATE', 12, 'SCHUTZ')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 2.3: Altersgemäße Ernährung?
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='2.3')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('2.3.1', 'Gibt es eine stete Gewichtszunahme (Gewichtskurve im Vorsorgeheft)?', 'TRI_STATE', 15, 'NEUTRAL'),
                   ('2.3.2', 'Reicht die Flüssigkeitsmenge?', 'TRI_STATE', 16, 'NEUTRAL'),
                   ('2.3.3', 'gesund (Nahrungsqualität!) sowie ausreichend (Menge!) und regelmäßig', 'TRI_STATE', 17, 'SCHUTZ'),
                   ('2.3.4', 'Wird auf Reinigung der Flasche / sauberes Geschirr / saubere Kochgerätschaften(Hygienische Mindeststandards!) geachtet?', 'TRI_STATE', 18, 'SCHUTZ'),
                   ('2.3.5', 'Ist der Umgang mit Süßigkeiten geregelt?', 'TRI_STATE', 19, 'NEUTRAL'),
                   ('2.3.6', 'Bekommt das Kind etwas zu Essen mit in den Kindergarten/ Hort(Nahrungsqualität, Menge, Regelmäßigkeit!)?', 'TRI_STATE', 20, 'SCHUTZ')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 2.4: Behandlung von Krankheiten und Entwicklungsstörungen bzw. Sicherung der medizinischen Versorgung?
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='2.4')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('2.4.1', 'Vorsorgeuntersuchungen werden regelmäßig durchgeführt (U-Heft: U1 bis U7)?', 'TRI_STATE', 21, 'SCHUTZ'),
                   ('2.4.2', 'Ist das Recht des Kindes auf Vorsorge (z. B. Impfungen) gewährleistet?', 'TRI_STATE', 22, 'SCHUTZ'),
                   ('2.4.3', 'Werden Krankheiten des Kindes nicht oder zu spät erkannt?', 'TRI_STATE', 23, 'RISIKO'),
                   ('2.4.4', 'Bei Erkrankungen des Kindes und in Notsituationen erfolgen Arztbesuche?', 'TRI_STATE', 24, 'NEUTRAL'),
                   ('2.4.5', 'Verschriebene Medikamente werden besorgt und regelmäßig verabreicht?', 'TRI_STATE', 25, 'SCHUTZ'),
                   ('2.4.6', 'Werden Entwicklungsverzögerungen oder Behinderungen nicht erkanntund/oder unsachgemäß behandelt?', 'TRI_STATE', 26, 'RISIKO'),
                   ('2.4.7', 'Zähne: Überwiegend kaputte schwarze Zähne, eventuelle Schmerzzustände,Mundgeruch?', 'TRI_STATE', 27, 'RISIKO'),
                   ('2.4.8', 'Besteht für das Kind eine Krankenversicherung? Bemühen sich die Mutter / der Vater darum?', 'TRI_STATE', 28, 'SCHUTZ'),
                   ('2.4.9', 'Gleichgültigkeit der Mutter / des Vaters und keinerlei Interesse an Gesundheitsfragen um das Kind?', 'TRI_STATE', 29, 'RISIKO')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 2.5: Besondere körperliche Auffälligkeiten?
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='2.5')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('2.5.1', 'Früh-, Mangel-, Mehrlingsgeburt (Bitte Unzutreffendes streichen)?', 'TRI_STATE', 30, 'RISIKO'),
                   ('2.5.2', 'Chronische Krankheiten, Behinderungen (Wenn ja, bitte angeben)?', 'TRI_STATE', 31, 'NEUTRAL'),
                   ('2.5.3', 'Krankheitsanfälligkeit, viele Krankenhausaufenthalte oder. auffallend wenige Infektionen, seltene Krankenhausaufenthalte, wenig Arztbesuche', 'TRI_STATE', 32, 'NEUTRAL'),
                   ('2.5.4', 'Auffällige Hämatome (z.B. am Rücken, Brust, Bauch, Po, geformte Hämatome),Striemen, Mehrfachverletzungen in verschiedenen Heilungsstadien?', 'TRI_STATE', 33, 'RISIKO'),
                   ('2.5.6', 'Knochenbrüche, Verbrennungen, Verbrühungen?', 'TRI_STATE', 34, 'RISIKO'),
                   ('2.5.7', 'Auffällige Rötungen / Entzündungen im Anal- und Genitalbereich?', 'TRI_STATE', 35, 'RISIKO'),
                   ('2.5.8', 'Massive und/oder wiederholte Zeichen von Verletzungen – insbesondere beiunklarer oder nicht nachvollziehbarer Ursache?', 'TRI_STATE', 36, 'RISIKO'),
                   ('2.5.9', 'Einnässen / Einkoten?', 'TRI_STATE', 37, 'NEUTRAL'),
                   ('2.5.10', 'Lassen sich Zeichen von Fehl-, Unter- bzw. Überernährung erkennen?', 'TRI_STATE', 38, 'RISIKO')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 3.1: Lernverhalten / Leistungsverhalten Zeigt das Kind einen deutlich altersunangemessenen körperlichen Ent
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='3.1')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('3.1.1', 'wicklungsstand (Körpermotorik, Handmotorik, Handlungskoordination,', 'TRI_STATE', 40, 'NEUTRAL'),
                   ('3.1.2', 'Zeigt das Kind einen deutlich altersunangemessenen Entwicklungsstand der Sprache (Wortschatz, Satzbildung, Artikulation, Sprachverständnis)?', 'TRI_STATE', 41, 'NEUTRAL'),
                   ('3.1.3', 'Entwicklungstand (Situationsverständnis, Verständnis von', 'TRI_STATE', 42, 'NEUTRAL'),
                   ('3.1.4', 'Zeigt das Kind einen deutlich altersunangemessenen Entwicklungsstand der Emotionen (Gefühle erkennen, benennen, ausdrücken, bewältigen)?', 'TRI_STATE', 43, 'NEUTRAL'),
                   ('3.1.5', 'Zeigt das Kind einen deutlich altersunangemessenen sozialen Entwicklungstand(Spiel-Verhalten, Umgang mit Gleichaltrigen, Umgang mit Erwachsenen)?', 'TRI_STATE', 44, 'NEUTRAL'),
                   ('3.1.6', 'Zeigt das Kind Schlafstörungen?', 'TRI_STATE', 45, 'NEUTRAL'),
                   ('3.1.7', 'Zeigt das Kind Essstörungen?', 'TRI_STATE', 46, 'NEUTRAL')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 3.2: Soziales Verhalten / Emotionales Verhalten
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='3.2')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('3.2.1', 'Wirkt das Kind auffallend zurückgezogen, ruhig und/oder teilnahmslos?', 'TRI_STATE', 47, 'NEUTRAL'),
                   ('3.2.2', 'Wirkt das Kind stark verängstigt und zurückgezogen?', 'TRI_STATE', 48, 'NEUTRAL'),
                   ('3.2.3', 'Zeigt das Kind eine anhaltende traurige Verstimmung?', 'TRI_STATE', 49, 'NEUTRAL'),
                   ('3.2.4', 'Zeigt das Kind mangelndes Interesse an der Umwelt?', 'TRI_STATE', 50, 'RISIKO'),
                   ('3.2.5', 'Jaktationen (Schaukelbewegungen) / anhaltendes Schreien?', 'TRI_STATE', 51, 'NEUTRAL'),
                   ('3.2.6', 'Wirkt das Kind aggressiv und/oder selbstverletzend?', 'TRI_STATE', 52, 'RISIKO'),
                   ('3.2.7', 'Zeigt das Kind sexualisiertes Verhalten?', 'TRI_STATE', 53, 'RISIKO'),
                   ('3.2.8', 'Wirkt das Kind distanzlos gegenüber Fremden?', 'TRI_STATE', 54, 'NEUTRAL')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 4: Äußeres Erscheinungsbild der Erziehungspersonen
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='4.0')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('4.1', '. Fehlende oder erschwerte Ansprechbarkeit?', 'TRI_STATE', 56, 'NEUTRAL'),
                   ('4.2', 'Übererregtheit, Verwirrtheit?', 'TRI_STATE', 57, 'RISIKO'),
                   ('4.3', 'Häufige Benommenheit?', 'TRI_STATE', 58, 'RISIKO'),
                   ('4.4', 'Mangelnde Fähigkeit zur Kontrolle von Aggression und Wut?', 'TRI_STATE', 59, 'RISIKO'),
                   ('4.5', 'Auffallende Vergesslichkeiten bzw. Erinnerungslücken', 'TRI_STATE', 60, 'NEUTRAL'),
                   ('4.6', 'Anmerkungen / Ergänzungen? (Bitte ID-Nr angeben, falls möglich) Verhalten Erziehungspersonen: Mutter – Vater – Dritte Personen 5. (Bitte unzutreffende Beschreibungen durchstreichen und falls notwendig Anmerkungen hinzufügen!)', 'TEXT', 61, 'NEUTRAL'),
                   ('4.5', 'Erwachsenenkonflikte um das Kind(Verdachtsmomente / Konkrete Hinweise)?', 'TRI_STATE', 89, 'NEUTRAL'),
                   ('4.6', 'Autonomiekonflikte (Verdachtsmomente / Konkrete Hinweise)?', 'TRI_STATE', 90, 'NEUTRAL')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 5: Verhalten der Erziehungspersonen
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.0')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('5.8', 'Anmerkungen / Ergänzungen? (Bitte ID-Nr angeben, falls möglich)', 'TEXT', 110, 'NEUTRAL')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 5.1: Zärtlichkeit, Anerkennung und Bestätigung?
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.1')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('5.1.1', 'Wird dem Kind altersgerecht Kontakt und Ansprache (Körperkontakt,Blickkontakt & Sprechen) geboten?', 'TRI_STATE', 62, 'NEUTRAL'),
                   ('5.1.2', 'Wird dem Kind Achtung und Wertschätzung entgegen gebracht?', 'TRI_STATE', 63, 'NEUTRAL'),
                   ('5.1.3', 'Wird dem Kind bei Krankheit oder Verletzung Trost verweigert?', 'TRI_STATE', 64, 'RISIKO'),
                   ('5.1.4', 'Wird das Kind in Familienaktivitäten miteinbezogen?', 'TRI_STATE', 65, 'NEUTRAL'),
                   ('5.1.5', 'Wird mit dem Kind bei unerwünschtem Verhalten angemessen umgegangen(Grenzsetzung ohne Gewalt, Orientierung situations- u. altersangemessen).?', 'TRI_STATE', 66, 'RISIKO'),
                   ('5.1.6', 'Werden Medien (TV, Video, PC, Smartphone, Audio-CD`s, Zeitschriften, PC-,Konsolen-, Smartphone- und Video-Spiele) zum Erziehungsersatz?', 'TRI_STATE', 67, 'NEUTRAL')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 5.2: Sicherheit und Geborgenheit?
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.2')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('5.2.1', 'Werden Unwohläußerungen des Kindes wahr und ernst genommen?', 'TRI_STATE', 68, 'SCHUTZ'),
                   ('5.2.2', 'Ist das Kind einer gewalttätigen Atmosphäre ausgesetzt?', 'TRI_STATE', 69, 'RISIKO'),
                   ('5.2.3', 'Machen die Mutter / der Vater dem Kind durch Anschreien, Drohungen, grobes Anfassen, Schütteln, Schlagen oder Nichtbeachten / Alleinlassen Angst?', 'TRI_STATE', 70, 'RISIKO'),
                   ('5.2.4', 'Erlebt das Kind einen geregelten Tagesablauf?', 'TRI_STATE', 71, 'NEUTRAL')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 5.3: Schutz vor Gefahren?
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.3')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('5.3.1', 'Wird die Aufsicht alters- und situationsangemessen wahrgenommen?', 'TRI_STATE', 72, 'NEUTRAL'),
                   ('5.3.2', 'Wird das Kind für sein Alter zu lange allein gelassen?', 'TRI_STATE', 73, 'RISIKO'),
                   ('5.3.3', 'Werden Gefahren im Haushalt übersehen (defekte Stromkabel, Steckdosen,ungesicherte Treppen, gefährliches Spielzeug etc.)?', 'TRI_STATE', 74, 'NEUTRAL'),
                   ('5.3.4', 'Werden gefährliche Gegenstände (Medikamente, Putzmittel, Alkohol, Drogen,Waffen, u.a.m.) sicher aufgehoben?', 'TRI_STATE', 75, 'NEUTRAL'),
                   ('5.3.5', 'Werden Haustiere sicher und für das Kind ohne Gesundheitsgefährdunggehalten?', 'TRI_STATE', 76, 'RISIKO'),
                   ('5.3.6', 'Werden Gefahren im Wohnumfeld (Spielplatz, Garten, …) erkannt undbehoben?', 'TRI_STATE', 77, 'SCHUTZ'),
                   ('5.3.7', 'Wenn eine Begleitung auf dem Weg zum Kindergarten / Besuch eines Spielplatzes / auf Wegen im Wohnumfeld nötig ist, wird diese gewährleistet?', 'TRI_STATE', 78, 'SCHUTZ'),
                   ('5.3.8', 'Wird dem Kind altersgemäß ein Umgang mit Gefahren (Umwelt, Dritte Personen, Fremde) vermittelt?', 'TRI_STATE', 79, 'NEUTRAL'),
                   ('5.3.9', 'Das Kind wird einer gefährdenden Umgebung (Bierzelt, verrauchte Kneipe,Haus-Party, …) ausgesetzt?', 'TRI_STATE', 80, 'RISIKO'),
                   ('5.3.10', 'Sicherheit im Auto / Fahrrad: Kein Altersgerechter Kindersitz, keine Kindersicherung?', 'TRI_STATE', 81, 'RISIKO'),
                   ('5.3.11', 'Unangemessener Umgang mit Medien (TV, Video, PC, Smartphone, Audio-CD`s, Zeitschriften, PC-, Konsolen-, Smartphone- und Video-Spiele)?', 'TRI_STATE', 82, 'NEUTRAL'),
                   ('5.3.12', 'Unangemessene Geräuschkulisse durch Medien (s.o.) und/oder Besucher', 'TRI_STATE', 83, 'NEUTRAL'),
                   ('5.3.13', 'intellektuelle Beeinträchtigungen o. ä. in ihrer Wahrnehmung getrübt oder in', 'TRI_STATE', 84, 'NEUTRAL')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 5.4: Gewalt gegen das Kind? (Familiäres bzw. soziales Umfeld)
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.4')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('5.4.1', 'Körperliche Gewalt (Verdachtsmomente / Konkrete Hinweise)?', 'TRI_STATE', 85, 'RISIKO'),
                   ('5.4.2', 'Seelische Gewalt (Verdachtsmomente / Konkrete Hinweise)?', 'TRI_STATE', 86, 'RISIKO'),
                   ('5.4.3', 'Sexuelle Grenzverletzungen / sexuelle Gewalt(Verdachtsmomente / Konkrete Hinweise)?', 'TRI_STATE', 87, 'RISIKO'),
                   ('5.4.4', 'Miterleben Häuslicher Gewalt (Verdachtsmomente / Konkrete Hinweise)?', 'TRI_STATE', 88, 'RISIKO')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 5.5: Individualität und Selbstbestimmung?
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.5')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('5.5.1', 'Wird das Kind als Besitz betrachtet, über den man nach Belieben verfügenkann?', 'TRI_STATE', 91, 'NEUTRAL'),
                   ('5.5.2', 'Lassen Mutter / Vater / Bezugsperson dem Kind Raum und „klammern“ nicht?', 'TRI_STATE', 92, 'RISIKO'),
                   ('5.5.3', 'Existiert ein Platz, an dem das Kind zur Ruhe kommen kann bzw. in Ruhegelassen wird?', 'TRI_STATE', 93, 'SCHUTZ'),
                   ('5.5.4', 'Mutter / Vater / Bezugsperson schenken dem Kind Aufmerksamkeit, wenn essich mit Geräuschen / Handlungen / Worten mitteilen möchte?', 'TRI_STATE', 94, 'SCHUTZ'),
                   ('5.5.5', 'Wird das Kind zur Selbstständigkeit ermutigt?', 'TRI_STATE', 95, 'SCHUTZ'),
                   ('5.5.6', 'Wird das Kind in seiner Bewegungsfreiheit unangemessen eingeschränkt?', 'TRI_STATE', 96, 'NEUTRAL'),
                   ('5.5.7', 'Wird mit dem Kind nur dann geschmust, wenn das eigene Bedürfnis nach Körperkontakt, Zuneigung und Zärtlichkeit befriedigt werden soll?', 'TRI_STATE', 97, 'NEUTRAL'),
                   ('5.5.8', 'Ignoranz der kindlichen Bedürfnisse / der altersentsprechenden Autonomiebedürfnisse?', 'TRI_STATE', 98, 'SCHUTZ')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 5.6: Ansprache / Entwicklungsförderung?
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.6')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('5.6.1', 'Wird das Kind immer wieder angeschaut (Blickkontakt)?', 'TRI_STATE', 99, 'NEUTRAL'),
                   ('5.6.2', 'Wird nicht oder kaum mit dem Kind gesprochen?', 'TRI_STATE', 100, 'RISIKO'),
                   ('5.6.3', 'Wird nicht oder kaum mit dem Kind gespielt?', 'TRI_STATE', 101, 'RISIKO'),
                   ('5.6.4', 'Steht kein altersentsprechendes Beschäftigungsmaterial für das Kind zur Verfügung?', 'TRI_STATE', 102, 'SCHUTZ'),
                   ('5.6.5', 'Wird dem Kind kein ausreichender Körperkontakt angeboten?', 'TRI_STATE', 103, 'NEUTRAL'),
                   ('5.6.6', 'Nicht kindgerechte emotionale Interaktion mit dem Kind (z.B. schroffer/ kühler Umgangston)?', 'TRI_STATE', 104, 'RISIKO'),
                   ('5.6.7', 'Ist das Kind sozial isoliert, kommt es nie mit anderen Kindern/Erwachsenen(z.B. Krippe, Ki Ta, Krabbelgruppe, Freunde des Kindes, etc.) in Kontakt?', 'TRI_STATE', 105, 'RISIKO'),
                   ('5.6.8', 'Eltern durchführbare entwicklungsbedingte Zusatzförderung wird in Anspruch', 'TEXT', 106, 'NEUTRAL')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 5.7: Verlässliche Betreuung?
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.7')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('5.7.1', 'Wird das Kind ständig verschiedenen Personen zur Betreuung überlassen?', 'TRI_STATE', 107, 'NEUTRAL'),
                   ('5.7.2', 'Gefährdende Aufsichtspersonen, z.B. Geschwister unter 12 Jahren, Betrunkene,Fremde?', 'TRI_STATE', 108, 'RISIKO'),
                   ('5.7.3', 'Das Kind hat keine verantwortungsfähige Bezugsperson, die beabsichtigt,langfristig für das Kind zu sorgen?', 'TRI_STATE', 109, 'RISIKO')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 5.9: Kooperationsbereitschaft der Mutter / des Vaters / weiterer Bezugs- bzw. Pflegepersonen? (Bitte unzutreffende Beschreibungen durchstreichen!)
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='5.9')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('5.9.1', 'Wünscht Hilfe?', 'TRI_STATE', 111, 'SCHUTZ'),
                   ('5.9.2', 'Teilt die Problemsicht der Fachkraft?', 'TRI_STATE', 112, 'SCHUTZ'),
                   ('5.9.3', 'Teilt die Ansicht der Fachkraft in Hinsicht auf Lösungs- und Hilfeansätze?', 'TRI_STATE', 113, 'SCHUTZ'),
                   ('5.9.4', 'Hält sich an getroffene Vereinbarung (zu 75%)?', 'TRI_STATE', 114, 'SCHUTZ'),
                   ('5.9.5', 'Kontaktaufnahme: Adressdaten für Anschreiben sind aktuell / Telefondaten für Telefonate sind aktuell bzw. werden aktualisiert?', 'TRI_STATE', 115, 'NEUTRAL'),
                   ('5.9.6', 'Hausbesuche sind möglich (Name am Briefkasten, Klingel funktioniert (??),öffnet bei angekündigtem und unangekündigtem Hausbesuch)?', 'TRI_STATE', 116, 'NEUTRAL'),
                   ('5.9.7', 'Termine und Kontaktabsprachen werden eingehalten?', 'TRI_STATE', 117, 'NEUTRAL'),
                   ('5.9.8', 'Beteiligt sich aktiv und kompromissbereit am Aushandlungsprozess?', 'TRI_STATE', 118, 'NEUTRAL'),
                   ('5.9.9', 'Reagiert im Kontakt nicht aggressiv, distanzlos und/oder ablehnend?', 'TRI_STATE', 119, 'RISIKO'),
                   ('5.9.10', 'Übernimmt Verantwortung für das Kind in allen Fragen?', 'TRI_STATE', 120, 'SCHUTZ'),
                   ('5.9.11', 'Anmerkungen / Ergänzungen? (Bitte ID-Nr angeben, falls möglich) 6 / 8 § 8a SGB VIII – Kooperationsvereinbarung Kinderschutz – Arbeitshilfen Version Handlungsanleitung zur Sicherung des Kindeswohls - Landkreis Mansfeld-Südharz – Jugendamt 2015-09 Ar A b H e - it 3 s - H 0 i 1 lf b e n WE C R h K e Z c E kl U is G te E /D – o M ku ö m g e lic n h ta e t i H on in s w b e o i g s e e n / - G A e l w te i r c s h g t r ig u e p p A e n 1 h 2 a lt b s i p s u u n n k t t e e r - 3 K 6 i M nd o e n s a w te o h – l g K e l f e ä in h k rd in u d n g - 7 / 8 Familiäre Situation? / Risiko-Faktoren 6. (Bitte unzutreffende Beschreibungen durchstreichen und falls notwendig Anmerkungen hinzufügen!) Falls Sie Informationen über die familiäre Situation des Kindes haben oder mit den Eltern oder Erziehungsberechtigten im Gespräch sind, achten Sie auf die Risikofaktoren in der Lebensgeschichte des Kindes. Liegt eine Häufung mehrerer der nun folgenden Risikofaktoren vor? Bitte bedenken Sie: Es handelt sich lediglich um Faktoren, die das Risiko der Vernachlässigung erhöhen. Dies bedeutet im Umkehrschluss aber nicht, dass bei Vorliegen mehrerer dieser Faktoren eine Kindesvernachlässigung zwangsläufig gegeben ist. Zur persönlichen Situation der Mutter / des Vaters / weiterer Bezugs- bzw. Pflegepersonen?', 'TEXT', 121, 'RISIKO')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 6: Familiäre Situation / Risikofaktoren
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='6.0')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('6.5', 'Anmerkungen / Ergänzungen? (Bitte ID-Nr angeben, falls möglich) Version § 8a SGB VIII – Kooperationsvereinbarung Kinderschutz – Arbeitshilfen 7 / 8 2015-09 Handlungsanleitung zur Sicherung des Kindeswohls - Landkreis Mansfeld-Südharz – Jugendamt 8 / 8 WERKZEUGE – Mögliche Hinweise / Gewichtige Anhaltspunkte - Kindeswohlgefährdung - Arbeits Hilfen Checkliste/Dokumentationsbogen - Altersgruppe 12 bis unter 36 Monate – Kleinkind AH-3-01b Wohnsituation: Geeigneter Wach- und Schlafplatz? ID-Nr. (Bitte unzutreffende Beschreibungen durchstreichen und falls notwendig Anmerkungen hinzufügen!)', 'TEXT', 143, 'RISIKO')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 6.1: (Bitte unzutreffende Beschreibungen durchstreichen!)
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='6.1')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('6.1.1', 'selbst erlebte häufige Beziehungsabbrüche, Fremdunterbringung,Mangelerfahrungen in der Kindheit?', 'TRI_STATE', 122, 'RISIKO'),
                   ('6.1.2', 'ausgeprägt negative Emotionalität (leicht auszulösende, intensive Gefühle von Trauer und Niedergeschlagenheit) und/oder hohe Impulsivität?', 'TRI_STATE', 123, 'RISIKO'),
                   ('6.1.3', 'geringe Planungsfähigkeit / unstrukturierten Verhaltensweisen / fehlende', 'TRI_STATE', 124, 'NEUTRAL'),
                   ('6.1.4', 'Ausgeprägte Bindungsstörungen?', 'TRI_STATE', 125, 'NEUTRAL'),
                   ('6.1.5', 'Psychische Erkrankungen (z. B. depressive Störungen)?', 'TRI_STATE', 126, 'NEUTRAL'),
                   ('6.1.6', 'Hinweise auf Drogen-, Alkohol und Medikamentenmissbrauch bzw. –Sucht?', 'TRI_STATE', 127, 'RISIKO'),
                   ('6.1.7', 'Gewalt unter Erwachsenen? Partnerschaftskonflikte? Häusliche Gewalt?', 'TRI_STATE', 128, 'RISIKO')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 6.2: Zur Situation der Familie?
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='6.2')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('6.2.1', 'Finanzielle Probleme (Armut, Arbeitslosigkeit, Trennung, Schulden, …)?', 'TRI_STATE', 129, 'RISIKO'),
                   ('6.2.2', 'mangelnde soziale Unterstützung und Entlastung innerhalb und außerhalb der Familie', 'TRI_STATE', 130, 'RISIKO'),
                   ('6.2.3', 'Familiäre Überforderungssituationen?', 'TRI_STATE', 131, 'RISIKO'),
                   ('6.2.4', 'Fehlen basaler familiärer Organisation (z.B. Nahrungsmitteleinkauf, Kochen,Waschen/Putzen, Müllentsorgung)', 'TRI_STATE', 132, 'RISIKO'),
                   ('6.2.5', 'Soziale Isolierung', 'TRI_STATE', 133, 'RISIKO')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 6.3: Wahrnehmung kindlicher Bedürfnisse und Ressourcen durch die Mutter / den Vater / die Pflegeperson?
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='6.3')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('6.3.1', 'Unkenntnis von Pflege- und Fürsorgebedürfnissen von Kindern', 'TRI_STATE', 134, 'NEUTRAL'),
                   ('6.3.2', 'Überschätzung kindlicher Selbsthilfepotentiale?', 'TRI_STATE', 135, 'NEUTRAL'),
                   ('6.3.3', 'Kooperation - Gewährung von Eigenständigkeit - Autonomie-Förderung /', 'TRI_STATE', 136, 'NEUTRAL'),
                   ('6.3.4', 'Erkennt altersentsprechende Autonomiebestrebungen des Kindes nicht bzw.ermöglicht altersentsprechende Autonomiebestrebungen nicht?', 'TRI_STATE', 137, 'RISIKO')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 6.4: Erwachsenenkonflikte um das Kind?
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='6.4')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('6.4.1', 'Steht das Kind in einem Loyalitätskonflikt zwischen den Bezugspersonen?', 'TRI_STATE', 138, 'NEUTRAL'),
                   ('6.4.2', 'Wird das Kind von einer Bezugsperson für einen Erwachsenenkonflikt genutzt /missbraucht?', 'TRI_STATE', 139, 'RISIKO'),
                   ('6.4.3', 'Das Kind kann keine gute und angemessene Beziehung zu beiden Elternteilenpflegen / gleichzeitig zu Eltern und Großeltern pflegen?', 'TRI_STATE', 140, 'RISIKO'),
                   ('6.4.4', 'Ist das Kind parentifiziert, d.h. übernimmt es die Rolle eines Elternteils bzw.eines Erwachsenen?', 'TRI_STATE', 141, 'NEUTRAL'),
                   ('6.4.5', 'Das Kind darf in der Familie sein Kind-Sein nicht leben?', 'TRI_STATE', 142, 'RISIKO')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 7: Wohnsituation
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='7.0')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('7.1.1', 'Wohnräume sind tagsüber stundenlang abgedunkelt oder künstlich beleuchtet?Erhalten die Wohnräume und kaum Tageslicht?', 'TRI_STATE', 144, 'NEUTRAL'),
                   ('7.1.2', 'Schlafort: Wechselnder Schlafplatz, Verraucht, Laut, Zugluft, nicht beheizbar?', 'TRI_STATE', 145, 'RISIKO'),
                   ('7.1.3', 'Dreck - Feuchtigkeit/ Nässe - Ungeziefer - Schimmel sind beobachtbar', 'TRI_STATE', 146, 'RISIKO'),
                   ('7.1.5', 'Matratze oder Bett entsprechen nicht der Körpergröße des Kindes?', 'TRI_STATE', 147, 'RISIKO'),
                   ('7.1.6', 'Wohnung ist nicht mit ausreichenden und funktionstüchtigen Möbelnausgestattet?', 'TRI_STATE', 148, 'RISIKO'),
                   ('7.1.7', 'Dunkel - Laut (TV läuft ständig, ...) – Verraucht – Zugluft - nicht beheizbar –überheizt – völlige Unsauberkeit – Dreck – Müll - Feuchtigkeit/Nässe', 'TRI_STATE', 149, 'RISIKO'),
                   ('7.1.8', 'Entwicklungs- bzw. altersangemessenes Spielzeug fehlt?', 'TRI_STATE', 150, 'NEUTRAL'),
                   ('7.1.9', 'Wohnung: Nichtbeseitigung von erheblichen Gefahren im Haushalt (z.B.defekte Stromkabel)?', 'TRI_STATE', 151, 'RISIKO'),
                   ('7.1.10', 'Keine Möglichkeiten zum Kochen und Kühlen?', 'TRI_STATE', 152, 'RISIKO'),
                   ('7.1.11', 'Wohnung zeigt Spuren äußerer Gewaltanwendung?', 'TRI_STATE', 153, 'RISIKO'),
                   ('7.1.12', 'Obdachlosigkeit oder extrem kleine bzw. gesundheitsgefährdende Unterkunft', 'TRI_STATE', 154, 'RISIKO'),
                   ('7.1.13', 'Anmerkungen / Ergänzungen? (Bitte ID-Nr angeben, falls möglich) ID-Nr. Zusätzliche Beschreibungen / Anmerkungen / Ergänzungen', 'TEXT', 155, 'NEUTRAL')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

-- subsection 8: Zusätzliche Beschreibungen / Anmerkungen
WITH inst AS (SELECT id AS instrument_id FROM ks_instrumente WHERE code='AH-3-01b' AND version='2015-09'),
     sec AS (SELECT s.id AS section_id FROM ks_sections s JOIN inst ON s.instrument_id=inst.instrument_id WHERE s.section_no='8.0')
INSERT INTO ks_items (section_id, item_no, text, answer_type, order_index, polarity)
SELECT sec.section_id, i.item_no, i.text, i.answer_type, i.order_index, i.polarity
FROM sec JOIN (VALUES
                   ('8.1', '8 / 8 § 8a SGB VIII – Kooperationsvereinbarung Kinderschutz – Arbeitshilfen Version Handlungsanleitung zur Sicherung des Kindeswohls - Landkreis Mansfeld-Südharz – Jugendamt 2015-09', 'TRI_STATE', 156, 'SCHUTZ')
) AS i(item_no, text, answer_type, order_index, polarity) ON TRUE
    ON CONFLICT (section_id, item_no) DO UPDATE SET
    text=EXCLUDED.text, answer_type=EXCLUDED.answer_type, order_index=EXCLUDED.order_index, polarity=EXCLUDED.polarity;

COMMIT;