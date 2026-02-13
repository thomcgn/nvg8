"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { apiJson } from "@/lib/http";
import type {
    KSInstrumentTreeDTO,
    GetOrCreateInstanceResponse,
    LoadInstanceResponse,
    AutoSaveRequest,
    AutoSaveResponse,
} from "@/lib/types";
import { KSSectionAccordion } from "./KSSectionAccordion";

type FormValues = {
    // answers.<itemId> = value_string
    answers: Record<string, string>;
};

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
    let t: any;
    return (...args: Parameters<T>) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

export function KSInstrumentForm({
                                     fallId,
                                     instrument,
                                 }: {
    fallId: string; // route param
    instrument: KSInstrumentTreeDTO; // kommt z.B. aus load endpoint oder instrument endpoint
}) {
    const [instanceId, setInstanceId] = React.useState<number | null>(null);
    const [version, setVersion] = React.useState<number>(0);
    const [saving, setSaving] = React.useState(false);

    const { control, handleSubmit, setValue, getValues, watch } = useForm<FormValues>({
        defaultValues: { answers: {} },
    });

    // 1) Instance get-or-create + load answers (damit du auch refresh/weiterarbeiten kannst)
    React.useEffect(() => {
        let mounted = true;

        (async () => {
            const created = await apiJson<GetOrCreateInstanceResponse>(
                "/api/kinderschutz/forms/instances:get-or-create",
                {
                    method: "POST",
                    body: JSON.stringify({
                        fallId: Number(fallId),
                        instrumentId: instrument.id,
                    }),
                }
            );

            const loaded = await apiJson<LoadInstanceResponse>(
                `/api/kinderschutz/forms/instances/${created.instanceId}`
            );

            if (!mounted) return;

            setInstanceId(loaded.instanceId);
            setVersion(loaded.version);

            // answers in RHF schreiben
            for (const a of loaded.answers) {
                if (a.value != null) setValue(`answers.${String(a.itemId)}`, a.value);
            }
        })().catch(console.error);

        return () => {
            mounted = false;
        };
    }, [fallId, instrument.id, setValue]);

    // 2) Autosave (watch -> debounce -> POST autosave)
    const doAutosave = React.useMemo(
        () =>
            debounce(async () => {
                if (!instanceId) return;

                const values = getValues().answers || {};
                const payload: AutoSaveRequest = {
                    instanceId,
                    expectedVersion: version,
                    answers: Object.entries(values).map(([itemId, value]) => ({
                        itemId: Number(itemId),
                        value: value ?? null,
                    })),
                };

                setSaving(true);
                try {
                    const res = await apiJson<AutoSaveResponse>("/api/kinderschutz/forms/autosave", {
                        method: "POST",
                        body: JSON.stringify(payload),
                    });
                    setVersion(res.newVersion);
                } catch (e: any) {
                    // Bei 409: reload (einfachste robuste Strategie)
                    const msg = String(e?.message ?? "");
                    if (msg.includes("409") || msg.toLowerCase().includes("conflict")) {
                        const loaded = await apiJson<LoadInstanceResponse>(
                            `/api/kinderschutz/forms/instances/${instanceId}`
                        );
                        setVersion(loaded.version);
                        for (const a of loaded.answers) {
                            setValue(`answers.${String(a.itemId)}`, a.value ?? "");
                        }
                    } else {
                        console.error(e);
                    }
                } finally {
                    setSaving(false);
                }
            }, 800),
        [getValues, instanceId, version, setValue]
    );

    React.useEffect(() => {
        const sub = watch(() => doAutosave());
        return () => sub.unsubscribe();
    }, [watch, doAutosave]);

    // 3) Optional: “Speichern”-Button = erzwingt Autosave sofort (kein anderes Endpoint nötig)
    const onSubmit = async () => {
        await doAutosave();
        alert("Gespeichert.");
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-xl font-semibold">{instrument.titel}</div>
                    <div className="text-sm text-muted-foreground">
                        {instrument.code} · Version {instrument.version}
                        {instanceId ? ` · Instance #${instanceId} · v${version}` : ""}
                        {saving ? " · speichere…" : ""}
                    </div>
                </div>

                <Button type="submit" disabled={!instanceId}>
                    Speichern
                </Button>
            </div>

            <KSSectionAccordion sections={instrument.sections} control={control} />
        </form>
    );
}