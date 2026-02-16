"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import type {
    AutoSaveResp,
    FormValues,
    GetOrCreateResp,
    KSFormLoadDTO,
    KSSectionDTO,
    TriState,
} from "@/lib/types";

function flattenSections(sections: KSSectionDTO[]): KSSectionDTO[] {
    const result: KSSectionDTO[] = [];
    const walk = (s: KSSectionDTO) => {
        result.push(s);
        s.children.forEach(walk);
    };
    sections.forEach(walk);
    return result;
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

async function readBodySafe(res: Response): Promise<string> {
    try {
        return await res.text();
    } catch {
        return "";
    }
}

export default function KSFormPage() {
    const params = useParams<{ fallId: string; instrumentId: string }>();
    const router = useRouter();

    const fallId = Number(params.fallId);
    const instrumentId = Number(params.instrumentId);

    const [load, setLoad] = useState<KSFormLoadDTO | null>(null);
    const [activeSectionNo, setActiveSectionNo] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const versionRef = useRef<number>(0);
    const instanceRef = useRef<number>(0);

    const form = useForm<FormValues>({ defaultValues: { answers: {} } });
    const { watch, setValue, getValues } = form;

    // INIT
    useEffect(() => {
        const init = async (): Promise<void> => {
            try {
                // 1) get-or-create instance  ✅ POST /instances
                const instRes = await fetch("/api/kinderschutz/forms/instances", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    cache: "no-store",
                    body: JSON.stringify({ fallId, instrumentId }),
                });

                if (!instRes.ok) {
                    const text = await readBodySafe(instRes);
                    throw new Error(`POST /instances failed: ${instRes.status} ${text}`);
                }

                const inst: GetOrCreateResp = await instRes.json();
                instanceRef.current = inst.instanceId;

                // 2) load instance ✅ GET /instances/{id}
                const loadRes = await fetch(
                    `/api/kinderschutz/forms/instances/${inst.instanceId}`,
                    { credentials: "include", cache: "no-store" }
                );

                if (!loadRes.ok) {
                    const text = await readBodySafe(loadRes);
                    throw new Error(`GET /instances/{id} failed: ${loadRes.status} ${text}`);
                }

                const data: KSFormLoadDTO = await loadRes.json();
                versionRef.current = data.version;
                setLoad(data);

                const first = data.instrument.sections[0]?.sectionNo ?? null;
                setActiveSectionNo(first);

                // Antworten in RHF setzen
                for (const a of data.answers) {
                    if (a.value !== null) {
                        setValue(`answers.${String(a.itemId)}`, a.value, { shouldDirty: false });
                    }
                }
            } catch (err) {
                console.error(err);
                router.push("/dashboard");
            }
        };

        void init();
    }, [fallId, instrumentId, router, setValue]);

    const allSections = useMemo(
        () => (load ? flattenSections(load.instrument.sections) : []),
        [load]
    );

    const activeSection = useMemo(() => {
        if (!load || !activeSectionNo) return null;
        return allSections.find((s) => s.sectionNo === activeSectionNo) ?? null;
    }, [load, activeSectionNo, allSections]);

    const doAutosave = useMemo(
        () =>
            debounce(async () => {
                if (!load) return;

                const values = getValues().answers;

                const payload = {
                    expectedVersion: versionRef.current,
                    answers: Object.entries(values).map(([itemId, value]) => ({
                        itemId: Number(itemId),
                        value: value ?? null,
                    })),
                };

                setSaving(true);
                try {
                    // ✅ POST /instances/{id}/autosave  (passt zu deinem Controller!)
                    const res = await fetch(
                        `/api/kinderschutz/forms/instances/${instanceRef.current}/autosave`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify(payload),
                        }
                    );

                    if (!res.ok) {
                        const text = await readBodySafe(res);

                        // Optional: bei 409 reload
                        if (res.status === 409) {
                            const freshRes = await fetch(
                                `/api/kinderschutz/forms/instances/${instanceRef.current}`,
                                { credentials: "include", cache: "no-store" }
                            );
                            if (freshRes.ok) {
                                const fresh: KSFormLoadDTO = await freshRes.json();
                                versionRef.current = fresh.version;
                                setLoad(fresh);
                                for (const a of fresh.answers) {
                                    setValue(`answers.${String(a.itemId)}`, a.value ?? "", { shouldDirty: false });
                                }
                            }
                            return;
                        }

                        throw new Error(`Autosave failed: ${res.status} ${text}`);
                    }

                    const json: AutoSaveResp = await res.json();
                    versionRef.current = json.newVersion;
                } catch (e) {
                    console.error(e);
                } finally {
                    setSaving(false);
                }
            }, 800),
        [getValues, load, setValue]
    );

    useEffect(() => {
        const sub = watch(() => {
            doAutosave();
        });
        return () => sub.unsubscribe();
    }, [watch, doAutosave]);

    if (!load) return <div className="p-6">Lade Formular…</div>;

    return (
        <div className="p-6 grid grid-cols-12 gap-6">
            <Card className="col-span-12 md:col-span-4 p-4">
                <div className="font-semibold mb-2">{load.instrument.titel}</div>
                <div className="text-xs text-muted-foreground mb-4">
                    Instance #{load.instanceId} · v{versionRef.current}{" "}
                    {saving ? "· speichere…" : "· gespeichert"}
                </div>

                <div className="space-y-1">
                    {allSections.map((s) => (
                        <Button
                            key={s.id}
                            variant={s.sectionNo === activeSectionNo ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => setActiveSectionNo(s.sectionNo)}
                        >
                            {s.sectionNo} · {s.title}
                        </Button>
                    ))}
                </div>
            </Card>

            <Card className="col-span-12 md:col-span-8 p-4">
                {!activeSection ? (
                    <div>Keine Section gewählt.</div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <div className="text-lg font-semibold">
                                {activeSection.sectionNo} · {activeSection.title}
                            </div>
                            {activeSection.hintText && (
                                <div className="text-sm text-muted-foreground mt-1">
                                    {activeSection.hintText}
                                </div>
                            )}
                        </div>

                        <Separator />

                        <div className="space-y-6">
                            {activeSection.items.map((item) => {
                                const field = `answers.${String(item.id)}` as const;

                                if (item.answerType === "TEXT") {
                                    return (
                                        <div key={item.id} className="space-y-2">
                                            <div className="text-sm font-medium">
                                                {item.itemNo} · {item.text}
                                            </div>
                                            <Textarea
                                                value={watch(field) || ""}
                                                onChange={(e) => setValue(field, e.target.value)}
                                            />
                                        </div>
                                    );
                                }

                                return (
                                    <div key={item.id} className="space-y-2">
                                        <div className="text-sm font-medium">
                                            {item.itemNo} · {item.text}
                                        </div>

                                        <RadioGroup
                                            value={(watch(field) as TriState) || "UNBEKANNT"}
                                            onValueChange={(v) => setValue(field, v)}
                                            className="flex gap-6"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="JA" id={`${item.id}-ja`} />
                                                <Label htmlFor={`${item.id}-ja`}>Ja</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="NEIN" id={`${item.id}-nein`} />
                                                <Label htmlFor={`${item.id}-nein`}>Nein</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="UNBEKANNT" id={`${item.id}-unk`} />
                                                <Label htmlFor={`${item.id}-unk`}>Unbekannt</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}