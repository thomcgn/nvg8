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
