import { apiFetch } from "@/lib/api";

/**
 * Backend: /falloeffnungen/{fallId}/meldungen
 */

export type MeldungListItemResponse = {
    id: number;
    versionNo: number;
    current: boolean;
    status: string;
    type: string;
    createdAt: string | null;
    createdByDisplayName: string | null;
    supersedesId: number | null;
    correctsId: number | null;
};

export type MeldungChangeResponse = {
    id: number;
    section: string;
    fieldPath: string | null;
    oldValue: string | null;
    newValue: string | null;
    reason: string | null;
    changedAt: string | null;
    changedByDisplayName: string | null;
};

export type MeldungResponse = {
    id: number;
    fallId: number;
    versionNo: number;
    current: boolean;
    status: string;
    type: string;

    createdAt: string | null;
    updatedAt: string | null;
    createdByDisplayName: string | null;

    supersedesId: number | null;
    correctsId: number | null;

    // Meta
    erfasstVonRolle: string | null;
    meldeweg: string | null;
    meldewegSonstiges: string | null;
    meldendeStelleKontakt: string | null;
    dringlichkeit: string | null;
    datenbasis: string | null;
    einwilligungVorhanden: boolean | null;
    schweigepflichtentbindungVorhanden: boolean | null;

    // Inhalt
    kurzbeschreibung: string | null;

    // Fach
    fachAmpel: string | null;
    fachText: string | null;
    abweichungZurAuto: string | null;
    abweichungsBegruendung: string | null;

    // Akut
    akutGefahrImVerzug: boolean;
    akutBegruendung: string | null;
    akutNotrufErforderlich: boolean | null;
    akutKindSicherUntergebracht: string | null;

    // Planung
    verantwortlicheFachkraftUserId: number | null;
    naechsteUeberpruefungAm: string | null; // LocalDate
    zusammenfassung: string | null;

    // Sections
    anlassCodes: string[];
    jugendamt: {
        informiert: string | null;
        kontaktAm: string | null; // Instant
        kontaktart: string | null;
        aktenzeichen: string | null;
        begruendung: string | null;
    } | null;

    contacts: Array<{
        id: number;
        kontaktMit: string | null;
        kontaktAm: string | null; // Instant
        status: string | null;
        notiz: string | null;
        ergebnis: string | null;
    }>;

    extern: Array<{
        id: number;
        stelle: string | null;
        stelleSonstiges: string | null;
        am: string | null; // Instant
        begruendung: string | null;
        ergebnis: string | null;
    }>;

    attachments: Array<{
        id: number;
        fileId: number;
        typ: string | null;
        titel: string | null;
        beschreibung: string | null;
        sichtbarkeit: string | null;
        rechtsgrundlageHinweis: string | null;
    }>;

    observations: Array<{
        id: number;
        zeitpunkt: string | null; // Instant
        zeitraum: string | null;
        ort: string | null;
        ortSonstiges: string | null;
        quelle: string | null;
        text: string | null;
        woertlichesZitat: string | null;
        koerperbefund: string | null;
        verhaltenKind: string | null;
        verhaltenBezug: string | null;
        sichtbarkeit: string | null;
        createdAt: string | null;
        createdByDisplayName: string | null;
        tags: Array<{
            id: number;
            anlassCode: string | null;
            indicatorId: string | null;
            severity: number | null;
            comment: string | null;
        }>;
    }>;

    // Submit
    submittedAt: string | null;
    submittedByDisplayName: string | null;
    freigabeAm: string | null;
    freigabeVonDisplayName: string | null;

    // Changes
    changes: MeldungChangeResponse[];
};

export type MeldungCreateRequest = {
    supersedesId?: number | null;
};

export type MeldungCorrectRequest = {
    targetMeldungId: number;
};

