"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    meldebogenApi,
    type MeldebogenRequest,
    MELDUNGART_LABELS,
    ERSTEINSCHAETZUNG_LABELS,
    ERSTEINSCHAETZUNG_TONE,
    DRINGLICHKEIT_LABELS,
    GLAUBWUERDIGKEIT_LABELS,
} from "@/lib/api/meldebogen";
import { ArrowLeft, FileSearch } from "lucide-react";
import { toast } from "sonner";

const INPUT_CLASS =
    "w-full rounded-xl border border-brand-border/40 bg-white px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30";
const LABEL_CLASS = "block text-xs font-medium text-brand-text2 mb-1";

function btnClass(active: boolean) {
    return `rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
            ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
            : "border-brand-border/40 bg-white text-brand-text2 hover:border-brand-primary/40"
    }`;
}

function ersteinschaetzungBtnClass(key: string, active: boolean) {
    if (!active) {
        return "rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors border-brand-border/40 bg-white text-brand-text2 hover:border-brand-primary/40";
    }
    const tone = ERSTEINSCHAETZUNG_TONE[key] ?? "text-brand-primary";
    return `rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors border-current bg-current/10 ${tone}`;
}

interface FormState {
    eingangsdatum: string;
    erfassendeFachkraft: string;
    meldungart: string;
    melderName: string;
    melderKontakt: string;
    melderBeziehungKind: string;
    melderGlaubwuerdigkeit: string;
    schilderung: string;
    kindAktuellerAufenthalt: string;
    belastungKoerperlErkrankung: boolean;
    belastungPsychErkrankung: boolean;
    belastungSucht: boolean;
    belastungHaeuslicheGewalt: boolean;
    belastungSuizidgefahr: boolean;
    belastungGewalttaetigeErz: boolean;
    belastungSozialeIsolation: boolean;
    belastungSonstiges: string;
    ersteinschaetzung: string;
    handlungsdringlichkeit: string;
    ersteinschaetzungFreitext: string;
}

const initialState: FormState = {
    eingangsdatum: new Date().toISOString().slice(0, 10),
    erfassendeFachkraft: "",
    meldungart: "",
    melderName: "",
    melderKontakt: "",
    melderBeziehungKind: "",
    melderGlaubwuerdigkeit: "",
    schilderung: "",
    kindAktuellerAufenthalt: "",
    belastungKoerperlErkrankung: false,
    belastungPsychErkrankung: false,
    belastungSucht: false,
    belastungHaeuslicheGewalt: false,
    belastungSuizidgefahr: false,
    belastungGewalttaetigeErz: false,
    belastungSozialeIsolation: false,
    belastungSonstiges: "",
    ersteinschaetzung: "",
    handlungsdringlichkeit: "",
    ersteinschaetzungFreitext: "",
};

