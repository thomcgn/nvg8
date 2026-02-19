"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CaseTable from "@/app/dashboard/components/CaseTable";
import type { Case, CaseStatus } from "@/lib/types";

type AllFallResponse = {
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

export default function FaellePage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cases, setCases] = useState<Case[]>([]);

    const fetchAll = async (): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/cases/all", {
                credentials: "include",
                cache: "no-store",
            });

            if (!res.ok) {
                throw new Error(`GET /api/cases/all failed: ${res.status} ${await readBodySafe(res)}`);
            }

            const json: AllFallResponse[] = await res.json();

            const mapped: Case[] = json.map((f) => {
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
            setError(e instanceof Error ? e.message : "Fälle konnten nicht geladen werden.");
            setCases([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchAll();
    }, []);

    const onClickCase = (c: Case) => {
        if (!c.kindId) {
            alert("Dieser Fall hat kein Kind zugeordnet (kindId fehlt).");
            return;
        }
        router.push(`/dashboard/cases/${c.id}/checklists?kindId=${c.kindId}`);
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-lg font-semibold">Fälle</h1>
                <p className="text-sm text-muted-foreground">Alle Fälle im System.</p>
            </div>

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
        </div>
    );
}
