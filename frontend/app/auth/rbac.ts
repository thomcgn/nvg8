export type Role =
    | "ADMIN"
    | "FACHKRAFT"
    | "TEAMLEITUNG"
    | "IEFK"
    | "READ_ONLY"
    | "DATENSCHUTZBEAUFTRAGTER";

export const canReadCases = (role: Role) =>
    ["ADMIN", "TEAMLEITUNG", "FACHKRAFT", "IEFK", "READ_ONLY", "DATENSCHUTZBEAUFTRAGTER"].includes(role);

export const canWriteCases = (role: Role) =>
    ["ADMIN", "TEAMLEITUNG", "FACHKRAFT"].includes(role);

export const canSeeMasterData = (role: Role) =>
    ["ADMIN", "TEAMLEITUNG", "DATENSCHUTZBEAUFTRAGTER"].includes(role);

export const ALL_ROLES: Role[] = [
    "ADMIN",
    "FACHKRAFT",
    "TEAMLEITUNG",
    "IEFK",
    "READ_ONLY",
    "DATENSCHUTZBEAUFTRAGTER",
];

export const toRole = (r: string): Role =>
    (ALL_ROLES.includes(r as Role) ? (r as Role) : "READ_ONLY");