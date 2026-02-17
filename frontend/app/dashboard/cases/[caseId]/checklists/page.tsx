"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { apiJson } from "@/lib/http";

import { TriStateToggle } from "@/app/components/kws/TriStateToggle";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import type { BezugspersonSummary, KindSummary, TemplateListEntry, TemplateSchema, TriState } from "@/lib/types";

type AnswerState = Record<number, { triState?: TriState; comment?: string }>;

type KindBezugspersonRelationResponse = {
    relationId: number;
    bezugsperson: BezugspersonSummary;
    rolleImAlltag?: string | null;
    beziehungstyp?: string | null;
    sorgeStatus?: string | null;
    lebtImHaushalt?: boolean | null;
};

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function formatDateDE(iso?: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("de-DE");
}

function calcAge(iso?: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return `${Math.max(age, 0)} Jahre`;
}

function buildHeaderLine(schema: Pick<TemplateSchema, "code" | "ageRange">) {
    const age = (schema.ageRange ?? "").trim();
    const agePart = age ? ` ${age}` : "";
    return `Arbeitshilfe ${schema.code} – Kinder im Alter${agePart}`;
}

function formatAddress(p: BezugspersonSummary) {
    const line1 = [p.strasse, p.hausnummer].filter(Boolean).join(" ").trim();
    const line2 = [p.plz, p.ort].filter(Boolean).join(" ").trim();
    const parts = [line1, line2].filter((x) => x && x.length > 0);
    return parts.length ? parts.join(", ") : "—";
}

