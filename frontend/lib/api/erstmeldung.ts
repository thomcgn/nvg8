// lib/api/erstmeldung.ts

import { apiFetch } from "@/lib/api";

export type ErstmeldungStatus = "ENTWURF" | "IN_BEARBEITUNG" | "ABGESCHLOSSEN";
export type AmpelStatus = "GRUEN" | "GELB" | "ROT" | "UNKLAR";

export type Dringlichkeit = "AKUT_HEUTE" | "ZEITNAH_24_48H" | "BEOBACHTEN" | "UNKLAR";
export type Datenbasis = "EIGENE_AUFTRAGSERFUELLUNG" | "EINWILLIGUNG_LIEGT_VOR" | "GESETZL_GRUNDLAGE" | "UNGEKLAERT";

export type Meldeweg =
    | "EIGENBEOBACHTUNG"
    | "KIND_SELBER"
    | "ELTERN"
    | "ANGEHOERIGE"
    | "MITSCHUELER_IN"
    | "ANONYM"
    | "POLIZEI"
    | "ARZT_KLINIK"
    | "JUGENDAMT"
    | "BERATUNGSSTELLE"
    | "SONSTIGE";

export type AbweichungZurAutoAmpel = "KEINE" | "HOEHERE_DRINGLICHKEIT" | "GERINGERE_DRINGLICHKEIT";
export type JaNeinUnklar = "JA" | "NEIN" | "UNKLAR";

export type ObservationZeitraum = "HEUTE" | "LETZTE_WOCHE" | "LETZTER_MONAT" | "LAENGER" | "UNBEKANNT";
export type ObservationOrt = "SCHULE" | "KITA" | "ZUHAUSE" | "WEG" | "ONLINE" | "SONSTIGE";
export type ObservationQuelle = "EIGENBEOBACHTUNG" | "AUSSAGE_KIND" | "AUSSAGE_DRITTE" | "DOKUMENT" | "SONSTIGE";
export type Sichtbarkeit = "INTERN" | "WEITERGABEHINWEIS";

export type KontaktMit =
    | "KIND"
    | "ELTERNTEIL_1"
    | "ELTERNTEIL_2"
    | "SORGE_BERECHTIGTE"
    | "PFLEGE"
    | "DRITTE"
    | "JUGENDAMT"
    | "POLIZEI"
    | "SONSTIGE";

export type KontaktStatus = "GEPLANT" | "DURCHGEFUEHRT" | "NICHT_MOEGLICH" | "ABGEBROCHEN";

export type JugendamtInformiert = "JA" | "NEIN" | "NOCH_NICHT_ENTSCHIEDEN";
export type JugendamtKontaktart = "TELEFON" | "SCHRIFTLICH" | "PERSOENLICH" | "ONLINE";

export type ExterneStelle = "POLIZEI" | "KLINIK_ARZT" | "BERATUNGSSTELLE" | "SCHULAMT" | "SONSTIGE";

export type AttachmentTyp =
    | "FOTO"
    | "ATTEST"
    | "PROTOKOLL"
    | "FEHLZEITEN"
    | "SCHREIBEN_JUGENDAMT"
    | "POLIZEI_REFERENZ"
    | "EINWILLIGUNG"
    | "SONSTIGE";

export type ErstmeldungCloneRequest = {
    includeAnlaesse: boolean;
    includeObservations: boolean;
    includeObservationTags: boolean;
    includeJugendamt: boolean;
    includeContacts: boolean;
    includeExtern: boolean;
    includeAttachments: boolean;
    carryOverFachlicheEinschaetzung: boolean;
};

export type ErstmeldungSubmitRequest = {
    mirrorObservationsToNotizen: boolean;
    recomputeRisk: boolean;
};

