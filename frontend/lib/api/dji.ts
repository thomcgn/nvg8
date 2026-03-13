import { apiFetch } from "@/lib/api";

export type DjiFormTypCode =
  | "SICHERHEITSEINSCHAETZUNG"
  | "RISIKOEINSCHAETZUNG"
  | "ERZIEHUNGSFAEHIGKEIT_PFLEGE"
  | "ERZIEHUNGSFAEHIGKEIT_BINDUNG"
  | "ERZIEHUNGSFAEHIGKEIT_REGELN"
  | "ERZIEHUNGSFAEHIGKEIT_FOERDERUNG"
  | "BEDUERFNIS_SCHEMA"
  | "FOERDERUNGSBEDARF"
  | "RESSOURCEN_KIND"
  | "VERAENDERUNGSBEREITSCHAFT";

export type DjiBewertungstyp = "FREITEXT" | "BOOLEAN_MIT_BELEGE" | "SECHSSTUFEN";

export interface DjiFormTypItem {
  code: DjiFormTypCode;
  label: string;
  beschreibung: string;
}

export interface DjiFormTypListResponse {
  formTypen: DjiFormTypItem[];
}

export interface GesamtOption {
  code: string;
  label: string;
}

export interface DjiKatalogItem {
  code: string;
  label: string;
  bereich: string | null;
  bewertungstyp: DjiBewertungstyp;
}

export interface DjiKatalogResponse {
  formTyp: DjiFormTypCode;
  formTypLabel: string;
  beschreibung: string;
  gesamteinschaetzungOptionen: GesamtOption[];
  positionen: DjiKatalogItem[];
}

export interface DjiPositionResponse {
  positionCode: string;
  label: string;
  bereich: string | null;
  bewertungstyp: DjiBewertungstyp;
  belege: string | null;
  bewertungBool: boolean | null;
  bewertungStufe: number | null;
}

export interface DjiAssessmentListItem {
  id: number;
  falloeffnungId: number;
  formTyp: DjiFormTypCode;
  formTypLabel: string;
  bewertungsdatum: string;
  gesamteinschaetzung: string | null;
  gesamteinschaetzungLabel: string | null;
  createdByDisplayName: string;
  createdAt: string;
}

export interface DjiAssessmentResponse {
  id: number;
  falloeffnungId: number;
  formTyp: DjiFormTypCode;
  formTypLabel: string;
  bewertungsdatum: string;
  positionen: DjiPositionResponse[];
  gesamteinschaetzung: string | null;
  gesamteinschaetzungLabel: string | null;
  gesamtfreitext: string | null;
  createdByDisplayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DjiPositionRequest {
  positionCode: string;
  belege?: string;
  bewertungBool?: boolean | null;
  bewertungStufe?: number | null;
}

export interface CreateDjiAssessmentRequest {
  formTyp: DjiFormTypCode;
  bewertungsdatum: string;
  positionen: DjiPositionRequest[];
  gesamteinschaetzung?: string | null;
  gesamtfreitext?: string | null;
}

export const SECHSSTUFEN_LABELS: Record<number, string> = {
  0: "Sehr gut",
  1: "Gut",
  2: "Ausreichend",
  3: "Grenzwertig",
  4: "Unzureichend",
  5: "Deutlich unzureichend",
};

export const SECHSSTUFEN_TONE: Record<number, string> = {
  0: "text-emerald-600",
  1: "text-green-600",
  2: "text-yellow-600",
  3: "text-orange-500",
  4: "text-red-500",
  5: "text-red-700",
};

export const SECHSSTUFEN_ACTIVE: Record<number, string> = {
  0: "bg-emerald-50 border-emerald-400 text-emerald-700",
  1: "bg-green-50 border-green-400 text-green-700",
  2: "bg-yellow-50 border-yellow-400 text-yellow-700",
  3: "bg-orange-50 border-orange-400 text-orange-700",
  4: "bg-red-50 border-red-400 text-red-700",
  5: "bg-red-100 border-red-600 text-red-800",
};

export const SECHSSTUFEN = [0, 1, 2, 3, 4, 5] as const;

export const GESAMT_TONE: Record<string, string> = {
  KEIN_RISIKO: "text-emerald-600",
  GERINGES_RISIKO: "text-yellow-600",
  ERHOEHTES_RISIKO: "text-orange-500",
  HOHES_RISIKO: "text-red-600",
  KEIN_AKUTER_HANDLUNGSBEDARF: "text-emerald-600",
  HANDLUNGSBEDARF_BALD: "text-orange-500",
  HANDLUNGSBEDARF_SOFORT: "text-red-600",
  AUSREICHEND: "text-emerald-600",
  EINGESCHRAENKT: "text-orange-500",
  NICHT_AUSREICHEND: "text-red-600",
  GERING_BIS_FEHLEND: "text-red-600",
};

export const djiApi = {
  formTypen(fallId: number): Promise<DjiFormTypListResponse> {
    return apiFetch(`/falloeffnungen/${fallId}/dji/formtypen`);
  },

  katalog(fallId: number, formTyp: DjiFormTypCode): Promise<DjiKatalogResponse> {
    return apiFetch(`/falloeffnungen/${fallId}/dji/katalog?formTyp=${formTyp}`);
  },

  list(fallId: number): Promise<DjiAssessmentListItem[]> {
    return apiFetch(`/falloeffnungen/${fallId}/dji`);
  },

  get(fallId: number, id: number): Promise<DjiAssessmentResponse> {
    return apiFetch(`/falloeffnungen/${fallId}/dji/${id}`);
  },

  create(fallId: number, req: CreateDjiAssessmentRequest): Promise<DjiAssessmentResponse> {
    return apiFetch(`/falloeffnungen/${fallId}/dji`, {
      method: "POST",
      body: req,
    });
  },

  update(fallId: number, id: number, req: CreateDjiAssessmentRequest): Promise<DjiAssessmentResponse> {
    return apiFetch(`/falloeffnungen/${fallId}/dji/${id}`, {
      method: "PUT",
      body: req,
    });
  },
};