export type MeldungDraftRequest = {
    erfasstVonRolle?: string | null;

    meldeweg?: string | null;
    meldewegSonstiges?: string | null;
    meldendeStelleKontakt?: string | null;

    dringlichkeit?: string | null;
    datenbasis?: string | null;

    einwilligungVorhanden?: boolean | null;
    schweigepflichtentbindungVorhanden?: boolean | null;

    kurzbeschreibung?: string | null;

    fachAmpel?: string | null;
    fachText?: string | null;

    abweichungZurAuto?: string | null;
    abweichungsBegruendung?: string | null;

    akutGefahrImVerzug?: boolean;
    akutBegruendung?: string | null;
    akutNotrufErforderlich?: boolean | null;
    akutKindSicherUntergebracht?: string | null;

    verantwortlicheFachkraftUserId?: number | null;
    naechsteUeberpruefungAm?: string | null; // yyyy-mm-dd
    zusammenfassung?: string | null;

    anlassCodes?: string[];

    observations?: Array<{
        zeitpunkt?: string | null; // Instant
        zeitraum?: string | null;
        ort?: string | null;
        ortSonstiges?: string | null;
        quelle?: string | null;
        text?: string | null;
        woertlichesZitat?: string | null;
        koerperbefund?: string | null;
        verhaltenKind?: string | null;
        verhaltenBezug?: string | null;
        sichtbarkeit?: string | null;
        tags?: Array<{
            anlassCode?: string | null;
            indicatorId?: string | null;
            severity?: number | null;
            comment?: string | null;
        }>;
    }>;

    jugendamt?: {
        informiert?: string | null;
        kontaktAm?: string | null; // Instant
        kontaktart?: string | null;
        aktenzeichen?: string | null;
        begruendung?: string | null;
    } | null;

    contacts?: Array<{
        kontaktMit?: string | null;
        kontaktAm?: string | null; // Instant
        status?: string | null;
        notiz?: string | null;
        ergebnis?: string | null;
    }>;

    extern?: Array<{
        stelle?: string | null;
        stelleSonstiges?: string | null;
        am?: string | null; // Instant
        begruendung?: string | null;
        ergebnis?: string | null;
    }>;

    attachments?: Array<{
        fileId: number;
        typ?: string | null;
        titel?: string | null;
        beschreibung?: string | null;
        sichtbarkeit?: string | null;
        rechtsgrundlageHinweis?: string | null;
    }>;

    sectionReasons?: Record<string, string>;
};

export type MeldungSubmitRequest = {
    mirrorToNotizen?: boolean | null;
    sectionReasons?: Record<string, string>;
};

export const meldungApi = {
    list: (fallId: number) =>
        apiFetch<MeldungListItemResponse[]>(`/falloeffnungen/${fallId}/meldungen`, { method: "GET" }),

    current: (fallId: number) =>
        apiFetch<MeldungResponse>(`/falloeffnungen/${fallId}/meldungen/current`, { method: "GET" }),

    get: (fallId: number, meldungId: number) =>
        apiFetch<MeldungResponse>(`/falloeffnungen/${fallId}/meldungen/${meldungId}`, { method: "GET" }),

    createNew: (fallId: number, req?: MeldungCreateRequest | null) =>
        apiFetch<MeldungResponse>(`/falloeffnungen/${fallId}/meldungen`, {
            method: "POST",
            body: req ?? null,
        }),

    startCorrection: (fallId: number, req: MeldungCorrectRequest) =>
        apiFetch<MeldungResponse>(`/falloeffnungen/${fallId}/meldungen/correct`, {
            method: "POST",
            body: req,
        }),

    saveDraft: (fallId: number, meldungId: number, req: MeldungDraftRequest) =>
        apiFetch<MeldungResponse>(`/falloeffnungen/${fallId}/meldungen/${meldungId}/draft`, {
            method: "PUT",
            body: req,
        }),

    submit: (fallId: number, meldungId: number, req?: MeldungSubmitRequest | null) =>
        apiFetch<MeldungResponse>(`/falloeffnungen/${fallId}/meldungen/${meldungId}/submit`, {
            method: "POST",
            body: req ?? null,
        }),
};