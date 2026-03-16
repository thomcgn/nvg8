import type { MeldungDraftRequest } from "@/lib/api/meldung";

export type WorkflowStepKey = "aufnahme" | "einschaetzung" | "massnahmen" | "planung" | "abschluss";

export type StepStatus = "open" | "done";

export type ObservationDraft = NonNullable<MeldungDraftRequest["observations"]>[number];
export type TagDraft = NonNullable<ObservationDraft["tags"]>[number];

export type MelderInfo = {
  melderName: string;
  melderKontakt: string;
  melderBeziehungKind: string;
  melderGlaubwuerdigkeit: string | null;
  kindAktuellerAufenthalt: string;
  belastungKoerperlErkrankung: boolean;
  belastungPsychErkrankung: boolean;
  belastungSucht: boolean;
  belastungHaeuslicheGewalt: boolean;
  belastungSuizidgefahr: boolean;
  belastungGewalttaetigeErz: boolean;
  belastungSozialeIsolation: boolean;
  belastungSonstiges: string;
};

