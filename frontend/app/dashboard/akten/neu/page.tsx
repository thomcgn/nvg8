"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AkteNeuStub() {
    const sp = useSearchParams();
    const router = useRouter();
    const kindId = sp.get("kindId");

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Akte starten" />

                <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-4 sm:px-6">
                    <Card>
                        <CardHeader className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-brand-text2" />
                            <div>
                                <div className="text-sm font-semibold text-brand-text">Noch nicht implementiert</div>
                                <div className="mt-1 text-xs text-brand-text2">
                                    Platzhalter – hier kommt später der Akte-Wizard rein.
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-sm text-brand-text">Kind-ID: {kindId ?? "—"}</div>
                            <Button variant="secondary" onClick={() => router.back()}>
                                Zurück
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthGate>
    );
}