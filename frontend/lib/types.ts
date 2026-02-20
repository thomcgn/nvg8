
export type AnswerType = "TRI_STATE" | "TEXT" | "DATE" | "USER_REF";
export type TriState = "JA" | "NEIN" | "KEINE_ANGABE";

export type Bezugsperson = {
    id: number;
    name: string;
    rolle?: string | null;
    telefon?: string | null;
    email?: string | null;
};

export type TemplateSchema = {
    code: string;
    title: string;
    version: string;
    ageRange?: string | null;
    sections: Array<{
        id: number;
        sectionKey: string;
        title: string;
        sort: number;
        items: Array<{
            id: number;
            itemKey: string;
            label: string;
            answerType: "TRI_STATE" | "TEXT" | "DATE";
            sort: number;
        }>;
    }>;
};

export type CaseDetails = {
    id: number;
    childId: number;
    childName: string;
};

export type TemplateListEntry = {
    code: string;
    title: string;
    version: string;
    audience: "ALL" | "YOUTH_OFFICE_ONLY";
    active: boolean;
    ageRange?: string | null;
};

export type KSItemDTO = {
    id: number;
    itemNo: string;
    text: string;
    answerType: AnswerType;
    orderIndex?: number | null;
    polarity?: string | null;
    akutKriterium?: boolean | null;
};

export type KSSectionDTO = {
    id: number;
    sectionNo: string;
    title: string;
    orderIndex: number | null;
    hintText?: string | null;
    items: KSItemDTO[];
    children: KSSectionDTO[];
};

export type KSInstrumentDTO = {
    id: number;
    code: string;
    titel: string;
    typ: string;
    version: string;
    sections: KSSectionDTO[];
};

export type KSInstrumentTreeDTO = {
    id: number;
    code: string;
    version: string;
    titel: string;
    sections: KSSectionDTO[];
};

export type KSFormLoadDTO = {
    instanceId: number;
    version: number;
    fallId: number;
    instrument: KSInstrumentDTO;
    answers: { itemId: number; value: string | null }[];
};

export type GetOrCreateResp = {
    instanceId: number;
    version: number;
};

export type AutoSaveResp = {
    instanceId: number;
    newVersion: number;
};

export type FormValues = {
    answers: Record<string, string>;
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
    telefon?: string | null;
    kontaktEmail?: string | null;
    strasse?: string | null;
    hausnummer?: string | null;
    plz?: string | null;
    ort?: string | null
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
    kindId?: number;
}

export type InboxItem = {
    recipientRowId: number;
    isRead: boolean;
    readAt?: string | null;
    message: {
        id: number;
        subject: string;
        bodyPreview: string;
        createdAt: string;
        senderId: number;
        senderName?: string; // optional wenn Backend später liefert
    };
};

export type  Facility = {
    id: number;
    name: string;
}