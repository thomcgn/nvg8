"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api";

type Gender = "MAENNLICH" | "WEIBLICH" | "DIVERS" | "UNBEKANNT";
type Beziehung =
    | "MUTTER"
    | "VATER"
    | "SORGEBERECHTIGT"
    | "PFLEGEMUTTER"
    | "PFLEGEVATER"
    | "STIEFMUTTER"
    | "STIEFVATER"
    | "GROSSMUTTER"
    | "GROSSVATER"
    | "SONSTIGE";
type Sorgerecht = "ALLEIN" | "GEMEINSAM" | "KEIN" | "AMTSPFLEGSCHAFT" | "VORMUNDSCHAFT" | "UNGEKLAERT";

type CreateKindCompleteRequest = {
    kind: {
        vorname: string;
        nachname: string;
        geburtsdatum: string | null; // ISO yyyy-mm-dd
        gender: Gender;
        foerderbedarf: boolean;
        foerderbedarfDetails: string | null;
        gesundheitsHinweise: string | null;
    };
    bezugspersonen: Array<{
        existingBezugspersonId: number | null;
        create: {
            vorname: string;
            nachname: string;
            geburtsdatum: string | null;
            gender: Gender;
            telefon: string | null;
            kontaktEmail: string | null;
            strasse: string | null;
            hausnummer: string | null;
            plz: string | null;
            ort: string | null;
        } | null;
        beziehung: Beziehung;
        sorgerecht: Sorgerecht | null;
        validFrom: string | null;
        hauptkontakt: boolean | null;
        lebtImHaushalt: boolean | null;
    }>;
};

type CreateKindResponse = { kindId: number };

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
    { value: "UNBEKANNT", label: "Unbekannt" },
    { value: "MAENNLICH", label: "Männlich" },
    { value: "WEIBLICH", label: "Weiblich" },
    { value: "DIVERS", label: "Divers" },
];

const BEZIEHUNG_OPTIONS: Array<{ value: Beziehung; label: string }> = [
    { value: "MUTTER", label: "Mutter" },
    { value: "VATER", label: "Vater" },
    { value: "SORGEBERECHTIGT", label: "Sorgeberechtigt" },
    { value: "PFLEGEMUTTER", label: "Pflegemutter" },
    { value: "PFLEGEVATER", label: "Pflegevater" },
    { value: "STIEFMUTTER", label: "Stiefmutter" },
    { value: "STIEFVATER", label: "Stiefvater" },
    { value: "GROSSMUTTER", label: "Großmutter" },
    { value: "GROSSVATER", label: "Großvater" },
    { value: "SONSTIGE", label: "Sonstige" },
];

const SORGERECHT_OPTIONS: Array<{ value: Sorgerecht; label: string }> = [
    { value: "UNGEKLAERT", label: "Ungeklärt" },
    { value: "GEMEINSAM", label: "Gemeinsam" },
    { value: "ALLEIN", label: "Allein" },
    { value: "KEIN", label: "Kein" },
    { value: "AMTSPFLEGSCHAFT", label: "Amtspflegschaft" },
    { value: "VORMUNDSCHAFT", label: "Vormundschaft" },
];

function StepPill({ active, label }: { active: boolean; label: string }) {
    return (
        <div
            className={
                "rounded-full px-3 py-1 text-xs font-semibold border " +
                (active ? "bg-brand-teal/12 border-brand-teal/25 text-brand-blue" : "bg-white border-brand-border text-brand-text2")
            }
        >
            {label}
        </div>
    );
}

