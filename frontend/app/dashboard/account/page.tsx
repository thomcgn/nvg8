"use client";

import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/lib/useAuth";

export default function AccountPage() {
    const { me } = useAuth();

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Account Einstellungen" />
                <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 sm:px-6 md:px-8">
                    <Card>
                        <CardHeader>
                            <div className="text-sm font-semibold text-brand-text">Profil</div>
                            <div className="mt-1 text-xs text-brand-text2">Basisdaten & zukünftige Einstellungen</div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-brand-text2">
                                <div>
                                    <span className="font-semibold text-brand-text">Name:</span>{" "}
                                    {me?.displayName ?? "—"}
                                </div>
                                <div>
                                    <span className="font-semibold text-brand-text">E-Mail:</span>{" "}
                                    {me?.email ?? "—"}
                                </div>
                                <div>
                                    <span className="font-semibold text-brand-text">Rollen:</span>{" "}
                                    {me?.roles?.length ? me.roles.join(", ") : "—"}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthGate>
    );
}