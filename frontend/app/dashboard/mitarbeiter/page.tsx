"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ─── Types ────────────────────────────────────────────────────────────────────

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

type UserListItem = {
    id: number;
    email: string;
    displayName: string;
    enabled: boolean;
    roles?: string[];
};

type OrgUnitTreeNode = {
    id: number;
    type: string;
    name: string;
    enabled?: boolean;
    children?: OrgUnitTreeNode[];
    strasse?: string | null;
    hausnummer?: string | null;
    plz?: string | null;
    ort?: string | null;
    leitung?: string | null;
    ansprechpartner?: string | null;
};

type RoleAssignment = {
    id: number;
    role: string;
};

type OrgUnitUserResponse = {
    id: number;
    email: string;
    displayName: string;
    enabled: boolean;
    roleAssignments: RoleAssignment[];
};

type TeamMemberListItem = {
    membershipId: number;
    userId: number;
    displayName: string;
    email: string;
    membershipType: string;
    primary: boolean;
    enabled: boolean;
};

type TeamMembershipResponse = {
    id: number;
    userId: number;
    teamOrgUnitId: number;
    teamName: string;
    membershipType: string;
    primary: boolean;
    enabled: boolean;
};

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
    roles: { orgUnitId: number; role: string; }[];
};

type TeamAssignment = { orgUnitId: number; membershipType: string };

// ─── Options ──────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
    { value: "TRAEGER_ADMIN",     label: "Träger-Admin" },
    { value: "EINRICHTUNG_ADMIN", label: "Einrichtungs-Admin" },
    { value: "FACHKRAFT",         label: "Fachkraft" },
    { value: "TEAMLEITUNG",       label: "Teamleitung" },
    { value: "ISEF",              label: "ISEF" },
    { value: "LESEN",             label: "Lesen" },
    { value: "SCHREIBEN",         label: "Schreiben" },
    { value: "FREIGEBEN",         label: "Freigeben" },
] as const;

const DOLMETSCH_BEDARF_OPTIONS = [
    { value: "KEIN",                        label: "Kein Dolmetschbedarf" },
    { value: "SPRACHDOLMETSCHEN",           label: "Sprachdolmetschen" },
    { value: "GEBAERDENSPRACHDOLMETSCHEN",  label: "Gebärdensprachdolmetschen" },
    { value: "SCHRIFTDOLMETSCHEN",          label: "Schriftdolmetschen" },
    { value: "UNGEKLAERT",                  label: "Ungeklärt" },
] as const;

const HOER_STATUS_OPTIONS = [
    { value: "UNBEKANNT",    label: "Unbekannt" },
    { value: "HOEREND",      label: "Hörend" },
    { value: "SCHWERHOERIG", label: "Schwerhörig" },
    { value: "GEHOERLOS",    label: "Gehörlos" },
] as const;

const CODA_STATUS_OPTIONS = [
    { value: "NEIN",     label: "Nein" },
    { value: "JA",       label: "Ja" },
    { value: "UNBEKANNT",label: "Unbekannt" },
] as const;

const ORG_UNIT_TYPE_OPTIONS = [
    { value: "EINRICHTUNG", label: "Einrichtung" },
    { value: "ABTEILUNG",   label: "Fachbereich" },
    { value: "TEAM",        label: "Team" },
    { value: "GRUPPE",      label: "Gruppe" },
    { value: "STANDORT",    label: "Standort" },
] as const;

const TEAM_MEMBERSHIP_TYPE_OPTIONS = [
    { value: "MITGLIED",   label: "Mitglied" },
    { value: "PRAKTIKANT", label: "Praktikant" },
    { value: "LEITUNG",    label: "Leitung" },
    { value: "EXTERN",     label: "Extern" },
    { value: "SPRINGER",   label: "Springer" },
] as const;

// ─── Utilities ────────────────────────────────────────────────────────────────

function emptyToNull(v: string | null | undefined): string | null {
    const value = (v ?? "").trim();
    return value.length > 0 ? value : null;
}

function labelForOrgUnitType(type: string) {
    const map: Record<string, string> = {
        TRAEGER: "Träger", EINRICHTUNG: "Einrichtung", ABTEILUNG: "Fachbereich",
        TEAM: "Team", GRUPPE: "Gruppe", STANDORT: "Standort",
    };
    return map[type] ?? type;
}

function labelForMembershipType(type: string) {
    return TEAM_MEMBERSHIP_TYPE_OPTIONS.find((x) => x.value === type)?.label ?? type;
}

function labelForRole(role: string) {
    return ROLE_OPTIONS.find((x) => x.value === role)?.label ?? role;
}

function allowedChildTypes(parentType: string | null) {
    if (parentType === "TRAEGER")     return ORG_UNIT_TYPE_OPTIONS.filter((x) => x.value === "EINRICHTUNG");
    if (parentType === "EINRICHTUNG") return ORG_UNIT_TYPE_OPTIONS.filter((x) => ["ABTEILUNG", "TEAM", "STANDORT"].includes(x.value));
    if (parentType === "ABTEILUNG")   return ORG_UNIT_TYPE_OPTIONS.filter((x) => ["TEAM", "GRUPPE"].includes(x.value));
    if (parentType === "TEAM")        return ORG_UNIT_TYPE_OPTIONS.filter((x) => x.value === "GRUPPE");
    return ORG_UNIT_TYPE_OPTIONS.filter((x) => x.value === "TEAM");
}

function suggestChildType(parentType: string | null): (typeof ORG_UNIT_TYPE_OPTIONS)[number]["value"] {
    return allowedChildTypes(parentType)[0]?.value ?? "TEAM";
}

function findNodeById(nodes: OrgUnitTreeNode[] | null | undefined, id: number): OrgUnitTreeNode | null {
    if (!Array.isArray(nodes)) return null;
    for (const node of nodes) {
        if (node.id === id) return node;
        const child = findNodeById(node.children, id);
        if (child) return child;
    }
    return null;
}

function findFirstUsefulNodeId(nodes: OrgUnitTreeNode[] | null | undefined): number | null {
    if (!Array.isArray(nodes)) return null;
    for (const node of nodes) {
        if (["TEAM", "ABTEILUNG", "EINRICHTUNG", "TRAEGER"].includes(node.type)) return node.id;
        const childId = findFirstUsefulNodeId(node.children);
        if (childId) return childId;
    }
    return nodes[0]?.id ?? null;
}

function flattenTeamsAndGroups(nodes: OrgUnitTreeNode[]): OrgUnitTreeNode[] {
    const result: OrgUnitTreeNode[] = [];
    function walk(node: OrgUnitTreeNode) {
        if (node.type === "TEAM" || node.type === "GRUPPE") result.push(node);
        node.children?.forEach(walk);
    }
    nodes.forEach(walk);
    return result;
}

// ─── Role power helpers ───────────────────────────────────────────────────────

