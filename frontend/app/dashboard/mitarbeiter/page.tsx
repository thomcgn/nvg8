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

const ROLE_OPTIONS = [
    { value: "FACHKRAFT", label: "Fachkraft" },
    { value: "TEAMLEITUNG", label: "Teamleitung" },
    { value: "ISEF", label: "ISEF" },
    { value: "LESEN", label: "Lesen" },
    { value: "SCHREIBEN", label: "Schreiben" },
    { value: "FREIGEBEN", label: "Freigeben" },
] as const;

const DOLMETSCH_BEDARF_OPTIONS = [
    { value: "KEIN", label: "Kein Dolmetschbedarf" },
    { value: "SPRACHDOLMETSCHEN", label: "Sprachdolmetschen" },
    { value: "GEBAERDENSPRACHDOLMETSCHEN", label: "Gebärdensprachdolmetschen" },
    { value: "SCHRIFTDOLMETSCHEN", label: "Schriftdolmetschen" },
    { value: "UNGEKLAERT", label: "Ungeklärt" },
] as const;

const HOER_STATUS_OPTIONS = [
    { value: "UNBEKANNT", label: "Unbekannt" },
    { value: "HOEREND", label: "Hörend" },
    { value: "SCHWERHOERIG", label: "Schwerhörig" },
    { value: "GEHOERLOS", label: "Gehörlos" },
] as const;

const CODA_STATUS_OPTIONS = [
    { value: "NEIN", label: "Nein" },
    { value: "JA", label: "Ja" },
    { value: "UNBEKANNT", label: "Unbekannt" },
] as const;

