export type AnswerType = "TRI_STATE" | "TEXT" | "DATE" | "USER_REF";
export type Polarity = "RISIKO" | "SCHUTZ" | "NEUTRAL";
export type TriState = "JA" | "NEIN" | "KEINE_ANGABE";

export type KSItemDTO = {
    id: number;
    itemNo: string;
    text: string;
    answerType: AnswerType;
    orderIndex: number;
    polarity: Polarity;
    akutKriterium?: boolean;
};

export type KSSectionDTO = {
    id: number;
    sectionNo: string;
    title: string;
    orderIndex: number;
    hintText?: string | null;
    items: KSItemDTO[];
    children: KSSectionDTO[];
};

export type KSInstrumentTreeDTO = {
    id: number;
    code: string;
    titel: string;
    version: string;
    sections: KSSectionDTO[];
};

// Payload fürs Speichern:
export type KSAnswerDTO = {
    itemId: number;
    itemNo: string;
    answer: string;      // TRI_STATE als String ("JA"/"NEIN"/"KEINE_ANGABE") oder Text/Date/UserRef ebenfalls String
    comment?: string;    // optionaler Freitext pro Item
};

export type SaveAnswersRequest = {
    instrumentCode: string;
    instrumentVersion: string;
    answers: KSAnswerDTO[];
};
