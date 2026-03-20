"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    RefreshCw,
    Phone,
    Mail,
    MapPin,
    User,
    Baby,
    CalendarDays,
    UserCircle,
} from "lucide-react";

import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { BezugspersonResponse, BezugspersonBeziehung, Gender } from "@/lib/types";

// ---- helpers ----
function safeIdFromParams(v: unknown): number | null {
    if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    if (Array.isArray(v) && typeof v[0] === "string") {
        const n = Number(v[0]);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    return null;
}

function errorMessage(e: unknown, fallback: string): string {
    if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
        return (e as { message: string }).message;
    }
    return fallback;
}

function formatBeziehung(b: BezugspersonBeziehung | null | undefined): string {
    if (!b) return "—";
    const map: Record<string, string> = {
        MUTTER: "Mutter",
        VATER: "Vater",
        SORGEBERECHTIGT: "Sorgeberechtigt",
        PFLEGEMUTTER: "Pflegemutter",
        PFLEGEVATER: "Pflegevater",
        STIEFMUTTER: "Stiefmutter",
        STIEFVATER: "Stiefvater",
        GROSSMUTTER: "Großmutter",
        GROSSVATER: "Großvater",
        SONSTIGE: "Sonstige",
    };
    return map[b] ?? String(b).charAt(0) + String(b).slice(1).toLowerCase();
}

function formatGender(g: Gender | null | undefined): string {
    if (!g) return "—";
    const map: Record<string, string> = {
        MAENNLICH: "Männlich",
        WEIBLICH: "Weiblich",
        DIVERS: "Divers",
        UNBEKANNT: "Unbekannt",
    };
    return map[g] ?? g;
}

function formatAddress(bp: BezugspersonResponse | null): string | null {
    if (!bp) return null;
    const street = [bp.strasse, bp.hausnummer].filter(Boolean).join(" ");
    const city = [bp.plz, bp.ort].filter(Boolean).join(" ");
    const full = [street, city].filter(Boolean).join(", ").trim();
    return full.length ? full : null;
}

// ---- Info tile component ----
function InfoTile({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-brand-border/25 bg-white p-3">
            <div className="text-xs font-medium text-brand-text2">{label}</div>
            <div className="mt-1 text-sm font-semibold text-brand-text">{children}</div>
        </div>
    );
}

