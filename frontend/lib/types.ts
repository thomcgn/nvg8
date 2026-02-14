export type AnswerType = "TRI_STATE" | "TEXT" | "DATE" | "USER_REF";
export type TriState = "JA" | "NEIN" | "UNBEKANNT";

export type KSItemDTO = {
    id: number;
    itemNo: string;
    text: string;
    answerType: AnswerType;
    orderIndex?: number | null;
    akutKriterium?: boolean | null;
};

export type KindSummary = {
    id: number;
    vorname: string;
    nachname: string;
    geburtsdatum?: string | null; // yyyy-mm-dd
};

export type BezugspersonSummary = {
    id: number;
    vorname: string;
    nachname: string;
    organisation?: string | null;
};

export type BezugspersonResponse = {
    id: number;
    organisation?: string | null;
    person: any; // PersonResponseBase (vom Backend)
};

export type KindResponse = {
    id: number;
    geburtsdatum?: string | null;
    person: any; // PersonResponseBase (vom Backend)
    bezugspersonen?: any[];
};

export type KSSectionDTO = {
    id: number;
    sectionNo: string;
    title: string;
    orderIndex?: number | null;
    hintText?: string | null;
    items: KSItemDTO[];
    children: KSSectionDTO[];
};

export type KSInstrumentTreeDTO = {
    id: number;
    code: string;
    version: string;
    titel: string;
    sections: KSSectionDTO[];
};

export type GetOrCreateInstanceResponse = {
    instanceId: number;
    version: number;
};

export type LoadInstanceResponse = {
    instanceId: number;
    version: number;
    fallId: number;
    instrument: KSInstrumentTreeDTO;
    answers: { itemId: number; value: string | null }[];
};

export type AutoSaveRequest = {
    instanceId: number;
    expectedVersion: number;
    answers: { itemId: number; value: string | null }[];
};

export type AutoSaveResponse = {
    instanceId: number;
    newVersion: number;
};

export type CaseStatus =
    | "ENTWURF"
    | "IN_PRUEFUNG"
    | "AKUT"
    | "HILFEPLANUNG"
    | "ABGESCHLOSSEN"
    | "ARCHIVIERT";

export interface Case {
    id: number;
    childName: string;
    age: number;
    status: CaseStatus;
    lastActivity: string;
}