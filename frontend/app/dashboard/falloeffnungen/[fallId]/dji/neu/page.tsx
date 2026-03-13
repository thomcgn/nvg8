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
    type DjiFormTypCode,
    type DjiFormTypItem,
    type DjiKatalogItem,
    type DjiKatalogResponse,
    type DjiPositionRequest,
    SECHSSTUFEN,
    SECHSSTUFEN_ACTIVE,
    SECHSSTUFEN_LABELS,
} from "@/lib/api/dji";
import { ArrowLeft, ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { toast } from "sonner";

type Step = "select" | "fill";

interface PositionState {
    belege: string;
    bewertungBool: boolean | null;
    bewertungStufe: number | null;
    open: boolean;
}

export default function DjiNeuPage() {
    const { fallId } = useParams<{ fallId: string }>();
    const router = useRouter();
    const fid = fallId ? Number(fallId) : null;

    const [step, setStep]               = useState<Step>("select");
    const [formTypen, setFormTypen]     = useState<DjiFormTypItem[]>([]);
    const [selectedTyp, setSelectedTyp] = useState<DjiFormTypCode | null>(null);
    const [katalog, setKatalog]         = useState<DjiKatalogResponse | null>(null);
    const [bewertungsdatum, setBewertungsdatum] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [positionen, setPositionen]   = useState<Record<string, PositionState>>({});
    const [gesamteinschaetzung, setGesamteinschaetzung] = useState<string | null>(null);
    const [gesamtfreitext, setGesamtfreitext] = useState("");
    const [saving, setSaving]           = useState(false);
    const [loadingKatalog, setLoadingKatalog] = useState(false);

    // Formtypen laden
    useEffect(() => {
        if (!fid) return;
        // Formtypen kommen aus dem /formtypen Endpoint – aber wir brauchen fallId nur für Auth.
        // Wir laden den Katalog erst nach Auswahl.
        djiApi.katalog(fid, "SICHERHEITSEINSCHAETZUNG")
            .then((k) => {
                // Nur um zu prüfen, ob der Fallzugang klappt; Formtypliste direkt hardcoden
            })
            .catch(() => {});

        const FT: DjiFormTypItem[] = [
            { code: "SICHERHEITSEINSCHAETZUNG",       label: "Sicherheitseinschätzung",                       beschreibung: "5 binäre Kriterien – wird nach jedem Kontakt ausgefüllt" },
            { code: "RISIKOEINSCHAETZUNG",             label: "Risikoeinschätzung",                             beschreibung: "6 Domänen – mittel- und längerfristiges Gefährdungsrisiko" },
            { code: "ERZIEHUNGSFAEHIGKEIT_PFLEGE",    label: "Erziehungsfähigkeit – Pflege",                  beschreibung: "Pflege- und Versorgungsleistung (Frage 63)" },
            { code: "ERZIEHUNGSFAEHIGKEIT_BINDUNG",   label: "Erziehungsfähigkeit – Bindung",                 beschreibung: "Bindungsqualität und Feinfühligkeit (Frage 64)" },
            { code: "ERZIEHUNGSFAEHIGKEIT_REGELN",    label: "Erziehungsfähigkeit – Regeln & Werte",          beschreibung: "Werte- und Regelvermittlung (Frage 65)" },
            { code: "ERZIEHUNGSFAEHIGKEIT_FOERDERUNG",label: "Erziehungsfähigkeit – Förderung",               beschreibung: "Stimulation und Förderung (Frage 66)" },
            { code: "BEDUERFNIS_SCHEMA",               label: "Kindliche Bedürfnisse",                         beschreibung: "6-stufige Einschätzung der Bedürfniserfüllung" },
            { code: "FOERDERUNGSBEDARF",               label: "Förderungsbedarf des Kindes",                   beschreibung: "7 Entwicklungsdimensionen (Frage 60)" },
            { code: "RESSOURCEN_KIND",                 label: "Ressourcen des Kindes",                         beschreibung: "Stärken und Schutzfaktoren (Frage 61)" },
            { code: "VERAENDERUNGSBEREITSCHAFT",       label: "Veränderungsbereitschaft der Eltern",           beschreibung: "6 Domänen zur Kooperationsbereitschaft (Frage 72)" },
        ];
        setFormTypen(FT);
    }, [fid]);

    const waehleFormTyp = useCallback(
        (code: DjiFormTypCode) => {
            if (!fid) return;
            setSelectedTyp(code);
            setLoadingKatalog(true);
            djiApi
                .katalog(fid, code)
                .then((k) => {
                    setKatalog(k);
                    const init: Record<string, PositionState> = {};
                    k.positionen.forEach((p) => {
                        init[p.code] = {
                            belege: "",
                            bewertungBool: null,
                            bewertungStufe: null,
                            open: true,
                        };
                    });
                    setPositionen(init);
                    setGesamteinschaetzung(null);
                    setStep("fill");
                })
                .catch(() => toast.error("Katalog konnte nicht geladen werden."))
                .finally(() => setLoadingKatalog(false));
        },
        [fid]
    );

    const updatePosition = (
        code: string,
        field: keyof PositionState,
        value: unknown
    ) => {
        setPositionen((prev) => ({
            ...prev,
            [code]: { ...prev[code], [field]: value },
        }));
    };

    const handleSave = async () => {
        if (!fid || !katalog || !selectedTyp) return;
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

            const result = await djiApi.create(fid, {
                formTyp: selectedTyp,
                bewertungsdatum,
                positionen: posReqs,
                gesamteinschaetzung: gesamteinschaetzung || null,
                gesamtfreitext: gesamtfreitext || null,
            });

            toast.success("Prüfbogen gespeichert.");
            router.push(`/dashboard/falloeffnungen/${fid}/dji/${result.id}`);
        } catch {
            toast.error("Speichern fehlgeschlagen.");
        } finally {
            setSaving(false);
        }
    };

    // Positionen nach Bereich gruppieren
    const gruppiertNachBereich = katalog
        ? katalog.positionen.reduce<Record<string, DjiKatalogItem[]>>((acc, item) => {
              const key = item.bereich ?? "Kriterien";
              if (!acc[key]) acc[key] = [];
              acc[key].push(item);
              return acc;
          }, {})
        : {};

    if (step === "select") {
        return (
            <AuthGate>
                <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                    <Topbar title="Neuer DJI-Prüfbogen" />
                    <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pb-12 pt-4 space-y-4">
                        <Button
                            variant="ghost"
                            className="gap-2 text-brand-text2"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Zurück
                        </Button>

                        <div className="flex items-center gap-2 px-1">
                            <ClipboardList className="h-5 w-5 text-brand-text2" />
                            <div className="text-base font-semibold text-brand-text">
                                Formular auswählen
                            </div>
                        </div>

                        <div className="grid gap-3">
                            {formTypen.map((ft) => (
                                <button
                                    key={ft.code}
                                    disabled={loadingKatalog}
                                    onClick={() => waehleFormTyp(ft.code)}
                                    className="w-full text-left rounded-2xl border border-brand-border/40 bg-white p-4 hover:border-brand-primary/40 hover:shadow-sm transition-all disabled:opacity-50"
                                >
                                    <div className="font-semibold text-sm text-brand-text">
                                        {ft.label}
                                    </div>
                                    <div className="text-xs text-brand-text2 mt-0.5">
                                        {ft.beschreibung}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </AuthGate>
        );
    }

    // Step: fill
    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title={katalog?.formTypLabel ?? "Prüfbogen"} />
                <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pb-12 pt-4 space-y-5">
                    <Button
                        variant="ghost"
                        className="gap-2 text-brand-text2"
                        onClick={() => setStep("select")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Formular wechseln
                    </Button>

                    {/* Metadaten */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="text-sm font-semibold text-brand-text">
                                {katalog?.formTypLabel}
                            </div>
                            {katalog?.beschreibung && (
                                <div className="text-xs text-brand-text2">
                                    {katalog.beschreibung}
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
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

                    {/* Positionen nach Bereich */}
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
                    {katalog && katalog.gesamteinschaetzungOptionen.length > 0 && (
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
                                        Begründung / Fachliche Einschätzung
                                    </label>
                                    <Textarea
                                        value={gesamtfreitext}
                                        onChange={(e) => setGesamtfreitext(e.target.value)}
                                        placeholder="Zusammenfassende fachliche Einschätzung…"
                                        rows={4}
                                        className="text-sm"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {katalog && katalog.gesamteinschaetzungOptionen.length === 0 && (
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
                                    placeholder="Zusammenfassende fachliche Einschätzung…"
                                    rows={4}
                                    className="text-sm"
                                />
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            {saving ? "Wird gespeichert…" : "Prüfbogen speichern"}
                        </Button>
                    </div>
                </div>
            </div>
        </AuthGate>
    );
}

// ─── PositionRow ──────────────────────────────────────────────────────────────

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
            {/* Label + Toggle */}
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
                    {/* Boolean */}
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

                    {/* Sechsstufen */}
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

                    {/* Belege */}
                    <Textarea
                        value={state.belege}
                        onChange={(e) => onUpdate("belege", e.target.value)}
                        placeholder="Belege / Beobachtungen dokumentieren…"
                        rows={2}
                        className="text-xs"
                    />
                </div>
            )}
        </div>
    );
}
