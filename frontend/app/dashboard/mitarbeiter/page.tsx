"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * ✅ Backend liefert bei dir:
 * - GET /auth/contexts -> ContextsResponse { contexts: [...] }
 * - GET /auth/me       -> MeResponse { roles: [...] , ... }
 *
 * Dein ursprünglicher Code hat fälschlich erwartet:
 * { active: { roles, ... } }
 *
 * → Fix: lade /auth/me für Rollen + aktive context IDs
 *        und /auth/contexts für die Liste (falls du sie brauchst)
 */

type MeResponse = {
    userId: number;
    email: string;
    displayName: string;
    contextActive: boolean;
    traegerId: number | null;
    orgUnitId: number | null;
    roles: string[];
};

type AvailableContextDto = {
    traegerId: number;
    traegerName: string;
    orgUnitId: number;
    orgUnitType: string;
    orgUnitName: string;
};

type ContextsResponse = {
    contexts: AvailableContextDto[];
};

type UserListItem = {
    id: number;
    email: string;
    displayName: string;
    enabled: boolean;
    roles: string[];
};

const ROLE_OPTIONS = ["FACHKRAFT", "TEAMLEITUNG", "ISEF", "LESEN", "SCHREIBEN", "FREIGEBEN"] as const;

export default function TeamsPage() {
    const [me, setMe] = useState<MeResponse | null>(null);
    const [contexts, setContexts] = useState<AvailableContextDto[]>([]);
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [wizardOpen, setWizardOpen] = useState(false);

    const canCreate = useMemo(() => {
        const roles = me?.roles ?? [];
        return roles.includes("TRAEGER_ADMIN") || roles.includes("EINRICHTUNG_ADMIN");
    }, [me]);

    const activeOrgUnitId = me?.orgUnitId ?? null;

    async function loadAll() {
        setLoading(true);
        try {
            // ✅ Source of truth: roles + active ids
            const meRes = await apiFetch<MeResponse>("/auth/me");
            setMe(meRes);

            // (Optional) contexts list (für future UI / debugging)
            // Wenn du das nicht brauchst, kannst du diesen Call entfernen.
            const ctxRes = await apiFetch<ContextsResponse>("/auth/contexts");
            setContexts(ctxRes.contexts ?? []);

            const orgUnitId = meRes?.orgUnitId;
            if (orgUnitId) {
                const list = await apiFetch<UserListItem[]>(`/admin/org-units/${orgUnitId}/users`);
                setUsers(list);
            } else {
                setUsers([]);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
    }, []);

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Personal" />
                <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 sm:px-6 md:px-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-brand-text">Mitarbeitende</div>
                                    <div className="mt-1 text-xs text-brand-text2">Rollen & Zugriffe</div>
                                </div>

                                <Button
                                    onClick={() => setWizardOpen(true)}
                                    //disabled={!canCreate}
                                    disabled={true}
                                    title={!canCreate ? "Nur für Träger-/Einrichtungs-Admins" : "Neuen Mitarbeiter anlegen"}
                                >
                                    Vorerst keine neuen Mitarbeiter

                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {loading && <div className="text-sm text-brand-text2">Lade...</div>}

                            {!loading && !activeOrgUnitId && (
                                <div className="text-sm text-brand-text2">
                                    Keine aktive Einrichtung im Kontext. (orgUnitId ist leer)
                                </div>
                            )}

                            {!loading && activeOrgUnitId && users.length === 0 && (
                                <div className="text-sm text-brand-text2">Keine Mitarbeiter gefunden.</div>
                            )}

                            {!loading && users.length > 0 && (
                                <div className="space-y-2">
                                    {users.map((u) => (
                                        <div key={u.id} className="rounded-lg border border-brand-border p-3">
                                            <div className="text-sm font-medium text-brand-text">{u.displayName || u.email}</div>
                                            <div className="text-xs text-brand-text2">{u.email}</div>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {(u.roles ?? []).map((r) => (
                                                    <span
                                                        key={r}
                                                        className="rounded bg-brand-border px-2 py-0.5 text-[11px] text-brand-text"
                                                    >
                            {r}
                          </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <CreateEmployeeWizard
                                open={wizardOpen}
                                onOpenChange={setWizardOpen}
                                defaultOrgUnitId={activeOrgUnitId}
                                canCreate={canCreate}
                                onCreated={async () => {
                                    setWizardOpen(false);
                                    await loadAll();
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthGate>
    );
}

function CreateEmployeeWizard(props: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    defaultOrgUnitId: number | null;
    canCreate: boolean;
    onCreated: () => void;
}) {
    const { open, onOpenChange, defaultOrgUnitId, canCreate, onCreated } = props;

    const [step, setStep] = useState<1 | 2>(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [vorname, setVorname] = useState("");
    const [nachname, setNachname] = useState("");
    const [email, setEmail] = useState("");
    const [initialPassword, setInitialPassword] = useState("");
    const [orgUnitId, setOrgUnitId] = useState<number | null>(defaultOrgUnitId);
    const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>("FACHKRAFT");

    useEffect(() => {
        if (open) {
            setStep(1);
            setError(null);
            setOrgUnitId(defaultOrgUnitId);
            setVorname("");
            setNachname("");
            setEmail("");
            setInitialPassword("");
            setRole("FACHKRAFT");
        }
    }, [open, defaultOrgUnitId]);

    async function submit() {
        if (!canCreate) return;
        if (!orgUnitId) {
            setError("Keine Einrichtung/OrgUnit ausgewählt.");
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            // 1) create user
            const user = await apiFetch<{ id: number }>("/admin/users", {
                method: "POST",
                body: {
                    email,
                    initialPassword,
                    vorname,
                    nachname,
                },
            });

            // 2) assign role to orgUnit
            await apiFetch<void>(`/admin/users/${user.id}/roles`, {
                method: "POST",
                body: {
                    orgUnitId,
                    role,
                },
            });

            await onCreated();
        } catch (e: any) {
            setError(e?.message ?? "Unbekannter Fehler.");
        } finally {
            setSubmitting(false);
        }
    }

    const step1Valid =
        vorname.trim().length > 0 &&
        nachname.trim().length > 0 &&
        email.trim().length > 0 &&
        initialPassword.trim().length >= 8;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Neuen Mitarbeiter anlegen</DialogTitle>
                </DialogHeader>

                {!canCreate && (
                    <div className="rounded-md border border-brand-border p-3 text-sm text-brand-text2">
                        Du hast keine Berechtigung. Nur <b>TRAEGER_ADMIN</b> oder <b>EINRICHTUNG_ADMIN</b>.
                    </div>
                )}

                {error && <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm">{error}</div>}

                <div className="flex items-center gap-2 text-xs text-brand-text2">
                    <span className={step === 1 ? "text-brand-text font-semibold" : ""}>1) Stammdaten</span>
                    <span>→</span>
                    <span className={step === 2 ? "text-brand-text font-semibold" : ""}>2) Rolle</span>
                </div>

                {step === 1 && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="mb-1 text-xs text-brand-text2">Vorname</div>
                                <Input value={vorname} onChange={(e) => setVorname(e.target.value)} />
                            </div>
                            <div>
                                <div className="mb-1 text-xs text-brand-text2">Nachname</div>
                                <Input value={nachname} onChange={(e) => setNachname(e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <div className="mb-1 text-xs text-brand-text2">E-Mail</div>
                            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>

                        <div>
                            <div className="mb-1 text-xs text-brand-text2">Initial-Passwort (min. 8 Zeichen)</div>
                            <Input type="password" value={initialPassword} onChange={(e) => setInitialPassword(e.target.value)} />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => onOpenChange(false)}>
                                Abbrechen
                            </Button>
                            <Button disabled={!step1Valid} onClick={() => setStep(2)}>
                                Weiter
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-3">
                        <div>
                            <div className="mb-1 text-xs text-brand-text2">OrgUnit (Standard: aktive Einrichtung)</div>
                            <Input
                                value={orgUnitId ?? ""}
                                onChange={(e) => setOrgUnitId(e.target.value ? Number(e.target.value) : null)}
                                placeholder="OrgUnitId"
                            />
                            <div className="mt-1 text-[11px] text-brand-text2">
                                (Optional: hier kannst du später ein OrgUnit-Select aus `/org-units/tree` draus machen.)
                            </div>
                        </div>

                        <div>
                            <div className="mb-1 text-xs text-brand-text2">Rolle</div>
                            <Select value={role} onValueChange={(v) => setRole(v as any)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Rolle wählen" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLE_OPTIONS.map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {r}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-between gap-2">
                            <Button variant="secondary" onClick={() => setStep(1)}>
                                Zurück
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                                    Abbrechen
                                </Button>
                                <Button disabled={!canCreate || submitting || !orgUnitId} onClick={submit}>
                                    {submitting ? "Speichere..." : "Anlegen"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}