export type ErstmeldungDraftRequest = {
    erfasstVonRolle?: string | null;
    meldeweg?: Meldeweg | null;
    meldewegSonstiges?: string | null;
    meldendeStelleKontakt?: string | null;
    dringlichkeit?: Dringlichkeit | null;
    datenbasis?: Datenbasis | null;
    einwilligungVorhanden?: boolean | null;
    schweigepflichtentbindungVorhanden?: boolean | null;

    kurzbeschreibung?: string | null;

    fachAmpel?: AmpelStatus | null;
    fachText?: string | null;
    abweichungZurAuto?: AbweichungZurAutoAmpel | null;
    abweichungsBegruendung?: string | null;

    akutGefahrImVerzug?: boolean;
    akutBegruendung?: string | null;
    akutNotrufErforderlich?: boolean | null;
    akutKindSicherUntergebracht?: JaNeinUnklar | null;

    verantwortlicheFachkraftUserId?: number | null;
    naechsteUeberpruefungAm?: string | null; // YYYY-MM-DD
    zusammenfassung?: string | null;

    anlassCodes?: string[] | null;

    observations?: ObservationDraft[] | null;
    jugendamt?: JugendamtDraft | null;
    contacts?: ContactDraft[] | null;
    extern?: ExternDraft[] | null;
    attachments?: AttachmentDraft[] | null;
};

export type ObservationDraft = {
    zeitpunkt?: string | null; // ISO
    zeitraum?: ObservationZeitraum | null;
    ort?: ObservationOrt | null;
    ortSonstiges?: string | null;
    quelle?: ObservationQuelle | null;
    text: string;
    woertlichesZitat?: string | null;
    koerperbefund?: string | null;
    verhaltenKind?: string | null;
    verhaltenBezug?: string | null;
    sichtbarkeit?: Sichtbarkeit | null;
    tags?: ObservationTagDraft[] | null;
};

export type ObservationTagDraft = {
    anlassCode?: string | null;
    indicatorId?: string | null;
    severity?: number | null; // 0..3
    comment?: string | null;
};

export type JugendamtDraft = {
    informiert: JugendamtInformiert;
    kontaktAm?: string | null;
    kontaktart?: JugendamtKontaktart | null;
    aktenzeichen?: string | null;
    begruendung?: string | null;
};

export type ContactDraft = {
    kontaktMit: KontaktMit;
    kontaktAm?: string | null;
    status: KontaktStatus;
    notiz?: string | null;
    ergebnis?: string | null;
};

export type ExternDraft = {
    stelle: ExterneStelle;
    stelleSonstiges?: string | null;
    am?: string | null;
    begruendung?: string | null;
    ergebnis?: string | null;
};

export type AttachmentDraft = {
    fileId: number;
    typ: AttachmentTyp;
    titel?: string | null;
    beschreibung?: string | null;
    sichtbarkeit: Sichtbarkeit;
    rechtsgrundlageHinweis?: string | null;
};

export type ErstmeldungVersionListItemResponse = {
    id: number;
    versionNo: number;
    current: boolean;
    status: ErstmeldungStatus;
    erfasstAm: string;
    submittedAt?: string | null;
};

