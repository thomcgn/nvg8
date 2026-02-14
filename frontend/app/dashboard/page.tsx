"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Secu from "../auth/Nvg8Auth";
import DashboardShell from "./components/DashboardShell";
import StatCard from "./components/StatCard";
import CaseTable from "./components/CaseTable";
import CaseWizard from "../cases/components/CaseWizard";

import { FaUsers, FaFolderOpen, FaExclamationTriangle } from "react-icons/fa";
import type { Case, CaseStatus, KindSummary } from "@/lib/types";

type DashboardStatsResponse = {
    meineOffenenFaelle: number;
    akutGefaehrdet: number;
    abgeschlossen30Tage: number;
};

// minimaler Ausschnitt aus KinderschutzFallResponse (für Dashboard)
type MyFallResponse = {
    id: number;
    status?: string | null;
    updatedAt?: string | null;
    kind?: { id: number; vorname: string; nachname: string; geburtsdatum?: string | null } | null;
};

function calcAge(geburtsdatum?: string | null) {
    if (!geburtsdatum) return 0;
    const d = new Date(geburtsdatum);
    if (Number.isNaN(d.getTime())) return 0;

    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return Math.max(age, 0);
}

function formatLastActivity(updatedAt?: string | null) {
    if (!updatedAt) return "—";
    const d = new Date(updatedAt);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("de-DE");
}

async function readBodySafe(res: Response) {
    const text = await res.text().catch(() => "");
    return { text };
}

function normalizeStatus(value: any): CaseStatus {
    if (
        value === "ENTWURF" ||
        value === "IN_PRUEFUNG" ||
        value === "AKUT" ||
        value === "HILFEPLANUNG" ||
        value === "ABGESCHLOSSEN" ||
        value === "ARCHIVIERT"
    ) {
        return value;
    }
    return "ENTWURF";
}

export default function DashboardPage() {
    const [showWizard, setShowWizard] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [stats, setStats] = useState<DashboardStatsResponse>({
        meineOffenenFaelle: 0,
        akutGefaehrdet: 0,
        abgeschlossen30Tage: 0,
    });

    const [kinderGesamt, setKinderGesamt] = useState<number>(0);
    const [cases, setCases] = useState<Case[]>([]);

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (searchParams.get("wizard") === "1") {
            setShowWizard(true);
            router.replace("/dashboard");
        }
    }, [searchParams, router]);

    const fetchAll = async () => {
        setLoading(true);
        setError(null);

        try {
            const [statsRes, mineRes, kinderRes] = await Promise.all([
                fetch("/api/cases/stats", { credentials: "include", cache: "no-store" }),
                fetch("/api/cases/mine", { credentials: "include", cache: "no-store" }),
                fetch("/api/cases/kinder", { credentials: "include", cache: "no-store" }),
            ]);

            if (!statsRes.ok) {
                const { text } = await readBodySafe(statsRes);
                throw new Error(`GET /api/cases/stats failed: ${statsRes.status} ${text}`);
            }
            if (!mineRes.ok) {
                const { text } = await readBodySafe(mineRes);
                throw new Error(`GET /api/cases/mine failed: ${mineRes.status} ${text}`);
            }
            if (!kinderRes.ok) {
                const { text } = await readBodySafe(kinderRes);
                throw new Error(`GET /api/cases/kinder failed: ${kinderRes.status} ${text}`);
            }

            const statsJson = (await statsRes.json()) as DashboardStatsResponse;
            const mineJson = (await mineRes.json()) as MyFallResponse[];
            const kinderJson = (await kinderRes.json()) as KindSummary[];

            setStats(statsJson);
            setKinderGesamt(kinderJson?.length ?? 0);

            const mapped: Case[] = (mineJson ?? []).map((f) => {
                const k = f.kind;

                const childName = k
                    ? `${k.vorname ?? ""} ${k.nachname ?? ""}`.trim()
                    : `Fall #${f.id}`;

                const status = normalizeStatus(f.status);

                return {
                    id: f.id,
                    childName,
                    age: calcAge(k?.geburtsdatum),
                    status,
                    lastActivity: formatLastActivity(f.updatedAt),
                };
            });

            setCases(mapped);
        } catch (e: any) {
            console.error("[Dashboard] fetchAll error:", e);
            setError(e?.message ?? "Dashboard konnte nicht geladen werden.");
            setCases([]);
            setStats({ meineOffenenFaelle: 0, akutGefaehrdet: 0, abgeschlossen30Tage: 0 });
            setKinderGesamt(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    return (
        <Secu fallback={<div className="p-6">Lade Dashboard…</div>}>
            {(user) => (
                <DashboardShell
                    userName={user.name}
                    userRole={user.role}
                    lastLogin={user.lastLogin}
                    onStartWizard={() => setShowWizard(true)}
                >
                    {showWizard ? (
                        <CaseWizard
                            onCancel={() => {
                                setShowWizard(false);
                                fetchAll();
                            }}
                        />
                    ) : (
                        <>
                            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
                                <StatCard
                                    title="Meine offenen Fälle"
                                    value={loading ? "…" : stats.meineOffenenFaelle}
                                    icon={<FaFolderOpen />}
                                />
                                <StatCard
                                    title="Akut gefährdet"
                                    value={loading ? "…" : stats.akutGefaehrdet}
                                    icon={<FaExclamationTriangle />}
                                />
                                <StatCard
                                    title="Abgeschlossen (30 Tage)"
                                    value={loading ? "…" : stats.abgeschlossen30Tage}
                                />
                                <StatCard
                                    title="Kinder gesamt"
                                    value={loading ? "…" : kinderGesamt}
                                    icon={<FaUsers />}
                                />
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold">Meine Fälle</h3>

                                {error ? (
                                    <div className="rounded-md border p-4 text-sm">
                                        <div className="font-medium">Fehler</div>
                                        <div className="text-muted-foreground">{error}</div>
                                    </div>
                                ) : loading ? (
                                    <div className="rounded-md border p-4 text-sm text-muted-foreground">
                                        Lade Fälle…
                                    </div>
                                ) : (
                                    <CaseTable cases={cases} />
                                )}
                            </section>
                        </>
                    )}
                </DashboardShell>
            )}
        </Secu>
    );
}