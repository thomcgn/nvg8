import type { WorkflowStepKey } from "./meldungEditor.types";

export const MELDEWEG = ["TELEFON", "EMAIL", "PERSOENLICH", "BRIEF", "SONSTIGES"] as const;
export const MELDEWEG_LABEL: Record<(typeof MELDEWEG)[number], string> = {
  TELEFON: "Telefon",
  EMAIL: "E-Mail",
  PERSOENLICH: "Persönlich",
  BRIEF: "Brief",
  SONSTIGES: "Sonstiges",
};

export const DRING = ["AKUT_HEUTE", "ZEITNAH_24_48H", "BEOBACHTEN", "UNKLAR"] as const;
export const DRING_LABEL: Record<(typeof DRING)[number], string> = {
  AKUT_HEUTE: "Akut (heute)",
  ZEITNAH_24_48H: "Zeitnah (24–48h)",
  BEOBACHTEN: "Beobachten",
  UNKLAR: "Unklar",
};

export const DATENB = ["BEOBACHTUNG", "ERZAEHLUNG", "DOKUMENT", "UNKLAR"] as const;
export const DATENB_LABEL: Record<(typeof DATENB)[number], string> = {
  BEOBACHTUNG: "Beobachtung",
  ERZAEHLUNG: "Erzählung",
  DOKUMENT: "Dokument",
  UNKLAR: "Unklar",
};

export const AMPEL = ["GRUEN", "GELB", "ROT"] as const;
export const AMPEL_LABEL: Record<(typeof AMPEL)[number], string> = {
  GRUEN: "Grün",
  GELB: "Gelb",
  ROT: "Rot",
};

export const OBS_QUELLE = ["EIGENE_WAHRNEHMUNG", "KIND", "DRITTE", "UNBEKANNT"] as const;
export const OBS_QUELLE_LABEL: Record<(typeof OBS_QUELLE)[number], string> = {
  EIGENE_WAHRNEHMUNG: "Eigene Wahrnehmung",
  KIND: "Kind",
  DRITTE: "Dritte",
  UNBEKANNT: "Unbekannt",
};

export const OBS_ORT = ["ZUHAUSE", "SCHULE_KITA", "OEFFENTLICH", "SONSTIGES"] as const;
export const OBS_ORT_LABEL: Record<(typeof OBS_ORT)[number], string> = {
  ZUHAUSE: "Zuhause",
  SCHULE_KITA: "Schule/Kita",
  OEFFENTLICH: "Öffentlich",
  SONSTIGES: "Sonstiges",
};

export const OBS_ZEITRAUM = ["EINMALIG", "WIEDERHOLT", "UNBEKANNT"] as const;
export const OBS_ZEITRAUM_LABEL: Record<(typeof OBS_ZEITRAUM)[number], string> = {
  EINMALIG: "Einmalig",
  WIEDERHOLT: "Wiederholt",
  UNBEKANNT: "Unbekannt",
};

export const SICHT = ["INTERN", "EXTERN"] as const;
export const SICHT_LABEL: Record<(typeof SICHT)[number], string> = {
  INTERN: "Intern",
  EXTERN: "Extern",
};

export const ABW_AUTO = ["GLEICH", "NIEDRIGER", "HOEHER"] as const;
export const ABW_AUTO_LABEL: Record<(typeof ABW_AUTO)[number], string> = {
  GLEICH: "Keine Abweichung (entspricht Vorbewertung)",
  NIEDRIGER: "Abweichung: niedriger als Vorbewertung",
  HOEHER: "Abweichung: höher als Vorbewertung",
};

export const JANEINUNKLAR = ["JA", "NEIN", "UNKLAR"] as const;
export const JNU_LABEL: Record<(typeof JANEINUNKLAR)[number], string> = {
  JA: "Ja",
  NEIN: "Nein",
  UNKLAR: "Unklar",
};

export const KONTAKT_MIT = ["KIND", "MUTTER", "VATER", "BEZUGSPERSON", "JUGENDAMT", "ARZT", "SONSTIGE"] as const;
export const KONTAKT_MIT_LABEL: Record<(typeof KONTAKT_MIT)[number], string> = {
  KIND: "Kind",
  MUTTER: "Mutter",
  VATER: "Vater",
  BEZUGSPERSON: "Bezugsperson",
  JUGENDAMT: "Jugendamt",
  ARZT: "Arzt / Ärztin",
  SONSTIGE: "Sonstige",
};

export const KONTAKT_STATUS = ["GEPLANT", "ERREICHT", "NICHT_ERREICHT", "ABGEBROCHEN"] as const;
export const KONTAKT_STATUS_LABEL: Record<(typeof KONTAKT_STATUS)[number], string> = {
  GEPLANT: "Geplant",
  ERREICHT: "Erreicht",
  NICHT_ERREICHT: "Nicht erreicht",
  ABGEBROCHEN: "Abgebrochen",
};

export const KONTAKTSTATUS = ["ERREICHT", "NICHT_ERREICHT", "VERWEIGERT", "OFFEN"] as const;
export const KONTAKTSTATUS_LABEL: Record<(typeof KONTAKTSTATUS)[number], string> = {
  ERREICHT: "Erreicht",
  NICHT_ERREICHT: "Nicht erreicht",
  VERWEIGERT: "Verweigert",
  OFFEN: "Offen",
};

export const KONTAKTART = ["TELEFON", "EMAIL", "PERSOENLICH", "SCHRIFTLICH", "SONSTIGES"] as const;
export const KONTAKTART_LABEL: Record<(typeof KONTAKTART)[number], string> = {
  TELEFON: "Telefon",
  EMAIL: "E-Mail",
  PERSOENLICH: "Persönlich",
  SCHRIFTLICH: "Schriftlich",
  SONSTIGES: "Sonstiges",
};

export const WORKFLOW_STEPS: Array<{ key: WorkflowStepKey; label: string; subtitle: string }> = [
  { key: "aufnahme", label: "1. Aufnahme", subtitle: "Basisdaten, Melder, Anlass, Beobachtungen" },
  { key: "einschaetzung", label: "2. Einschätzung", subtitle: "Fachbewertung, Kinderschutzbogen, DJI" },
  { key: "massnahmen", label: "3. Schutz & Kontakte", subtitle: "Akutlage, Jugendamt, Kontakte, Hausbesuch, Schutzplan" },
  { key: "planung", label: "4. Planung", subtitle: "Verantwortung, Überprüfung, Zusammenfassung" },
  { key: "abschluss", label: "5. Abschluss", subtitle: "Spiegeln, Änderungsgrund, finaler Abschluss" },
];

