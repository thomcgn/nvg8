import { apiFetch } from "@/lib/api";

const base = (fallId: number) => `/falloeffnungen/${fallId}/kinderschutzbogen`;

// ─── Typen ──────────────────────────────────────────────────────────────────

export type KatalogItem = {
    code: string;
    label: string;
    bereich: string;
    bereichLabel: string;
};

export type KatalogResponse = {
    altersgruppe: string;
    altergruppeLabel: string;
    items: KatalogItem[];
};

export type BewertungResponse = {
    itemCode: string;
    itemLabel: string;
    bereich: string;
    rating: number | null;
    notiz: string | null;
};

export type KinderschutzbogenListItem = {
    id: number;
    falloeffnungId: number;
    altersgruppe: string;
    altergruppeLabel: string;
    bewertungsdatum: string;
    gesamteinschaetzungAuto: number;
    gesamteinschaetzungManuell: number | null;
    createdByDisplayName: string;
    createdAt: string;
};

export type KinderschutzbogenResponse = {
    id: number;
    falloeffnungId: number;
    altersgruppe: string;
    altergruppeLabel: string;
    bewertungsdatum: string;
    bewertungen: BewertungResponse[];
    gesamteinschaetzungAuto: number;
    gesamteinschaetzungManuell: number | null;
    gesamteinschaetzungFreitext: string | null;
    createdByDisplayName: string;
    createdAt: string;
    updatedAt: string;
};

export type BewertungRequest = {
    itemCode: string;
    rating: number | null;
    notiz: string | null;
};

export type CreateKinderschutzbogenRequest = {
    bewertungsdatum: string;
    bewertungen: BewertungRequest[];
    gesamteinschaetzungManuell: number | null;
    gesamteinschaetzungFreitext: string | null;
};

// ─── API ────────────────────────────────────────────────────────────────────

export const kinderschutzbogenApi = {
    katalog: (fallId: number) =>
        apiFetch<KatalogResponse>(`${base(fallId)}/katalog`),

    list: (fallId: number) =>
        apiFetch<KinderschutzbogenListItem[]>(base(fallId)),

    get: (fallId: number, id: number) =>
        apiFetch<KinderschutzbogenResponse>(`${base(fallId)}/${id}`),

    create: (fallId: number, req: CreateKinderschutzbogenRequest) =>
        apiFetch<KinderschutzbogenResponse>(base(fallId), { method: "POST", body: req }),

    update: (fallId: number, id: number, req: CreateKinderschutzbogenRequest) =>
        apiFetch<KinderschutzbogenResponse>(`${base(fallId)}/${id}`, { method: "PUT", body: req }),
};

// ─── Hilfsfunktionen ────────────────────────────────────────────────────────

export const RATINGS = [-2, -1, 1, 2] as const;
export type Rating = (typeof RATINGS)[number];

export const RATING_LABELS: Record<number, string> = {
    [-2]: "sehr schlecht",
    [-1]: "schlecht",
    [1]: "ausreichend",
    [2]: "gut",
};

export const RATING_ACTIVE: Record<number, string> = {
    [-2]: "bg-red-600 text-white border-red-700",
    [-1]: "bg-amber-500 text-white border-amber-600",
    [1]:  "bg-lime-500  text-white border-lime-600",
    [2]:  "bg-green-600 text-white border-green-700",
};

export const RATING_INACTIVE: Record<number, string> = {
    [-2]: "bg-red-50   text-red-700   border-red-200   hover:bg-red-100",
    [-1]: "bg-amber-50  text-amber-700  border-amber-200  hover:bg-amber-100",
    [1]:  "bg-lime-50   text-lime-700   border-lime-200   hover:bg-lime-100",
    [2]:  "bg-green-50  text-green-700  border-green-200  hover:bg-green-100",
};

export function autoScoreLabel(score: number): string {
    if (score >= 1.5) return "gut";
    if (score >= 0.5) return "ausreichend";
    if (score >= -0.5) return "schlecht";
    if (score < -0.5) return "sehr schlecht";
    return "—";
}

export function autoScoreTone(score: number): string {
    if (score >= 1.5) return "text-green-700";
    if (score >= 0.5) return "text-lime-700";
    if (score >= -0.5) return "text-amber-700";
    return "text-red-700";
}
