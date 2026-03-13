"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    djiApi,
    type DjiAssessmentResponse,
    type DjiKatalogItem,
    type DjiKatalogResponse,
    type DjiPositionRequest,
    SECHSSTUFEN,
    SECHSSTUFEN_ACTIVE,
    SECHSSTUFEN_LABELS,
} from "@/lib/api/dji";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface PositionState {
    belege: string;
    bewertungBool: boolean | null;
    bewertungStufe: number | null;
    open: boolean;
}

export default function DjiBearbeitenPage() {
    const { fallId, assessmentId } = useParams<{
        fallId: string;
        assessmentId: string;
    }>();
    const router = useRouter();
    const fid = fallId ? Number(fallId) : null;
    const aid = assessmentId ? Number(assessmentId) : null;

    const [assessment, setAssessment] = useState<DjiAssessmentResponse | null>(null);
    const [katalog, setKatalog]       = useState<DjiKatalogResponse | null>(null);
    const [bewertungsdatum, setBewertungsdatum] = useState("");
    const [positionen, setPositionen] = useState<Record<string, PositionState>>({});
    const [gesamteinschaetzung, setGesamteinschaetzung] = useState<string | null>(null);
    const [gesamtfreitext, setGesamtfreitext] = useState("");
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);

    useEffect(() => {
        if (!fid || !aid) return;
        setLoading(true);

        djiApi
            .get(fid, aid)
            .then(async (a) => {
                setAssessment(a);
                setBewertungsdatum(a.bewertungsdatum);
                setGesamteinschaetzung(a.gesamteinschaetzung ?? null);
                setGesamtfreitext(a.gesamtfreitext ?? "");

                const k = await djiApi.katalog(fid, a.formTyp);
                setKatalog(k);

                const init: Record<string, PositionState> = {};
                k.positionen.forEach((item) => {
                    const existing = a.positionen.find(
                        (p) => p.positionCode === item.code
                    );
                    init[item.code] = {
                        belege:        existing?.belege ?? "",
                        bewertungBool: existing?.bewertungBool ?? null,
                        bewertungStufe: existing?.bewertungStufe ?? null,
                        open: true,
                    };
                });
                setPositionen(init);
            })
            .catch(() => toast.error("Prüfbogen konnte nicht geladen werden."))
            .finally(() => setLoading(false));
    }, [fid, aid]);

    const updatePosition = useCallback(
        (code: string, field: keyof PositionState, value: unknown) => {
            setPositionen((prev) => ({
                ...prev,
                [code]: { ...prev[code], [field]: value },
            }));
        },
        []
    );

    const handleSave = async () => {
        if (!fid || !aid || !katalog || !assessment) return;
        setSaving(true);
        try {
            const posReqs: DjiPositionRequest[] = katalog.positionen.map((item) => {
                const state = positionen[item.code];
                return {
                    positionCode: item.code,
                    belege: state?.belege || undefined,
                    bewertungBool:
                        item.bewertungstyp === "BOOLEAN_MIT_BELEGE"
                            ? state?.bewertungBool ?? null
                            : undefined,
                    bewertungStufe:
                        item.bewertungstyp === "SECHSSTUFEN"
                            ? state?.bewertungStufe ?? null
                            : undefined,
                };
            });

            await djiApi.update(fid, aid, {
                formTyp: assessment.formTyp,
                bewertungsdatum,
                positionen: posReqs,
                gesamteinschaetzung: gesamteinschaetzung || null,
                gesamtfreitext: gesamtfreitext || null,
            });

            toast.success("Prüfbogen aktualisiert.");
            router.push(`/dashboard/falloeffnungen/${fid}/dji/${aid}`);
        } catch {
            toast.error("Speichern fehlgeschlagen.");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !katalog || !assessment) {
        return (
            <AuthGate>
                <div className="min-h-screen bg-brand-bg">
                    <Topbar title="Prüfbogen bearbeiten" />
                    <div className="p-8 text-center text-sm text-brand-text2">Lade…</div>
                </div>
            </AuthGate>
        );
    }

    const gruppiertNachBereich = katalog.positionen.reduce<
        Record<string, DjiKatalogItem[]>
    >((acc, item) => {
        const key = item.bereich ?? "Kriterien";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title={katalog.formTypLabel + " – Bearbeiten"} />
                <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pb-12 pt-4 space-y-5">
                    <Button
                        variant="ghost"
                        className="gap-2 text-brand-text2"
                        onClick={() =>
                            router.push(`/dashboard/falloeffnungen/${fid}/dji/${aid}`)
                        }
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Zurück
                    </Button>

                    {/* Datum */}
                    <Card>
                        <CardContent className="pt-4">
                            <label className="block text-xs font-medium text-brand-text2 mb-1">
                                Datum
                            </label>
                            <input
                                type="date"
                                value={bewertungsdatum}
                                onChange={(e) => setBewertungsdatum(e.target.value)}
                                className="rounded-xl border border-brand-border/40 bg-white px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                            />
                        </CardContent>
                    </Card>

                    {/* Positionen */}
                    {Object.entries(gruppiertNachBereich).map(([bereich, items]) => (
                        <Card key={bereich}>
                            {bereich !== "Kriterien" && (
                                <CardHeader className="pb-2">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-brand-text2">
                                        {bereich}
                                    </div>
                                </CardHeader>
                            )}
                            <CardContent className="space-y-4">
                                {items.map((item) => (
                                    <PositionRow
                                        key={item.code}
                                        item={item}
                                        state={
                                            positionen[item.code] ?? {
                                                belege: "",
                                                bewertungBool: null,
                                                bewertungStufe: null,
                                                open: true,
                                            }
                                        }
                                        onUpdate={(field, value) =>
                                            updatePosition(item.code, field, value)
                                        }
                                    />
                                ))}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Gesamteinschätzung */}
                    {katalog.gesamteinschaetzungOptionen.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="text-sm font-semibold text-brand-text">
                                    Gesamteinschätzung
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {katalog.gesamteinschaetzungOptionen.map((opt) => (
                                        <button
                                            key={opt.code}
                                            onClick={() =>
                                                setGesamteinschaetzung(
                                                    gesamteinschaetzung === opt.code
                                                        ? null
                                                        : opt.code
                                                )
                                            }
                                            className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
                                                gesamteinschaetzung === opt.code
                                                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                                                    : "border-brand-border/40 bg-white text-brand-text2 hover:border-brand-primary/40"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-brand-text2 mb-1">
                                        Begründung
                                    </label>
                                    <Textarea
                                        value={gesamtfreitext}
                                        onChange={(e) => setGesamtfreitext(e.target.value)}
                                        rows={4}
                                        className="text-sm"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {katalog.gesamteinschaetzungOptionen.length === 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="text-sm font-semibold text-brand-text">
                                    Fachliche Gesamteinschätzung
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={gesamtfreitext}
                                    onChange={(e) => setGesamtfreitext(e.target.value)}
                                    rows={4}
                                    className="text-sm"
                                />
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            {saving ? "Wird gespeichert…" : "Änderungen speichern"}
                        </Button>
                    </div>
                </div>
            </div>
        </AuthGate>
    );
}

function PositionRow({
    item,
    state,
    onUpdate,
}: {
    item: DjiKatalogItem;
    state: PositionState;
    onUpdate: (field: keyof PositionState, value: unknown) => void;
}) {
    return (
        <div className="border-b border-brand-border/20 last:border-0 pb-4 last:pb-0">
            <button
                className="flex items-start justify-between gap-2 w-full text-left"
                onClick={() => onUpdate("open", !state.open)}
            >
                <span className="text-sm text-brand-text font-medium leading-snug">
                    {item.label}
                </span>
                {state.open ? (
                    <ChevronUp className="h-4 w-4 text-brand-text2 flex-shrink-0 mt-0.5" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-brand-text2 flex-shrink-0 mt-0.5" />
                )}
            </button>

            {state.open && (
                <div className="mt-2 space-y-2 pl-1">
                    {item.bewertungstyp === "BOOLEAN_MIT_BELEGE" && (
                        <div className="flex gap-2">
                            {[true, false].map((val) => (
                                <button
                                    key={String(val)}
                                    onClick={() =>
                                        onUpdate(
                                            "bewertungBool",
                                            state.bewertungBool === val ? null : val
                                        )
                                    }
                                    className={`rounded-xl border px-4 py-1.5 text-sm font-medium transition-colors ${
                                        state.bewertungBool === val
                                            ? val
                                                ? "bg-red-50 border-red-400 text-red-700"
                                                : "bg-emerald-50 border-emerald-400 text-emerald-700"
                                            : "border-brand-border/40 bg-white text-brand-text2 hover:border-brand-primary/40"
                                    }`}
                                >
                                    {val ? "Ja – trifft zu" : "Nein – trifft nicht zu"}
                                </button>
                            ))}
                        </div>
                    )}

                    {item.bewertungstyp === "SECHSSTUFEN" && (
                        <div className="flex flex-wrap gap-1.5">
                            {SECHSSTUFEN.map((stufe) => (
                                <button
                                    key={stufe}
                                    onClick={() =>
                                        onUpdate(
                                            "bewertungStufe",
                                            state.bewertungStufe === stufe ? null : stufe
                                        )
                                    }
                                    className={`rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors ${
                                        state.bewertungStufe === stufe
                                            ? SECHSSTUFEN_ACTIVE[stufe]
                                            : "border-brand-border/40 bg-white text-brand-text2 hover:border-brand-primary/40"
                                    }`}
                                >
                                    {SECHSSTUFEN_LABELS[stufe]}
                                </button>
                            ))}
                        </div>
                    )}

                    <Textarea
                        value={state.belege}
                        onChange={(e) => onUpdate("belege", e.target.value)}
                        placeholder="Belege / Beobachtungen…"
                        rows={2}
                        className="text-xs"
                    />
                </div>
            )}
        </div>
    );
}
