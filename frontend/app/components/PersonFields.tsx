"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * DTO-kompatibel mit deinem Backend:
 * - BezugspersonCreateRequest / CreateKindRequest
 * - legacy: email bleibt optional (wird serverseitig auf kontaktEmail gemappt)
 */
export type PersonBase = {
    // Grunddaten
    vorname: string;
    nachname: string;

    // Adresse
    strasse: string;
    hausnummer: string;
    plz: string;
    ort: string;

    // Kontakt
    telefon: string;
    kontaktEmail: string;

    // Legacy (optional, falls alte UI noch sendet)
    email?: string;

    // Staatsangehörigkeit
    staatsangehoerigkeitIso2: string; // "DE", "TR" ...
    staatsangehoerigkeitSonderfall: string; // Enum name
    staatsangehoerigkeitGruppe: string; // Enum name

    // Aufenthalt
    aufenthaltstitelTyp: string; // Enum name
    aufenthaltstitelDetails: string;

    // Sprache & Kommunikation
    mutterspracheCode: string; // "de", "tr", ...
    bevorzugteSpracheCode: string;

    dolmetschBedarf: string; // Enum name
    dolmetschSpracheCode: string;

    hoerStatus: string; // Enum name
    codaStatus: string; // Enum name

    gebaerdenspracheCode: string; // "DGS", "ÖGS", "DSGS" ...
    kommunikationsHinweise: string;
};

export type PersonFieldKey = keyof PersonBase;

export const emptyPerson: PersonBase = {
    vorname: "",
    nachname: "",
    strasse: "",
    hausnummer: "",
    plz: "",
    ort: "",
    telefon: "",
    kontaktEmail: "",

    // optional legacy
    email: "",

    staatsangehoerigkeitIso2: "",
    staatsangehoerigkeitSonderfall: "KEINER",
    staatsangehoerigkeitGruppe: "UNBEKANNT",

    aufenthaltstitelTyp: "UNBEKANNT",
    aufenthaltstitelDetails: "",

    mutterspracheCode: "",
    bevorzugteSpracheCode: "",

    dolmetschBedarf: "UNGEKLAERT",
    dolmetschSpracheCode: "",

    hoerStatus: "UNBEKANNT",
    codaStatus: "UNBEKANNT",

    gebaerdenspracheCode: "",
    kommunikationsHinweise: "",
};

type Props = {
    value: PersonBase;
    onChange: (v: PersonBase) => void;

    /** z.B. "Kind" oder "Bezugsperson" */
    prefix?: string;

    /**
     * Welche Felder sollen angezeigt werden?
     * Default: sinnvolle Standardauswahl
     */
    fields?: PersonFieldKey[];

    /** Optional für Layout */
    className?: string;

    /** Optional: IDs für bessere a11y (Label->Input) */
    idPrefix?: string;
};

// sinnvolle Defaults (du kannst im Wizard pro Use Case überschreiben)
const DEFAULT_FIELDS: PersonFieldKey[] = [
    "vorname",
    "nachname",
    "strasse",
    "hausnummer",
    "plz",
    "ort",
    "telefon",
    "kontaktEmail",

    "staatsangehoerigkeitIso2",
    "aufenthaltstitelTyp",

    "bevorzugteSpracheCode",
    "dolmetschBedarf",
    "dolmetschSpracheCode",

    "hoerStatus",
    "codaStatus",

    "kommunikationsHinweise",
];

const LABELS: Record<PersonFieldKey, string> = {
    vorname: "Vorname",
    nachname: "Nachname",
    strasse: "Straße",
    hausnummer: "Hausnummer",
    plz: "PLZ",
    ort: "Ort",
    telefon: "Telefon",
    kontaktEmail: "Kontakt-E-Mail",

    email: "E-Mail (Legacy)",

    staatsangehoerigkeitIso2: "Staatsangehörigkeit (ISO-Code, z.B. DE)",
    staatsangehoerigkeitSonderfall: "Staatsangehörigkeit (Sonderfall)",
    staatsangehoerigkeitGruppe: "Staatsangehörigkeit (Gruppe)",

    aufenthaltstitelTyp: "Aufenthaltstitel",
    aufenthaltstitelDetails: "Aufenthaltstitel Details",

    mutterspracheCode: "Muttersprache (Code, z.B. de)",
    bevorzugteSpracheCode: "Bevorzugte Sprache (Code, z.B. de)",

    dolmetschBedarf: "Dolmetschbedarf",
    dolmetschSpracheCode: "Dolmetschsprache (Code)",

    hoerStatus: "Hörstatus",
    codaStatus: "CODA (Child of Deaf Adults)",

    gebaerdenspracheCode: "Gebärdensprache (z.B. DGS)",
    kommunikationsHinweise: "Kommunikationshinweise",
};

function inputType(key: PersonFieldKey) {
    if (key === "kontaktEmail" || key === "email") return "email";
    if (key === "telefon") return "tel";
    return "text";
}

// Enums (müssen zu Backend passen!)
const STAATS_SONDERFALL = ["KEINER", "UNGEKLAERT", "UNBEKANNT", "STAATENLOS"] as const;
const STAATS_GRUPPE = ["DE", "EU_EWR", "SCHWEIZ", "DRITTSTAAT", "UNBEKANNT"] as const;

