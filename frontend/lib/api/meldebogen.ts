import { apiFetch } from "@/lib/api";

export interface MeldebogenListItem {
    id: number;
    falloeffnungId: number;
    eingangsdatum: string;
    meldungart: string | null;
    ersteinschaetzung: string | null;
    handlungsdringlichkeit: string | null;
    createdByDisplayName: string;
    createdAt: string;
}

export interface MeldebogenResponse {
    id: number;
    falloeffnungId: number;
    eingangsdatum: string;
    erfassendeFachkraft: string | null;
    meldungart: string | null;
    melderName: string | null;
    melderKontakt: string | null;
    melderBeziehungKind: string | null;
    melderGlaubwuerdigkeit: string | null;
    schilderung: string | null;
    kindAktuellerAufenthalt: string | null;
    belastungKoerperlErkrankung: boolean;
    belastungPsychErkrankung: boolean;
    belastungSucht: boolean;
    belastungHaeuslicheGewalt: boolean;
    belastungSuizidgefahr: boolean;
    belastungGewalttaetigeErz: boolean;
    belastungSozialeIsolation: boolean;
    belastungSonstiges: string | null;
    ersteinschaetzung: string | null;
    handlungsdringlichkeit: string | null;
    ersteinschaetzungFreitext: string | null;
    createdByDisplayName: string;
    createdAt: string;
    updatedAt: string;
}

export type MeldebogenRequest = Omit<MeldebogenResponse,
    "id" | "falloeffnungId" | "createdByDisplayName" | "createdAt" | "updatedAt">;

// ─── Konstanten ───────────────────────────────────────────────────────────────

export const MELDUNGART_LABELS: Record<string, string> = {
    PERSOENLICH: "Persönlich",
    TELEFONISCH: "Telefonisch",
    SCHRIFTLICH:  "Schriftlich",
    EMAIL:        "E-Mail",
    ANONYM:       "Anonym",
};

export const ERSTEINSCHAETZUNG_LABELS: Record<string, string> = {
    KEINE:     "Keine Gefährdung",
    GERING:    "Geringe Gefährdung",
    AKUT:      "Akute Gefährdung",
    CHRONISCH: "Chronische Gefährdung",
};

export const ERSTEINSCHAETZUNG_TONE: Record<string, string> = {
    KEINE:     "text-emerald-600",
    GERING:    "text-yellow-600",
    AKUT:      "text-red-600",
    CHRONISCH: "text-orange-600",
};

export const DRINGLICHKEIT_LABELS: Record<string, string> = {
    SOFORT:          "Sofort handeln",
    INNERHALB_24H:   "Innerhalb 24 Stunden",
    INNERHALB_WOCHE: "Innerhalb einer Woche",
    SPAETER:         "Zu einem späteren Zeitpunkt",
};

export const GLAUBWUERDIGKEIT_LABELS: Record<string, string> = {
    GUT:    "Gut",
    MITTEL: "Mittel",
    GERING: "Gering",
};

// ─── API-Client ───────────────────────────────────────────────────────────────

export const meldebogenApi = {
    list(fallId: number): Promise<MeldebogenListItem[]> {
        return apiFetch(`/falloeffnungen/${fallId}/meldeboegen`);
    },
    get(fallId: number, id: number): Promise<MeldebogenResponse> {
        return apiFetch(`/falloeffnungen/${fallId}/meldeboegen/${id}`);
    },
    create(fallId: number, req: MeldebogenRequest): Promise<MeldebogenResponse> {
        return apiFetch(`/falloeffnungen/${fallId}/meldeboegen`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req),
        });
    },
    update(fallId: number, id: number, req: MeldebogenRequest): Promise<MeldebogenResponse> {
        return apiFetch(`/falloeffnungen/${fallId}/meldeboegen/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req),
        });
    },
};
