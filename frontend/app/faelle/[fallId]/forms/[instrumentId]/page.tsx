"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { apiFetch } from "@/lib/http";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type AnswerType = "TRI_STATE" | "TEXT" | "DATE" | "USER_REF";
type TriState = "JA" | "NEIN" | "UNBEKANNT";

type KSItemDTO = {
    id: number;
    itemNo: string;
    text: string;
    answerType: AnswerType;
    orderIndex: number | null;
    polarity?: string | null;
    akutKriterium?: boolean | null;
};

type KSSectionDTO = {
    id: number;
    sectionNo: string;
    title: string;
    orderIndex: number | null;
    hintText?: string | null;
    items: KSItemDTO[];
    children: KSSectionDTO[];
};

type KSInstrumentDTO = {
    id: number;
    code: string;
    titel: string;
    typ: string;
    version: string;
    sections: KSSectionDTO[];
};

type KSFormLoadDTO = {
    instanceId: number;
    version: number;
    fallId: number;
    instrument: KSInstrumentDTO;
    answers: { itemId: number; value: string | null }[];
};

type GetOrCreateResp = { instanceId: number; version: number };
type AutoSaveResp = { instanceId: number; newVersion: number };

type FormValues = {
    // key = itemId als string
    answers: Record<string, string>;
};

function flattenSections(sections: KSSectionDTO[]): KSSectionDTO[] {
    const out: KSSectionDTO[] = [];
    const walk = (s: KSSectionDTO) => {
        out.push(s);
        s.children?.forEach(walk);
    };
    sections.forEach(walk);
    return out;
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
    let t: any;
    return (...args: Parameters<T>) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
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

    useEffect(() => {
        const init = async () => {
            // 1) get-or-create instance
            const inst = await apiFetch<GetOrCreateResp>("/api/kinderschutz/forms/instances:get-or-create", {
                method: "POST",
                body: JSON.stringify({ fallId, instrumentId }),
            });

            instanceRef.current = inst.instanceId;

            // 2) load instance + instrument tree + answers
            const data = await apiFetch<KSFormLoadDTO>(`/api/kinderschutz/forms/instances/${inst.instanceId}`);

            versionRef.current = data.version;
            setLoad(data);

            // default active section
            const first = data.instrument.sections?.[0]?.sectionNo ?? null;
            setActiveSectionNo(first);

            // answers in RHF default setzen
            for (const a of data.answers) {
                if (a.value != null) {
                    setValue(`answers.${String(a.itemId)}` as const, a.value);
                }
            }
        };

        init().catch((e) => {
            console.error(e);
            router.push("/dashboard");
        });
    }, [fallId, instrumentId, router, setValue]);

    const allSections = useMemo(() => (load ? flattenSections(load.instrument.sections) : []), [load]);

    const activeSection = useMemo(() => {
        if (!load || !activeSectionNo) return null;
        return allSections.find((s) => s.sectionNo === activeSectionNo) ?? null;
    }, [load, activeSectionNo, allSections]);

    const doAutosave = useMemo(
        () =>
            debounce(async () => {
                if (!load) return;

                const values = getValues().answers || {};
                const payload = {
                    instanceId: instanceRef.current,
                    expectedVersion: versionRef.current,
                    answers: Object.entries(values).map(([itemId, value]) => ({
                        itemId: Number(itemId),
                        value: value ?? null,
                    })),
                };

                setSaving(true);
                try {
                    const res = await apiFetch<AutoSaveResp>("/api/kinderschutz/forms/autosave", {
                        method: "POST",
                        body: JSON.stringify(payload),
                    });
                    versionRef.current = res.newVersion;
                } catch (e: any) {
                    // 409 Version conflict: simplest robust approach => reload
                    if (String(e.message || "").includes("409") || String(e.message || "").includes("CONFLICT")) {
                        const fresh = await apiFetch<KSFormLoadDTO>(`/api/kinderschutz/forms/instances/${instanceRef.current}`);
                        versionRef.current = fresh.version;
                        setLoad(fresh);

                        // Werte neu setzen
                        for (const a of fresh.answers) {
                            setValue(`answers.${String(a.itemId)}` as const, a.value ?? "");
                        }
                    } else {
                        console.error(e);
                    }
                } finally {
                    setSaving(false);
                }
            }, 800),
        [getValues, load, setValue]
    );

    // watch -> autosave
    useEffect(() => {
        const sub = watch(() => {
            doAutosave();
        });
        return () => sub.unsubscribe();
    }, [watch, doAutosave]);

    if (!load) return <div className="p-6">Lade Formular…</div>;

    return (
        <div className="p-6 grid grid-cols-12 gap-6">
            {/* Navigation */}
            <Card className="col-span-12 md:col-span-4 p-4">
                <div className="font-semibold mb-2">{load.instrument.titel}</div>
                <div className="text-xs text-muted-foreground mb-4">
                    {load.instrument.code} · {load.instrument.version} · Instance #{load.instanceId} · v{versionRef.current}{" "}
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

            {/* Section Content */}
            <Card className="col-span-12 md:col-span-8 p-4">
                {!activeSection ? (
                    <div>Keine Section gewählt.</div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <div className="text-lg font-semibold">
                                {activeSection.sectionNo} · {activeSection.title}
                            </div>
                            {activeSection.hintText ? (
                                <div className="text-sm text-muted-foreground mt-1">{activeSection.hintText}</div>
                            ) : null}
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
                                                {item.akutKriterium ? <span className="ml-2 text-red-600">(AKUT)</span> : null}
                                            </div>
                                            <Textarea
                                                value={watch(field) || ""}
                                                onChange={(e) => setValue(field, e.target.value)}
                                                placeholder="Freitext…"
                                            />
                                        </div>
                                    );
                                }

                                // TRI_STATE als String
                                return (
                                    <div key={item.id} className="space-y-2">
                                        <div className="text-sm font-medium">
                                            {item.itemNo} · {item.text}
                                            {item.akutKriterium ? <span className="ml-2 text-red-600">(AKUT)</span> : null}
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