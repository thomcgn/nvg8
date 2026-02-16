"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { apiJson } from "@/lib/http";

import { TriStateToggle, type TriState } from "@/app/components/kws/TriStateToggle";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type KindSummary = {
    id: number;
    vorname: string;
    nachname: string;
    geburtsdatum: string | null;
};

type CaseDetails = {
    id: number;
    childId: number;
    childName: string;
};

type TemplateListEntry = {
    code: string;
    title: string;
    version: string;
    audience: "ALL" | "YOUTH_OFFICE_ONLY";
    active: boolean;
};

type TemplateSchema = {
    code: string;
    title: string;
    version: string;
    sections: Array<{
        id: number;
        sectionKey: string;
        title: string;
        sort: number;
        items: Array<{
            id: number;
            itemKey: string;
            label: string;
            answerType: "TRI_STATE" | "TEXT" | "DATE";
            sort: number;
        }>;
    }>;
};

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

type AnswerState = Record<number, { triState?: TriState; comment?: string; textValue?: string; dateValue?: string }>;

export default function CaseChecklistsPage() {
    const params = useParams<{ caseId: string }>();
    const searchParams = useSearchParams();

    const caseId = Number(params.caseId);
    const kindIdParam = searchParams.get("kindId");
    const kindId = kindIdParam ? Number(kindIdParam) : NaN;

    const [caseDetails, setCaseDetails] = React.useState<CaseDetails | null>(null);
    const [templates, setTemplates] = React.useState<TemplateListEntry[]>([]);
    const [loading, setLoading] = React.useState(true);

    // Start dialog
    const [startOpen, setStartOpen] = React.useState(false);
    const [templateCode, setTemplateCode] = React.useState("");
    const [assessmentDate, setAssessmentDate] = React.useState(todayISO());
    const [reason, setReason] = React.useState("");
    const [nextReviewDate, setNextReviewDate] = React.useState("");

    // Active run
    const [runId, setRunId] = React.useState<number | null>(null);
    const [schema, setSchema] = React.useState<TemplateSchema | null>(null);
    const [answers, setAnswers] = React.useState<AnswerState>({});
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (!kindId || Number.isNaN(kindId)) {
            setLoading(false);
            setCaseDetails(null);
            setTemplates([]);
            return;
        }

        let mounted = true;
        (async () => {
            try {
                setLoading(true);

                // Kind Name optional aus /api/cases/kinder (du hast den Endpoint bereits)
                const kinder = await apiJson<KindSummary[]>("/api/cases/kinder");
                const k = kinder.find((x) => x.id === kindId);
                const childName = k ? `${k.vorname} ${k.nachname}`.trim() : `Kind #${kindId}`;

                if (!mounted) return;
                setCaseDetails({ id: caseId, childId: kindId, childName });

                // Templates fürs Kind laden
                const tpls = await apiJson<TemplateListEntry[]>(`/api/kws/templates/applicable?kindId=${kindId}`);
                if (!mounted) return;
                setTemplates(tpls);
            } finally {
                if (mounted) setLoading(false);
            }
        })().catch(console.error);

        return () => {
            mounted = false;
        };
    }, [caseId, kindId]);

    async function startChecklist() {
        if (!caseDetails || !templateCode) return;

        const create = await apiJson<{ runId: number }>(`/api/kws/runs`, {
            method: "POST",
            body: JSON.stringify({
                templateCode,
                kindId: caseDetails.childId,
                assessmentDate,
                parentRunId: null,
                relatedRunId: null,
                reason: reason.trim() || null,
                nextReviewDate: nextReviewDate || null,
            }),
        });

        const tpl = await apiJson<TemplateSchema>(`/api/kws/templates/${encodeURIComponent(templateCode)}`);

        setRunId(create.runId);
        setSchema(tpl);
        setAnswers({});
        setStartOpen(false);
    }

    function updateTri(itemId: number, v: TriState) {
        setAnswers((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] ?? {}), triState: v } }));
    }
    function updateComment(itemId: number, v: string) {
        setAnswers((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] ?? {}), comment: v } }));
    }

    async function save() {
        if (!runId || !schema) return;
        setSaving(true);
        try {
            const triItems = schema.sections.flatMap((s) => s.items).filter((i) => i.answerType === "TRI_STATE");

            await apiJson<void>(`/api/kws/runs/${runId}/answers`, {
                method: "PUT",
                body: JSON.stringify({
                    answers: triItems
                        .map((it) => ({
                            itemId: it.id,
                            triState: answers[it.id]?.triState ?? null,
                            comment: (answers[it.id]?.comment ?? "").trim() || null,
                        }))
                        .filter((a) => a.triState !== null || a.comment !== null),
                }),
            });

            alert("Gespeichert.");
        } finally {
            setSaving(false);
        }
    }

    if (!kindIdParam || Number.isNaN(kindId)) {
        return (
            <div className="rounded-md border p-4 text-sm">
                <div className="font-medium">kindId fehlt</div>
                <div className="text-muted-foreground">
                    Öffne die Seite über das Dashboard, damit `?kindId=...` gesetzt ist.
                </div>
            </div>
        );
    }

    if (loading) return <div className="text-sm text-muted-foreground">Lade…</div>;
    if (!caseDetails) return <div className="text-sm text-destructive">Daten konnten nicht geladen werden.</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold">Checklisten</h1>
                    <p className="text-sm text-muted-foreground">
                        Fall #{caseDetails.id} · Kind: {caseDetails.childName} (ID {caseDetails.childId})
                    </p>
                </div>

                <Dialog open={startOpen} onOpenChange={setStartOpen}>
                    <DialogTrigger asChild>
                        <Button>Neue Checkliste starten</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Checkliste starten</DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Vorlage</Label>
                                <Select value={templateCode} onValueChange={setTemplateCode}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Vorlage wählen…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.map((t) => (
                                            <SelectItem key={t.code} value={t.code}>
                                                {t.code} — {t.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Datum</Label>
                                <Input type="date" value={assessmentDate} onChange={(e) => setAssessmentDate(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label>Nächste Prüfung (optional)</Label>
                                <Input type="date" value={nextReviewDate} onChange={(e) => setNextReviewDate(e.target.value)} />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Begründung (optional)</Label>
                                <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setStartOpen(false)}>
                                Abbrechen
                            </Button>
                            <Button onClick={startChecklist} disabled={!templateCode}>
                                Starten
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {!schema || !runId ? (
                <div className="rounded-lg border p-6 text-sm text-muted-foreground">Starte eine Checkliste, um sie auszufüllen.</div>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-lg border p-4 flex items-center justify-between">
                        <div>
                            <div className="text-xs text-muted-foreground">Aktiver Durchlauf</div>
                            <div className="font-medium">
                                {schema.code} — {schema.title}
                            </div>
                            <div className="text-xs text-muted-foreground">Run #{runId}</div>
                        </div>
                        <Button onClick={save} disabled={saving}>
                            {saving ? "Speichern…" : "Speichern"}
                        </Button>
                    </div>

                    <Accordion type="multiple" className="w-full">
                        {schema.sections
                            .slice()
                            .sort((a, b) => a.sort - b.sort)
                            .map((sec) => (
                                <AccordionItem key={sec.id} value={String(sec.id)}>
                                    <AccordionTrigger>
                                        {sec.sectionKey} — {sec.title}
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        {sec.items
                                            .slice()
                                            .sort((a, b) => a.sort - b.sort)
                                            .map((it) => (
                                                <div key={it.id} className="rounded-lg border p-4 space-y-3">
                                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                        <div className="font-medium">
                                                            {it.itemKey} — {it.label}
                                                        </div>

                                                        {it.answerType === "TRI_STATE" ? (
                                                            <TriStateToggle
                                                                name={`item-${it.id}`}
                                                                value={answers[it.id]?.triState}
                                                                onChange={(v) => updateTri(it.id, v)}
                                                            />
                                                        ) : (
                                                            <div className="text-sm text-muted-foreground">(AnswerType {it.answerType} noch nicht implementiert)</div>
                                                        )}
                                                    </div>

                                                    {it.answerType === "TRI_STATE" ? (
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`c-${it.id}`}>Kommentar (optional)</Label>
                                                            <Textarea
                                                                id={`c-${it.id}`}
                                                                rows={2}
                                                                value={answers[it.id]?.comment ?? ""}
                                                                onChange={(e) => updateComment(it.id, e.target.value)}
                                                            />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ))}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                    </Accordion>
                </div>
            )}
        </div>
    );
}