export type ErstmeldungResponse = {
    id: number;
    fallId: number;
    versionNo: number;
    current: boolean;
    supersedesId?: number | null;
    status: ErstmeldungStatus;

    erfasstAm: string;
    erfasstVonDisplayName: string;
    erfasstVonRolle: string;

    meldeweg: Meldeweg;
    meldewegSonstiges?: string | null;
    meldendeStelleKontakt?: string | null;
    dringlichkeit: Dringlichkeit;
    datenbasis: Datenbasis;
    einwilligungVorhanden?: boolean | null;
    schweigepflichtentbindungVorhanden?: boolean | null;

    kurzbeschreibung: string;

    fachAmpel?: AmpelStatus | null;
    fachText?: string | null;
    abweichungZurAuto?: AbweichungZurAutoAmpel | null;
    abweichungsBegruendung?: string | null;

    akutGefahrImVerzug: boolean;
    akutBegruendung?: string | null;
    akutNotrufErforderlich?: boolean | null;
    akutKindSicherUntergebracht?: JaNeinUnklar | null;

    autoRiskSnapshotId?: number | null;

    submittedAt?: string | null;
    submittedByDisplayName?: string | null;

    freigabeAm?: string | null;
    freigabeVonDisplayName?: string | null;
    verantwortlicheFachkraftUserId?: number | null;
    naechsteUeberpruefungAm?: string | null;
    zusammenfassung?: string | null;

    anlassCodes: string[];
    jugendamt?: {
        informiert: JugendamtInformiert;
        kontaktAm?: string | null;
        kontaktart?: JugendamtKontaktart | null;
        aktenzeichen?: string | null;
        begruendung?: string | null;
    } | null;

    contacts: Array<{
        id: number;
        kontaktMit: KontaktMit;
        kontaktAm?: string | null;
        status: KontaktStatus;
        notiz?: string | null;
        ergebnis?: string | null;
    }>;

    extern: Array<{
        id: number;
        stelle: ExterneStelle;
        stelleSonstiges?: string | null;
        am?: string | null;
        begruendung?: string | null;
        ergebnis?: string | null;
    }>;

    attachments: Array<{
        id: number;
        fileId: number;
        typ: AttachmentTyp;
        titel?: string | null;
        beschreibung?: string | null;
        sichtbarkeit: Sichtbarkeit;
        rechtsgrundlageHinweis?: string | null;
    }>;

    observations: Array<{
        id: number;
        zeitpunkt?: string | null;
        zeitraum?: ObservationZeitraum | null;
        ort?: ObservationOrt | null;
        ortSonstiges?: string | null;
        quelle: ObservationQuelle;
        text: string;
        woertlichesZitat?: string | null;
        koerperbefund?: string | null;
        verhaltenKind?: string | null;
        verhaltenBezug?: string | null;
        sichtbarkeit: Sichtbarkeit;
        linkedNotizId?: number | null;
        tags: Array<{
            id: number;
            anlassCode?: string | null;
            indicatorId?: string | null;
            severity?: number | null;
            comment?: string | null;
        }>;
    }>;
};

// ---------- API (nutzt apiFetch) ----------
export const erstmeldungApi = {
    current(fallId: number) {
        return apiFetch<ErstmeldungResponse>(`/falloeffnungen/${fallId}/erstmeldung/current`, { method: "GET" });
    },
    versions(fallId: number) {
        return apiFetch<ErstmeldungVersionListItemResponse[]>(`/falloeffnungen/${fallId}/erstmeldung/versions`, { method: "GET" });
    },
    get(fallId: number, erstmeldungId: number) {
        return apiFetch<ErstmeldungResponse>(`/falloeffnungen/${fallId}/erstmeldung/${erstmeldungId}`, { method: "GET" });
    },
    newVersion(fallId: number) {
        return apiFetch<ErstmeldungResponse>(`/falloeffnungen/${fallId}/erstmeldung/new-version`, { method: "POST" });
    },
    cloneCurrent(fallId: number, req?: Partial<ErstmeldungCloneRequest>) {
        return apiFetch<ErstmeldungResponse>(`/falloeffnungen/${fallId}/erstmeldung/clone-current`, { method: "POST", body: req });
    },
    saveDraft(fallId: number, erstmeldungId: number, req: ErstmeldungDraftRequest) {
        return apiFetch<ErstmeldungResponse>(`/falloeffnungen/${fallId}/erstmeldung/${erstmeldungId}/draft`, { method: "PUT", body: req });
    },
    submit(fallId: number, erstmeldungId: number, req?: ErstmeldungSubmitRequest) {
        return apiFetch<ErstmeldungResponse>(`/falloeffnungen/${fallId}/erstmeldung/${erstmeldungId}/submit`, { method: "POST", body: req });
    },
};