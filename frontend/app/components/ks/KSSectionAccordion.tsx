"use client";

import * as React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { KSSectionDTO } from "@/lib/types";
import { KSItemField } from "./KSItemField";
import { Control } from "react-hook-form";

export function KSSectionAccordion({
                                       sections,
                                       control,
                                   }: {
    sections: KSSectionDTO[];
    control: Control<any>;
}) {
    const sorted = [...sections].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

    return (
        <Accordion type="multiple" className="w-full">
            {sorted.map((sec) => (
                <AccordionItem key={sec.id} value={sec.sectionNo}>
                    <AccordionTrigger>
                        <div className="text-left">
                            <div className="font-semibold">{sec.sectionNo} – {sec.title}</div>
                            {sec.hintText ? <div className="text-xs text-muted-foreground mt-1">{sec.hintText}</div> : null}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                        {!!sec.items?.length && (
                            <div className="space-y-4">
                                {[...sec.items]
                                    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                                    .map((it) => (
                                        <KSItemField key={it.id} item={it} control={control} />
                                    ))}
                            </div>
                        )}

                        {!!sec.children?.length && (
                            <div className="pl-2 border-l">
                                <KSSectionAccordion sections={sec.children} control={control} />
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
