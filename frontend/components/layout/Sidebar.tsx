"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    ClipboardList,
    Users,
    Briefcase,
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
        title: "Akten",
        items: [{ href: "/dashboard/akten", label: "Akten", icon: ClipboardList, description: "Übersicht & Suche" }],
    },
    {
        title: "Kinder & Bezugspersonen",
        items: [
            { href: "/dashboard/kinder", label: "Kinder", icon: Users, description: "Stammdaten & Verlauf" },
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
];

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
    const active = pathname === href;

    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={
                "group relative flex items-start gap-3 rounded-2xl px-3 py-2.5 transition-all duration-150 " +
                (active
                    ? "bg-brand-teal/15 text-brand-blue border border-brand-teal/30 shadow-sm"
                    : "text-brand-text2 border border-transparent hover:bg-white/80 hover:shadow-sm hover:border-brand-border hover:text-brand-blue")
            }
        >
            <div
                className={
                    "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl transition " +
                    (active ? "bg-brand-teal/15 text-brand-teal" : "bg-white/70 text-brand-text2 group-hover:bg-white group-hover:text-brand-blue")
                }
            >
                <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0">
                <div className="text-sm font-semibold whitespace-normal break-words">{label}</div>
                {description ? (
                    <div className={"mt-0.5 text-xs whitespace-normal break-words " + (active ? "text-brand-blue/80" : "text-brand-text2")}>
                        {description}
                    </div>
                ) : null}
            </div>

            <div className="pointer-events-none absolute right-2 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-brand-teal/0 transition group-hover:bg-brand-teal/20" />
        </Link>
    );
}

function formatMmSs(totalSeconds: number) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
}

type AuthContextsResponse = {
    contexts: AvailableContextDto[];
};

