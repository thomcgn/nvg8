"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";

type KindResponse = {
    id: number;
    displayName: string;
    geburtsdatum: string | null;
};

export default function AkteNeuPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const kindId = Number(sp.get("kindId") || "0");

    const [kind, setKind] = useState<KindResponse | null>(null);

    useEffect(() => {
        if (!kindId) return;
        (async () => {
            const k = await apiFetch<KindResponse>(`/kinder/${kindId}`, { method: "GET" });
            setKind(k);
        })();
    }, [kindId]);

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Akte starten" />
                <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-4 sm:px-6 md:px-8">
                    <Card>
                        <CardHeader>
                            <div className="text-sm font-semibold text-brand-text">Neue Akte</div>
                            <div className="mt-1 text-xs text-brand-text2">
                                Kind wird vorausgewählt, danach erstellen wir die Fallöffnung.
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {kindId ? (
                                <div className="rounded-2xl border border-brand-border bg-white p-3">
                                    <div className="text-sm font-semibold text-brand-blue">{kind?.displayName ?? `Kind #${kindId}`}</div>
                                    <div className="mt-1 text-xs text-brand-text2">geb. {kind?.geburtsdatum ?? "—"}</div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-brand-warning/25 bg-brand-warning/10 p-3 text-sm text-brand-text">
                                    Kein Kind ausgewählt. Bitte starte die Akte über ein Kind.
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-2">
                                <Button variant="secondary" onClick={() => router.push("/dashboard/akten")}>
                                    Zurück
                                </Button>

                                {/* Placeholder: hier kommt das echte POST /falloeffnungen rein */}
                                <Button
                                    onClick={() => {
                                        // später: POST /falloeffnungen { kindId } -> dann push auf detail
                                        router.push("/dashboard/akten");
                                    }}
                                    disabled={!kindId}
                                >
                                    Akte erstellen
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthGate>
    );
}