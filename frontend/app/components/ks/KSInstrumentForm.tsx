"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { KSInstrumentTreeDTO, SaveAnswersRequest } from "@/lib/types";
import { KSSectionAccordion } from "./KSSectionAccordion";

type FormValues = {
    // answers.<itemNo>.answer + answers.<itemNo>.comment
    answers: Record<string, { answer?: string; comment?: string }>;
};

export function KSInstrumentForm({
                                     fallId,
                                     instrument,
                                 }: {
    fallId: string;
    instrument: KSInstrumentTreeDTO;
}) {
    const [formId, setFormId] = React.useState<number | null>(null);
    const [saving, setSaving] = React.useState(false);

    const { control, handleSubmit } = useForm<FormValues>({
        defaultValues: { answers: {} },
    });

    // 1) FormInstance anlegen (einmalig), damit wir an Fallakte hängen
    React.useEffect(() => {
        let mounted = true;
        (async () => {
            const res = await api.createFormInstance(fallId, instrument.code, instrument.version);
            if (mounted) setFormId(res.formId);
        })().catch(console.error);
        return () => { mounted = false; };
    }, [fallId, instrument.code, instrument.version]);

    const onSubmit = async (values: FormValues) => {
        if (!formId) return;
        setSaving(true);
        try {
            // answers: Record(itemNo -> {answer, comment}) -> Array
            const answersArray = Object.entries(values.answers || {})
                .filter(([, v]) => v?.answer != null && v.answer !== "")
                .map(([itemNo, v]) => ({
                    // itemId optional, wenn du es serverseitig über itemNo auflösen willst
                    itemId: 0,
                    itemNo,
                    answer: String(v.answer),
                    comment: v.comment?.trim() || undefined,
                }));

            const payload: SaveAnswersRequest = {
                instrumentCode: instrument.code,
                instrumentVersion: instrument.version,
                answers: answersArray,
            };

            await api.saveAnswers(fallId, formId, payload);
            // optional: toast
            alert("Gespeichert.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-xl font-semibold">{instrument.titel}</div>
                    <div className="text-sm text-muted-foreground">
                        {instrument.code} · Version {instrument.version}
                    </div>
                </div>
                <Button type="submit" disabled={saving || !formId}>
                    {saving ? "Speichern…" : "Speichern"}
                </Button>
            </div>

            <KSSectionAccordion sections={instrument.sections} control={control} />
        </form>
    );
}