function SidebarContent({ onClose, className = "" }: { onClose?: () => void; className?: string }) {
    const router = useRouter();
    const { me, loading, signOut } = useAuth();

    const [traegerName, setTraegerName] = useState<string | null>(null);
    const [einrichtungName, setEinrichtungName] = useState<string | null>(null);

    const [collapsed, setCollapsed] = useState(true);

    const displayName = useMemo(() => me?.displayName || me?.email || "—", [me?.displayName, me?.email]);
    const roleText = useMemo(() => (me?.roles?.length ? me.roles.join(", ") : "Keine Rolle"), [me?.roles]);

    // Session timeout (Idle) UI
    const idleMinutes = Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES || "60");
    const idleSeconds = Math.max(5, idleMinutes) * 60;

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
        if (!me) return;
        if (remainingSeconds > 0) return;

        (async () => {
            try {
                await signOut();
            } finally {
                onClose?.();
                router.replace("/login");
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remainingSeconds]);

    // ✅ Load traeger/einrichtung labels from /auth/contexts (the endpoint returns { contexts: [...] })
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
            } catch {
                // ignore: keep "—"
            }
        }

        loadContextLabels();

        return () => {
            mounted = false;
        };
    }, [me?.contextActive, me?.orgUnitId]);

    return (
        <div className={"flex h-full flex-col border-r border-brand-border bg-brand-bg/80 backdrop-blur p-4 " + className}>
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <BrandMark />
                {onClose ? (
                    <button
                        onClick={onClose}
                        className="
              rounded-xl p-2 text-brand-text2
              transition
              hover:bg-white/80 hover:text-brand-blue
              focus:outline-none focus:ring-2 focus:ring-brand-teal/25
              active:scale-[0.98]
            "
                        aria-label="Menü schließen"
                    >
                        <X className="h-5 w-5" />
                    </button>
                ) : null}
            </div>

            {/* User / Context card */}
            <div className="mb-3 overflow-hidden rounded-2xl border border-brand-border bg-white/80 backdrop-blur shadow-sm">
                <button type="button" onClick={() => setCollapsed((c) => !c)} className="w-full p-4 text-left transition hover:bg-white">
                    <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-teal/15 text-brand-teal">
                            <UserRoundIcon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-brand-text truncate">{loading ? "…" : displayName}</div>
                            <div className="mt-0.5 text-xs text-brand-text2 truncate">{loading ? "…" : traegerName ?? "—"}</div>
                        </div>

                        <ChevronDown className={"h-4 w-4 shrink-0 text-brand-text2 transition-transform duration-200 " + (collapsed ? "" : "rotate-180")} />
                    </div>
                </button>

                {/* Smooth accordion */}
                <div className={"grid transition-[grid-template-rows] duration-200 ease-out " + (collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]")}>
                    <div className="min-h-0">
                        <div
                            className={"px-4 pb-4 border-t border-brand-border pt-3 text-xs space-y-3 " + (collapsed ? "opacity-0" : "opacity-100")}
                            style={{ transition: "opacity 160ms ease-out" }}
                            aria-hidden={collapsed}
                        >
                            <div className="flex items-start gap-2 text-brand-text2">
                                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span className="whitespace-normal break-words leading-snug">{loading ? "…" : roleText}</span>
                            </div>

                            <div className="flex items-start gap-2 text-brand-text2">
                                <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span className="whitespace-normal break-words leading-snug">{loading ? "…" : einrichtungName ?? "—"}</span>
                            </div>

                            <div
                                className={
                                    "rounded-xl border px-3 py-2 " +
                                    (isExpiringSoon ? "border-brand-warning/30 bg-brand-warning/10 text-brand-text" : "border-brand-border bg-brand-bg/60 text-brand-text2")
                                }
                            >
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 shrink-0" />
                                    <div className="min-w-0">
                                        <div className="text-[11px] font-extrabold uppercase tracking-wide">Sitzung (Inaktivität)</div>
                                        <div className="mt-1 text-xs">
                                            Läuft ab in <span className="font-semibold">{formatMmSs(remainingSeconds)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 pt-1">
                                <Link
                                    href="/dashboard/account"
                                    onClick={onClose}
                                    className="
                    inline-flex items-center justify-center gap-2 rounded-xl
                    border border-brand-border bg-white
                    px-3 py-2 text-xs font-semibold text-brand-text2
                    shadow-sm
                    transition
                    hover:bg-brand-teal/10 hover:border-brand-teal/30 hover:text-brand-blue
                    focus:outline-none focus:ring-2 focus:ring-brand-teal/25
                    active:scale-[0.98]
                  "
                                >
                                    <Settings className="h-4 w-4" />
                                    Account Einstellungen
                                </Link>

                                <Button
                                    variant="ghost"
                                    className="w-full justify-center gap-2 rounded-xl border border-transparent hover:border-brand-border hover:bg-white"
                                    onClick={async () => {
                                        await signOut();
                                        onClose?.();
                                        router.push("/login");
                                    }}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Abmelden
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Home */}
            <div className="mb-4">
                <NavItem href="/dashboard" label="Übersicht" icon={LayoutDashboard} description="Start & Kennzahlen" onNavigate={onClose} />
            </div>

            {/* Nav */}
            <nav className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
                {navSections.map((sec) => (
                    <div key={sec.title}>
                        <div className="px-1 text-[11px] font-extrabold uppercase tracking-wide text-brand-text2/80">{sec.title}</div>
                        <div className="mt-2 flex flex-col gap-2">
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

export function Sidebar() {
    const [open, setOpen] = useState(false);

    // swipe-to-close state
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
        if (!dragging) return;
        const t = e.touches[0];
        if (startX.current == null || startY.current == null) return;

        const dx = t.clientX - startX.current;
        const dy = t.clientY - startY.current;

        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) return;

        if (dx < 0) {
            e.preventDefault();
            setDragX(dx);
        }
    };

    const onTouchEnd = () => {
        if (!dragging) return;

        if (dragX < -80) {
            close();
            return;
        }

        setDragX(0);
        setDragging(false);
        startX.current = null;
        startY.current = null;
    };

    return (
        <>
            {/* Mobile topbar */}
            <div className="lg:hidden sticky top-0 z-40 border-b border-brand-border bg-brand-bg/80 backdrop-blur">
                <div className="flex items-center justify-between px-4 py-3">
                    <BrandMark compact />
                    <button
                        onClick={() => setOpen(true)}
                        className="
              rounded-xl p-2 text-brand-text2
              transition
              hover:bg-white/80 hover:text-brand-blue
              focus:outline-none focus:ring-2 focus:ring-brand-teal/25
              active:scale-[0.98]
            "
                        aria-label="Menü öffnen"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden lg:flex h-screen w-72">
                <SidebarContent className="w-72" />
            </aside>

            {/* Drawer on mobile */}
            {open ? (
                <div className="lg:hidden fixed inset-0 z-50">
                    <button className="absolute inset-0 bg-black/40" aria-label="Overlay schließen" onClick={close} />

                    <div
                        className="
              absolute left-0 top-0 h-full shadow-2xl
              w-[min(320px,85vw)]
              md:w-[min(360px,55vw)]
              overscroll-contain touch-pan-y
            "
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