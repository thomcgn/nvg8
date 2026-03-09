"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    ClipboardList,
    UserCog,
    UsersRound,
    UserRoundIcon,
    ShieldCheck,
    Menu,
    X,
    ChevronDown,
    LogOut,
    Settings,
    Clock,
    LayoutDashboard,
    Baby,
    Users,
    FolderOpen,
    AlertTriangle,
    LifeBuoy,
    Briefcase,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/lib/useAuth";
import { apiFetch } from "@/lib/api";
import type { AvailableContextDto } from "@/lib/types";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type NavItemDef = { href: string; label: string; icon: any; description?: string };
type NavSection = { title: string; items: NavItemDef[] };

const navSections: NavSection[] = [
    {
        title: "Fallführung",
        items: [
            { href: "/dashboard/akten", label: "Akten", icon: ClipboardList, description: "Übersicht & Suche" },
        ],
    },
    {
        title: "Personen",
        items: [
            { href: "/dashboard/kinder", label: "Kinder", icon: Baby, description: "Stammdaten & Verlauf" },
            { href: "/dashboard/bezugspersonen", label: "Bezugspersonen", icon: Users, description: "Stamm- und Kontaktdaten" },
        ],
    },
    {
        title: "Personal",
        items: [
            { href: "/dashboard/mitarbeiter", label: "Mitarbeiter", icon: UserCog, description: "Rollen & Zugänge" },
            { href: "/dashboard/teams", label: "Teams", icon: UsersRound, description: "Struktur & Zuständigkeit" },
        ],
    },
    {
        title: "System",
        items: [
            { href: "/dashboard/risk/config", label: "Risikobewertung", icon: AlertTriangle, description: "Bewertung & Monitoring" },
            { href: "/dashboard/tickets", label: "Support", icon: LifeBuoy, description: "Tickets & Anfragen" },
        ],
    },
];

/* ── Nav Item ──────────────────────────────────────────────── */

function NavItem({
    href,
    label,
    description,
    icon: Icon,
    onNavigate,
}: {
    href: string;
    label: string;
    description?: string;
    icon: any;
    onNavigate?: () => void;
}) {
    const pathname = usePathname();
    const active = pathname === href || pathname.startsWith(href + "/");

    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 " +
                (active
                    ? "bg-brand-blue/5 text-brand-blue border-l-2 border-brand-blue pl-[10px]"
                    : "text-brand-text2 border-l-2 border-transparent hover:bg-white hover:text-brand-text hover:border-brand-border")
            }
        >
            <div
                className={
                    "grid h-7 w-7 shrink-0 place-items-center rounded-lg transition " +
                    (active
                        ? "bg-brand-blue/10 text-brand-blue"
                        : "text-brand-text2 group-hover:text-brand-text")
                }
            >
                <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
                <div className={
                    "text-sm font-medium truncate " +
                    (active ? "text-brand-blue font-semibold" : "")
                }>
                    {label}
                </div>
                {description ? (
                    <div className="mt-0.5 text-xs text-brand-text2 truncate">{description}</div>
                ) : null}
            </div>
        </Link>
    );
}

/* ── Session timer ─────────────────────────────────────────── */

function formatMmSs(totalSeconds: number) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
}

/* ── Auth contexts type ────────────────────────────────────── */

type AuthContextsResponse = { contexts: AvailableContextDto[] };

/* ── Sidebar content ───────────────────────────────────────── */