type CreateUserRequest = {
    email: string;
    initialPassword: string;

    vorname: string;
    nachname: string;

    staatsangehoerigkeitIso2: string | null;
    staatsangehoerigkeitSonderfall: string | null;
    staatsangehoerigkeitGruppe: string | null;

    aufenthaltstitelTyp: string | null;
    aufenthaltstitelDetails: string | null;

    kommunikationsProfil: {
        mutterspracheCode: string | null;
        bevorzugteSpracheCode: string | null;
        dolmetschBedarf: string;
        dolmetschSpracheCode: string | null;
        hoerStatus: string;
        codaStatus: string;
        gebaerdenspracheCode: string | null;
        kommunikationsHinweise: string | null;
    };

    strasse: string | null;
    hausnummer: string | null;
    plz: string | null;
    ort: string | null;

    telefon: string | null;
    kontaktEmail: string | null;

    mitarbeiterFaehigkeiten: {
        kannKinderDolmetschen: boolean;
        kannBezugspersonenDolmetschen: boolean;
        hinweise: string | null;
    };

    defaultOrgUnitId: number | null;
    roles: {
        orgUnitId: number;
        role: string;
    }[];
};

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
            const meRes = await apiFetch<MeResponse>("/auth/me");
            setMe(meRes);

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
                                    disabled={!canCreate}
                                    title={!canCreate ? "Nur für Träger-/Einrichtungs-Admins" : "Neuen Mitarbeiter anlegen"}
                                >
                                    Neuer Mitarbeiter
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
                                            <div className="text-sm font-medium text-brand-text">
                                                {u.displayName || u.email}
                                            </div>
                                            <div className="text-xs text-brand-text2">{u.email}</div>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {(u.roles ?? []).map((r) => {
                                                    const option = ROLE_OPTIONS.find((x) => x.value === r);
                                                    return (
                                                        <span
                                                            key={r}
                                                            className="rounded bg-brand-border px-2 py-0.5 text-[11px] text-brand-text"
                                                        >
                                                            {option?.label ?? r}
                                                        </span>
                                                    );
                                                })}
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
                                contexts={contexts}
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
    contexts: AvailableContextDto[];
    onCreated: () => void;
}) {
    const { open, onOpenChange, defaultOrgUnitId, canCreate, contexts, onCreated } = props;

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [vorname, setVorname] = useState("");
    const [nachname, setNachname] = useState("");
    const [email, setEmail] = useState("");
    const [initialPassword, setInitialPassword] = useState("");

    const [telefon, setTelefon] = useState("");
    const [kontaktEmail, setKontaktEmail] = useState("");

    const [strasse, setStrasse] = useState("");
    const [hausnummer, setHausnummer] = useState("");
    const [plz, setPlz] = useState("");
    const [ort, setOrt] = useState("");

    const [mutterspracheCode, setMutterspracheCode] = useState("");
    const [bevorzugteSpracheCode, setBevorzugteSpracheCode] = useState("");
    const [dolmetschBedarf, setDolmetschBedarf] =
        useState<(typeof DOLMETSCH_BEDARF_OPTIONS)[number]["value"]>("UNGEKLAERT");
    const [dolmetschSpracheCode, setDolmetschSpracheCode] = useState("");
    const [hoerStatus, setHoerStatus] =
        useState<(typeof HOER_STATUS_OPTIONS)[number]["value"]>("UNBEKANNT");
    const [codaStatus, setCodaStatus] =
        useState<(typeof CODA_STATUS_OPTIONS)[number]["value"]>("UNBEKANNT");
    const [gebaerdenspracheCode, setGebaerdenspracheCode] = useState("");
    const [kommunikationsHinweise, setKommunikationsHinweise] = useState("");

    const [kannKinderDolmetschen, setKannKinderDolmetschen] = useState(false);
    const [kannBezugspersonenDolmetschen, setKannBezugspersonenDolmetschen] = useState(false);
    const [mitarbeiterHinweise, setMitarbeiterHinweise] = useState("");

    const [orgUnitId, setOrgUnitId] = useState<number | null>(defaultOrgUnitId);
    const [selectedRoles, setSelectedRoles] = useState<string[]>(["FACHKRAFT"]);

    useEffect(() => {
        if (open) {
            setStep(1);
            setError(null);

            setVorname("");
            setNachname("");
            setEmail("");
            setInitialPassword("");

            setTelefon("");
            setKontaktEmail("");

            setStrasse("");
            setHausnummer("");
            setPlz("");
            setOrt("");

            setMutterspracheCode("");
            setBevorzugteSpracheCode("");
            setDolmetschBedarf("UNGEKLAERT");
            setDolmetschSpracheCode("");
            setHoerStatus("UNBEKANNT");
            setCodaStatus("UNBEKANNT");
            setGebaerdenspracheCode("");
            setKommunikationsHinweise("");

            setKannKinderDolmetschen(false);
            setKannBezugspersonenDolmetschen(false);
            setMitarbeiterHinweise("");

            setOrgUnitId(defaultOrgUnitId);
            setSelectedRoles(["FACHKRAFT"]);
        }
    }, [open, defaultOrgUnitId]);

    function toggleRole(role: string) {
        setSelectedRoles((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
        );
    }

    async function submit() {
        if (!canCreate) return;

        if (!orgUnitId) {
            setError("Keine Einrichtung/OrgUnit ausgewählt.");
            return;
        }

        if (selectedRoles.length === 0) {
            setError("Bitte mindestens eine Rolle auswählen.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const body: CreateUserRequest = {
                email: email.trim(),
                initialPassword,

                vorname: vorname.trim(),
                nachname: nachname.trim(),

                staatsangehoerigkeitIso2: null,
                staatsangehoerigkeitSonderfall: null,
                staatsangehoerigkeitGruppe: null,

                aufenthaltstitelTyp: null,
                aufenthaltstitelDetails: null,

                kommunikationsProfil: {
                    mutterspracheCode: emptyToNull(mutterspracheCode),
                    bevorzugteSpracheCode: emptyToNull(bevorzugteSpracheCode),
                    dolmetschBedarf,
                    dolmetschSpracheCode: emptyToNull(dolmetschSpracheCode),
                    hoerStatus,
                    codaStatus,
                    gebaerdenspracheCode: emptyToNull(gebaerdenspracheCode),
                    kommunikationsHinweise: emptyToNull(kommunikationsHinweise),
                },

                strasse: emptyToNull(strasse),
                hausnummer: emptyToNull(hausnummer),
                plz: emptyToNull(plz),
                ort: emptyToNull(ort),

                telefon: emptyToNull(telefon),
                kontaktEmail: emptyToNull(kontaktEmail),

                mitarbeiterFaehigkeiten: {
                    kannKinderDolmetschen,
                    kannBezugspersonenDolmetschen,
                    hinweise: emptyToNull(mitarbeiterHinweise),
                },

                defaultOrgUnitId: orgUnitId,
                roles: selectedRoles.map((role) => ({
                    orgUnitId,
                    role,
                })),
            };

            await apiFetch("/admin/users", {
                method: "POST",
                body,
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

    const step2Valid = true;
    const step3Valid = !!orgUnitId && selectedRoles.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Neuen Mitarbeiter anlegen</DialogTitle>
                </DialogHeader>

                {!canCreate && (
                    <div className="rounded-md border border-brand-border p-3 text-sm text-brand-text2">
                        Du hast keine Berechtigung. Nur <b>TRAEGER_ADMIN</b> oder <b>EINRICHTUNG_ADMIN</b>.
                    </div>
                )}

                {error && (
                    <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-brand-text2">
                    <span className={step === 1 ? "text-brand-text font-semibold" : ""}>
                        1) Stammdaten
                    </span>
                    <span>→</span>
                    <span className={step === 2 ? "text-brand-text font-semibold" : ""}>
                        2) Kommunikation
                    </span>
                    <span>→</span>
                    <span className={step === 3 ? "text-brand-text font-semibold" : ""}>
                        3) Rollen
                    </span>
                </div>

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <Field label="Vorname">
                                <Input value={vorname} onChange={(e) => setVorname(e.target.value)} />
                            </Field>

                            <Field label="Nachname">
                                <Input value={nachname} onChange={(e) => setNachname(e.target.value)} />
                            </Field>

                            <Field label="Login-E-Mail">
                                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                            </Field>

                            <Field label="Initial-Passwort (min. 8 Zeichen)">
                                <Input
                                    type="password"
                                    value={initialPassword}
                                    onChange={(e) => setInitialPassword(e.target.value)}
                                />
                            </Field>

                            <Field label="Telefon">
                                <Input value={telefon} onChange={(e) => setTelefon(e.target.value)} />
                            </Field>

                            <Field label="Kontakt-E-Mail">
                                <Input value={kontaktEmail} onChange={(e) => setKontaktEmail(e.target.value)} />
                            </Field>

                            <Field label="Straße">
                                <Input value={strasse} onChange={(e) => setStrasse(e.target.value)} />
                            </Field>

                            <Field label="Hausnummer">
                                <Input value={hausnummer} onChange={(e) => setHausnummer(e.target.value)} />
                            </Field>

                            <Field label="PLZ">
                                <Input value={plz} onChange={(e) => setPlz(e.target.value)} />
                            </Field>

                            <Field label="Ort">
                                <Input value={ort} onChange={(e) => setOrt(e.target.value)} />
                            </Field>
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
                    <div className="space-y-5">
                        <div>
                            <div className="mb-2 text-sm font-medium text-brand-text">
                                Kommunikationsprofil
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <Field label="Muttersprache-Code">
                                    <Input
                                        placeholder="z. B. de"
                                        value={mutterspracheCode}
                                        onChange={(e) => setMutterspracheCode(e.target.value)}
                                    />
                                </Field>

                                <Field label="Bevorzugte Sprache-Code">
                                    <Input
                                        placeholder="z. B. de"
                                        value={bevorzugteSpracheCode}
                                        onChange={(e) => setBevorzugteSpracheCode(e.target.value)}
                                    />
                                </Field>

                                <Field label="Dolmetschbedarf">
                                    <Select
                                        value={dolmetschBedarf}
                                        onValueChange={(v) =>
                                            setDolmetschBedarf(v as (typeof DOLMETSCH_BEDARF_OPTIONS)[number]["value"])
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DOLMETSCH_BEDARF_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field label="Dolmetsch-Sprache-Code">
                                    <Input
                                        placeholder="z. B. tr"
                                        value={dolmetschSpracheCode}
                                        onChange={(e) => setDolmetschSpracheCode(e.target.value)}
                                    />
                                </Field>

                                <Field label="Hörstatus">
                                    <Select
                                        value={hoerStatus}
                                        onValueChange={(v) =>
                                            setHoerStatus(v as (typeof HOER_STATUS_OPTIONS)[number]["value"])
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {HOER_STATUS_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field label="CODA-Status">
                                    <Select
                                        value={codaStatus}
                                        onValueChange={(v) =>
                                            setCodaStatus(v as (typeof CODA_STATUS_OPTIONS)[number]["value"])
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CODA_STATUS_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field label="Gebärdensprache-Code">
                                    <Input
                                        placeholder="z. B. DGS"
                                        value={gebaerdenspracheCode}
                                        onChange={(e) => setGebaerdenspracheCode(e.target.value)}
                                    />
                                </Field>

                                <Field label="Kommunikationshinweise">
                                    <Input
                                        value={kommunikationsHinweise}
                                        onChange={(e) => setKommunikationsHinweise(e.target.value)}
                                    />
                                </Field>
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 text-sm font-medium text-brand-text">
                                Mitarbeiterfähigkeiten
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 rounded border border-brand-border px-3 py-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={kannKinderDolmetschen}
                                        onChange={(e) => setKannKinderDolmetschen(e.target.checked)}
                                    />
                                    <span>Kann Kinder dolmetschen</span>
                                </label>

                                <label className="flex items-center gap-2 rounded border border-brand-border px-3 py-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={kannBezugspersonenDolmetschen}
                                        onChange={(e) => setKannBezugspersonenDolmetschen(e.target.checked)}
                                    />
                                    <span>Kann Bezugspersonen dolmetschen</span>
                                </label>

                                <Field label="Hinweise">
                                    <Input
                                        value={mitarbeiterHinweise}
                                        onChange={(e) => setMitarbeiterHinweise(e.target.value)}
                                    />
                                </Field>
                            </div>
                        </div>

                        <div className="flex justify-between gap-2">
                            <Button variant="secondary" onClick={() => setStep(1)}>
                                Zurück
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                                    Abbrechen
                                </Button>
                                <Button disabled={!step2Valid} onClick={() => setStep(3)}>
                                    Weiter
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <Field label="OrgUnit (Standard: aktive Einrichtung)">
                            {contexts.length > 0 ? (
                                <Select
                                    value={orgUnitId ? String(orgUnitId) : undefined}
                                    onValueChange={(v) => setOrgUnitId(v ? Number(v) : null)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="OrgUnit wählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contexts.map((ctx) => (
                                            <SelectItem key={`${ctx.traegerId}-${ctx.orgUnitId}`} value={String(ctx.orgUnitId)}>
                                                {ctx.traegerName} · {ctx.orgUnitName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    value={orgUnitId ?? ""}
                                    onChange={(e) => setOrgUnitId(e.target.value ? Number(e.target.value) : null)}
                                    placeholder="OrgUnitId"
                                />
                            )}
                        </Field>

                        <div>
                            <div className="mb-2 text-xs text-brand-text2">Rollen</div>
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                                {ROLE_OPTIONS.map((role) => {
                                    const checked = selectedRoles.includes(role.value);
                                    return (
                                        <label
                                            key={role.value}
                                            className="flex items-center gap-2 rounded border border-brand-border px-3 py-2 text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleRole(role.value)}
                                            />
                                            <span>{role.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-between gap-2">
                            <Button variant="secondary" onClick={() => setStep(2)}>
                                Zurück
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                                    Abbrechen
                                </Button>
                                <Button disabled={!canCreate || submitting || !step3Valid} onClick={submit}>
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

function Field(props: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="mb-1 text-xs text-brand-text2">{props.label}</div>
            {props.children}
        </div>
    );
}

function emptyToNull(v: string | null | undefined) {
    const value = (v ?? "").trim();
    return value.length > 0 ? value : null;
}