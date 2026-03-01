"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
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
type Sorgerecht =
    | "ALLEIN"
    | "GEMEINSAM"
    | "KEIN"
    | "AMTSPFLEGSCHAFT"
    | "VORMUNDSCHAFT"
    | "UNGEKLAERT";

type CreateKindCompleteRequest = {
    kind: {
        vorname: string;
        nachname: string;
        geburtsdatum: string | null; // ISO yyyy-mm-dd
        gender: Gender;
        foerderbedarf: boolean;
        foerderbedarfDetails: string | null;
        gesundheitsHinweise: string | null;

        // ✅ Adresse Kind
        strasse: string | null;
        hausnummer: string | null;
        plz: string | null;
        ort: string | null;
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
            className={[
                "rounded-full px-3 py-1 text-xs font-semibold border",
                active
                    ? "bg-accent text-accent-foreground border-border"
                    : "bg-background text-muted-foreground border-border",
            ].join(" ")}
        >
            {label}
        </div>
    );
}

function Field({
                   label,
                   htmlFor,
                   children,
               }: {
    label: string;
    htmlFor?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1">
            <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
                {label}
            </Label>
            {children}
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

    // ✅ Adresse Kind
    const [kStr, setKStr] = useState("");
    const [kHnr, setKHnr] = useState("");
    const [kPlz, setKPlz] = useState("");
    const [kOrt, setKOrt] = useState("");

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

    // ✅ Step 1 jetzt inkl. Adresse Pflicht? -> du wolltest "braucht die gleichen Adressfelder"
    // Ich mache sie hier als Pflicht (wie Vorname/Nachname). Wenn optional: entferne die Adresschecks.
    const canNext1 = useMemo(
        () =>
            kVorname.trim().length > 0 &&
            kNachname.trim().length > 0 &&
            kStr.trim().length > 0 &&
            kHnr.trim().length > 0 &&
            kPlz.trim().length > 0 &&
            kOrt.trim().length > 0,
        [kVorname, kNachname, kStr, kHnr, kPlz, kOrt]
    );

    const canNext3 = useMemo(
        () => bpVorname.trim().length > 0 && bpNachname.trim().length > 0,
        [bpVorname, bpNachname]
    );

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
                    foerderbedarfDetails: foerderbedarf
                        ? foerderbedarfDetails.trim() || null
                        : null,
                    gesundheitsHinweise: gesundheit.trim() || null,

                    // ✅ Adresse Kind
                    strasse: kStr.trim() || null,
                    hausnummer: kHnr.trim() || null,
                    plz: kPlz.trim() || null,
                    ort: kOrt.trim() || null,
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
            <div className="min-h-screen bg-background overflow-x-hidden">
                <Topbar title="Kind anlegen" />

                <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-4 sm:px-6 md:px-8">
                    {err ? (
                        <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
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
                                <div className="text-sm font-semibold">Kind: Basisdaten</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Vorname/Nachname und Adresse sind Pflicht.
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {/* Basis */}
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="Vorname *" htmlFor="k-vorname">
                                            <Input
                                                id="k-vorname"
                                                value={kVorname}
                                                onChange={(e) => setKVorname(e.target.value)}
                                            />
                                        </Field>

                                        <Field label="Nachname *" htmlFor="k-nachname">
                                            <Input
                                                id="k-nachname"
                                                value={kNachname}
                                                onChange={(e) => setKNachname(e.target.value)}
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="Geburtsdatum" htmlFor="k-geb">
                                            <Input
                                                id="k-geb"
                                                type="date"
                                                value={kGeb}
                                                onChange={(e) => setKGeb(e.target.value)}
                                            />
                                        </Field>

                                        <Field label="Geschlecht">
                                            <Select
                                                value={kGender}
                                                onValueChange={(v) => setKGender(v as Gender)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Bitte wählen" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {GENDER_OPTIONS.map((o) => (
                                                        <SelectItem key={o.value} value={o.value}>
                                                            {o.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </div>
                                </div>

                                {/* Adresse */}
                                <div className="space-y-3">
                                    <div className="text-xs font-semibold text-muted-foreground">
                                        Adresse
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="Straße *" htmlFor="k-str">
                                            <Input
                                                id="k-str"
                                                value={kStr}
                                                onChange={(e) => setKStr(e.target.value)}
                                            />
                                        </Field>

                                        <Field label="Hausnr. *" htmlFor="k-hnr">
                                            <Input
                                                id="k-hnr"
                                                value={kHnr}
                                                onChange={(e) => setKHnr(e.target.value)}
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="PLZ *" htmlFor="k-plz">
                                            <Input
                                                id="k-plz"
                                                value={kPlz}
                                                onChange={(e) => setKPlz(e.target.value)}
                                            />
                                        </Field>

                                        <Field label="Ort *" htmlFor="k-ort">
                                            <Input
                                                id="k-ort"
                                                value={kOrt}
                                                onChange={(e) => setKOrt(e.target.value)}
                                            />
                                        </Field>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => router.push("/dashboard/kinder")}
                                        disabled={loading}
                                    >
                                        Abbrechen
                                    </Button>
                                    <Button
                                        onClick={() => setStep(2)}
                                        disabled={!canNext1 || loading}
                                    >
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
                                <div className="text-sm font-semibold">Hinweise</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Optional, aber hilfreich.
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="foerderbedarf"
                                        checked={foerderbedarf}
                                        onCheckedChange={(v) => setFoerderbedarf(Boolean(v))}
                                    />
                                    <Label htmlFor="foerderbedarf" className="text-sm">
                                        Förderbedarf vorhanden
                                    </Label>
                                </div>

                                {foerderbedarf ? (
                                    <Field
                                        label="Förderbedarf Details"
                                        htmlFor="foerderbedarfDetails"
                                    >
                                        <Textarea
                                            id="foerderbedarfDetails"
                                            value={foerderbedarfDetails}
                                            onChange={(e) => setFoerderbedarfDetails(e.target.value)}
                                            className="min-h-[96px]"
                                            placeholder="z.B. Logopädie, Motorik, Sprache…"
                                        />
                                    </Field>
                                ) : null}

                                <Field
                                    label="Gesundheits-/Entwicklungshinweise"
                                    htmlFor="gesundheit"
                                >
                                    <Textarea
                                        id="gesundheit"
                                        value={gesundheit}
                                        onChange={(e) => setGesundheit(e.target.value)}
                                        className="min-h-[96px]"
                                        placeholder="Optional…"
                                    />
                                </Field>

                                <div className="flex items-center justify-between pt-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setStep(1)}
                                        disabled={loading}
                                    >
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
                                <div className="text-sm font-semibold">
                                    Bezugsperson (mind. 1)
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Wird zusammen mit dem Kind gespeichert.
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Field label="Beziehung">
                                        <Select
                                            value={bpBeziehung}
                                            onValueChange={(v) => setBpBeziehung(v as Beziehung)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Bitte wählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BEZIEHUNG_OPTIONS.map((o) => (
                                                    <SelectItem key={o.value} value={o.value}>
                                                        {o.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    <Field label="Sorgerecht">
                                        <Select
                                            value={bpSorgerecht}
                                            onValueChange={(v) => setBpSorgerecht(v as Sorgerecht)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Bitte wählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SORGERECHT_OPTIONS.map((o) => (
                                                    <SelectItem key={o.value} value={o.value}>
                                                        {o.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Field label="Vorname *" htmlFor="bp-vorname">
                                        <Input
                                            id="bp-vorname"
                                            value={bpVorname}
                                            onChange={(e) => setBpVorname(e.target.value)}
                                        />
                                    </Field>

                                    <Field label="Nachname *" htmlFor="bp-nachname">
                                        <Input
                                            id="bp-nachname"
                                            value={bpNachname}
                                            onChange={(e) => setBpNachname(e.target.value)}
                                        />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Field label="Geburtsdatum" htmlFor="bp-geb">
                                        <Input
                                            id="bp-geb"
                                            type="date"
                                            value={bpGeb}
                                            onChange={(e) => setBpGeb(e.target.value)}
                                        />
                                    </Field>

                                    <Field label="Geschlecht">
                                        <Select
                                            value={bpGender}
                                            onValueChange={(v) => setBpGender(v as Gender)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Bitte wählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {GENDER_OPTIONS.map((o) => (
                                                    <SelectItem key={o.value} value={o.value}>
                                                        {o.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Field label="Telefon" htmlFor="bp-telefon">
                                        <Input
                                            id="bp-telefon"
                                            value={bpTelefon}
                                            onChange={(e) => setBpTelefon(e.target.value)}
                                        />
                                    </Field>

                                    <Field label="E-Mail" htmlFor="bp-email">
                                        <Input
                                            id="bp-email"
                                            value={bpEmail}
                                            onChange={(e) => setBpEmail(e.target.value)}
                                        />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Field label="Straße" htmlFor="bp-str">
                                        <Input
                                            id="bp-str"
                                            value={bpStr}
                                            onChange={(e) => setBpStr(e.target.value)}
                                        />
                                    </Field>

                                    <Field label="Hausnr." htmlFor="bp-hnr">
                                        <Input
                                            id="bp-hnr"
                                            value={bpHnr}
                                            onChange={(e) => setBpHnr(e.target.value)}
                                        />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Field label="PLZ" htmlFor="bp-plz">
                                        <Input
                                            id="bp-plz"
                                            value={bpPlz}
                                            onChange={(e) => setBpPlz(e.target.value)}
                                        />
                                    </Field>

                                    <Field label="Ort" htmlFor="bp-ort">
                                        <Input
                                            id="bp-ort"
                                            value={bpOrt}
                                            onChange={(e) => setBpOrt(e.target.value)}
                                        />
                                    </Field>
                                </div>

                                <div className="flex flex-wrap gap-6 pt-1">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="bp-haupt"
                                            checked={bpHaupt}
                                            onCheckedChange={(v) => setBpHaupt(Boolean(v))}
                                        />
                                        <Label htmlFor="bp-haupt" className="text-sm">
                                            Hauptkontakt
                                        </Label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="bp-haushalt"
                                            checked={bpHaushalt}
                                            onCheckedChange={(v) => setBpHaushalt(Boolean(v))}
                                        />
                                        <Label htmlFor="bp-haushalt" className="text-sm">
                                            lebt im Haushalt
                                        </Label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setStep(2)}
                                        disabled={loading}
                                    >
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