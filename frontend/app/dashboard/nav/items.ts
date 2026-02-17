import type { Role } from "@/app/auth/rbac";

export type NavItem = {
    label: string;
    href: string;
    allow: Role[];
};

export const NAV_ITEMS: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        allow: ["ADMIN", "TEAMLEITUNG", "FACHKRAFT", "IEFK", "READ_ONLY", "DATENSCHUTZBEAUFTRAGTER"],
    },
    {
        label: "Meine Fälle",
        href: "/dashboard/cases",
        allow: ["ADMIN", "TEAMLEITUNG", "FACHKRAFT", "IEFK"],
    },
    {
        label: "Kinder",
        href: "/dashboard/kinder",
        allow: ["ADMIN", "TEAMLEITUNG", "FACHKRAFT", "IEFK", "READ_ONLY", "DATENSCHUTZBEAUFTRAGTER"],
    },
    {
        label: "Bezugspersonen",
        href: "/dashboard/bezugspersonen",
        allow: ["ADMIN", "TEAMLEITUNG", "FACHKRAFT", "IEFK", "READ_ONLY", "DATENSCHUTZBEAUFTRAGTER"],
    },
    {
        label: "Reports",
        href: "/dashboard/reports",
        allow: ["ADMIN", "TEAMLEITUNG", "IEFK", "DATENSCHUTZBEAUFTRAGTER"],
    },
    {
        label: "Admin",
        href: "/dashboard/admin",
        allow: ["ADMIN"],
    },
];