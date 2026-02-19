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

export const canManageEmployees = (role: Role) =>
    ["ADMIN", "TEAMLEITUNG", "FACHKRAFT"].includes(role); // wenn nur ADMIN: ["ADMIN"]

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

// niedrig -> hoch
export const ROLE_RANK: Record<Role, number> = {
    DATENSCHUTZBEAUFTRAGTER: 0,
    READ_ONLY: 1,
    FACHKRAFT: 2,
    IEFK: 3,
    TEAMLEITUNG: 4,
    ADMIN: 5,
};

export const rank = (r: Role) => ROLE_RANK[r];

export function canChangeRole(params: {
    actor: Role;
    target: Role;
    next: Role;
    isSelf: boolean;
    adminsLeftAfter: number; // wie viele Admins nach der Änderung noch übrig wären
}): { allowed: boolean; reason?: string } {
    const { actor, target, next, isSelf, adminsLeftAfter } = params;

    if (isSelf) {
        return { allowed: false, reason: "Eigene Rolle kann nicht geändert werden." };
    }

    // Niemand darf jemanden ändern, der höher ist als man selbst
    if (rank(target) > rank(actor)) {
        return { allowed: false, reason: "Du darfst keine höhergestellte Rolle ändern." };
    }

    // Zielrolle darf nicht höher sein als eigene Rolle (kein Promote über eigenes Level)
    if (rank(next) > rank(actor)) {
        return { allowed: false, reason: "Du darfst niemanden über dein eigenes Level promoten." };
    }

    // Admin darf nur von Admin geändert werden (verhindert: TEAMLEITUNG degradiert Admin)
    if (target === "ADMIN" && actor !== "ADMIN") {
        return { allowed: false, reason: "ADMIN kann nur von ADMIN geändert werden." };
    }

    // Mindestens ein Admin muss übrig bleiben (nur relevant bei Admin -> non-Admin)
    if (target === "ADMIN" && next !== "ADMIN" && adminsLeftAfter < 1) {
        return { allowed: false, reason: "Es muss mindestens ein ADMIN im System bleiben." };
    }

    return { allowed: true };
}