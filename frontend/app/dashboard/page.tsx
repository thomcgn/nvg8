"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

type MyFallResponse = {
    id: number;
    status: CaseStatus | null;
    updatedAt: string | null;
    kind: {
        id: number;
        vorname: string;
        nachname: string;
        geburtsdatum: string | null;
    } | null;
};

function calcAgeYears(geburtsdatum: string | null): number {
    if (!geburtsdatum) return 0;
    const d = new Date(geburtsdatum);
    if (Number.isNaN(d.getTime())) return 0;

    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return Math.max(age, 0);
}

function formatLastActivity(updatedAt: string | null): string {
    if (!updatedAt) return "—";
    const d = new Date(updatedAt);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("de-DE");
}

async function readBodySafe(res: Response): Promise<string> {
    try {
        return await res.text();
    } catch {
        return "";
    }
}

export default function DashboardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

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

    useEffect(() => {
        if (searchParams.get("wizard") === "1") {
            setShowWizard(true);

            // ✅ URL bereinigen ohne Next-Navigation/Remount
            if (typeof window !== "undefined") {
                window.history.replaceState(null, "", "/dashboard");
            }
        }
    }, [searchParams]);

    const fetchAll = async (): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const [statsRes, mineRes, kinderRes] = await Promise.all([
                fetch("/api/cases/stats", { credentials: "include", cache: "no-store" }),
                fetch("/api/cases/mine", { credentials: "include", cache: "no-store" }),
                fetch("/api/cases/kinder", { credentials: "include", cache: "no-store" }),
            ]);

            if (!statsRes.ok) throw new Error(`GET /api/cases/stats failed: ${statsRes.status} ${await readBodySafe(statsRes)}`);
            if (!mineRes.ok) throw new Error(`GET /api/cases/mine failed: ${mineRes.status} ${await readBodySafe(mineRes)}`);
            if (!kinderRes.ok) throw new Error(`GET /api/cases/kinder failed: ${kinderRes.status} ${await readBodySafe(kinderRes)}`);

            const statsJson: DashboardStatsResponse = await statsRes.json();
            const mineJson: MyFallResponse[] = await mineRes.json();
            const kinderJson: KindSummary[] = await kinderRes.json();

            setStats(statsJson);
            setKinderGesamt(kinderJson.length);

            const mapped: Case[] = mineJson.map((f) => {
                const kind = f.kind;
                const childName = kind ? `${kind.vorname} ${kind.nachname}`.trim() : `Fall #${f.id}`;

                return {
                    id: f.id,
                    kindId: kind?.id,
                    childName,
                    age: calcAgeYears(kind?.geburtsdatum ?? null),
                    status: f.status ?? "ENTWURF",
                    lastActivity: formatLastActivity(f.updatedAt),
                };
            });

            setCases(mapped);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Dashboard konnte nicht geladen werden.");
            setCases([]);
            setStats({ meineOffenenFaelle: 0, akutGefaehrdet: 0, abgeschlossen30Tage: 0 });
            setKinderGesamt(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchAll();
    }, []);

    const onCancelWizard = () => {
        setShowWizard(false);
        void fetchAll();
    };

    const onClickCase = (c: Case) => {
        if (!c.kindId) {
            alert("Dieser Fall hat kein Kind zugeordnet (kindId fehlt).");
            return;
        }
        router.push(`/dashboard/cases/${c.id}/checklists?kindId=${c.kindId}`);
    };

    return (
        <div className="space-y-6">
            {showWizard ? (
                <CaseWizard onCancel={onCancelWizard} />
            ) : (
                <>
                    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                        <StatCard title="Meine offenen Fälle" value={loading ? "…" : String(stats.meineOffenenFaelle)} icon={<FaFolderOpen />} />
                        <StatCard title="Akut gefährdet" value={loading ? "…" : String(stats.akutGefaehrdet)} icon={<FaExclamationTriangle />} />
                        <StatCard title="Abgeschlossen (30 Tage)" value={loading ? "…" : String(stats.abgeschlossen30Tage)} />
                        <StatCard title="Kinder gesamt" value={loading ? "…" : String(kinderGesamt)} icon={<FaUsers />} />
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold">Meine Fälle</h3>

                        {error ? (
                            <div className="rounded-md border p-4 text-sm">
                                <div className="font-medium">Fehler</div>
                                <div className="text-muted-foreground">{error}</div>
                            </div>
                        ) : loading ? (
                            <div className="rounded-md border p-4 text-sm text-muted-foreground">Lade Fälle…</div>
                        ) : (
                            <CaseTable cases={cases} onRowClick={onClickCase} />
                        )}
                    </section>
                </>
            )}
        </div>
    );
}