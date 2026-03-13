import { apiFetch } from "@/lib/api";

export interface HausbesuchListItem {
    id: number;
    falloeffnungId: number;
    besuchsdatum: string;
    einschaetzungAmpel: string | null;
    createdByDisplayName: string;
    createdAt: string;
}

export interface HausbesuchResponse {
    id: number;
    falloeffnungId: number;
    besuchsdatum: string;
    besuchszeitVon: string | null;
    besuchszeitBis: string | null;
    anwesende: string | null;
    whgOrdnung: string | null;
    whgHygiene: string | null;
    whgNahrungsversorgung: string | null;
    whgUnfallgefahren: string | null;
    whgSonstiges: string | null;
    kindErscheinungsbild: string | null;
    kindVerhalten: string | null;
    kindStimmung: string | null;
    kindAeusserungen: string | null;
    kindHinweiseGefaehrdung: string | null;
    bpErscheinungsbild: string | null;
    bpVerhalten: string | null;
    bpUmgangKind: string | null;
    bpKooperation: string | null;
    einschaetzungAmpel: string | null;
    einschaetzungText: string | null;
    naechsteSchritte: string | null;
    naechsterTermin: string | null;
    createdByDisplayName: string;
    createdAt: string;
    updatedAt: string;
}

export type HausbesuchRequest = Omit<HausbesuchResponse,
    "id" | "falloeffnungId" | "createdByDisplayName" | "createdAt" | "updatedAt">;

// ─── Konstanten ───────────────────────────────────────────────────────────────

export const AMPEL_LABELS: Record<string, string> = {
    GRUEN: "Grün – keine akute Gefährdung",
    GELB:  "Gelb – Beobachtungsbedarf",
    ROT:   "Rot – Handlungsbedarf",
};

export const AMPEL_CLASSES: Record<string, string> = {
    GRUEN: "bg-emerald-100 text-emerald-700 border-emerald-300",
    GELB:  "bg-yellow-100 text-yellow-700 border-yellow-300",
    ROT:   "bg-red-100 text-red-700 border-red-300",
};

export const AMPEL_DOT: Record<string, string> = {
    GRUEN: "bg-emerald-500",
    GELB:  "bg-yellow-400",
    ROT:   "bg-red-500",
};

export const BEFUND_LABELS: Record<string, string> = {
    GUT:        "Gut",
    AUSREICHEND: "Ausreichend",
    MANGELHAFT:  "Mangelhaft",
};

export const BEFUND_TONE: Record<string, string> = {
    GUT:        "text-emerald-600",
    AUSREICHEND: "text-yellow-600",
    MANGELHAFT:  "text-red-600",
};

export const STIMMUNG_LABELS: Record<string, string> = {
    FREUDIG:       "Freudig",
    AUSGEGLICHEN:  "Ausgeglichen",
    ZURUECKGEZOGEN: "Zurückgezogen",
    AENGSTLICH:    "Ängstlich",
    AUFFAELLIG:    "Auffällig",
};

export const KOOPERATION_LABELS: Record<string, string> = {
    GUT:           "Gut",
    EINGESCHRAENKT: "Eingeschränkt",
    VERWEIGERT:    "Verweigert",
};

// ─── API-Client ───────────────────────────────────────────────────────────────

export const hausbesuchApi = {
    list(fallId: number): Promise<HausbesuchListItem[]> {
        return apiFetch(`/falloeffnungen/${fallId}/hausbesuche`);
    },
    get(fallId: number, id: number): Promise<HausbesuchResponse> {
        return apiFetch(`/falloeffnungen/${fallId}/hausbesuche/${id}`);
    },
    create(fallId: number, req: HausbesuchRequest): Promise<HausbesuchResponse> {
        return apiFetch(`/falloeffnungen/${fallId}/hausbesuche`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req),
        });
    },
    update(fallId: number, id: number, req: HausbesuchRequest): Promise<HausbesuchResponse> {
        return apiFetch(`/falloeffnungen/${fallId}/hausbesuche/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req),
        });
    },
};