function labelFromEnum(v?: string | null) {
    if (!v) return "—";
    return v
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

function HaushaltBadge({ v }: { v?: boolean | null }) {
    if (v == null) return <Badge variant="secondary">Haushalt: Unbekannt</Badge>;
    return v ? <Badge>Haushalt: Ja</Badge> : <Badge variant="outline">Haushalt: Nein</Badge>;
}

function SorgeBadge({ v }: { v?: string | null }) {
    const val = (v ?? "").toUpperCase();

    // Variants: default | secondary | destructive | outline (shadcn)
    if (!val) return <Badge variant="secondary">Sorge: —</Badge>;
    if (val === "VOLL") return <Badge>Sorge: Voll</Badge>;
    if (val === "TEIL") return <Badge variant="secondary">Sorge: Teil</Badge>;
    if (val === "KEIN") return <Badge variant="outline">Sorge: Keine</Badge>;
    if (val === "UNBEKANNT") return <Badge variant="secondary">Sorge: Unbekannt</Badge>;

    return <Badge variant="secondary">Sorge: {labelFromEnum(val)}</Badge>;
}

export default function CaseChecklistsPage() {
    const params = useParams<{ caseId: string }>();
    const searchParams = useSearchParams();

    const caseId = Number(params.caseId);
    const kindIdParam = searchParams.get("kindId");
    const kindId = kindIdParam ? Number(kindIdParam) : NaN;

    const [kind, setKind] = React.useState<KindSummary | null>(null);
    const [relations, setRelations] = React.useState<KindBezugspersonRelationResponse[]>([]);
    const [templates, setTemplates] = React.useState<TemplateListEntry[]>([]);
    const [loading, setLoading] = React.useState(true);

    const [startOpen, setStartOpen] = React.useState(false);
    const [templateCode, setTemplateCode] = React.useState("");
    const [assessmentDate, setAssessmentDate] = React.useState(todayISO());
    const [reason, setReason] = React.useState("");

    const [runId, setRunId] = React.useState<number | null>(null);
    const [schema, setSchema] = React.useState<TemplateSchema | null>(null);
    const [answers, setAnswers] = React.useState<AnswerState>({});
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (!kindIdParam || Number.isNaN(kindId)) {
            setLoading(false);
            return;
        }

        let mounted = true;

        (async () => {
            try {
                setLoading(true);

                const kinder = await apiJson<KindSummary[]>("/api/cases/kinder");
                const k = kinder.find((x) => x.id === kindId) ?? null;
                if (!mounted) return;
                setKind(k);

                const tpls = await apiJson<TemplateListEntry[]>(`/api/kws/templates/applicable?kindId=${kindId}`);
                if (!mounted) return;
                setTemplates(tpls);

                // Erwartet: KindBezugspersonRelationResponse[]
                const rels = await apiJson<KindBezugspersonRelationResponse[]>(`/api/cases/kinder/${kindId}/bezugspersonen`);
                if (!mounted) return;
                setRelations(rels ?? []);
            } finally {
                if (mounted) setLoading(false);
            }
        })().catch(console.error);

        return () => {
            mounted = false;
        };
    }, [kindIdParam, kindId]);

    async function startChecklist() {
        if (!templateCode || Number.isNaN(kindId)) return;

        const create = await apiJson<{ runId: number }>(`/api/kws/runs`, {
            method: "POST",
            body: JSON.stringify({
                templateCode,
                kindId,
                assessmentDate,
                reason: reason.trim() || null,
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
                            comment: answers[it.id]?.comment?.trim() || null,
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
                <div className="text-muted-foreground">Öffne die Seite über das Dashboard, damit `?kindId=...` gesetzt ist.</div>
            </div>
        );
    }

    if (loading) return <div>Lade…</div>;

    return (
        <div className="space-y-6">
            {/* KIND STAMMDATEN + BEZUGSPERSONEN IN DERSELBE CARD */}
            <Card>
                <CardHeader>
                    <CardTitle>Stammdaten Kind</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6 text-sm">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <div className="text-muted-foreground">Name</div>
                            <div className="font-medium">{kind ? `${kind.vorname} ${kind.nachname}` : "—"}</div>
                        </div>

                        <div>
                            <div className="text-muted-foreground">Geburtsdatum</div>
                            <div className="font-medium">{formatDateDE(kind?.geburtsdatum ?? null)}</div>
                        </div>

                        <div>
                            <div className="text-muted-foreground">Alter</div>
                            <div className="font-medium">{calcAge(kind?.geburtsdatum ?? null)}</div>
                        </div>

                        <div>
                            <div className="text-muted-foreground">Fall</div>
                            <div className="font-medium">#{caseId}</div>
                        </div>
                    </div>

                    <Accordion type="single" collapsible>
                        <AccordionItem value="bp">
                            <AccordionTrigger className="font-medium">Bezugspersonen</AccordionTrigger>
                            <AccordionContent className="space-y-3 pt-3">
                                {relations.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">Keine Bezugspersonen hinterlegt.</div>
                                ) : (
                                    relations.map((r) => {
                                        const p = r.bezugsperson;

                                        return (
                                            <Card key={r.relationId}>
                                                <CardContent className="p-4 space-y-3 text-sm">
                                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                        <div className="font-medium">
                                                            {p?.vorname ?? "—"} {p?.nachname ?? ""}
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            <Badge variant="outline">{labelFromEnum(r.beziehungstyp)}</Badge>
                                                            <Badge variant="secondary">{labelFromEnum(r.rolleImAlltag)}</Badge>
                                                            <SorgeBadge v={r.sorgeStatus} />
                                                            <HaushaltBadge v={r.lebtImHaushalt} />
                                                        </div>
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-2">
                                                        <div>
                                                            <div className="text-muted-foreground">Kontakt</div>
                                                            <div>{p?.telefon ?? "—"}</div>
                                                            <div className="text-muted-foreground">{p?.kontaktEmail ?? "—"}</div>
                                                        </div>

                                                        <div>
                                                            <div className="text-muted-foreground">Organisation</div>
                                                            <div>{p?.organisation ?? "—"}</div>
                                                        </div>

                                                        <div className="md:col-span-2">
                                                            <div className="text-muted-foreground">Adresse</div>
                                                            <div>{p ? formatAddress(p) : "—"}</div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

            {/* CHECKLISTE STARTEN */}
            {!runId && (
                <div className="flex justify-end">
                    <Dialog open={startOpen} onOpenChange={setStartOpen}>
                        <DialogTrigger asChild>
                            <Button>Neue Checkliste starten</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Checkliste starten</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                <Select value={templateCode} onValueChange={setTemplateCode}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Vorlage wählen…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.map((t) => (
                                            <SelectItem key={t.code} value={t.code}>
                                                {t.code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Input type="date" value={assessmentDate} onChange={(e) => setAssessmentDate(e.target.value)} />

                                <Textarea placeholder="Begründung (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />

                                <Button onClick={startChecklist} disabled={!templateCode}>
                                    Starten
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {/* CHECKLISTE UI */}
            {schema && runId ? (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle title={schema.title}>{schema.code}</CardTitle>
                            <p className="text-sm text-muted-foreground">{buildHeaderLine(schema)}</p>
                        </CardHeader>
                    </Card>

                    <Accordion type="single" collapsible className="space-y-3">
                        {schema.sections
                            .slice()
                            .sort((a, b) => a.sort - b.sort)
                            .map((sec) => (
                                <AccordionItem key={sec.id} value={String(sec.id)}>
                                    <AccordionTrigger className="w-full rounded-md border px-4 py-2 text-left font-medium hover:bg-accent">
                                        {sec.sectionKey} — {sec.title}
                                    </AccordionTrigger>

                                    <AccordionContent className="pt-3">
                                        <Card>
                                            <CardContent className="space-y-4 p-4">
                                                {sec.items
                                                    .slice()
                                                    .sort((a, b) => a.sort - b.sort)
                                                    .map((it) => (
                                                        <Card key={it.id}>
                                                            <CardContent className="p-4 space-y-3">
                                                                <div className="flex justify-between items-center gap-3">
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
                                                                        <div className="text-sm text-muted-foreground">
                                                                            (AnswerType {it.answerType} noch nicht implementiert)
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {it.answerType === "TRI_STATE" ? (
                                                                    <Textarea
                                                                        placeholder="Kommentar (optional)"
                                                                        value={answers[it.id]?.comment ?? ""}
                                                                        onChange={(e) => updateComment(it.id, e.target.value)}
                                                                    />
                                                                ) : null}
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                            </CardContent>
                                        </Card>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                    </Accordion>

                    <div className="flex justify-end">
                        <Button onClick={save} disabled={saving}>
                            {saving ? "Speichern…" : "Speichern"}
                        </Button>
                    </div>
                </>
            ) : null}
        </div>
    );
}