"use client";

import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type TriState = "JA" | "NEIN" | "KEINE_ANGABE";

export function TriStateToggle({
                                   value,
                                   onChange,
                               }: {
    value?: TriState;
    onChange: (v: TriState) => void;
}) {
    return (
        <ToggleGroup
            type="single"
            value={value}
            onValueChange={(v) => {
                if (!v) return;
                onChange(v as TriState);
            }}
            className="justify-start"
        >
            <ToggleGroupItem value="JA">Ja</ToggleGroupItem>
            <ToggleGroupItem value="NEIN">Nein</ToggleGroupItem>
            <ToggleGroupItem value="KEINE_ANGABE">k.A.</ToggleGroupItem>
        </ToggleGroup>
    );
}