const AUFENTHALTSTITEL = [
    "DEUTSCH",
    "EU_EWR_FREIZUEGIGKEIT",
    "SCHWEIZ_FREIZUEGIGKEIT",

    "AUFENTHALTSERLAUBNIS",
    "NIEDERLASSUNGSERLAUBNIS",
    "DAUERAUFENTHALT_EU",
    "BLAUE_KARTE_EU",
    "VISUM_D",

    "AUFENTHALTSGESTATTUNG",
    "DULDUNG",

    "UNGEKLAERT",
    "KEIN_STATUS",
    "UNBEKANNT",
] as const;

const DOLMETSCH = ["KEIN", "SPRACHDOLMETSCHEN", "GEBAERDENSPRACHDOLMETSCHEN", "SCHRIFTDOLMETSCHEN", "UNGEKLAERT"] as const;
const HOERSTATUS = ["UNBEKANNT", "HOEREND", "SCHWERHOERIG", "GEHOERLOS"] as const;
const CODA = ["UNBEKANNT", "NEIN", "JA"] as const;

export default function PersonFields({
                                         value,
                                         onChange,
                                         prefix,
                                         fields = DEFAULT_FIELDS,
                                         className,
                                         idPrefix = "person",
                                     }: Props) {
    const setField = (key: PersonFieldKey, next: any) => {
        onChange({ ...value, [key]: next });
    };

    const labelText = (key: PersonFieldKey) => (prefix ? `${prefix} ${LABELS[key]}` : LABELS[key]);

    const renderField = (key: PersonFieldKey) => {
        const id = `${idPrefix}-${key}`;

        // Textarea
        if (key === "kommunikationsHinweise") {
            return (
                <div key={key} className="space-y-1 md:col-span-2">
                    <Label htmlFor={id}>{labelText(key)}</Label>
                    <Textarea id={id} value={value[key] ?? ""} onChange={(e) => setField(key, e.target.value)} rows={4} />
                </div>
            );
        }

        // Selects für Enums
        if (key === "staatsangehoerigkeitSonderfall") {
            return (
                <div key={key} className="space-y-1">
                    <Label htmlFor={id}>{labelText(key)}</Label>
                    <Select value={value[key] ?? "KEINER"} onValueChange={(v) => setField(key, v)}>
                        <SelectTrigger id={id}>
                            <SelectValue placeholder="Bitte auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                            {STAATS_SONDERFALL.map((v) => (
                                <SelectItem key={v} value={v}>
                                    {v}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        if (key === "staatsangehoerigkeitGruppe") {
            return (
                <div key={key} className="space-y-1">
                    <Label htmlFor={id}>{labelText(key)}</Label>
                    <Select value={value[key] ?? "UNBEKANNT"} onValueChange={(v) => setField(key, v)}>
                        <SelectTrigger id={id}>
                            <SelectValue placeholder="Bitte auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                            {STAATS_GRUPPE.map((v) => (
                                <SelectItem key={v} value={v}>
                                    {v}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        if (key === "aufenthaltstitelTyp") {
            return (
                <div key={key} className="space-y-1">
                    <Label htmlFor={id}>{labelText(key)}</Label>
                    <Select value={value[key] ?? "UNBEKANNT"} onValueChange={(v) => setField(key, v)}>
                        <SelectTrigger id={id}>
                            <SelectValue placeholder="Bitte auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                            {AUFENTHALTSTITEL.map((v) => (
                                <SelectItem key={v} value={v}>
                                    {v}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        if (key === "dolmetschBedarf") {
            return (
                <div key={key} className="space-y-1">
                    <Label htmlFor={id}>{labelText(key)}</Label>
                    <Select value={value[key] ?? "UNGEKLAERT"} onValueChange={(v) => setField(key, v)}>
                        <SelectTrigger id={id}>
                            <SelectValue placeholder="Bitte auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                            {DOLMETSCH.map((v) => (
                                <SelectItem key={v} value={v}>
                                    {v}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        if (key === "hoerStatus") {
            return (
                <div key={key} className="space-y-1">
                    <Label htmlFor={id}>{labelText(key)}</Label>
                    <Select value={value[key] ?? "UNBEKANNT"} onValueChange={(v) => setField(key, v)}>
                        <SelectTrigger id={id}>
                            <SelectValue placeholder="Bitte auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                            {HOERSTATUS.map((v) => (
                                <SelectItem key={v} value={v}>
                                    {v}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        if (key === "codaStatus") {
            return (
                <div key={key} className="space-y-1">
                    <Label htmlFor={id}>{labelText(key)}</Label>
                    <Select value={value[key] ?? "UNBEKANNT"} onValueChange={(v) => setField(key, v)}>
                        <SelectTrigger id={id}>
                            <SelectValue placeholder="Bitte auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                            {CODA.map((v) => (
                                <SelectItem key={v} value={v}>
                                    {v}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        // Normale Inputs
        return (
            <div key={key} className="space-y-1">
                <Label htmlFor={id}>{labelText(key)}</Label>
                <Input
                    id={id}
                    type={inputType(key)}
                    value={(value as any)[key] ?? ""}
                    onChange={(e) => setField(key, e.target.value)}
                    autoComplete={key === "kontaktEmail" || key === "email" ? "email" : undefined}
                />
            </div>
        );
    };

    return <div className={["grid grid-cols-1 md:grid-cols-2 gap-3", className ?? ""].join(" ")}>{fields.map(renderField)}</div>;
}