export default function KindWizardPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // Kind
    const [kVorname, setKVorname] = useState("");
    const [kNachname, setKNachname] = useState("");
    const [kGeb, setKGeb] = useState<string>("");
    const [kGender, setKGender] = useState<Gender>("UNBEKANNT");

    const [foerderbedarf, setFoerderbedarf] = useState(false);
    const [foerderbedarfDetails, setFoerderbedarfDetails] = useState("");
    const [gesundheit, setGesundheit] = useState("");

    // Bezugsperson (min. 1)
    const [bpBeziehung, setBpBeziehung] = useState<Beziehung>("MUTTER");
    const [bpSorgerecht, setBpSorgerecht] = useState<Sorgerecht>("UNGEKLAERT");
    const [bpVorname, setBpVorname] = useState("");
    const [bpNachname, setBpNachname] = useState("");
    const [bpGeb, setBpGeb] = useState<string>("");
    const [bpGender, setBpGender] = useState<Gender>("UNBEKANNT");
    const [bpTelefon, setBpTelefon] = useState("");
    const [bpEmail, setBpEmail] = useState("");
    const [bpStr, setBpStr] = useState("");
    const [bpHnr, setBpHnr] = useState("");
    const [bpPlz, setBpPlz] = useState("");
    const [bpOrt, setBpOrt] = useState("");
    const [bpHaupt, setBpHaupt] = useState(true);
    const [bpHaushalt, setBpHaushalt] = useState(true);

    const canNext1 = useMemo(() => kVorname.trim().length > 0 && kNachname.trim().length > 0, [kVorname, kNachname]);
    const canNext3 = useMemo(() => bpVorname.trim().length > 0 && bpNachname.trim().length > 0, [bpVorname, bpNachname]);

    async function submit() {
        setErr(null);
        setLoading(true);
        try {
            const payload: CreateKindCompleteRequest = {
                kind: {
                    vorname: kVorname.trim(),
                    nachname: kNachname.trim(),
                    geburtsdatum: kGeb ? kGeb : null,
                    gender: kGender,
                    foerderbedarf,
                    foerderbedarfDetails: foerderbedarf ? (foerderbedarfDetails.trim() || null) : null,
                    gesundheitsHinweise: gesundheit.trim() || null,
                },
                bezugspersonen: [
                    {
                        existingBezugspersonId: null,
                        create: {
                            vorname: bpVorname.trim(),
                            nachname: bpNachname.trim(),
                            geburtsdatum: bpGeb ? bpGeb : null,
                            gender: bpGender,
                            telefon: bpTelefon.trim() || null,
                            kontaktEmail: bpEmail.trim() || null,
                            strasse: bpStr.trim() || null,
                            hausnummer: bpHnr.trim() || null,
                            plz: bpPlz.trim() || null,
                            ort: bpOrt.trim() || null,
                        },
                        beziehung: bpBeziehung,
                        sorgerecht: bpSorgerecht,
                        validFrom: null,
                        hauptkontakt: bpHaupt,
                        lebtImHaushalt: bpHaushalt,
                    },
                ],
            };

            const res = await apiFetch<CreateKindResponse>("/kinder/complete", {
                method: "POST",
                body: payload,
            });

            router.push(`/dashboard/kinder/${res.kindId}`);
        } catch (e: any) {
            setErr(e?.message || "Konnte Kind nicht anlegen.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Kind anlegen" />

                <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-4 sm:px-6 md:px-8">
                    {err ? (
                        <div className="mb-4 rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                            {err}
                        </div>
                    ) : null}

                    <div className="mb-4 flex flex-wrap gap-2">
                        <StepPill active={step === 1} label="1 · Kind" />
                        <StepPill active={step === 2} label="2 · Hinweise" />
                        <StepPill active={step === 3} label="3 · Bezugsperson" />
                    </div>

                    {/* STEP 1 */}
                    {step === 1 ? (
                        <Card>
                            <CardHeader>
                                <div className="text-sm font-semibold text-brand-text">Basisdaten Kind</div>
                                <div className="mt-1 text-xs text-brand-text2">Vorname/Nachname sind Pflicht.</div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Input label="Vorname *" value={kVorname} onChange={(e) => setKVorname(e.target.value)} />
                                    <Input label="Nachname *" value={kNachname} onChange={(e) => setKNachname(e.target.value)} />
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-xs font-semibold text-brand-text2">Geburtsdatum</div>
                                        <input
                                            type="date"
                                            value={kGeb}
                                            onChange={(e) => setKGeb(e.target.value)}
                                            className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-1 text-xs font-semibold text-brand-text2">Geschlecht</div>
                                        <select
                                            value={kGender}
                                            onChange={(e) => setKGender(e.target.value as Gender)}
                                            className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                        >
                                            {GENDER_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <Button variant="secondary" onClick={() => router.push("/dashboard/kinder")} disabled={loading}>
                                        Abbrechen
                                    </Button>
                                    <Button onClick={() => setStep(2)} disabled={!canNext1 || loading}>
                                        Weiter
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : null}

                    {/* STEP 2 */}
                    {step === 2 ? (
                        <Card>
                            <CardHeader>
                                <div className="text-sm font-semibold text-brand-text">Hinweise</div>
                                <div className="mt-1 text-xs text-brand-text2">Optional, aber hilfreich.</div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <label className="flex items-center gap-2 text-sm text-brand-text">
                                    <input
                                        type="checkbox"
                                        checked={foerderbedarf}
                                        onChange={(e) => setFoerderbedarf(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    Förderbedarf vorhanden
                                </label>

                                {foerderbedarf ? (
                                    <div>
                                        <div className="mb-1 text-xs font-semibold text-brand-text2">Förderbedarf Details</div>
                                        <textarea
                                            value={foerderbedarfDetails}
                                            onChange={(e) => setFoerderbedarfDetails(e.target.value)}
                                            className="min-h-[96px] w-full rounded-xl border border-brand-border bg-white p-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                            placeholder="z.B. Logopädie, Motorik, Sprache…"
                                        />
                                    </div>
                                ) : null}

                                <div>
                                    <div className="mb-1 text-xs font-semibold text-brand-text2">Gesundheits-/Entwicklungshinweise</div>
                                    <textarea
                                        value={gesundheit}
                                        onChange={(e) => setGesundheit(e.target.value)}
                                        className="min-h-[96px] w-full rounded-xl border border-brand-border bg-white p-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                        placeholder="Optional…"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <Button variant="secondary" onClick={() => setStep(1)} disabled={loading}>
                                        Zurück
                                    </Button>
                                    <Button onClick={() => setStep(3)} disabled={loading}>
                                        Weiter
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : null}

                    {/* STEP 3 */}
                    {step === 3 ? (
                        <Card>
                            <CardHeader>
                                <div className="text-sm font-semibold text-brand-text">Bezugsperson (mind. 1)</div>
                                <div className="mt-1 text-xs text-brand-text2">Wird zusammen mit dem Kind gespeichert.</div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-xs font-semibold text-brand-text2">Beziehung</div>
                                        <select
                                            value={bpBeziehung}
                                            onChange={(e) => setBpBeziehung(e.target.value as Beziehung)}
                                            className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                        >
                                            {BEZIEHUNG_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <div className="mb-1 text-xs font-semibold text-brand-text2">Sorgerecht</div>
                                        <select
                                            value={bpSorgerecht}
                                            onChange={(e) => setBpSorgerecht(e.target.value as Sorgerecht)}
                                            className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                        >
                                            {SORGERECHT_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Input label="Vorname *" value={bpVorname} onChange={(e) => setBpVorname(e.target.value)} />
                                    <Input label="Nachname *" value={bpNachname} onChange={(e) => setBpNachname(e.target.value)} />
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-xs font-semibold text-brand-text2">Geburtsdatum</div>
                                        <input
                                            type="date"
                                            value={bpGeb}
                                            onChange={(e) => setBpGeb(e.target.value)}
                                            className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-1 text-xs font-semibold text-brand-text2">Geschlecht</div>
                                        <select
                                            value={bpGender}
                                            onChange={(e) => setBpGender(e.target.value as Gender)}
                                            className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                        >
                                            {GENDER_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Input label="Telefon" value={bpTelefon} onChange={(e) => setBpTelefon(e.target.value)} />
                                    <Input label="E-Mail" value={bpEmail} onChange={(e) => setBpEmail(e.target.value)} />
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Input label="Straße" value={bpStr} onChange={(e) => setBpStr(e.target.value)} />
                                    <Input label="Hausnr." value={bpHnr} onChange={(e) => setBpHnr(e.target.value)} />
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Input label="PLZ" value={bpPlz} onChange={(e) => setBpPlz(e.target.value)} />
                                    <Input label="Ort" value={bpOrt} onChange={(e) => setBpOrt(e.target.value)} />
                                </div>

                                <div className="flex flex-wrap gap-4 pt-1 text-sm text-brand-text">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={bpHaupt} onChange={(e) => setBpHaupt(e.target.checked)} className="h-4 w-4" />
                                        Hauptkontakt
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={bpHaushalt} onChange={(e) => setBpHaushalt(e.target.checked)} className="h-4 w-4" />
                                        lebt im Haushalt
                                    </label>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <Button variant="secondary" onClick={() => setStep(2)} disabled={loading}>
                                        Zurück
                                    </Button>
                                    <Button onClick={submit} disabled={!canNext3 || loading}>
                                        {loading ? "Speichere…" : "Kind anlegen"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : null}
                </div>
            </div>
        </AuthGate>
    );
}