export default function MeldebogenNeuPage() {
    const { fallId } = useParams<{ fallId: string }>();
    const router = useRouter();
    const fid = fallId ? Number(fallId) : null;

    const [form, setForm] = useState<FormState>(initialState);
    const [saving, setSaving] = useState(false);

    function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function toggleField(key: keyof FormState, currentValue: string, newValue: string) {
        setForm((prev) => ({
            ...prev,
            [key]: prev[key] === newValue ? "" : newValue,
        }));
        void currentValue;
    }

    async function handleSave() {
        if (!fid) return;
        setSaving(true);
        try {
            const req: MeldebogenRequest = {
                eingangsdatum: form.eingangsdatum,
                erfassendeFachkraft: form.erfassendeFachkraft || null,
                meldungart: form.meldungart || null,
                melderName: form.melderName || null,
                melderKontakt: form.melderKontakt || null,
                melderBeziehungKind: form.melderBeziehungKind || null,
                melderGlaubwuerdigkeit: form.melderGlaubwuerdigkeit || null,
                schilderung: form.schilderung || null,
                kindAktuellerAufenthalt: form.kindAktuellerAufenthalt || null,
                belastungKoerperlErkrankung: form.belastungKoerperlErkrankung,
                belastungPsychErkrankung: form.belastungPsychErkrankung,
                belastungSucht: form.belastungSucht,
                belastungHaeuslicheGewalt: form.belastungHaeuslicheGewalt,
                belastungSuizidgefahr: form.belastungSuizidgefahr,
                belastungGewalttaetigeErz: form.belastungGewalttaetigeErz,
                belastungSozialeIsolation: form.belastungSozialeIsolation,
                belastungSonstiges: form.belastungSonstiges || null,
                ersteinschaetzung: form.ersteinschaetzung || null,
                handlungsdringlichkeit: form.handlungsdringlichkeit || null,
                ersteinschaetzungFreitext: form.ersteinschaetzungFreitext || null,
            };
            const result = await meldebogenApi.create(fid, req);
            toast.success("Meldebogen gespeichert.");
            router.push(`/dashboard/falloeffnungen/${fid}/meldeboegen/${result.id}`);
        } catch {
            toast.error("Speichern fehlgeschlagen.");
        } finally {
            setSaving(false);
        }
    }

    const belastungCheckboxes: { key: keyof FormState; label: string }[] = [
        { key: "belastungKoerperlErkrankung", label: "Körperliche Erkrankung" },
        { key: "belastungPsychErkrankung", label: "Psychische Erkrankung" },
        { key: "belastungSucht", label: "Suchtproblematik" },
        { key: "belastungHaeuslicheGewalt", label: "Häusliche Gewalt" },
        { key: "belastungSuizidgefahr", label: "Suizidgefahr" },
        { key: "belastungGewalttaetigeErz", label: "Gewalttätige Erziehungsmethoden" },
        { key: "belastungSozialeIsolation", label: "Soziale Isolation" },
    ];

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Neuer Meldebogen" />

                <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pb-12 pt-4 space-y-5">
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            className="gap-2 text-brand-text2"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Zurück
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 px-1">
                        <FileSearch className="h-5 w-5 text-brand-text2" />
                        <div className="text-base font-semibold text-brand-text">
                            Neuer Meldebogen
                        </div>
                    </div>

                    {/* Section 1: Eingang */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="text-sm font-semibold text-brand-text">Eingang</div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className={LABEL_CLASS}>Eingangsdatum</label>
                                <input
                                    type="date"
                                    value={form.eingangsdatum}
                                    onChange={(e) => setField("eingangsdatum", e.target.value)}
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Erfassende Fachkraft</label>
                                <input
                                    type="text"
                                    value={form.erfassendeFachkraft}
                                    onChange={(e) => setField("erfassendeFachkraft", e.target.value)}
                                    placeholder="Name der Fachkraft…"
                                    className={INPUT_CLASS}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 2: Melder */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="text-sm font-semibold text-brand-text">Melder</div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className={LABEL_CLASS}>Meldungsart</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(MELDUNGART_LABELS).map(([key, label]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => toggleField("meldungart", form.meldungart, key)}
                                            className={btnClass(form.meldungart === key)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {form.meldungart !== "ANONYM" && (
                                <div>
                                    <label className={LABEL_CLASS}>Name des Melders</label>
                                    <input
                                        type="text"
                                        value={form.melderName}
                                        onChange={(e) => setField("melderName", e.target.value)}
                                        placeholder="Name…"
                                        className={INPUT_CLASS}
                                    />
                                </div>
                            )}

                            <div>
                                <label className={LABEL_CLASS}>Kontakt</label>
                                <input
                                    type="text"
                                    value={form.melderKontakt}
                                    onChange={(e) => setField("melderKontakt", e.target.value)}
                                    placeholder="Telefon, E-Mail…"
                                    className={INPUT_CLASS}
                                />
                            </div>

                            <div>
                                <label className={LABEL_CLASS}>Beziehung zum Kind</label>
                                <input
                                    type="text"
                                    value={form.melderBeziehungKind}
                                    onChange={(e) => setField("melderBeziehungKind", e.target.value)}
                                    placeholder="z.B. Nachbar, Lehrer…"
                                    className={INPUT_CLASS}
                                />
                            </div>

                            <div>
                                <label className={LABEL_CLASS}>Glaubwürdigkeit</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(GLAUBWUERDIGKEIT_LABELS).map(([key, label]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => toggleField("melderGlaubwuerdigkeit", form.melderGlaubwuerdigkeit, key)}
                                            className={btnClass(form.melderGlaubwuerdigkeit === key)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 3: Schilderung */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="text-sm font-semibold text-brand-text">Schilderung</div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className={LABEL_CLASS}>Schilderung</label>
                                <Textarea
                                    value={form.schilderung}
                                    onChange={(e) => setField("schilderung", e.target.value)}
                                    placeholder="Schilderung des Sachverhalts…"
                                    rows={6}
                                    className="text-sm"
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Aktueller Aufenthaltsort des Kindes</label>
                                <input
                                    type="text"
                                    value={form.kindAktuellerAufenthalt}
                                    onChange={(e) => setField("kindAktuellerAufenthalt", e.target.value)}
                                    placeholder="Aufenthaltsort…"
                                    className={INPUT_CLASS}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 4: Belastungsmerkmale */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="text-sm font-semibold text-brand-text">
                                Belastungsmerkmale der Sorgeberechtigten
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {belastungCheckboxes.map(({ key, label }) => (
                                <label
                                    key={key}
                                    className="flex items-center gap-3 cursor-pointer rounded-xl border border-brand-border/30 bg-white px-3 py-2 hover:border-brand-primary/30 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={form[key] as boolean}
                                        onChange={(e) => setField(key, e.target.checked as FormState[typeof key])}
                                        className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary/30"
                                    />
                                    <span className="text-sm text-brand-text">{label}</span>
                                </label>
                            ))}
                            <div>
                                <label className={LABEL_CLASS}>Sonstige Belastungen</label>
                                <Textarea
                                    value={form.belastungSonstiges}
                                    onChange={(e) => setField("belastungSonstiges", e.target.value)}
                                    placeholder="Weitere Belastungen beschreiben…"
                                    rows={3}
                                    className="text-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 5: Ersteinschätzung */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="text-sm font-semibold text-brand-text">Ersteinschätzung</div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className={LABEL_CLASS}>Ersteinschätzung</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(ERSTEINSCHAETZUNG_LABELS).map(([key, label]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => toggleField("ersteinschaetzung", form.ersteinschaetzung, key)}
                                            className={ersteinschaetzungBtnClass(key, form.ersteinschaetzung === key)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={LABEL_CLASS}>Handlungsdringlichkeit</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(DRINGLICHKEIT_LABELS).map(([key, label]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => toggleField("handlungsdringlichkeit", form.handlungsdringlichkeit, key)}
                                            className={btnClass(form.handlungsdringlichkeit === key)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={LABEL_CLASS}>Begründung / Fachliche Einschätzung</label>
                                <Textarea
                                    value={form.ersteinschaetzungFreitext}
                                    onChange={(e) => setField("ersteinschaetzungFreitext", e.target.value)}
                                    placeholder="Fachliche Begründung der Einschätzung…"
                                    rows={4}
                                    className="text-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            {saving ? "Wird gespeichert…" : "Meldebogen speichern"}
                        </Button>
                    </div>
                </div>
            </div>
        </AuthGate>
    );
}