export default function BezugspersonDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = safeIdFromParams(params?.id);

    const [bp, setBp] = React.useState<BezugspersonResponse | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);

    async function load() {
        if (!id) {
            setErr("Ungültige ID in der URL.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setErr(null);
        try {
            const res = await apiFetch<BezugspersonResponse>(`/bezugspersonen/${id}`, { method: "GET" });
            setBp(res);
        } catch (e: unknown) {
            setErr(errorMessage(e, "Bezugsperson konnte nicht geladen werden."));
            setBp(null);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const address = formatAddress(bp);
    const kinder = bp?.kinder ?? [];
    const displayName = bp ? `${bp.vorname ?? ""} ${bp.nachname ?? ""}`.trim() || `Bezugsperson #${bp.id}` : "—";

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Bezugsperson" />

                <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 pb-12 pt-4 space-y-4">

                    {/* Back + Refresh */}
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => router.back()}
                            className="gap-2 h-11"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Zurück
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => load()}
                            disabled={loading}
                            className="gap-2 h-11"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Aktualisieren
                        </Button>
                    </div>

                    {err && (
                        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                            {err}
                        </div>
                    )}

                    {/* Header */}
                    <div className="rounded-2xl border border-brand-border/40 bg-white p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                            <UserCircle className="h-8 w-8 text-brand-text2 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <div className="text-lg font-bold text-brand-text truncate">
                                    {loading ? "Lädt…" : displayName}
                                </div>
                                {bp && (
                                    <div className="mt-0.5 text-sm text-brand-text2">
                                        {formatBeziehung(bp.beziehung)}
                                        {bp.id ? ` · #${bp.id}` : ""}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stammdaten */}
                    <Card className="border border-brand-border/40 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-brand-text2" />
                                <div className="text-sm font-semibold text-brand-text">Stammdaten</div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-sm text-brand-text2">Lade…</div>
                            ) : !bp ? (
                                <div className="text-sm text-brand-text2">Keine Daten gefunden.</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <InfoTile label="Vorname">{bp.vorname || "—"}</InfoTile>
                                    <InfoTile label="Nachname">{bp.nachname || "—"}</InfoTile>
                                    <InfoTile label="Geburtsdatum">
                                        <span className="flex items-center gap-1.5">
                                            <CalendarDays className="h-3.5 w-3.5 text-brand-text2 shrink-0" />
                                            {bp.geburtsdatum || "—"}
                                        </span>
                                    </InfoTile>
                                    <InfoTile label="Geschlecht">{formatGender(bp.gender)}</InfoTile>
                                    <div className="sm:col-span-2">
                                        <InfoTile label="Beziehung">{formatBeziehung(bp.beziehung)}</InfoTile>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Kontakt */}
                    <Card className="border border-brand-border/40 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-brand-text2" />
                                <div className="text-sm font-semibold text-brand-text">Kontakt</div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-sm text-brand-text2">Lade…</div>
                            ) : !bp ? null : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-brand-border/25 bg-white p-3">
                                        <div className="text-xs font-medium text-brand-text2">Telefon</div>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 text-brand-text2 shrink-0" />
                                            {bp.telefon ? (
                                                <a
                                                    href={`tel:${bp.telefon}`}
                                                    className="text-sm font-semibold text-brand-text hover:underline tabular-nums"
                                                >
                                                    {bp.telefon}
                                                </a>
                                            ) : (
                                                <span className="text-sm text-brand-text2">—</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-brand-border/25 bg-white p-3">
                                        <div className="text-xs font-medium text-brand-text2">E-Mail</div>
                                        <div className="mt-1 flex items-center gap-1.5 min-w-0">
                                            <Mail className="h-3.5 w-3.5 text-brand-text2 shrink-0" />
                                            {bp.kontaktEmail ? (
                                                <a
                                                    href={`mailto:${bp.kontaktEmail}`}
                                                    className="text-sm font-semibold text-brand-text hover:underline truncate"
                                                >
                                                    {bp.kontaktEmail}
                                                </a>
                                            ) : (
                                                <span className="text-sm text-brand-text2">—</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Adresse */}
                    <Card className="border border-brand-border/40 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-brand-text2" />
                                <div className="text-sm font-semibold text-brand-text">Adresse</div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-sm text-brand-text2">Lade…</div>
                            ) : !bp ? null : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <InfoTile label="Straße">
                                            {[bp.strasse, bp.hausnummer].filter(Boolean).join(" ") || "—"}
                                        </InfoTile>
                                    </div>
                                    <InfoTile label="PLZ">{bp.plz || "—"}</InfoTile>
                                    <InfoTile label="Ort">{bp.ort || "—"}</InfoTile>
                                    {address && (
                                        <div className="sm:col-span-2 rounded-2xl border border-brand-border/25 bg-brand-bg/50 p-3">
                                            <div className="flex items-start gap-2 text-sm text-brand-text2">
                                                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                                <span>{address}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Verknüpfte Kinder */}
                    <Card className="border border-brand-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Baby className="h-4 w-4 text-brand-text2" />
                                <div className="text-sm font-semibold text-brand-text">Verknüpfte Kinder</div>
                            </div>
                            <div className="text-xs text-brand-text2">
                                {loading ? "…" : `${kinder.length} ${kinder.length === 1 ? "Kind" : "Kinder"}`}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-sm text-brand-text2">Lade…</div>
                            ) : kinder.length === 0 ? (
                                <div className="rounded-2xl border border-brand-border/25 bg-white p-4 text-sm text-brand-text2">
                                    Keine Kinder verknüpft.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {kinder.map((k) => (
                                        <Link
                                            key={k.id}
                                            href={`/dashboard/kinder/${k.id}`}
                                            className="flex items-center gap-3 rounded-2xl border border-brand-border/25 bg-white p-3 transition hover:bg-brand-bg/30"
                                        >
                                            <Baby className="h-4 w-4 text-brand-text2 shrink-0" />
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-semibold text-brand-text">
                                                    {k.displayName || `Kind #${k.id}`}
                                                </div>
                                                {k.geburtsdatum && (
                                                    <div className="mt-0.5 text-xs text-brand-text2">
                                                        geb. {k.geburtsdatum}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AuthGate>
    );
}