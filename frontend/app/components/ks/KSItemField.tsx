"use client";

import * as React from "react";
import { Control, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TriStateToggle } from "./TriStateToggle";
import type { KSItemDTO } from "@/lib/types";

export function KSItemField({
                                item,
                                control,
                            }: {
    item: KSItemDTO;
    control: Control<any>;
}) {
    const baseName = `answers.${item.itemNo}`;

    return (
        <div className="rounded-xl border p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <div className="text-sm font-medium">
                        {item.itemNo} – {item.text}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary">{item.polarity}</Badge>
                        {item.akutKriterium ? <Badge variant="destructive">Akut</Badge> : null}
                    </div>
                </div>
            </div>

            {item.answerType === "TRI_STATE" && (
                <Controller
                    control={control}
                    name={`${baseName}.answer`}
                    render={({ field }) => (
                        <TriStateToggle value={field.value} onChange={field.onChange} />
                    )}
                />
            )}

            {item.answerType === "TEXT" && (
                <Controller
                    control={control}
                    name={`${baseName}.answer`}
                    render={({ field }) => (
                        <Textarea placeholder="Freitext…" {...field} />
                    )}
                />
            )}

            {item.answerType === "DATE" && (
                <Controller
                    control={control}
                    name={`${baseName}.answer`}
                    render={({ field }) => <Input type="date" {...field} />}
                />
            )}

            {item.answerType === "USER_REF" && (
                <Controller
                    control={control}
                    name={`${baseName}.answer`}
                    render={({ field }) => (
                        <Input placeholder="User-ID oder Name…" {...field} />
                    )}
                />
            )}

            {/* optional: Kommentar pro Item */}
            <Controller
                control={control}
                name={`${baseName}.comment`}
                render={({ field }) => (
                    <Textarea placeholder="Kommentar (optional)..." {...field} />
                )}
            />
        </div>
    );
}
