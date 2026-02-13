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