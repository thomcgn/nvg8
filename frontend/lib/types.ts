// lib/types.ts

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

// ✅ DAS ist das, was /auth/context wirklich liefert (laut deinem Backend DTO)
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

// (falls du die nutzt)
export type LoginResponse = {
  baseToken: string;
  contexts: AvailableContextDto[];
};

export type SelectContextResponse = {
  token: string;
};


export type MeResponse = {
  userId: number;
  email: string;
  displayName: string;
  contextActive: boolean;
  traegerId: number | null;
  orgUnitId: number | null;
  roles: string[];
};

export type ContextsResponse = {
  contexts: AvailableContextDto[];
};

export type FalleroeffnungListItem = {
  id: number;
  aktenzeichen?: string | null;
  status: string; // e.g. "OFFEN", ...
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

export type KindBezugspersonDto = {
  linkId: number;
  bezugspersonId: number;
  displayName: string;
  geburtsdatum: string | null;
  gender: string | null;
  telefon: string | null;
  kontaktEmail: string | null;
  beziehung: string;
  sorgerecht: string | null;
  hauptkontakt: boolean | null;
  lebtImHaushalt: boolean | null;
};

export type AddBezugspersonToKindRequest = {
  existingBezugspersonId?: number | null;
  create?: {
    vorname: string;
    nachname: string;
    geburtsdatum?: string | null;
    gender: string;
    telefon?: string | null;
    kontaktEmail?: string | null;
    strasse?: string | null;
    hausnummer?: string | null;
    plz?: string | null;
    ort?: string | null;
  } | null;
  beziehung: string;
  sorgerecht?: string | null;
  hauptkontakt?: boolean | null;
  lebtImHaushalt?: boolean | null;
};

// ===== PEOPLE / KINDER =====

export type Gender = "UNBEKANNT" | "MAENNLICH" | "WEIBLICH" | "DIVERS";

export type BezugspersonBeziehung =
    | "MUTTER"
    | "VATER"
    | "SORGEBERECHTIGT"
    | "PFLEGEMUTTER"
    | "PFLEGEVATER"
    | "STIEFMUTTER"
    | "STIEFVATER"
    | "GROSSMUTTER"
    | "GROSSVATER"
    | "SONSTIGE";

export type SorgerechtTyp =
    | "ALLEIN"
    | "GEMEINSAM"
    | "KEIN"
    | "AMTSPFLEGSCHAFT"
    | "VORMUNDSCHAFT"
    | "UNGEKLAERT";

export type KindResponse = {
  id: number;
  vorname: string;
  nachname: string;
  geburtsdatum: string | null;
  gender: Gender | null;
  foerderbedarf: boolean;
  foerderbedarfDetails: string | null;
  gesundheitsHinweise: string | null;
};

export type KindBezugspersonResponse = {
  linkId: number;
  bezugspersonId: number;
  bezugspersonName: string;
  beziehung: BezugspersonBeziehung;
  sorgerecht: SorgerechtTyp | null;
  validFrom: string | null;
  validTo: string | null;
  hauptkontakt: boolean;
  lebtImHaushalt: boolean;
  enabled: boolean;
};

export type CreateBezugspersonRequest = {
  vorname: string;
  nachname: string;
  geburtsdatum?: string | null;
  gender?: Gender | null;
  telefon?: string | null;
  kontaktEmail?: string | null;
  strasse?: string | null;
  hausnummer?: string | null;
  plz?: string | null;
  ort?: string | null;
};

export type AddKindBezugspersonRequest = {
  existingBezugspersonId?: number | null;
  create?: CreateBezugspersonRequest | null;
  beziehung: BezugspersonBeziehung;
  sorgerecht?: SorgerechtTyp | null;
  validFrom?: string | null; // ISO date: "2026-02-27"
  hauptkontakt?: boolean | null;
  lebtImHaushalt?: boolean | null;
};

// ===== AKTEN / FALLOEFFNUNGEN =====

export type CreateFalleroeffnungRequest = {
  kindId: number;
  einrichtungOrgUnitId: number;
  teamOrgUnitId?: number | null;
  titel?: string | null;
  kurzbeschreibung?: string | null;
};

export type FalleroeffnungResponse = {
  id: number;
  aktenzeichen: string;
  status: string;
  titel: string | null;
  kurzbeschreibung: string | null;
  kindId: number;
  createdAt?: string | null;
};