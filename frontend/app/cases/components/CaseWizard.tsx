"use client";

import { useEffect, useMemo, useState } from "react";

import PersonFields, { emptyPerson, PersonBase } from "@/app/components/PersonFields";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { KindResponse, KindSummary, BezugspersonResponse, BezugspersonSummary } from "@/lib/types";

interface CaseWizardProps {
    onCancel: () => void;
}

// Enum-Werte passend zu deinem Backend: RolleImAlltag
const ROLLEN_IM_ALLTAG = [
    "ELTERNTEIL",
    "PFLEGEFAMILIE",
    "BETREUUNG",
    "FAMILIENHILFE",
    "EINRICHTUNG",
    "SONSTIGE",
] as const;

type RolleImAlltag = (typeof ROLLEN_IM_ALLTAG)[number];

async function readBodySafe(res: Response) {
    const text = await res.text().catch(() => "");
    return { text };
}

// Response -> Summary
function kindSummaryFromCreate(res: KindResponse): KindSummary {
    const p = res?.person ?? {};
    return {
        id: res.id,
        vorname: p.vorname ?? "",
        nachname: p.nachname ?? "",
        geburtsdatum: res.geburtsdatum ?? undefined,
    };
}

function bpSummaryFromCreate(res: BezugspersonResponse): BezugspersonSummary {
    const p = res?.person ?? {};
    return {
        id: res.id,
        vorname: p.vorname ?? "",
        nachname: p.nachname ?? "",
        organisation: (res as any).organisation ?? undefined,
    };
}

/**
 * Rollen-spezifische Details (UI-seitig).
 * -> Passe die Felder an dein Backend an.
 *
 * Ergänzt:
 * - ELTERNTEIL: Art-Enums + lebtImHaushalt/Umgang + rechtliche Hinweise
 * - EINRICHTUNG: Typ/Gruppe/Dienstkontakt
 * - PFLEGEFAMILIE: Pflegeart/Beginn
 * - BETREUUNG/FAMILIENHILFE: Stunden/Zuständig seit
 * - SONSTIGE: BeziehungZumKind/KontaktErlaubt/Priorität
 */
type SorgeArt = "ALLEIN" | "GEMEINSAM" | "UNBEKANNT";
type Umgang = "REGELMAESSIG" | "UNREGELMAESSIG" | "KEIN" | "UNBEKANNT";
type EinrichtungTyp = "HEIM" | "WOHNGRUPPE" | "INOBHUTNAHME" | "KITA" | "SCHULE" | "SONSTIGE";
type PflegeStatus = "BEREITSCHAFT" | "DAUERPFLEGE" | "VERWANDTENPFLEGE" | "UNBEKANNT";
type Prioritaet = "NIEDRIG" | "NORMAL" | "HOCH";

type BezugspersonDetails =
    | {
    type: "ELTERNTEIL";
    // Rechte
    sorgerechtArt?: SorgeArt;
    abrArt?: SorgeArt; // Aufenthaltsbestimmungsrecht
    // Haushalt / Umgang
    lebtImHaushalt?: boolean;
    umgang?: Umgang;
    umgangAusgesetzt?: boolean;
    // Schutz / rechtlich (optional)
    schutzanordnungGewSchG?: boolean;
    kontaktverbot?: boolean;
    gerichtsbeschluss?: boolean;
    // Freitext
    hinweis?: string;
}
    | {
    type: "EINRICHTUNG";
    einrichtungTyp?: EinrichtungTyp;
    einrichtungsname?: string;
    gruppeKlasse?: string;
    ansprechperson?: string;
    funktion?: string;
    dienstTelefon?: string;
    dienstEmail?: string;
    erreichbarkeit?: string;
    hinweis?: string;
}
    | {
    type: "PFLEGEFAMILIE";
    pflegeStatus?: PflegeStatus;
    pflegebeginn?: string; // ISO date
    pflegeverhaeltnis?: string;
    hinweis?: string;
}
    | {
    type: "BETREUUNG";
    traeger?: string;
    zuständigSeit?: string; // ISO date
    stundenProWoche?: number;
    hinweis?: string;
}
    | {
    type: "FAMILIENHILFE";
    traeger?: string;
    zuständigSeit?: string; // ISO date
    stundenProWoche?: number;
    hinweis?: string;
}
    | {
    type: "SONSTIGE";
    beziehungZumKind?: string;
    kontaktErlaubt?: boolean;
    prioritaet?: Prioritaet;
    hinweis?: string;
};

