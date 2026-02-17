"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {TriState} from "@/lib/types";



export function TriStateToggle({
                                   value,
                                   onChange,
                                   name,
                               }: {
    value?: TriState;
    onChange: (v: TriState) => void;
    name: string;
}) {
    return (
        <RadioGroup
            value={value}
            onValueChange={(v) => onChange(v as TriState)}
            className="flex gap-4"
        >
            <div className="flex items-center gap-2">
                <RadioGroupItem id={`${name}-ja`} value="JA" />
                <Label htmlFor={`${name}-ja`}>Ja</Label>
            </div>
            <div className="flex items-center gap-2">
                <RadioGroupItem id={`${name}-nein`} value="NEIN" />
                <Label htmlFor={`${name}-nein`}>Nein</Label>
            </div>
            <div className="flex items-center gap-2">
                <RadioGroupItem id={`${name}-ka`} value="KEINE_ANGABE" />
                <Label htmlFor={`${name}-ka`}>Keine Angaben</Label>
            </div>
        </RadioGroup>
    );
}