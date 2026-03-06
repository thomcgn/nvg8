"use client";

import React from "react";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function S8aHinweisBanner() {
    return (
        <div className="rounded-2xl border border-brand-border/40 bg-white p-4 sm:p-5">
            <div className="flex items-start gap-3">
                <div className="mt-0.5">
                    <Info className="h-5 w-5 text-brand-text2" />
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-brand-text">
                            Dokumentation & Nachvollziehbarkeit (SGB VIII / §8a)
                        </div>
                        <Badge tone="neutral">behördentauglich</Badge>
                    </div>

                    <div className="mt-1 text-sm text-brand-text2">
                        Änderungen werden versioniert und bleiben nachvollziehbar (Zeitpunkt, Ersteller:in, Änderungshistorie).
                        <span className="block mt-1">
              <strong>Korrigieren</strong> = Fehlerberichtigung · <strong>Neue Meldung</strong> = neue Sachlage/folgende Beobachtung.
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
}