function defaultDetailsForRole(role: RolleImAlltag): BezugspersonDetails {
    switch (role) {
        case "ELTERNTEIL":
            return {
                type: "ELTERNTEIL",
                sorgerechtArt: "UNBEKANNT",
                abrArt: "UNBEKANNT",
                lebtImHaushalt: false,
                umgang: "UNBEKANNT",
                umgangAusgesetzt: false,
                schutzanordnungGewSchG: false,
                kontaktverbot: false,
                gerichtsbeschluss: false,
                hinweis: "",
            };
        case "EINRICHTUNG":
            return {
                type: "EINRICHTUNG",
                einrichtungTyp: "SONSTIGE",
                einrichtungsname: "",
                gruppeKlasse: "",
                ansprechperson: "",
                funktion: "",
                dienstTelefon: "",
                dienstEmail: "",
                erreichbarkeit: "",
                hinweis: "",
            };
        case "PFLEGEFAMILIE":
            return {
                type: "PFLEGEFAMILIE",
                pflegeStatus: "UNBEKANNT",
                pflegebeginn: "",
                pflegeverhaeltnis: "",
                hinweis: "",
            };
        case "BETREUUNG":
            return {
                type: "BETREUUNG",
                traeger: "",
                zuständigSeit: "",
                stundenProWoche: undefined,
                hinweis: "",
            };
        case "FAMILIENHILFE":
            return {
                type: "FAMILIENHILFE",
                traeger: "",
                zuständigSeit: "",
                stundenProWoche: undefined,
                hinweis: "",
            };
        default:
            return {
                type: "SONSTIGE",
                beziehungZumKind: "",
                kontaktErlaubt: true,
                prioritaet: "NORMAL",
                hinweis: "",
            };
    }
}

/** -------------------- Role components -------------------- **/

