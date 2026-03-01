// lib/types.ts
// =====================================================
// AUTH / CONTEXT
// =====================================================

export type AvailableContextDto = {
  traegerId: number;
  traegerName: string;
  orgUnitId: number;
  orgUnitType: string;
  orgUnitName: string;
};

export type ActiveAuthContextResponse = {
  traegerId: number | null;
  orgUnitId: number | null;
  roles: string[];
};

// Das ist das, was /auth/context wirklich liefert (laut Backend DTO)
export type AuthContextResponse = {
  traegerId: number;
  traegerName: string;
  einrichtungOrgUnitId: number;
  einrichtungName: string;
  roles: string[];
};

export type AuthContextOverviewResponse = {
  active: ActiveAuthContextResponse;
  available: AuthContextResponse[];
};

export type LoginResponse = {
  baseToken: string;
  contexts: AvailableContextDto[];
};

export type SelectContextResponse = {
  token: string;
};

// /auth/me
export type MeResponse = {
  userId: number;
  email: string;
  displayName: string;
  contextActive: boolean;
  traegerId: number | null;
  orgUnitId: number | null; // active EINRICHTUNG orgUnit id
  roles: string[];
};

// optional (wenn du es irgendwo nutzt)
export type ContextsResponse = {
  contexts: AvailableContextDto[];
};

// =====================================================
// PEOPLE / KINDER
// =====================================================

export type Gender = "MAENNLICH" | "WEIBLICH" | "DIVERS" | "UNBEKANNT" | string;

export type KindResponse = {
  id: number;
  vorname: string;
  nachname: string;
  geburtsdatum: string | null; // ISO yyyy-mm-dd
  gender: Gender; // backend kann erweitern → string erlaubt
  foerderbedarf: boolean;
  foerderbedarfDetails: string | null;
  gesundheitsHinweise: string | null;
};

export type KindListItem = {
  id: number;
  displayName: string;
  geburtsdatum: string | null;
  gender: Gender;
  foerderbedarf: boolean;
};

export type KindSearchResponse = {
  items: KindListItem[];
  total: number;
  page: number;
  size: number;
};

// =====================================================
// BEZUGSPERSONEN
// =====================================================

export type SorgerechtTyp = "UNGEKLAERT" | "GEMEINSAM" | "ALLEIN" | "ENTZOGEN" | string;

export type BezugspersonBeziehung =
    | "MUTTER"
    | "VATER"
    | "STIEFELTERNTEIL"
    | "PFLEGEMUTTER"
    | "PFLEGEVATER"
    | "GROSSMUTTER"
    | "GROSSVATER"
    | "GESCHWISTER"
    | "SORGEBERECHTIGT"
    | "SONSTIGE"
    | string;

export type BezugspersonResponse = {
  id: number;
  displayName: string;
  vorname: string;
  nachname: string;
  geburtsdatum: string | null;
  gender: Gender;
  telefon: string | null;
  kontaktEmail: string | null;
};

export type BezugspersonListItem = {
  id: number;
  displayName: string;
  geburtsdatum: string | null;
  telefon: string | null;
  kontaktEmail: string | null;
};

export type BezugspersonSearchResponse = {
  items: BezugspersonListItem[];
};

export type CreateBezugspersonRequest = {
  vorname: string;
  nachname: string;
  geburtsdatum?: string | null;
  gender?: Gender | null;
  telefon?: string | null;
  kontaktEmail?: string | null;

  // optional address fields
  strasse?: string | null;
  hausnummer?: string | null;
  plz?: string | null;
  ort?: string | null;
};

export type KindBezugspersonResponse = {
  id: number; // linkId (wichtig: deine Page benutzt l.id)
  bezugspersonId: number | null;
  bezugspersonName: string;
  beziehung: BezugspersonBeziehung;
  sorgerecht: SorgerechtTyp;
  validFrom: string | null; // yyyy-mm-dd
  validTo: string | null; // yyyy-mm-dd
  hauptkontakt: boolean;
  lebtImHaushalt: boolean;
  enabled: boolean;
};

export type AddKindBezugspersonRequest = {
  existingBezugspersonId?: number | null;
  create?: CreateBezugspersonRequest | null;

  beziehung: BezugspersonBeziehung;
  sorgerecht?: SorgerechtTyp | null;
  validFrom?: string | null; // yyyy-mm-dd

  hauptkontakt?: boolean | null;
  lebtImHaushalt?: boolean | null;
};

export type EndKindBezugspersonRequest = {
  validTo: string; // yyyy-mm-dd
};

export type CreateKindCompleteRequest = {
  kind: {
    vorname: string;
    nachname: string;
    geburtsdatum: string | null;
    gender: Gender;
    foerderbedarf: boolean;
    foerderbedarfDetails: string | null;
    gesundheitsHinweise: string | null;
  };
  bezugspersonen: AddKindBezugspersonRequest[];
};

export type CreateKindResponse = {
  kindId: number;
};

// =====================================================
// FALLERÖFFNUNG / DOSSIER
// =====================================================

export type CreateFalleroeffnungRequest = {
  kindId: number;
  einrichtungOrgUnitId: number;
  teamOrgUnitId?: number | null;
  titel?: string | null;
  kurzbeschreibung?: string | null;
  anlassCodes?: string[] | null;
};

export type FalleroeffnungResponse = {
  id: number;
  aktenzeichen: string;
  status: string;
  titel?: string | null;
  kurzbeschreibung?: string | null;

  // optional fields (einige Endpoints liefern mehr)
  kindName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type FalleroeffnungListItem = {
  id: number;
  aktenzeichen?: string | null;
  status: string;
  kindName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type FalleroeffnungListResponse = {
  items: FalleroeffnungListItem[];
  total: number;
  page: number;
  size: number;
};