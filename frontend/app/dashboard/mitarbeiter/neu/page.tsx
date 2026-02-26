"use client";

import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function MitarbeiterNeuPage() {
    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Mitarbeiter anlegen" />
                <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 sm:px-6 md:px-8">
                    <Card>
                        <CardHeader>
                            <div className="text-sm font-semibold text-brand-text">Neuer Mitarbeiter</div>
                            <div className="mt-1 text-xs text-brand-text2">Formular (kommt als nächstes)</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-brand-text2">Placeholder-Seite.</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthGate>
    );
}