function SidebarContent({ onClose, className = "" }: { onClose?: () => void; className?: string }) {
    const router = useRouter();
    const { me, loading, signOut } = useAuth();

    const [traegerName, setTraegerName] = useState<string | null>(null);
    const [einrichtungName, setEinrichtungName] = useState<string | null>(null);
    const [collapsed, setCollapsed] = useState(true);

    const displayName = useMemo(() => me?.displayName || me?.email || "—", [me?.displayName, me?.email]);
    const roleText = useMemo(() => (me?.roles?.length ? me.roles.join(", ") : "Keine Rolle"), [me?.roles]);

    const idleSeconds = Math.max(5, Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES || "60")) * 60;
    const [lastActivity, setLastActivity] = useState(() => Date.now());
    const [nowTs, setNowTs] = useState(() => Date.now());

    const remainingSeconds = useMemo(() => {
        const elapsed = (nowTs - lastActivity) / 1000;
        return Math.max(0, idleSeconds - elapsed);
    }, [nowTs, lastActivity, idleSeconds]);

    const isExpiringSoon = remainingSeconds > 0 && remainingSeconds <= 5 * 60;

    useEffect(() => {
        const tick = window.setInterval(() => setNowTs(Date.now()), 1000);
        const bump = () => setLastActivity(Date.now());
        window.addEventListener("mousemove", bump, { passive: true });
        window.addEventListener("keydown", bump);
        window.addEventListener("scroll", bump, { passive: true });
        window.addEventListener("touchstart", bump, { passive: true });
        return () => {
            window.clearInterval(tick);
            window.removeEventListener("mousemove", bump);
            window.removeEventListener("keydown", bump);
            window.removeEventListener("scroll", bump);
            window.removeEventListener("touchstart", bump);
        };
    }, []);

    useEffect(() => {
        if (!me || remainingSeconds > 0) return;
        (async () => {
            try { await signOut(); } finally {
                onClose?.();
                router.replace("/login");
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remainingSeconds]);

    useEffect(() => {
        let mounted = true;
        async function loadContextLabels() {
            setTraegerName(null);
            setEinrichtungName(null);
            if (!me?.contextActive || !me.orgUnitId) return;
            try {
                const res = await apiFetch<AuthContextsResponse>("/auth/contexts", { method: "GET" });
                if (!mounted) return;
                const found = res.contexts.find((c) => c.orgUnitId === me.orgUnitId);
                if (found) {
                    setTraegerName(found.traegerName);
                    setEinrichtungName(found.orgUnitName);
                }
            } catch { /* ignore */ }
        }
        loadContextLabels();
        return () => { mounted = false; };
    }, [me?.contextActive, me?.orgUnitId]);

    return (
        <div className={"flex h-full flex-col border-r border-brand-border/60 bg-white " + className}>

            {/* Logo bar */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-brand-border/40">
                <BrandMark />
                {onClose ? (
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-brand-text2 transition hover:bg-brand-bg hover:text-brand-text focus:outline-none"
                        aria-label="Menü schließen"
                    >
                        <X className="h-4 w-4" />
                    </button>
                ) : null}
            </div>

            {/* User card */}
            <div className="border-b border-brand-border/40">
                <button
                    type="button"
                    onClick={() => setCollapsed((c) => !c)}
                    className="w-full px-4 py-3 text-left transition hover:bg-brand-bg/50"
                >
                    <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-blue/10 text-brand-blue">
                            <UserRoundIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-brand-text truncate">{loading ? "…" : displayName}</div>
                            <div className="mt-0.5 text-xs text-brand-text2 truncate">{loading ? "…" : (einrichtungName ?? traegerName ?? "—")}</div>
                        </div>
                        <ChevronDown className={"h-4 w-4 shrink-0 text-brand-text2 transition-transform duration-200 " + (collapsed ? "" : "rotate-180")} />
                    </div>
                </button>

                {/* Expandable user detail */}
                <div className={"grid transition-[grid-template-rows] duration-200 ease-out " + (collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]")}>
                    <div className="min-h-0 overflow-hidden">
                        <div className="px-4 pb-3 space-y-2.5 text-xs">
                            <div className="flex items-center gap-2 text-brand-text2">
                                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{loading ? "…" : roleText}</span>
                            </div>
                            <div className="flex items-center gap-2 text-brand-text2">
                                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{loading ? "…" : (traegerName ?? "—")}</span>
                            </div>

                            {/* Session timer */}
                            <div className={
                                "flex items-center gap-2 rounded-lg border px-3 py-2 " +
                                (isExpiringSoon
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : "border-brand-border/40 bg-brand-bg text-brand-text2")
                            }>
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                <span>Sitzung läuft ab in <strong>{formatMmSs(remainingSeconds)}</strong></span>
                            </div>

                            <div className="flex gap-2 pt-0.5">
                                <Link
                                    href="/dashboard/account"
                                    onClick={onClose}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-border/60 bg-white px-3 py-2 text-xs font-medium text-brand-text2 transition hover:bg-brand-bg hover:text-brand-text"
                                >
                                    <Settings className="h-3.5 w-3.5" />
                                    Einstellungen
                                </Link>
                                <button
                                    onClick={async () => {
                                        await signOut();
                                        onClose?.();
                                        router.push("/login");
                                    }}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-border/60 bg-white px-3 py-2 text-xs font-medium text-brand-text2 transition hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    Abmelden
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
                {/* Dashboard */}
                <NavItem href="/dashboard" label="Übersicht" icon={LayoutDashboard} description="Start & Kennzahlen" onNavigate={onClose} />

                {/* Sections */}
                {navSections.map((sec) => (
                    <div key={sec.title}>
                        <div className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-widest text-brand-text2/60">
                            {sec.title}
                        </div>
                        <div className="flex flex-col gap-0.5">
                            {sec.items.map((i) => (
                                <NavItem key={i.href} {...i} onNavigate={onClose} />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
        </div>
    );
}

/* ── Sidebar shell (mobile drawer + desktop) ───────────────── */

export function Sidebar() {
    const [open, setOpen] = useState(false);

    const startX = useRef<number | null>(null);
    const startY = useRef<number | null>(null);
    const [dragX, setDragX] = useState(0);
    const [dragging, setDragging] = useState(false);

    const close = () => {
        setOpen(false);
        setDragX(0);
        setDragging(false);
        startX.current = null;
        startY.current = null;
    };

    const onTouchStart = (e: React.TouchEvent) => {
        const t = e.touches[0];
        startX.current = t.clientX;
        startY.current = t.clientY;
        setDragging(true);
        setDragX(0);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!dragging || startX.current == null || startY.current == null) return;
        const dx = e.touches[0].clientX - startX.current;
        const dy = e.touches[0].clientY - startY.current;
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) return;
        if (dx < 0) { e.preventDefault(); setDragX(dx); }
    };

    const onTouchEnd = () => {
        if (!dragging) return;
        if (dragX < -80) { close(); return; }
        setDragX(0);
        setDragging(false);
        startX.current = null;
        startY.current = null;
    };

    return (
        <>
            {/* Mobile topbar */}
            <div className="lg:hidden sticky top-0 z-40 border-b border-brand-border/60 bg-white print:hidden">
                <div className="flex items-center justify-between px-4 py-3">
                    <BrandMark compact />
                    <button
                        onClick={() => setOpen(true)}
                        className="rounded-lg p-2 text-brand-text2 transition hover:bg-brand-bg hover:text-brand-text focus:outline-none"
                        aria-label="Menü öffnen"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden lg:flex h-screen w-64 shrink-0 print:hidden">
                <SidebarContent className="w-64" />
            </aside>

            {/* Mobile drawer */}
            {open ? (
                <div className="lg:hidden fixed inset-0 z-50 print:hidden">
                    <button
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        aria-label="Overlay schließen"
                        onClick={close}
                    />
                    <div
                        className="absolute left-0 top-0 h-full shadow-xl w-[min(300px,85vw)]"
                        style={{
                            transform: `translateX(${Math.min(0, dragX)}px)`,
                            transition: dragging ? "none" : "transform 180ms ease-out",
                        }}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <SidebarContent className="w-full" onClose={close} />
                    </div>
                </div>
            ) : null}
        </>
    );
}

export default Sidebar;
