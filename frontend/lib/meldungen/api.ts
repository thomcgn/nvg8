import { apiFetch } from "@/lib/api";

export type ChangeReason = "fix" | "nachtrag" | "update" | "reassessment";

export type MeldungDetail = {
    meldungId: string;
    fallId: string;
    current: {
        id: string;
        versionNumber: number;
        state: "final" | "draft" | "void";
        changeReason?: ChangeReason | null;
        infoEffectiveAt?: string | null;
        reasonText?: string | null;
        finalizedAt?: string | null;
        data: any;
        changeSummary?: string | null;
    };
    draft: null | {
        versionId: string;
        versionNumber: number;
        createdAt: string;
        createdByName: string;
    };
    timeline: Array<{
        id: string;
        versionNumber: number;
        state: "final" | "draft" | "void";
        createdAt: string;
        createdByName: string;
        finalizedAt?: string | null;
        changeReason?: ChangeReason | null;
        infoEffectiveAt?: string | null;
        changeSummary?: string | null;
    }>;
};

export type MeldungVersion = {
    id: string;
    meldungId: string;
    versionNumber: number;
    state: "final" | "draft" | "void";
    basedOnVersionId?: string | null;
    changeReason?: ChangeReason | null;
    infoEffectiveAt?: string | null;
    reasonText?: string | null;
    createdAt: string;
    createdByName: string;
    finalizedAt?: string | null;
    finalizedByName?: string | null;
    data: any;
    changedFields?: any; // list/array from backend (JsonNode)
    changeSummary?: string | null;
};

export type CompareResponse = {
    fromVersionId: string;
    toVersionId: string;
    changedFields: string[];
    diff: {
        updated: Array<{ path: string; before: any; after: any }>;
        added: Array<{ path: string; value: any }>;
        removed: Array<{ path: string; value: any }>;
    };
};

export const MeldungenApi = {
    getDetail: (meldungId: string) =>
        apiFetch(`/meldungen/${meldungId}`),

    listByFallId: (fallId: string | number) =>
        apiFetch<FallMeldungListItem[]>(`/falloeffnungen/${fallId}/meldungen`),

    createDraft: (meldungId: string) =>
        apiFetch<{ versionId: string }>(`/meldungen/${meldungId}/versions`, {
            method: "POST",
            body: { basedOn: "current" },
        }),

    getVersion: (versionId: string) =>
        apiFetch<MeldungVersion>(`/meldungen/versions/${versionId}`),

    patchDraft: (versionId: string, patch: { data?: any; changeReason?: ChangeReason | null; infoEffectiveAt?: string | null; reasonText?: string | null }) =>
        apiFetch<void>(`/meldungen/versions/${versionId}`, {
            method: "PATCH",
            body: patch,
        }),

    finalizeDraft: (versionId: string, body: { changeReason: ChangeReason; infoEffectiveAt?: string; reasonText?: string }) =>
        apiFetch<void>(`/meldungen/versions/${versionId}/finalize`, {
            method: "POST",
            body,
        }),

    discardDraft: (versionId: string) =>
        apiFetch<void>(`/meldungen/versions/${versionId}/discard`, {
            method: "POST",
        }),

    compare: (a: string, b: string) =>
        apiFetch<CompareResponse>(`/meldungen/versions/${a}/compare/${b}`),
};
export type FallMeldungListItem = {
    id: number;
    versionNo: number;
    current: boolean;
    status: "ENTWURF" | "ABGESCHLOSSEN" | string;
    type: "ERSTMELDUNG" | "MELDUNG" | "KORREKTUR" | string;
    createdAt: string;
    createdByDisplayName: string;
    supersedesId: number | null;
    correctsId: number | null;
};