function ElternteilFields({
                              value,
                              onChange,
                          }: {
    value: Extract<BezugspersonDetails, { type: "ELTERNTEIL" }>;
    onChange: (v: BezugspersonDetails) => void;
}) {
    return (
        <div className="rounded-lg border p-4 space-y-4">
            <div className="text-sm font-semibold">Details (ELTERNTEIL)</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label>Sorgerecht</Label>
                    <Select
                        value={value.sorgerechtArt ?? "UNBEKANNT"}
                        onValueChange={(v) => onChange({ ...value, sorgerechtArt: v as any })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALLEIN">ALLEIN</SelectItem>
                            <SelectItem value="GEMEINSAM">GEMEINSAM</SelectItem>
                            <SelectItem value="UNBEKANNT">UNBEKANNT</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Aufenthaltsbestimmungsrecht</Label>
                    <Select value={value.abrArt ?? "UNBEKANNT"} onValueChange={(v) => onChange({ ...value, abrArt: v as any })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALLEIN">ALLEIN</SelectItem>
                            <SelectItem value="GEMEINSAM">GEMEINSAM</SelectItem>
                            <SelectItem value="UNBEKANNT">UNBEKANNT</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={!!value.lebtImHaushalt} onCheckedChange={(c) => onChange({ ...value, lebtImHaushalt: Boolean(c) })} />
                    Lebt im Haushalt
                </label>

                <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                        checked={!!value.umgangAusgesetzt}
                        onCheckedChange={(c) => onChange({ ...value, umgangAusgesetzt: Boolean(c) })}
                    />
                    Umgang ausgesetzt
                </label>
            </div>

            <div className="space-y-2">
                <Label>Umgang</Label>
                <Select value={value.umgang ?? "UNBEKANNT"} onValueChange={(v) => onChange({ ...value, umgang: v as any })}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="REGELMAESSIG">REGELMAESSIG</SelectItem>
                        <SelectItem value="UNREGELMAESSIG">UNREGELMAESSIG</SelectItem>
                        <SelectItem value="KEIN">KEIN</SelectItem>
                        <SelectItem value="UNBEKANNT">UNBEKANNT</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                        checked={!!value.schutzanordnungGewSchG}
                        onCheckedChange={(c) => onChange({ ...value, schutzanordnungGewSchG: Boolean(c) })}
                    />
                    Schutzanordnung
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={!!value.kontaktverbot} onCheckedChange={(c) => onChange({ ...value, kontaktverbot: Boolean(c) })} />
                    Kontaktverbot
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                        checked={!!value.gerichtsbeschluss}
                        onCheckedChange={(c) => onChange({ ...value, gerichtsbeschluss: Boolean(c) })}
                    />
                    Gerichtsbeschluss
                </label>
            </div>

            <div className="space-y-2">
                <Label className="text-sm">Hinweis</Label>
                <Textarea rows={3} value={value.hinweis ?? ""} onChange={(e) => onChange({ ...value, hinweis: e.target.value })} />
            </div>
        </div>
    );
}

function EinrichtungFields({
                               value,
                               onChange,
                           }: {
    value: Extract<BezugspersonDetails, { type: "EINRICHTUNG" }>;
    onChange: (v: BezugspersonDetails) => void;
}) {
    return (
        <div className="rounded-lg border p-4 space-y-4">
            <div className="text-sm font-semibold">Details (EINRICHTUNG)</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label>Typ</Label>
                    <Select value={value.einrichtungTyp ?? "SONSTIGE"} onValueChange={(v) => onChange({ ...value, einrichtungTyp: v as any })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="HEIM">HEIM</SelectItem>
                            <SelectItem value="WOHNGRUPPE">WOHNGRUPPE</SelectItem>
                            <SelectItem value="INOBHUTNAHME">INOBHUTNAHME</SelectItem>
                            <SelectItem value="KITA">KITA</SelectItem>
                            <SelectItem value="SCHULE">SCHULE</SelectItem>
                            <SelectItem value="SONSTIGE">SONSTIGE</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Gruppe / Klasse</Label>
                    <Input value={value.gruppeKlasse ?? ""} onChange={(e) => onChange({ ...value, gruppeKlasse: e.target.value })} />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Einrichtungsname</Label>
                <Input value={value.einrichtungsname ?? ""} onChange={(e) => onChange({ ...value, einrichtungsname: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label>Ansprechperson</Label>
                    <Input value={value.ansprechperson ?? ""} onChange={(e) => onChange({ ...value, ansprechperson: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Funktion</Label>
                    <Input value={value.funktion ?? ""} onChange={(e) => onChange({ ...value, funktion: e.target.value })} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label>Dienst-Telefon</Label>
                    <Input value={value.dienstTelefon ?? ""} onChange={(e) => onChange({ ...value, dienstTelefon: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Dienst-E-Mail</Label>
                    <Input value={value.dienstEmail ?? ""} onChange={(e) => onChange({ ...value, dienstEmail: e.target.value })} />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Erreichbarkeit</Label>
                <Input value={value.erreichbarkeit ?? ""} onChange={(e) => onChange({ ...value, erreichbarkeit: e.target.value })} />
            </div>

            <div className="space-y-2">
                <Label>Hinweis</Label>
                <Textarea rows={3} value={value.hinweis ?? ""} onChange={(e) => onChange({ ...value, hinweis: e.target.value })} />
            </div>
        </div>
    );
}

function SimpleHinweisFields({
                                 title,
                                 value,
                                 onChange,
                                 extra,
                             }: {
    title: string;
    value: BezugspersonDetails;
    onChange: (v: BezugspersonDetails) => void;
    extra?: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border p-4 space-y-3">
            <div className="text-sm font-semibold">{title}</div>
            {extra}
            <div className="space-y-2">
                <Label>Hinweis</Label>
                <Textarea
                    rows={3}
                    value={(value as any).hinweis ?? ""}
                    onChange={(e) => onChange({ ...(value as any), hinweis: e.target.value })}
                    placeholder="Optional"
                />
            </div>
        </div>
    );
}

function BezugspersonRoleFields({
                                    role,
                                    value,
                                    onChange,
                                }: {
    role: RolleImAlltag;
    value: BezugspersonDetails;
    onChange: (v: BezugspersonDetails) => void;
}) {
    switch (role) {
        case "ELTERNTEIL":
            return <ElternteilFields value={value.type === "ELTERNTEIL" ? value : (defaultDetailsForRole(role) as any)} onChange={onChange} />;

        case "EINRICHTUNG":
            return <EinrichtungFields value={value.type === "EINRICHTUNG" ? value : (defaultDetailsForRole(role) as any)} onChange={onChange} />;

        case "PFLEGEFAMILIE":
            return (
                <SimpleHinweisFields
                    title="Details (PFLEGEFAMILIE)"
                    value={value.type === "PFLEGEFAMILIE" ? value : defaultDetailsForRole(role)}
                    onChange={onChange}
                    extra={
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Pflegeart</Label>
                                <Select
                                    value={(value.type === "PFLEGEFAMILIE" ? value.pflegeStatus : "UNBEKANNT") ?? "UNBEKANNT"}
                                    onValueChange={(v) =>
                                        onChange({
                                            ...(value.type === "PFLEGEFAMILIE" ? value : (defaultDetailsForRole(role) as any)),
                                            pflegeStatus: v as any,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BEREITSCHAFT">BEREITSCHAFT</SelectItem>
                                        <SelectItem value="DAUERPFLEGE">DAUERPFLEGE</SelectItem>
                                        <SelectItem value="VERWANDTENPFLEGE">VERWANDTENPFLEGE</SelectItem>
                                        <SelectItem value="UNBEKANNT">UNBEKANNT</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Pflegebeginn</Label>
                                <Input
                                    type="date"
                                    value={(value.type === "PFLEGEFAMILIE" ? value.pflegebeginn : "") ?? ""}
                                    onChange={(e) =>
                                        onChange({
                                            ...(value.type === "PFLEGEFAMILIE" ? value : (defaultDetailsForRole(role) as any)),
                                            pflegebeginn: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Pflegeverhältnis</Label>
                                <Input
                                    value={(value.type === "PFLEGEFAMILIE" ? value.pflegeverhaeltnis : "") ?? ""}
                                    onChange={(e) =>
                                        onChange({
                                            ...(value.type === "PFLEGEFAMILIE" ? value : (defaultDetailsForRole(role) as any)),
                                            pflegeverhaeltnis: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    }
                />
            );

        case "BETREUUNG":
            return (
                <SimpleHinweisFields
                    title="Details (BETREUUNG)"
                    value={value.type === "BETREUUNG" ? value : defaultDetailsForRole(role)}
                    onChange={onChange}
                    extra={
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Träger</Label>
                                <Input
                                    value={(value.type === "BETREUUNG" ? value.traeger : "") ?? ""}
                                    onChange={(e) =>
                                        onChange({
                                            ...(value.type === "BETREUUNG" ? value : (defaultDetailsForRole(role) as any)),
                                            traeger: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Stunden/Woche</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={value.type === "BETREUUNG" && typeof value.stundenProWoche === "number" ? String(value.stundenProWoche) : ""}
                                    onChange={(e) =>
                                        onChange({
                                            ...(value.type === "BETREUUNG" ? value : (defaultDetailsForRole(role) as any)),
                                            stundenProWoche: e.target.value ? Number(e.target.value) : undefined,
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Zuständig seit</Label>
                                <Input
                                    type="date"
                                    value={(value.type === "BETREUUNG" ? value.zuständigSeit : "") ?? ""}
                                    onChange={(e) =>
                                        onChange({
                                            ...(value.type === "BETREUUNG" ? value : (defaultDetailsForRole(role) as any)),
                                            zuständigSeit: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    }
                />
            );

        case "FAMILIENHILFE":
            return (
                <SimpleHinweisFields
                    title="Details (FAMILIENHILFE)"
                    value={value.type === "FAMILIENHILFE" ? value : defaultDetailsForRole(role)}
                    onChange={onChange}
                    extra={
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Träger</Label>
                                <Input
                                    value={(value.type === "FAMILIENHILFE" ? value.traeger : "") ?? ""}
                                    onChange={(e) =>
                                        onChange({
                                            ...(value.type === "FAMILIENHILFE" ? value : (defaultDetailsForRole(role) as any)),
                                            traeger: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Stunden/Woche</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={value.type === "FAMILIENHILFE" && typeof value.stundenProWoche === "number" ? String(value.stundenProWoche) : ""}
                                    onChange={(e) =>
                                        onChange({
                                            ...(value.type === "FAMILIENHILFE" ? value : (defaultDetailsForRole(role) as any)),
                                            stundenProWoche: e.target.value ? Number(e.target.value) : undefined,
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Zuständig seit</Label>
                                <Input
                                    type="date"
                                    value={(value.type === "FAMILIENHILFE" ? value.zuständigSeit : "") ?? ""}
                                    onChange={(e) =>
                                        onChange({
                                            ...(value.type === "FAMILIENHILFE" ? value : (defaultDetailsForRole(role) as any)),
                                            zuständigSeit: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    }
                />
            );

        default:
            return (
                <SimpleHinweisFields
                    title="Details (SONSTIGE)"
                    value={value.type === "SONSTIGE" ? value : defaultDetailsForRole(role)}
                    onChange={onChange}
                    extra={
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Beziehung zum Kind</Label>
                                <Input
                                    value={(value.type === "SONSTIGE" ? value.beziehungZumKind : "") ?? ""}
                                    onChange={(e) =>
                                        onChange({
                                            ...(value.type === "SONSTIGE" ? value : (defaultDetailsForRole(role) as any)),
                                            beziehungZumKind: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Priorität</Label>
                                <Select
                                    value={(value.type === "SONSTIGE" ? value.prioritaet : "NORMAL") ?? "NORMAL"}
                                    onValueChange={(v) =>
                                        onChange({
                                            ...(value.type === "SONSTIGE" ? value : (defaultDetailsForRole(role) as any)),
                                            prioritaet: v as any,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NIEDRIG">NIEDRIG</SelectItem>
                                        <SelectItem value="NORMAL">NORMAL</SelectItem>
                                        <SelectItem value="HOCH">HOCH</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <label className="flex items-center gap-2 text-sm md:col-span-2">
                                <Checkbox
                                    checked={value.type === "SONSTIGE" ? !!value.kontaktErlaubt : true}
                                    onCheckedChange={(c) =>
                                        onChange({
                                            ...(value.type === "SONSTIGE" ? value : (defaultDetailsForRole(role) as any)),
                                            kontaktErlaubt: Boolean(c),
                                        })
                                    }
                                />
                                Kontaktaufnahme erlaubt
                            </label>
                        </div>
                    }
                />
            );
    }
}

/** -------------------- Wizard -------------------- **/

export default function CaseWizard({ onCancel }: CaseWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const progressValue = (step / 3) * 100;

    // Bezugspersonen (vorhanden)
    const [bezugspersonen, setBezugspersonen] = useState<BezugspersonSummary[]>([]);
    const [selectedBezugspersonIds, setSelectedBezugspersonIds] = useState<number[]>([]);
    const [rolleByBezugspersonId, setRolleByBezugspersonId] = useState<Record<number, RolleImAlltag>>({});
    const [notfallkontaktByBezugspersonId, setNotfallkontaktByBezugspersonId] = useState<Record<number, boolean>>({});

    // Geschwister-Auswahl (bestehende Kinder laden)
    const [kinder, setKinder] = useState<KindSummary[]>([]);
    const [geschwisterIds, setGeschwisterIds] = useState<number[]>([]);

    // Kind wird IMMER neu angelegt
    const [creatingKind, setCreatingKind] = useState(false);
    const [createdKind, setCreatedKind] = useState<KindSummary | null>(null);

    const [newKind, setNewKind] = useState<PersonBase>(emptyPerson);
    const [newKindGeburtsdatum, setNewKindGeburtsdatum] = useState<string>("");

    // Neue Bezugsperson anlegen
    const [showCreateBp, setShowCreateBp] = useState(false);
    const [creatingBp, setCreatingBp] = useState(false);

    const [newBp, setNewBp] = useState<PersonBase>(emptyPerson);
    const [newBpRole, setNewBpRole] = useState<RolleImAlltag>("ELTERNTEIL");
    const [newBpDetails, setNewBpDetails] = useState<BezugspersonDetails>(() => defaultDetailsForRole("ELTERNTEIL"));

    // Beschreibung
    const [description, setDescription] = useState("");
    const [submittingDraft, setSubmittingDraft] = useState(false);

    const kindLabel = (k: KindSummary) => `${k.vorname ?? ""} ${k.nachname ?? ""}`.trim() || `Kind #${k.id}`;
    const bpLabel = (p: BezugspersonSummary) => `${p.vorname ?? ""} ${p.nachname ?? ""}`.trim() || `Bezugsperson #${p.id}`;

    useEffect(() => {
        const load = async () => {
            try {
                const [bpRes, kRes] = await Promise.all([
                    fetch("/api/cases/bezugspersonen", { credentials: "include", cache: "no-store" }),
                    fetch("/api/cases/kinder", { credentials: "include", cache: "no-store" }),
                ]);

                if (!bpRes.ok) {
                    const { text } = await readBodySafe(bpRes);
                    throw new Error(`GET /bezugspersonen failed: ${bpRes.status} ${text}`);
                }
                if (!kRes.ok) {
                    const { text } = await readBodySafe(kRes);
                    throw new Error(`GET /kinder failed: ${kRes.status} ${text}`);
                }

                setBezugspersonen((await bpRes.json()) as BezugspersonSummary[]);
                setKinder((await kRes.json()) as KindSummary[]);
            } catch (e: any) {
                console.error("[Wizard] load error:", e);
                toast.error("Laden fehlgeschlagen", {
                    description: e?.message || "Daten konnten nicht geladen werden.",
                });
            }
        };

        load();
    }, []);

    const ensureRoleDefault = (id: number, fallback: RolleImAlltag = "SONSTIGE") => {
        setRolleByBezugspersonId((prev) => ({
            ...prev,
            [id]: prev[id] ?? fallback,
        }));
    };

    const toggleSelectedBp = (id: number) => {
        setSelectedBezugspersonIds((prev) => {
            const isSelected = prev.includes(id);
            const next = isSelected ? prev.filter((x) => x !== id) : [...prev, id];

            if (!isSelected) ensureRoleDefault(id, "ELTERNTEIL");

            if (isSelected) {
                setRolleByBezugspersonId((rprev) => {
                    const copy = { ...rprev };
                    delete copy[id];
                    return copy;
                });
                setNotfallkontaktByBezugspersonId((nprev) => {
                    const copy = { ...nprev };
                    delete copy[id];
                    return copy;
                });
            }

            return next;
        });
    };

    const toggleNotfallkontakt = (id: number) => {
        setNotfallkontaktByBezugspersonId((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const toggleGeschwister = (id: number) => {
        setGeschwisterIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const resetBpForm = () => {
        setNewBp(emptyPerson);
        setNewBpRole("ELTERNTEIL");
        setNewBpDetails(defaultDetailsForRole("ELTERNTEIL"));
    };

    const resetKindFormAndSelection = () => {
        setNewKind(emptyPerson);
        setNewKindGeburtsdatum("");
        setSelectedBezugspersonIds([]);
        setRolleByBezugspersonId({});
        setNotfallkontaktByBezugspersonId({});
        setGeschwisterIds([]);
        setCreatedKind(null);
        setShowCreateBp(false);
        resetBpForm();
    };

    const createBezugsperson = async ({ keepOpen }: { keepOpen: boolean }) => {
        if (!newBp.vorname?.trim() || !newBp.nachname?.trim()) {
            toast.error("Pflichtfelder fehlen", { description: "Bitte Vorname und Nachname der Bezugsperson ausfüllen." });
            return;
        }

        setCreatingBp(true);
        try {
            const payload: any = {
                ...newBp,
                rolleImAlltag: newBpRole, // falls Backend das als Stammfeld will; sonst entfernen
                details: newBpDetails, // falls Backend details akzeptiert; sonst mappen/flatten
            };

            const res = await fetch("/api/cases/bezugspersonen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const { text } = await readBodySafe(res);
            if (!res.ok) throw new Error(`Fehler beim Anlegen (${res.status}) ${text}`);

            const created = JSON.parse(text) as BezugspersonResponse;
            const createdSummary = bpSummaryFromCreate(created);

            setBezugspersonen((prev) => [createdSummary, ...prev]);

            // automatisch auswählen + Rolle in der Relation setzen
            setSelectedBezugspersonIds((prev) => (prev.includes(createdSummary.id) ? prev : [...prev, createdSummary.id]));
            setRolleByBezugspersonId((prev) => ({ ...prev, [createdSummary.id]: newBpRole }));

            toast.success("Bezugsperson angelegt", { description: `${bpLabel(createdSummary)} wurde hinzugefügt und ausgewählt (${newBpRole}).` });

            resetBpForm();
            setShowCreateBp(keepOpen);
        } catch (err: any) {
            console.error("[Wizard] createBezugsperson error:", err);
            toast.error("Anlegen fehlgeschlagen", { description: err?.message || "Unbekannter Fehler beim Anlegen der Bezugsperson." });
        } finally {
            setCreatingBp(false);
        }
    };

    const validateKindAndRelations = () => {
        if (!newKind.vorname?.trim() || !newKind.nachname?.trim()) {
            toast.error("Pflichtfelder fehlen", { description: "Bitte Vorname und Nachname des Kindes ausfüllen." });
            return false;
        }
        if (!newKindGeburtsdatum) {
            toast.error("Geburtsdatum fehlt", { description: "Bitte Geburtsdatum angeben." });
            return false;
        }
        if (selectedBezugspersonIds.length === 0) {
            toast.error("Zuordnung fehlt", { description: "Ein Kind benötigt mindestens eine Bezugsperson." });
            return false;
        }
        const missingRole = selectedBezugspersonIds.find((id) => !rolleByBezugspersonId[id]);
        if (missingRole) {
            toast.error("Rolle fehlt", { description: "Bitte für jede ausgewählte Bezugsperson eine Rolle (im Alltag) wählen." });
            return false;
        }
        return true;
    };

    const createKind = async () => {
        if (!validateKindAndRelations()) return null;

        setCreatingKind(true);
        try {
            const payload: any = {
                ...newKind,
                geburtsdatum: newKindGeburtsdatum,
                geschwisterIds, // <-- NEU
                bezugspersonen: selectedBezugspersonIds.map((id) => ({
                    id,
                    rolleImAlltag: rolleByBezugspersonId[id] ?? "SONSTIGE",
                    notfallkontakt: !!notfallkontaktByBezugspersonId[id], // <-- NEU
                })),
            };

            const res = await fetch("/api/cases/kinder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const { text } = await readBodySafe(res);
            if (!res.ok) throw new Error(`Fehler beim Anlegen (${res.status}) ${text}`);

            const created = JSON.parse(text) as KindResponse;
            const createdSummary = kindSummaryFromCreate(created);

            setCreatedKind(createdSummary);

            toast.success("Kind angelegt", { description: `${kindLabel(createdSummary)} wurde erstellt.` });

            return createdSummary;
        } catch (err: any) {
            console.error("[Wizard] createKind error:", err);
            toast.error("Anlegen fehlgeschlagen", { description: err?.message || "Unbekannter Fehler beim Anlegen des Kindes." });
            return null;
        } finally {
            setCreatingKind(false);
        }
    };

    const nextStep = () => setStep((prev) => (prev < 3 ? ((prev + 1) as any) : prev));
    const prevStep = () => setStep((prev) => (prev > 1 ? ((prev - 1) as any) : prev));

    const onNext = async () => {
        if (step === 1) {
            if (createdKind?.id) return nextStep();
            const created = await createKind();
            if (!created) return;
            nextStep();
            return;
        }
        if (step === 2) {
            if (!description.trim()) {
                toast.error("Beschreibung fehlt", { description: "Bitte eine kurze Beobachtung / Einschätzung eintragen." });
                return;
            }
            nextStep();
            return;
        }
    };

    const createDraft = async () => {
        if (!createdKind?.id) {
            toast.error("Kind fehlt", { description: "Bitte zuerst das Kind anlegen." });
            setStep(1);
            return;
        }
        if (!description.trim()) {
            toast.error("Beschreibung fehlt", { description: "Bitte eine Beschreibung eingeben." });
            setStep(2);
            return;
        }

        setSubmittingDraft(true);
        try {
            const payload: any = { kindId: createdKind.id, description };

            const res = await fetch("/api/cases/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const { text } = await readBodySafe(res);
            if (!res.ok) throw new Error(`Fehler beim Erstellen (${res.status}) ${text}`);

            const draft = JSON.parse(text);
            toast.success("Draft-Fall erstellt", { description: `ID: ${draft?.id ?? "–"}` });

            onCancel();
        } catch (err: any) {
            console.error("[Wizard] createDraft error:", err);
            toast.error("Erstellen fehlgeschlagen", { description: err?.message || "Unbekannter Fehler beim Erstellen des Draft-Falls." });
        } finally {
            setSubmittingDraft(false);
        }
    };

    const selectedBezugspersonenForSummary = useMemo(() => {
        const map = new Map(bezugspersonen.map((b) => [b.id, b]));
        return selectedBezugspersonIds.map((id) => ({
            id,
            bp: map.get(id),
            rolle: rolleByBezugspersonId[id],
            notfall: !!notfallkontaktByBezugspersonId[id],
        }));
    }, [bezugspersonen, selectedBezugspersonIds, rolleByBezugspersonId, notfallkontaktByBezugspersonId]);

    const selectableGeschwister = useMemo(() => {
        // falls die KindSummary-Liste das neue Kind noch nicht enthält: ok
        return kinder;
    }, [kinder]);

    return (
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Neuen Fall anlegen</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                    <Progress value={progressValue} />
                    <div className="text-sm text-muted-foreground">
                        Schritt <span className="font-medium text-foreground">{step}</span> von 3
                    </div>
                </div>

                <Separator />

                {/* STEP 1: Kind + Bezugspersonen */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-semibold">Stammdaten</h3>
                            <Badge variant="outline">Kind & Bezugsperson(en)</Badge>
                        </div>

                        {createdKind ? (
                            <div className="rounded-lg border p-4 space-y-2">
                                <div className="text-sm">
                                    <span className="font-medium">Kind angelegt:</span> {kindLabel(createdKind)}
                                </div>
                                <div className="text-xs text-muted-foreground">Wenn du das Kind ändern möchtest, setze den Schritt zurück und lege es neu an.</div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={resetKindFormAndSelection}>
                                        Kind neu anlegen
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Lege das Kind an und ordne <b>mindestens eine</b> Bezugsperson zu. Für jede Zuordnung wird eine <b>Rolle im Alltag</b> gespeichert.
                                    Optional: Notfallkontakt(e) & Geschwister.
                                </p>

                                <div className="space-y-2">
                                    <Label>Geburtsdatum</Label>
                                    <Input type="date" value={newKindGeburtsdatum} onChange={(e) => setNewKindGeburtsdatum(e.target.value)} />
                                </div>

                                <PersonFields value={newKind} onChange={setNewKind} prefix="Kind" idPrefix="kind" />

                                <Separator />

                                {/* Geschwister */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold">Geschwister (optional)</h4>
                                        {geschwisterIds.length > 0 && (
                                            <span className="text-xs text-muted-foreground">{geschwisterIds.length} ausgewählt</span>
                                        )}
                                    </div>

                                    {selectableGeschwister.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2">
                                            {selectableGeschwister.map((k) => {
                                                const checked = geschwisterIds.includes(k.id);
                                                return (
                                                    <div key={`sib-${k.id}`} className="rounded-md border p-3">
                                                        <label className="flex items-center gap-3">
                                                            <Checkbox checked={checked} onCheckedChange={() => toggleGeschwister(k.id)} />
                                                            <span className="text-sm">{kindLabel(k)}</span>
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Keine Kinder vorhanden – Geschwisterauswahl aktuell nicht möglich.</p>
                                    )}

                                    <p className="text-xs text-muted-foreground">
                                        Tipp: Wenn du später Regeln baust (z.B. häusliche Gewalt → Geschwister prüfen), ist diese Verknüpfung die Basis.
                                    </p>
                                </div>

                                <Separator />

                                {/* Bezugspersonen auswählen / anlegen */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold">Bezugsperson(en) zuordnen</h4>

                                        <Button variant="link" className="px-0" onClick={() => setShowCreateBp((v) => !v)}>
                                            {showCreateBp ? "Anlegen ausblenden" : "+ Bezugsperson anlegen"}
                                        </Button>
                                    </div>

                                    {bezugspersonen.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2">
                                            {bezugspersonen.map((p) => {
                                                const checked = selectedBezugspersonIds.includes(p.id);
                                                const rolle = rolleByBezugspersonId[p.id] ?? "ELTERNTEIL";
                                                const notfall = !!notfallkontaktByBezugspersonId[p.id];

                                                return (
                                                    <div key={`bp-${p.id}`} className="rounded-md border p-3 space-y-3">
                                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                            <label className="flex items-center gap-3">
                                                                <Checkbox checked={checked} onCheckedChange={() => toggleSelectedBp(p.id)} />
                                                                <span className="text-sm">{bpLabel(p)}</span>
                                                            </label>

                                                            <div className="w-full md:w-60">
                                                                <Label className="sr-only">Rolle im Alltag</Label>
                                                                <Select
                                                                    value={rolle}
                                                                    onValueChange={(v) =>
                                                                        setRolleByBezugspersonId((prev) => ({
                                                                            ...prev,
                                                                            [p.id]: v as RolleImAlltag,
                                                                        }))
                                                                    }
                                                                    disabled={!checked}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Rolle im Alltag" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {ROLLEN_IM_ALLTAG.map((r) => (
                                                                            <SelectItem key={r} value={r}>
                                                                                {r}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>

                                                        {/* Notfallkontakt: nur wenn BP ausgewählt */}
                                                        <div className="flex items-center justify-between">
                                                            <label className={`flex items-center gap-2 text-sm ${checked ? "" : "opacity-50"}`}>
                                                                <Checkbox checked={notfall} onCheckedChange={() => toggleNotfallkontakt(p.id)} disabled={!checked} />
                                                                Notfallkontakt
                                                            </label>
                                                            <span className="text-xs text-muted-foreground">Mehrere möglich</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Keine Bezugspersonen vorhanden – bitte jetzt anlegen.</p>
                                    )}

                                    {/* Neue Bezugsperson anlegen */}
                                    {(showCreateBp || bezugspersonen.length === 0) && (
                                        <div className="rounded-lg border p-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label>Rolle im Alltag</Label>
                                                <Select
                                                    value={newBpRole}
                                                    onValueChange={(v) => {
                                                        const role = v as RolleImAlltag;
                                                        setNewBpRole(role);
                                                        setNewBpDetails(defaultDetailsForRole(role));
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ROLLEN_IM_ALLTAG.map((r) => (
                                                            <SelectItem key={r} value={r}>
                                                                {r}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground">
                                                    Die Rolle wird für die Zuordnung Kind ↔ Bezugsperson gespeichert. Zusätzlich können rollenabhängige Details erfasst werden.
                                                </p>
                                            </div>

                                            <PersonFields value={newBp} onChange={setNewBp} prefix="Bezugsperson" idPrefix="bp" />
                                            <BezugspersonRoleFields role={newBpRole} value={newBpDetails} onChange={setNewBpDetails} />

                                            <div className="flex flex-wrap gap-2">
                                                <Button type="button" onClick={() => createBezugsperson({ keepOpen: true })} disabled={creatingBp}>
                                                    {creatingBp ? "Speichern..." : "Speichern & weitere anlegen"}
                                                </Button>

                                                <Button type="button" variant="secondary" onClick={() => createBezugsperson({ keepOpen: false })} disabled={creatingBp}>
                                                    {creatingBp ? "Speichern..." : "Speichern & schließen"}
                                                </Button>

                                                {bezugspersonen.length > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => {
                                                            resetBpForm();
                                                            setShowCreateBp(false);
                                                        }}
                                                        disabled={creatingBp}
                                                    >
                                                        Abbrechen
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* STEP 2: Beschreibung */}
                {step === 2 && (
                    <div className="space-y-3">
                        <h3 className="text-base font-semibold">Beobachtung / Einschätzung</h3>
                        <Textarea rows={6} placeholder="Beschreibung der Beobachtung" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                )}

                {/* STEP 3: Review */}
                {step === 3 && (
                    <div className="space-y-3">
                        <h3 className="text-base font-semibold">Überprüfung & Abschluss</h3>
                        <div className="text-sm text-muted-foreground">Bitte alle Angaben prüfen und den Draft-Fall erstellen.</div>

                        <div className="rounded-lg border p-4 space-y-2">
                            <div className="text-sm">
                                <span className="font-medium">Kind:</span> {createdKind ? kindLabel(createdKind) : "–"}
                            </div>

                            <div className="text-sm">
                                <span className="font-medium">Geschwister:</span>{" "}
                                {geschwisterIds.length === 0 ? "–" : `${geschwisterIds.length} ausgewählt`}
                            </div>

                            <div className="text-sm">
                                <span className="font-medium">Bezugsperson(en):</span>
                                {selectedBezugspersonenForSummary.length === 0 ? (
                                    <span> –</span>
                                ) : (
                                    <div className="mt-2 space-y-1">
                                        {selectedBezugspersonenForSummary.map((x) => (
                                            <div key={`sum-bp-${x.id}`} className="text-sm text-muted-foreground">
                                                • {x.bp ? bpLabel(x.bp) : `#${x.id}`} —{" "}
                                                <span className="text-foreground">{x.rolle ?? "–"}</span>
                                                {x.notfall ? <span className="ml-2 text-foreground">• Notfallkontakt</span> : null}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="text-sm">
                                <span className="font-medium">Beschreibung:</span> {description || "–"}
                            </div>
                        </div>
                    </div>
                )}

                <Separator />

                {/* Footer */}
                <div className="flex items-center justify-between gap-3">
                    <Button variant="outline" onClick={() => setStep((prev) => (prev > 1 ? ((prev - 1) as any) : prev))} disabled={step === 1}>
                        Zurück
                    </Button>

                    <div className="flex gap-2">
                        <Button variant="destructive" onClick={onCancel}>
                            Abbrechen
                        </Button>

                        {step < 3 ? (
                            <Button onClick={onNext} disabled={step === 1 ? creatingKind : false}>
                                {step === 1 ? (creatingKind ? "Kind anlegen..." : createdKind ? "Weiter" : "Kind anlegen & weiter") : "Weiter"}
                            </Button>
                        ) : (
                            <Button onClick={createDraft} disabled={submittingDraft}>
                                {submittingDraft ? "Erstellen..." : "Erstellen"}
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}