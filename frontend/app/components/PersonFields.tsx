"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PersonBase = {
    vorname: string;
    nachname: string;
    strasse: string;
    hausnummer: string;
    plz: string;
    ort: string;
    telefon: string;
    email: string;
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
    email: "",
};

type Props = {
    value: PersonBase;
    onChange: (v: PersonBase) => void;

    /** z.B. "Kind" oder "Erziehungsperson" */
    prefix?: string;

    /**
     * Welche Felder sollen angezeigt werden?
     * Default: alle
     */
    fields?: PersonFieldKey[];

    /** Optional für Layout */
    className?: string;

    /** Optional: IDs für bessere a11y (Label->Input) */
    idPrefix?: string;
};

const DEFAULT_FIELDS: PersonFieldKey[] = [
    "vorname",
    "nachname",
    "strasse",
    "hausnummer",
    "plz",
    "ort",
    "telefon",
    "email",
];

const LABELS: Record<PersonFieldKey, string> = {
    vorname: "Vorname",
    nachname: "Nachname",
    strasse: "Straße",
    hausnummer: "Hausnummer",
    plz: "PLZ",
    ort: "Ort",
    telefon: "Telefon",
    email: "E-Mail",
};

function inputType(key: PersonFieldKey) {
    if (key === "email") return "email";
    if (key === "telefon") return "tel";
    return "text";
}

export default function PersonFields({
                                         value,
                                         onChange,
                                         prefix,
                                         fields = DEFAULT_FIELDS,
                                         className,
                                         idPrefix = "person",
                                     }: Props) {
    const setField = (key: PersonFieldKey, next: string) => {
        onChange({ ...value, [key]: next });
    };

    const labelText = (key: PersonFieldKey) => (prefix ? `${prefix} ${LABELS[key]}` : LABELS[key]);

    return (
        <div className={["grid grid-cols-1 md:grid-cols-2 gap-3", className ?? ""].join(" ")}>
            {fields.map((key) => {
                const id = `${idPrefix}-${key}`;
                return (
                    <div key={key} className="space-y-1">
                        <Label htmlFor={id}>{labelText(key)}</Label>
                        <Input
                            id={id}
                            type={inputType(key)}
                            value={value[key]}
                            onChange={(e) => setField(key, e.target.value)}
                            autoComplete={key === "email" ? "email" : undefined}
                        />
                    </div>
                );
            })}
        </div>
    );
}