const ROLE_POWER: Record<string, number> = {
    TRAEGER_ADMIN: 100, EINRICHTUNG_ADMIN: 90,
};
function rolePower(role: string) { return ROLE_POWER[role] ?? 50; }
function myMaxPower(roles: string[]) { return roles.reduce((m, r) => Math.max(m, rolePower(r)), 0); }
function canAssign(myRoles: string[], targetRole: string) {
    return myMaxPower(myRoles) >= rolePower(targetRole);
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-4 py-2 text-sm transition ${
                active
                    ? "border-b-2 border-brand-navy text-brand-navy font-semibold"
                    : "text-brand-text2 hover:text-brand-text"
            }`}
        >
            {children}
        </button>
    );
}

// ─── Helper UI components ─────────────────────────────────────────────────────

function Field(props: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="mb-1 text-xs text-brand-text2">{props.label}</div>
            {props.children}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="mb-2 text-sm font-semibold text-brand-text">{title}</div>
            {children}
        </div>
    );
}

function Empty({ text }: { text: string }) {
    return <div className="text-sm text-brand-text2">{text}</div>;
}

function Err({ msg }: { msg: string }) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{msg}</div>;
}

function Badge(props: { children: React.ReactNode }) {
    return (
        <span className="rounded-lg bg-brand-border px-2 py-0.5 text-[11px] text-brand-text">
            {props.children}
        </span>
    );
}

// ─── Org-Baum ─────────────────────────────────────────────────────────────────

function OrgTreeNodeView(props: {
    node: OrgUnitTreeNode;
    level: number;
    selectedNodeId: number | null;
    onSelect: (node: OrgUnitTreeNode) => void | Promise<void>;
}) {
    const { node, level, selectedNodeId, onSelect } = props;
    const [open, setOpen] = useState(true);
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const selected = selectedNodeId === node.id;

    const typeIcon: Record<string, string> = {
        TRAEGER: "🏢", EINRICHTUNG: "🏠", ABTEILUNG: "📁", TEAM: "👥", GRUPPE: "👤", STANDORT: "📍",
    };

    return (
        <div>
            <div
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                    selected
                        ? "bg-brand-teal/15 text-brand-navy font-semibold"
                        : "text-brand-text hover:bg-brand-border/40"
                }`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => onSelect(node)}
            >
                <button
                    type="button"
                    className="w-4 shrink-0 text-brand-text2 text-xs"
                    onClick={(e) => { e.stopPropagation(); if (hasChildren) setOpen((v) => !v); }}
                >
                    {hasChildren ? (open ? "−" : "+") : " "}
                </button>
                <span className="shrink-0">{typeIcon[node.type] ?? "•"}</span>
                <div className="min-w-0 flex-1">
                    <div className="truncate">{node.name}</div>
                    <div className="text-[10px] text-brand-text2">{labelForOrgUnitType(node.type)}</div>
                </div>
            </div>

            {hasChildren && open && (
                <div>
                    {node.children!.map((child) => (
                        <OrgTreeNodeView
                            key={child.id}
                            node={child}
                            level={level + 1}
                            selectedNodeId={selectedNodeId}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── UserRoleRow ──────────────────────────────────────────────────────────────

function UserRoleRow({
    user,
    canManage,
    myRoles,
    onChanged,
}: {
    user: OrgUnitUserResponse;
    canManage: boolean;
    myRoles: string[];
    onChanged: () => void;
}) {
    const [busy,         setBusy]         = useState(false);
    const [changeRoleId, setChangeRoleId] = useState<number | null>(null);
    const [newRole,      setNewRole]      = useState("");

    async function handleRemove(assignment: RoleAssignment) {
        if (!confirm(`Rolle „${labelForRole(assignment.role)}" bei ${user.displayName || user.email} entfernen?`)) return;
        setBusy(true);
        try {
            await apiFetch(`/admin/users/${user.id}/roles/${assignment.id}`, { method: "DELETE" });
            onChanged();
        } catch (e: any) {
            alert(e?.message ?? "Fehler beim Entfernen.");
        } finally {
            setBusy(false);
        }
    }

    async function handleChange(assignment: RoleAssignment) {
        if (!newRole || newRole === assignment.role) { setChangeRoleId(null); return; }
        setBusy(true);
        try {
            await apiFetch(`/admin/users/${user.id}/roles/${assignment.id}`, {
                method: "PUT",
                body: { newRole },
            });
            setChangeRoleId(null);
            onChanged();
        } catch (e: any) {
            alert(e?.message ?? "Fehler beim Ändern.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="rounded-xl border border-brand-border p-3 space-y-2">
            <div>
                <div className="text-sm font-medium text-brand-navy">{user.displayName || user.email}</div>
                <div className="text-xs text-brand-text2">{user.email}</div>
            </div>

            <div className="space-y-1.5">
                {(user.roleAssignments ?? []).map((a) => {
                    const canTouch = canManage && canAssign(myRoles, a.role);
                    const isEditing = changeRoleId === a.id;

                    return (
                        <div key={a.id} className="flex items-center gap-2 flex-wrap">
                            {isEditing ? (
                                <>
                                    <Select value={newRole} onValueChange={setNewRole}>
                                        <SelectTrigger className="h-8 w-44 text-xs">
                                            <SelectValue placeholder="Neue Rolle…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLE_OPTIONS
                                                .filter((o) => canAssign(myRoles, o.value))
                                                .map((o) => (
                                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <button
                                        disabled={busy || !newRole}
                                        onClick={() => handleChange(a)}
                                        className="text-xs px-2 py-1 rounded-lg bg-brand-teal text-white disabled:opacity-50"
                                    >
                                        Speichern
                                    </button>
                                    <button
                                        onClick={() => setChangeRoleId(null)}
                                        className="text-xs px-2 py-1 rounded-lg border border-brand-border text-brand-text2"
                                    >
                                        Abbrechen
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Badge>{labelForRole(a.role)}</Badge>
                                    {canTouch && (
                                        <>
                                            <button
                                                disabled={busy}
                                                onClick={() => { setNewRole(a.role); setChangeRoleId(a.id); }}
                                                className="text-[11px] text-brand-text2 hover:text-brand-navy underline"
                                                title="Rolle ändern"
                                            >
                                                ändern
                                            </button>
                                            <button
                                                disabled={busy}
                                                onClick={() => handleRemove(a)}
                                                className="text-[11px] text-red-500 hover:text-red-700 underline"
                                                title="Rolle entfernen"
                                            >
                                                entfernen
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Dialog: Träger anlegen ───────────────────────────────────────────────────

function CreateTraegerDialog(props: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    canManage: boolean;
    onCreated: (name: string) => void;
}) {
    const { open, onOpenChange, canManage, onCreated } = props;

    const [name,            setName]            = useState("");
    const [kurzcode,        setKurzcode]        = useState("");
    const [aktenPrefix,     setAktenPrefix]     = useState("");
    const [strasse,         setStrasse]         = useState("");
    const [hausnummer,      setHausnummer]      = useState("");
    const [plz,             setPlz]             = useState("");
    const [ort,             setOrt]             = useState("");
    const [leitung,         setLeitung]         = useState("");
    const [ansprechpartner, setAnsprechpartner] = useState("");
    const [submitting,      setSubmitting]      = useState(false);
    const [error,           setError]           = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setName(""); setKurzcode(""); setAktenPrefix("");
            setStrasse(""); setHausnummer(""); setPlz(""); setOrt("");
            setLeitung(""); setAnsprechpartner(""); setError(null);
        }
    }, [open]);

    async function submit() {
        if (!canManage || !name.trim()) return;
        setSubmitting(true); setError(null);
        try {
            await apiFetch("/admin/traeger", {
                method: "POST",
                body: {
                    name: name.trim(),
                    kurzcode:        emptyToNull(kurzcode),
                    aktenPrefix:     emptyToNull(aktenPrefix),
                    strasse:         emptyToNull(strasse),
                    hausnummer:      emptyToNull(hausnummer),
                    plz:             emptyToNull(plz),
                    ort:             emptyToNull(ort),
                    leitung:         emptyToNull(leitung),
                    ansprechpartner: emptyToNull(ansprechpartner),
                },
            });
            onCreated(name.trim());
        } catch (e: any) {
            setError(e?.message ?? "Unbekannter Fehler.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Träger anlegen</DialogTitle></DialogHeader>
                {error && <Err msg={error} />}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <Field label="Name *"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Caritas Köln" /></Field>
                        <Field label="Kurzcode"><Input value={kurzcode} onChange={(e) => setKurzcode(e.target.value)} placeholder="z. B. CAR" /></Field>
                        <Field label="Aktenpräfix"><Input value={aktenPrefix} onChange={(e) => setAktenPrefix(e.target.value)} placeholder="z. B. CARITAS" /></Field>
                    </div>

                    <div className="text-xs font-semibold text-brand-text2 pt-1">Adresse</div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Field label="Straße"><Input value={strasse} onChange={(e) => setStrasse(e.target.value)} /></Field>
                        <Field label="Hausnummer"><Input value={hausnummer} onChange={(e) => setHausnummer(e.target.value)} /></Field>
                        <Field label="PLZ"><Input value={plz} onChange={(e) => setPlz(e.target.value)} /></Field>
                        <Field label="Ort"><Input value={ort} onChange={(e) => setOrt(e.target.value)} /></Field>
                    </div>

                    <div className="text-xs font-semibold text-brand-text2 pt-1">Kontakt</div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Field label="Leitung"><Input value={leitung} onChange={(e) => setLeitung(e.target.value)} /></Field>
                        <Field label="Ansprechpartner"><Input value={ansprechpartner} onChange={(e) => setAnsprechpartner(e.target.value)} /></Field>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                        <Button disabled={!canManage || submitting || !name.trim()} onClick={submit}>
                            {submitting ? "Speichere…" : "Träger anlegen"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Dialog: Org-Einheit anlegen ──────────────────────────────────────────────

function CreateOrgUnitDialog(props: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    canManage: boolean;
    parentOrgUnitId: number | null;
    parentOrgUnitType: string | null;
    parentOrgUnitName: string;
    onCreated: (name: string) => void;
}) {
    const { open, onOpenChange, canManage, parentOrgUnitId, parentOrgUnitType, parentOrgUnitName, onCreated } = props;

    const [name,            setName]            = useState("");
    const [type,            setType]            = useState<(typeof ORG_UNIT_TYPE_OPTIONS)[number]["value"]>("TEAM");
    const [strasse,         setStrasse]         = useState("");
    const [hausnummer,      setHausnummer]      = useState("");
    const [plz,             setPlz]             = useState("");
    const [ort,             setOrt]             = useState("");
    const [leitung,         setLeitung]         = useState("");
    const [ansprechpartner, setAnsprechpartner] = useState("");
    const [submitting,      setSubmitting]      = useState(false);
    const [error,           setError]           = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setName(""); setType(suggestChildType(parentOrgUnitType));
            setStrasse(""); setHausnummer(""); setPlz(""); setOrt("");
            setLeitung(""); setAnsprechpartner(""); setError(null);
        }
    }, [open, parentOrgUnitType]);

    async function submit() {
        if (!canManage || !parentOrgUnitId || !name.trim()) return;
        setSubmitting(true); setError(null);
        try {
            await apiFetch("/org-units", {
                method: "POST",
                body: {
                    name: name.trim(), type, parentId: parentOrgUnitId,
                    strasse:         emptyToNull(strasse),
                    hausnummer:      emptyToNull(hausnummer),
                    plz:             emptyToNull(plz),
                    ort:             emptyToNull(ort),
                    leitung:         emptyToNull(leitung),
                    ansprechpartner: emptyToNull(ansprechpartner),
                },
            });
            onCreated(name.trim());
        } catch (e: any) {
            setError(e?.message ?? "Unbekannter Fehler.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Organisationseinheit anlegen</DialogTitle></DialogHeader>
                {!parentOrgUnitId && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        Bitte zuerst links eine bestehende Einheit auswählen.
                    </div>
                )}
                {error && <Err msg={error} />}
                <div className="space-y-4">
                    <div className="rounded-xl border border-brand-border bg-brand-bg/60 px-3 py-2 text-sm text-brand-text2">
                        Übergeordnete Einheit: <span className="font-semibold text-brand-text">{parentOrgUnitName || "—"}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Field label="Bezeichnung *"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
                        <Field label="Typ">
                            <Select value={type} onValueChange={(v) => setType(v as any)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {allowedChildTypes(parentOrgUnitType).map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>

                    <div className="text-xs font-semibold text-brand-text2 pt-1">Adresse (optional)</div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Field label="Straße"><Input value={strasse} onChange={(e) => setStrasse(e.target.value)} /></Field>
                        <Field label="Hausnummer"><Input value={hausnummer} onChange={(e) => setHausnummer(e.target.value)} /></Field>
                        <Field label="PLZ"><Input value={plz} onChange={(e) => setPlz(e.target.value)} /></Field>
                        <Field label="Ort"><Input value={ort} onChange={(e) => setOrt(e.target.value)} /></Field>
                    </div>

                    <div className="text-xs font-semibold text-brand-text2 pt-1">Kontakt (optional)</div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Field label="Leitung"><Input value={leitung} onChange={(e) => setLeitung(e.target.value)} /></Field>
                        <Field label="Ansprechpartner"><Input value={ansprechpartner} onChange={(e) => setAnsprechpartner(e.target.value)} /></Field>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                        <Button disabled={!canManage || submitting || !name.trim() || !parentOrgUnitId} onClick={submit}>
                            {submitting ? "Speichere…" : "Einheit anlegen"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Dialog: Org-Einheit bearbeiten ──────────────────────────────────────────

function RenameOrgUnitDialog(props: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    orgUnitId: number | null;
    currentName: string;
    canManage: boolean;
    onSaved: (name: string) => void;
}) {
    const { open, onOpenChange, orgUnitId, currentName, canManage, onSaved } = props;

    const [name,            setName]            = useState("");
    const [strasse,         setStrasse]         = useState("");
    const [hausnummer,      setHausnummer]      = useState("");
    const [plz,             setPlz]             = useState("");
    const [ort,             setOrt]             = useState("");
    const [leitung,         setLeitung]         = useState("");
    const [ansprechpartner, setAnsprechpartner] = useState("");
    const [submitting,      setSubmitting]      = useState(false);
    const [error,           setError]           = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setName(currentName);
            setStrasse(""); setHausnummer(""); setPlz(""); setOrt("");
            setLeitung(""); setAnsprechpartner(""); setError(null);
        }
    }, [open, currentName]);

    async function submit() {
        if (!orgUnitId || !name.trim()) return;
        setSubmitting(true); setError(null);
        try {
            await apiFetch(`/org-units/${orgUnitId}`, {
                method: "PUT",
                body: {
                    name: name.trim(),
                    strasse:         emptyToNull(strasse),
                    hausnummer:      emptyToNull(hausnummer),
                    plz:             emptyToNull(plz),
                    ort:             emptyToNull(ort),
                    leitung:         emptyToNull(leitung),
                    ansprechpartner: emptyToNull(ansprechpartner),
                },
            });
            onSaved(name.trim());
        } catch (e: any) {
            setError(e?.message ?? "Unbekannter Fehler.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>Einheit bearbeiten</DialogTitle></DialogHeader>
                {error && <Err msg={error} />}
                <div className="space-y-3">
                    <Field label="Bezeichnung *"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Straße"><Input value={strasse} onChange={(e) => setStrasse(e.target.value)} /></Field>
                        <Field label="Hausnummer"><Input value={hausnummer} onChange={(e) => setHausnummer(e.target.value)} /></Field>
                        <Field label="PLZ"><Input value={plz} onChange={(e) => setPlz(e.target.value)} /></Field>
                        <Field label="Ort"><Input value={ort} onChange={(e) => setOrt(e.target.value)} /></Field>
                        <Field label="Leitung"><Input value={leitung} onChange={(e) => setLeitung(e.target.value)} /></Field>
                        <Field label="Ansprechpartner"><Input value={ansprechpartner} onChange={(e) => setAnsprechpartner(e.target.value)} /></Field>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                        <Button disabled={!canManage || submitting || !name.trim()} onClick={submit}>
                            {submitting ? "Speichere…" : "Speichern"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Dialog: Mitglied zuweisen ────────────────────────────────────────────────

function AssignMembershipDialog(props: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    canManage: boolean;
    teamOrgUnitId: number | null;
    teamName: string;
    traegerUsers: UserListItem[];
    onAssigned: () => void;
}) {
    const { open, onOpenChange, canManage, teamOrgUnitId, teamName, traegerUsers, onAssigned } = props;

    const [userId,         setUserId]         = useState<string>("");
    const [membershipType, setMembershipType] = useState<(typeof TEAM_MEMBERSHIP_TYPE_OPTIONS)[number]["value"]>("MITGLIED");
    const [primary,        setPrimary]        = useState(false);
    const [submitting,     setSubmitting]     = useState(false);
    const [error,          setError]          = useState<string | null>(null);

    useEffect(() => {
        if (open) { setUserId(""); setMembershipType("MITGLIED"); setPrimary(false); setError(null); }
    }, [open]);

    async function submit() {
        if (!canManage || !teamOrgUnitId || !userId) return;
        setSubmitting(true); setError(null);
        try {
            await apiFetch<TeamMembershipResponse>("/admin/team-memberships", {
                method: "POST",
                body: { userId: Number(userId), teamOrgUnitId, membershipType, primary },
            });
            onAssigned();
        } catch (e: any) {
            setError(e?.message ?? "Unbekannter Fehler.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Mitglied dem Team zuweisen</DialogTitle></DialogHeader>
                {error && <Err msg={error} />}
                <div className="space-y-3">
                    <div className="rounded-xl border border-brand-border bg-brand-bg/60 px-3 py-2 text-sm text-brand-text2">
                        Team: <span className="font-semibold text-brand-text">{teamName || "—"}</span>
                    </div>

                    <Field label="Nutzer auswählen">
                        <Select value={userId} onValueChange={setUserId}>
                            <SelectTrigger><SelectValue placeholder="Nutzer wählen…" /></SelectTrigger>
                            <SelectContent>
                                {traegerUsers.map((u) => (
                                    <SelectItem key={u.id} value={String(u.id)}>
                                        {u.displayName || u.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Mitgliedschaft">
                        <Select value={membershipType} onValueChange={(v) => setMembershipType(v as any)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {TEAM_MEMBERSHIP_TYPE_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <label className="flex items-center gap-2 rounded-xl border border-brand-border px-3 py-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} className="accent-brand-teal" />
                        <span>Primäres Team</span>
                    </label>

                    <div className="flex justify-end gap-2 pt-1">
                        <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                        <Button disabled={!canManage || submitting || !userId} onClick={submit}>
                            {submitting ? "Speichere…" : "Zuweisen"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Dialog: Rolle zuweisen ───────────────────────────────────────────────────

function AssignRoleDialog(props: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    canManage: boolean;
    orgUnitId: number | null;
    orgUnitName: string;
    traegerUsers: UserListItem[];
    onAssigned: () => void;
}) {
    const { open, onOpenChange, canManage, orgUnitId, orgUnitName, traegerUsers, onAssigned } = props;

    const [userId,     setUserId]     = useState<string>("");
    const [role,       setRole]       = useState<(typeof ROLE_OPTIONS)[number]["value"]>("LESEN");
    const [submitting, setSubmitting] = useState(false);
    const [error,      setError]      = useState<string | null>(null);

    useEffect(() => {
        if (open) { setUserId(""); setRole("LESEN"); setError(null); }
    }, [open]);

    async function submit() {
        if (!canManage || !orgUnitId || !userId) return;
        setSubmitting(true); setError(null);
        try {
            await apiFetch(`/admin/users/${Number(userId)}/roles`, {
                method: "POST",
                body: { orgUnitId, role },
            });
            onAssigned();
        } catch (e: any) {
            setError(e?.message ?? "Unbekannter Fehler.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Rolle zuweisen</DialogTitle></DialogHeader>
                {error && <Err msg={error} />}
                <div className="space-y-3">
                    <div className="rounded-xl border border-brand-border bg-brand-bg/60 px-3 py-2 text-sm text-brand-text2">
                        Einheit: <span className="font-semibold text-brand-text">{orgUnitName || "—"}</span>
                    </div>

                    <Field label="Nutzer auswählen">
                        <Select value={userId} onValueChange={setUserId}>
                            <SelectTrigger><SelectValue placeholder="Nutzer wählen…" /></SelectTrigger>
                            <SelectContent>
                                {traegerUsers.map((u) => (
                                    <SelectItem key={u.id} value={String(u.id)}>
                                        {u.displayName || u.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Rolle">
                        <Select value={role} onValueChange={(v) => setRole(v as any)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {ROLE_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <div className="flex justify-end gap-2 pt-1">
                        <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                        <Button disabled={!canManage || submitting || !userId} onClick={submit}>
                            {submitting ? "Speichere…" : "Zuweisen"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Wizard: Neuen Mitarbeiter anlegen ────────────────────────────────────────

function CreateEmployeeWizard(props: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    defaultOrgUnitId: number | null;
    canCreate: boolean;
    contexts: AvailableContextDto[];
    orgTree: OrgUnitTreeNode[];
    onCreated: () => void;
}) {
    const { open, onOpenChange, defaultOrgUnitId, canCreate, contexts, orgTree, onCreated } = props;

    const [step,       setStep]       = useState<1 | 2 | 3 | 4>(1);
    const [submitting, setSubmitting] = useState(false);
    const [error,      setError]      = useState<string | null>(null);

    // Step 1
    const [vorname,        setVorname]        = useState("");
    const [nachname,       setNachname]       = useState("");
    const [email,          setEmail]          = useState("");
    const [initialPassword,setInitialPassword] = useState("");
    const [telefon,        setTelefon]        = useState("");
    const [kontaktEmail,   setKontaktEmail]   = useState("");
    const [strasse,        setStrasse]        = useState("");
    const [hausnummer,     setHausnummer]     = useState("");
    const [plz,            setPlz]            = useState("");
    const [ort,            setOrt]            = useState("");

    // Step 2
    const [mutterspracheCode,         setMutterspracheCode]         = useState("");
    const [bevorzugteSpracheCode,     setBevorzugteSpracheCode]     = useState("");
    const [dolmetschBedarf,           setDolmetschBedarf]           = useState<(typeof DOLMETSCH_BEDARF_OPTIONS)[number]["value"]>("UNGEKLAERT");
    const [dolmetschSpracheCode,      setDolmetschSpracheCode]      = useState("");
    const [hoerStatus,                setHoerStatus]                = useState<(typeof HOER_STATUS_OPTIONS)[number]["value"]>("UNBEKANNT");
    const [codaStatus,                setCodaStatus]                = useState<(typeof CODA_STATUS_OPTIONS)[number]["value"]>("UNBEKANNT");
    const [gebaerdenspracheCode,      setGebaerdenspracheCode]      = useState("");
    const [kommunikationsHinweise,    setKommunikationsHinweise]    = useState("");
    const [kannKinderDolmetschen,     setKannKinderDolmetschen]     = useState(false);
    const [kannBezugspersonenDolmetschen, setKannBezugspersonenDolmetschen] = useState(false);
    const [mitarbeiterHinweise,       setMitarbeiterHinweise]       = useState("");

    // Step 3
    const [orgUnitId,     setOrgUnitId]     = useState<number | null>(defaultOrgUnitId);
    const [selectedRoles, setSelectedRoles] = useState<string[]>(["FACHKRAFT"]);

    // Step 4
    const [teamAssignments, setTeamAssignments] = useState<TeamAssignment[]>([]);

    const availableTeams = useMemo(() => flattenTeamsAndGroups(orgTree), [orgTree]);

    useEffect(() => {
        if (open) {
            setStep(1);
            setError(null);
            setVorname(""); setNachname(""); setEmail(""); setInitialPassword("");
            setTelefon(""); setKontaktEmail("");
            setStrasse(""); setHausnummer(""); setPlz(""); setOrt("");
            setMutterspracheCode(""); setBevorzugteSpracheCode("");
            setDolmetschBedarf("UNGEKLAERT"); setDolmetschSpracheCode("");
            setHoerStatus("UNBEKANNT"); setCodaStatus("UNBEKANNT");
            setGebaerdenspracheCode(""); setKommunikationsHinweise("");
            setKannKinderDolmetschen(false); setKannBezugspersonenDolmetschen(false);
            setMitarbeiterHinweise("");
            setOrgUnitId(defaultOrgUnitId);
            setSelectedRoles(["FACHKRAFT"]);
            setTeamAssignments([]);
        }
    }, [open, defaultOrgUnitId]);

    function toggleRole(role: string) {
        setSelectedRoles((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
        );
    }

    function toggleTeam(teamOrgUnitId: number) {
        setTeamAssignments((prev) => {
            const exists = prev.find((t) => t.orgUnitId === teamOrgUnitId);
            if (exists) return prev.filter((t) => t.orgUnitId !== teamOrgUnitId);
            return [...prev, { orgUnitId: teamOrgUnitId, membershipType: "MITGLIED" }];
        });
    }

    function setTeamMembershipType(teamOrgUnitId: number, membershipType: string) {
        setTeamAssignments((prev) =>
            prev.map((t) => t.orgUnitId === teamOrgUnitId ? { ...t, membershipType } : t)
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
                    mutterspracheCode:    emptyToNull(mutterspracheCode),
                    bevorzugteSpracheCode: emptyToNull(bevorzugteSpracheCode),
                    dolmetschBedarf,
                    dolmetschSpracheCode: emptyToNull(dolmetschSpracheCode),
                    hoerStatus,
                    codaStatus,
                    gebaerdenspracheCode: emptyToNull(gebaerdenspracheCode),
                    kommunikationsHinweise: emptyToNull(kommunikationsHinweise),
                },
                strasse:      emptyToNull(strasse),
                hausnummer:   emptyToNull(hausnummer),
                plz:          emptyToNull(plz),
                ort:          emptyToNull(ort),
                telefon:      emptyToNull(telefon),
                kontaktEmail: emptyToNull(kontaktEmail),
                mitarbeiterFaehigkeiten: {
                    kannKinderDolmetschen,
                    kannBezugspersonenDolmetschen,
                    hinweise: emptyToNull(mitarbeiterHinweise),
                },
                defaultOrgUnitId: orgUnitId,
                roles: selectedRoles.map((role) => ({ orgUnitId: orgUnitId!, role })),
            };

            const created = await apiFetch<{ id: number } | number>("/admin/users", {
                method: "POST",
                body,
            });

            const userId = typeof created === "object" && created !== null
                ? (created as { id: number }).id
                : (created as unknown as number);

            for (const ta of teamAssignments) {
                try {
                    await apiFetch("/admin/team-memberships", {
                        method: "POST",
                        body: {
                            userId: Number(userId),
                            teamOrgUnitId: ta.orgUnitId,
                            membershipType: ta.membershipType,
                            primary: false,
                        },
                    });
                } catch {
                    // ignore – user was created successfully
                }
            }

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

                <div className="flex items-center gap-2 text-xs text-brand-text2 flex-wrap">
                    <span className={step === 1 ? "text-brand-text font-semibold" : ""}>1) Stammdaten</span>
                    <span>→</span>
                    <span className={step === 2 ? "text-brand-text font-semibold" : ""}>2) Kommunikation</span>
                    <span>→</span>
                    <span className={step === 3 ? "text-brand-text font-semibold" : ""}>3) Rollen</span>
                    <span>→</span>
                    <span className={step === 4 ? "text-brand-text font-semibold" : ""}>4) Zuordnung</span>
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
                                <Input type="password" value={initialPassword} onChange={(e) => setInitialPassword(e.target.value)} />
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
                            <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                            <Button disabled={!step1Valid} onClick={() => setStep(2)}>Weiter</Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5">
                        <div>
                            <div className="mb-2 text-sm font-medium text-brand-text">Kommunikationsprofil</div>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <Field label="Muttersprache-Code">
                                    <Input placeholder="z. B. de" value={mutterspracheCode} onChange={(e) => setMutterspracheCode(e.target.value)} />
                                </Field>
                                <Field label="Bevorzugte Sprache-Code">
                                    <Input placeholder="z. B. de" value={bevorzugteSpracheCode} onChange={(e) => setBevorzugteSpracheCode(e.target.value)} />
                                </Field>
                                <Field label="Dolmetschbedarf">
                                    <Select value={dolmetschBedarf} onValueChange={(v) => setDolmetschBedarf(v as any)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {DOLMETSCH_BEDARF_OPTIONS.map((o) => (
                                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Dolmetsch-Sprache-Code">
                                    <Input placeholder="z. B. tr" value={dolmetschSpracheCode} onChange={(e) => setDolmetschSpracheCode(e.target.value)} />
                                </Field>
                                <Field label="Hörstatus">
                                    <Select value={hoerStatus} onValueChange={(v) => setHoerStatus(v as any)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {HOER_STATUS_OPTIONS.map((o) => (
                                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="CODA-Status">
                                    <Select value={codaStatus} onValueChange={(v) => setCodaStatus(v as any)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {CODA_STATUS_OPTIONS.map((o) => (
                                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Gebärdensprache-Code">
                                    <Input placeholder="z. B. DGS" value={gebaerdenspracheCode} onChange={(e) => setGebaerdenspracheCode(e.target.value)} />
                                </Field>
                                <Field label="Kommunikationshinweise">
                                    <Input value={kommunikationsHinweise} onChange={(e) => setKommunikationsHinweise(e.target.value)} />
                                </Field>
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 text-sm font-medium text-brand-text">Mitarbeiterfähigkeiten</div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 rounded border border-brand-border px-3 py-2 text-sm">
                                    <input type="checkbox" checked={kannKinderDolmetschen} onChange={(e) => setKannKinderDolmetschen(e.target.checked)} />
                                    <span>Kann Kinder dolmetschen</span>
                                </label>
                                <label className="flex items-center gap-2 rounded border border-brand-border px-3 py-2 text-sm">
                                    <input type="checkbox" checked={kannBezugspersonenDolmetschen} onChange={(e) => setKannBezugspersonenDolmetschen(e.target.checked)} />
                                    <span>Kann Bezugspersonen dolmetschen</span>
                                </label>
                                <Field label="Hinweise">
                                    <Input value={mitarbeiterHinweise} onChange={(e) => setMitarbeiterHinweise(e.target.value)} />
                                </Field>
                            </div>
                        </div>

                        <div className="flex justify-between gap-2">
                            <Button variant="secondary" onClick={() => setStep(1)}>Zurück</Button>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                                <Button disabled={!step2Valid} onClick={() => setStep(3)}>Weiter</Button>
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
                                    <SelectTrigger><SelectValue placeholder="OrgUnit wählen" /></SelectTrigger>
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
                            <Button variant="secondary" onClick={() => setStep(2)}>Zurück</Button>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                                <Button disabled={!step3Valid} onClick={() => setStep(4)}>Weiter</Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-4">
                        <div className="text-sm font-medium text-brand-text">Teams und Gruppen zuordnen (optional)</div>

                        {availableTeams.length === 0 && (
                            <div className="text-sm text-brand-text2">
                                Keine Teams oder Gruppen in der Organisationsstruktur vorhanden.
                            </div>
                        )}

                        {availableTeams.length > 0 && (
                            <div className="space-y-2">
                                {availableTeams.map((team) => {
                                    const assignment = teamAssignments.find((t) => t.orgUnitId === team.id);
                                    const checked = !!assignment;
                                    return (
                                        <div
                                            key={team.id}
                                            className="flex items-center gap-3 rounded border border-brand-border px-3 py-2"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleTeam(team.id)}
                                                className="shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm text-brand-text truncate">{team.name}</div>
                                                <div className="text-xs text-brand-text2">{labelForOrgUnitType(team.type)}</div>
                                            </div>
                                            {checked && assignment && (
                                                <Select
                                                    value={assignment.membershipType}
                                                    onValueChange={(v) => setTeamMembershipType(team.id, v)}
                                                >
                                                    <SelectTrigger className="h-8 w-36 text-xs shrink-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TEAM_MEMBERSHIP_TYPE_OPTIONS.map((o) => (
                                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex justify-between gap-2">
                            <Button variant="secondary" onClick={() => setStep(3)}>Zurück</Button>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                                <Button disabled={!canCreate || submitting} onClick={submit}>
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

// ─── Personal Tab ─────────────────────────────────────────────────────────────

function PersonalTab() {
    const [me,       setMe]       = useState<MeResponse | null>(null);
    const [contexts, setContexts] = useState<AvailableContextDto[]>([]);
    const [users,    setUsers]    = useState<UserListItem[]>([]);
    const [orgTree,  setOrgTree]  = useState<OrgUnitTreeNode[]>([]);
    const [loading,  setLoading]  = useState(true);
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

            const ctxRes = await apiFetch<{ contexts: AvailableContextDto[] }>("/auth/contexts");
            setContexts(ctxRes.contexts ?? []);

            const orgUnitId = meRes?.orgUnitId;
            if (orgUnitId) {
                const list = await apiFetch<UserListItem[]>(`/admin/org-units/${orgUnitId}/users`);
                setUsers(list);
            } else {
                setUsers([]);
            }

            try {
                const rawTree = await apiFetch<OrgUnitTreeNode | OrgUnitTreeNode[]>("/org-units/tree");
                setOrgTree(Array.isArray(rawTree) ? rawTree : [rawTree]);
            } catch {
                setOrgTree([]);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
    }, []);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-brand-text">Mitarbeitende</div>
                        <div className="mt-1 text-xs text-brand-text2">Rollen &amp; Zugriffe</div>
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
                    orgTree={orgTree}
                    onCreated={async () => {
                        setWizardOpen(false);
                        await loadAll();
                    }}
                />
            </CardContent>
        </Card>
    );
}

// ─── Struktur Tab ─────────────────────────────────────────────────────────────

function StrukturTab() {
    const [me,               setMe]               = useState<MeResponse | null>(null);
    const [tree,             setTree]             = useState<OrgUnitTreeNode[]>([]);
    const [traegerUsers,     setTraegerUsers]     = useState<UserListItem[]>([]);
    const [selectedNodeId,   setSelectedNodeId]   = useState<number | null>(null);
    const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
    const [selectedNodeName, setSelectedNodeName] = useState("");
    const [orgUsers,         setOrgUsers]         = useState<OrgUnitUserResponse[]>([]);
    const [teamMembers,      setTeamMembers]      = useState<TeamMemberListItem[]>([]);
    const [loading,          setLoading]          = useState(true);
    const [detailsLoading,   setDetailsLoading]   = useState(false);
    const [pageMessage,      setPageMessage]      = useState<string | null>(null);
    const [pageError,        setPageError]        = useState<string | null>(null);

    const [createTraegerOpen,    setCreateTraegerOpen]    = useState(false);
    const [createOrgUnitOpen,    setCreateOrgUnitOpen]    = useState(false);
    const [renameOrgUnitOpen,    setRenameOrgUnitOpen]    = useState(false);
    const [assignMembershipOpen, setAssignMembershipOpen] = useState(false);
    const [assignRoleOpen,       setAssignRoleOpen]       = useState(false);

    const canManage = useMemo(() => {
        const roles = me?.roles ?? [];
        return roles.includes("TRAEGER_ADMIN") || roles.includes("EINRICHTUNG_ADMIN");
    }, [me]);

    const isSystemAdmin = useMemo(() => (me?.roles ?? []).includes("SYSTEM_ADMIN"), [me]);

    const selectedIsTeam        = selectedNodeType === "TEAM";
    const selectedIsTraegerRoot = selectedNodeType === "TRAEGER";
    const canCreateChildOrgUnit = canManage && !!selectedNodeId;

    async function loadAll() {
        setLoading(true);
        setPageError(null);

        try {
            const meRes = await apiFetch<MeResponse>("/auth/me");
            setMe(meRes);

            let safeTree: OrgUnitTreeNode[] = [];
            try {
                const rawTree = await apiFetch<OrgUnitTreeNode | OrgUnitTreeNode[]>("/org-units/tree");
                safeTree = Array.isArray(rawTree) ? rawTree : [rawTree];
            } catch { /* leere Struktur */ }
            setTree(safeTree);

            try {
                const users = await apiFetch<UserListItem[]>("/admin/org-units/users");
                setTraegerUsers(Array.isArray(users) ? users : []);
            } catch { /* ignorieren */ }

            const initialId = selectedNodeId ?? meRes.orgUnitId ?? findFirstUsefulNodeId(safeTree);
            if (initialId) {
                const node = findNodeById(safeTree, initialId);
                setSelectedNodeId(initialId);
                setSelectedNodeType(node?.type ?? null);
                setSelectedNodeName(node?.name ?? "");
                await loadDetails(initialId, node?.type ?? null);
            } else {
                setSelectedNodeId(null);
                setSelectedNodeType(null);
                setSelectedNodeName("");
                setOrgUsers([]);
                setTeamMembers([]);
            }
        } catch (e: any) {
            setPageError(e?.message ?? "Die Organisationsstruktur konnte nicht geladen werden.");
        } finally {
            setLoading(false);
        }
    }

    async function loadDetails(nodeId: number, nodeType: string | null) {
        setDetailsLoading(true);
        try {
            const users = await apiFetch<OrgUnitUserResponse[]>(`/admin/org-units/${nodeId}/users`);
            setOrgUsers(Array.isArray(users) ? users : []);

            if (nodeType === "TEAM") {
                const members = await apiFetch<TeamMemberListItem[]>(
                    `/admin/team-memberships/teams/${nodeId}/members`
                );
                setTeamMembers(Array.isArray(members) ? members : []);
            } else {
                setTeamMembers([]);
            }
        } catch {
            setOrgUsers([]);
            setTeamMembers([]);
        } finally {
            setDetailsLoading(false);
        }
    }

    useEffect(() => { loadAll(); }, []);

    async function onSelectNode(node: OrgUnitTreeNode) {
        setSelectedNodeId(node.id);
        setSelectedNodeType(node.type);
        setSelectedNodeName(node.name);
        setPageError(null);
        await loadDetails(node.id, node.type);
    }

    async function handleDeleteOrgUnit() {
        if (!selectedNodeId || selectedIsTraegerRoot) return;
        if (!confirm(`Einheit „${selectedNodeName}" wirklich deaktivieren?`)) return;
        try {
            await apiFetch(`/org-units/${selectedNodeId}`, { method: "DELETE" });
            setPageMessage(`„${selectedNodeName}" wurde deaktiviert.`);
            setSelectedNodeId(null);
            setSelectedNodeType(null);
            setSelectedNodeName("");
            await loadAll();
        } catch (e: any) {
            setPageError(e?.message ?? "Deaktivieren fehlgeschlagen.");
        }
    }

    async function handleRemoveMember(membershipId: number, displayName: string) {
        if (!confirm(`Mitglied „${displayName}" aus diesem Team entfernen?`)) return;
        try {
            await apiFetch(`/admin/team-memberships/${membershipId}`, { method: "DELETE" });
            setPageMessage(`„${displayName}" wurde aus dem Team entfernt.`);
            if (selectedNodeId && selectedNodeType) await loadDetails(selectedNodeId, selectedNodeType);
        } catch (e: any) {
            setPageError(e?.message ?? "Entfernen fehlgeschlagen.");
        }
    }

    return (
        <div className="space-y-4">
            {/* Aktionsleiste */}
            <div className="flex flex-wrap gap-3">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <Button
                                    onClick={() => setCreateTraegerOpen(true)}
                                    disabled={!isSystemAdmin}
                                    style={!isSystemAdmin ? { pointerEvents: "none" } : undefined}
                                >
                                    + Träger anlegen
                                </Button>
                            </span>
                        </TooltipTrigger>
                        {!isSystemAdmin && (
                            <TooltipContent>
                                Nur System-Admins können Träger anlegen
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>

                <Button
                    variant="secondary"
                    onClick={() => setCreateOrgUnitOpen(true)}
                    disabled={!canCreateChildOrgUnit}
                    title={!selectedNodeId ? "Bitte zuerst links eine Einheit auswählen" : "Einheit anlegen"}
                >
                    + Einheit unter Auswahl
                </Button>

                {selectedNodeId && !selectedIsTraegerRoot && canManage && (
                    <>
                        <Button variant="secondary" onClick={() => setRenameOrgUnitOpen(true)}>
                            Einheit bearbeiten
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleDeleteOrgUnit}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                            Deaktivieren
                        </Button>
                    </>
                )}

                {selectedIsTeam && canManage && (
                    <Button variant="secondary" onClick={() => setAssignMembershipOpen(true)}>
                        Mitglied zuweisen
                    </Button>
                )}

                {selectedNodeId && canManage && (
                    <Button variant="secondary" onClick={() => setAssignRoleOpen(true)}>
                        Rolle zuweisen
                    </Button>
                )}
            </div>

            {pageMessage && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
                    {pageMessage}
                    <button className="ml-3 text-emerald-600 underline text-xs" onClick={() => setPageMessage(null)}>OK</button>
                </div>
            )}

            {pageError && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                    {pageError}
                </div>
            )}

            {/* Haupt-Layout */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[300px_minmax(0,1fr)]">
                {/* Linke Spalte: Org-Baum */}
                <Card className="h-fit">
                    <CardHeader>
                        <div className="text-sm font-semibold text-brand-text">Organisationsstruktur</div>
                        <div className="mt-1 text-xs text-brand-text2">Träger → Einrichtung → Fachbereich → Team</div>
                    </CardHeader>
                    <CardContent>
                        {loading && <div className="text-sm text-brand-text2">Lade…</div>}

                        {!loading && tree.length === 0 && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                Noch keine Organisationsstruktur vorhanden. Lege zuerst einen Träger an.
                            </div>
                        )}

                        {!loading && tree.length > 0 && (
                            <div className="space-y-0.5">
                                {tree.map((node) => (
                                    <OrgTreeNodeView
                                        key={node.id}
                                        node={node}
                                        level={0}
                                        selectedNodeId={selectedNodeId}
                                        onSelect={onSelectNode}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Rechte Spalte: Details */}
                <Card>
                    <CardHeader>
                        <div className="text-sm font-semibold text-brand-text">
                            {selectedNodeName || "Details"}
                            {selectedNodeType && (
                                <span className="ml-2 text-xs font-normal text-brand-text2">
                                    ({labelForOrgUnitType(selectedNodeType)})
                                </span>
                            )}
                        </div>
                        {!selectedNodeId && (
                            <div className="text-xs text-brand-text2">Bitte links eine Einheit auswählen</div>
                        )}
                    </CardHeader>

                    <CardContent>
                        {detailsLoading && <div className="text-sm text-brand-text2">Lade Details…</div>}

                        {!detailsLoading && !selectedNodeId && (
                            <div className="text-sm text-brand-text2">Keine Einheit ausgewählt.</div>
                        )}

                        {!detailsLoading && selectedNodeId && (
                            <div className="space-y-6">
                                {selectedIsTeam && (
                                    <Section title="Team-Mitgliedschaften">
                                        {teamMembers.length === 0 ? (
                                            <Empty text="Keine Mitglieder." />
                                        ) : (
                                            <div className="space-y-2">
                                                {teamMembers.map((m) => (
                                                    <div
                                                        key={m.membershipId}
                                                        className="rounded-xl border border-brand-border p-3"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <div className="text-sm font-medium text-brand-text">
                                                                    {m.displayName || m.email}
                                                                </div>
                                                                <div className="text-xs text-brand-text2">{m.email}</div>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-1">
                                                                <Badge>{labelForMembershipType(m.membershipType)}</Badge>
                                                                {m.primary && <Badge>Primär</Badge>}
                                                                {!m.enabled && <Badge>Deaktiviert</Badge>}
                                                                {canManage && (
                                                                    <button
                                                                        onClick={() => handleRemoveMember(m.membershipId, m.displayName || m.email)}
                                                                        className="ml-1 rounded px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 border border-red-200"
                                                                        title="Aus Team entfernen"
                                                                    >
                                                                        Entfernen
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Section>
                                )}

                                <Section title="Nutzer mit Rollen">
                                    {orgUsers.length === 0 ? (
                                        <Empty text="Keine Nutzer mit Rollen auf dieser Einheit." />
                                    ) : (
                                        <div className="space-y-2">
                                            {orgUsers.map((u) => (
                                                <UserRoleRow
                                                    key={u.id}
                                                    user={u}
                                                    canManage={canManage}
                                                    myRoles={me?.roles ?? []}
                                                    onChanged={() => selectedNodeId && selectedNodeType && loadDetails(selectedNodeId, selectedNodeType)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </Section>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialoge */}
            <CreateTraegerDialog
                open={createTraegerOpen}
                onOpenChange={setCreateTraegerOpen}
                canManage={canManage}
                onCreated={async (name) => {
                    setCreateTraegerOpen(false);
                    setPageMessage(`Träger „${name}" wurde angelegt.`);
                    await loadAll();
                }}
            />

            <CreateOrgUnitDialog
                open={createOrgUnitOpen}
                onOpenChange={setCreateOrgUnitOpen}
                canManage={canManage}
                parentOrgUnitId={selectedNodeId}
                parentOrgUnitType={selectedNodeType}
                parentOrgUnitName={selectedNodeName}
                onCreated={async (name) => {
                    setCreateOrgUnitOpen(false);
                    setPageMessage(`„${name}" wurde angelegt.`);
                    await loadAll();
                }}
            />

            <RenameOrgUnitDialog
                open={renameOrgUnitOpen}
                onOpenChange={setRenameOrgUnitOpen}
                orgUnitId={selectedNodeId}
                currentName={selectedNodeName}
                canManage={canManage}
                onSaved={async (name) => {
                    setRenameOrgUnitOpen(false);
                    setSelectedNodeName(name);
                    setPageMessage("Einheit wurde aktualisiert.");
                    await loadAll();
                }}
            />

            <AssignMembershipDialog
                open={assignMembershipOpen}
                onOpenChange={setAssignMembershipOpen}
                canManage={canManage}
                teamOrgUnitId={selectedNodeId}
                teamName={selectedNodeName}
                traegerUsers={traegerUsers}
                onAssigned={async () => {
                    setAssignMembershipOpen(false);
                    setPageMessage("Team-Mitgliedschaft gespeichert.");
                    if (selectedNodeId && selectedNodeType)
                        await loadDetails(selectedNodeId, selectedNodeType);
                }}
            />

            <AssignRoleDialog
                open={assignRoleOpen}
                onOpenChange={setAssignRoleOpen}
                canManage={canManage}
                orgUnitId={selectedNodeId}
                orgUnitName={selectedNodeName}
                traegerUsers={traegerUsers}
                onAssigned={async () => {
                    setAssignRoleOpen(false);
                    setPageMessage("Rolle zugewiesen.");
                    if (selectedNodeId && selectedNodeType)
                        await loadDetails(selectedNodeId, selectedNodeType);
                }}
            />
        </div>
    );
}

// ─── Inner page (uses useSearchParams) ───────────────────────────────────────

function PersonalPageInner() {
    const searchParams = useSearchParams();
    const router       = useRouter();
    const activeTab    = searchParams.get("tab") === "struktur" ? "struktur" : "personal";

    function setTab(tab: string) {
        router.push(`/dashboard/mitarbeiter?tab=${tab}`, { scroll: false });
    }

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Personal & Organisation" hideSearch />
                <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 sm:px-6">
                    {/* Tab bar */}
                    <div className="mb-4 flex gap-1 border-b border-brand-border">
                        <TabBtn active={activeTab === "personal"} onClick={() => setTab("personal")}>
                            Mitarbeitende
                        </TabBtn>
                        <TabBtn active={activeTab === "struktur"} onClick={() => setTab("struktur")}>
                            Organisationsstruktur
                        </TabBtn>
                    </div>

                    {activeTab === "personal" && <PersonalTab />}
                    {activeTab === "struktur" && <StrukturTab />}
                </div>
            </div>
        </AuthGate>
    );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function PersonalPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-brand-bg flex items-center justify-center">
                <div className="text-sm text-brand-text2">Lade...</div>
            </div>
        }>
            <PersonalPageInner />
        </Suspense>
    );
}
