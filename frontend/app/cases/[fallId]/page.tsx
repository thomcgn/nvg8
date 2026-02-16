"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Secu from "@/app/auth/Nvg8Auth";
import type {
    GetOrCreateInstanceResponse,
    LoadInstanceResponse,
    AutoSaveRequest,
} from "@/lib/types";

export default function CaseInstrumentPage() {
    const params = useParams<{ fallId: string }>();
    const router = useRouter();
    const fallId = Number(params.fallId);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [instance, setInstance] = useState<LoadInstanceResponse | null>(null);

    useEffect(() => {
        if (!fallId || Number.isNaN(fallId)) {
            setError("Ungültige Fall-ID.");
            setLoading(false);
            return;
        }

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1) get-or-create instance
                const createRes = await fetch("/api/instrument/instances/get-or-create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ fallId }),
                });

                if (!createRes.ok) {
                    const text = await createRes.text().catch(() => "");
                    throw new Error(`get-or-create failed: ${createRes.status} ${text}`);
                }

                const created = (await createRes.json()) as GetOrCreateInstanceResponse;

                // 2) load instance
                const loadRes = await fetch(`/api/instrument/instances/${created.instanceId}`, {
                    credentials: "include",
                    cache: "no-store",
                });

                if (!loadRes.ok) {
                    const text = await loadRes.text().catch(() => "");
                    throw new Error(`load instance failed: ${loadRes.status} ${text}`);
                }

                const loaded = (await loadRes.json()) as LoadInstanceResponse;
                setInstance(loaded);
            } catch (e: any) {
                console.error(e);
                setError(e?.message ?? "Instrument konnte nicht geladen werden.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [fallId]);

    if (loading) return <div className="p-6">Lade Instrument…</div>;
    if (error) {
        return (
            <div className="p-6 space-y-3">
                <div className="font-semibold">Fehler</div>
                <div className="text-sm text-muted-foreground">{error}</div>
                <button className="underline" onClick={() => router.push("/dashboard")}>
                    Zurück zum Dashboard
                </button>
            </div>
        );
    }

    if (!instance) return null;

    // TODO: Hier dein Instrument UI einhängen.
    // Du hast: instance.instrument (Baum) + instance.answers (Antworten)
    return (
        <Secu fallback={<div className="p-6">Lade…</div>}>
            {() => (
                <div className="p-6 space-y-4">
                    <h1 className="text-xl font-semibold">
                        Instrument – Fall #{instance.fallId} (Instanz #{instance.instanceId})
                    </h1>

                    <div className="text-sm text-muted-foreground">
                        Version: {instance.version} • Instrument: {instance.instrument?.titel} ({instance.instrument?.code} v{instance.instrument?.version})
                    </div>

                    {/* Platzhalter: ersetze das durch deinen Instrument-Renderer */}
                    <pre className="text-xs rounded-md border p-3 overflow-auto">
            {JSON.stringify(instance, null, 2)}
          </pre>
                </div>
            )}
        </Secu>
    );
}