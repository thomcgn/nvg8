import { apiFetch } from "@/lib/api";

export interface MassnahmeResponse {
    id: number;
    position: number;
    massnahme: string;
    verantwortlich: string | null;
    bisDatum: string | null;
    status: string;
}

export interface SchutzplanListItem {
    id: number;
    falloeffnungId: number;
    erstelltAm: string;
    gueltigBis: string | null;
    status: string;
    anzahlMassnahmen: number;
    createdByDisplayName: string;
    createdAt: string;
}

export interface SchutzplanResponse {
    id: number;
    falloeffnungId: number;
    erstelltAm: string;
    gueltigBis: string | null;
    status: string;
    gefaehrdungssituation: string | null;
    vereinbarungen: string | null;
    beteiligte: string | null;
    naechsterTermin: string | null;
    gesamtfreitext: string | null;
    massnahmen: MassnahmeResponse[];
    createdByDisplayName: string;
    createdAt: string;
    updatedAt: string;
}

export interface MassnahmeRequest {
    massnahme: string;
    verantwortlich?: string;
    bisDatum?: string | null;
    status?: string;
}

export interface SchutzplanRequest {
    erstelltAm: string;
    gueltigBis?: string | null;
    status?: string;
    gefaehrdungssituation?: string | null;
    vereinbarungen?: string | null;
    beteiligte?: string | null;
    naechsterTermin?: string | null;
    gesamtfreitext?: string | null;
    massnahmen: MassnahmeRequest[];
}

// ─── Konstanten ───────────────────────────────────────────────────────────────

export const SCHUTZPLAN_STATUS_LABELS: Record<string, string> = {
    AKTIV:        "Aktiv",
    ABGESCHLOSSEN: "Abgeschlossen",
};

export const MASSNAHME_STATUS_LABELS: Record<string, string> = {
    OFFEN:          "Offen",
    IN_UMSETZUNG:   "In Umsetzung",
    ERLEDIGT:       "Erledigt",
    NICHT_ERLEDIGT: "Nicht erledigt",
};

export const MASSNAHME_STATUS_TONE: Record<string, string> = {
    OFFEN:          "text-brand-text2",
    IN_UMSETZUNG:   "text-blue-600",
    ERLEDIGT:       "text-emerald-600",
    NICHT_ERLEDIGT: "text-red-600",
};

// ─── API-Client ───────────────────────────────────────────────────────────────

export const schutzplanApi = {
    list(fallId: number): Promise<SchutzplanListItem[]> {
        return apiFetch(`/falloeffnungen/${fallId}/schutzplaene`);
    },
    get(fallId: number, id: number): Promise<SchutzplanResponse> {
        return apiFetch(`/falloeffnungen/${fallId}/schutzplaene/${id}`);
    },
    create(fallId: number, req: SchutzplanRequest): Promise<SchutzplanResponse> {
        return apiFetch(`/falloeffnungen/${fallId}/schutzplaene`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req),
        });
    },
    update(fallId: number, id: number, req: SchutzplanRequest): Promise<SchutzplanResponse> {
        return apiFetch(`/falloeffnungen/${fallId}/schutzplaene/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req),
        });
    },
};
