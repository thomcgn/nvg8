"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type MeldungenFilter = "alle" | "aktuell" | "entwurf" | "abgeschlossen";

export function MeldungenFilterBar(props: {
    value: MeldungenFilter;
    onChange: (v: MeldungenFilter) => void;
    counts?: { alle: number; aktuell: number; entwurf: number; abgeschlossen: number };
}) {
    const { value, onChange, counts } = props;

    const item = (v: MeldungenFilter, label: string) => (
        <Button
            type="button"
            variant={value === v ? "default" : "secondary"}
            className="h-10 px-4 whitespace-nowrap"
            onClick={() => onChange(v)}
        >
            <span className="mr-2">{label}</span>
            {counts ? <Badge tone="neutral">{counts[v]}</Badge> : null}
        </Button>
    );

    return (
        <div className="-mx-1 overflow-x-auto">
            <div className="mx-1 inline-flex w-max rounded-2xl border border-brand-border/40 bg-white p-1 gap-1">
                {item("alle", "Alle")}
                {item("aktuell", "Aktuell")}
                {item("entwurf", "Entwürfe")}
                {item("abgeschlossen", "Abgeschlossen")}
            </div>
        </div>
    );
}