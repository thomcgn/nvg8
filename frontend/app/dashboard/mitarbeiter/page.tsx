"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Shield, User as UserIcon, Lock, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import type { Role } from "@/app/auth/rbac";

type Me = {
    id: number;
    email: string;
    name: string;
    role: Role;
    lastLogin: string | null;
};

type Team = {
    id: number;
    name: string;
};

type UserAdminRow = {
    id: number;
    email: string;
    vorname: string | null;
    nachname: string | null;
    role: Role;
    lastLogin: string | null;
    teams: Team[]; // ✅ neu
};

const ALL_ROLES: Role[] = [
    "ADMIN",
    "TEAMLEITUNG",
    "IEFK",
    "FACHKRAFT",
    "READ_ONLY",
    "DATENSCHUTZBEAUFTRAGTER",
];

const ROLE_RANK: Record<Role, number> = {
    DATENSCHUTZBEAUFTRAGTER: 0,
    READ_ONLY: 1,
    FACHKRAFT: 2,
    IEFK: 3,
    TEAMLEITUNG: 4,
    ADMIN: 5,
};
const rank = (r: Role) => ROLE_RANK[r];

function canChangeRole(params: {
    actor: Role;
    target: Role;
    next: Role;
    isSelf: boolean;
    adminsLeftAfter: number;
}): { allowed: boolean; reason?: string } {
    const { actor, target, next, isSelf, adminsLeftAfter } = params;

    if (isSelf) return { allowed: false, reason: "Eigene Rolle kann nicht geändert werden." };

    if (rank(target) > rank(actor)) {
        return { allowed: false, reason: "Du darfst keine höhergestellte Rolle ändern." };
    }

    if (rank(next) > rank(actor)) {
        return { allowed: false, reason: "Du darfst niemanden über dein eigenes Level promoten." };
    }

    if (target === "ADMIN" && actor !== "ADMIN") {
        return { allowed: false, reason: "ADMIN kann nur von ADMIN geändert werden." };
    }

    if (target === "ADMIN" && next !== "ADMIN" && adminsLeftAfter < 1) {
        return { allowed: false, reason: "Es muss mindestens ein ADMIN im System bleiben." };
    }

    return { allowed: true };
}

function formatLastLogin(v: string | null) {
    if (!v) return "–";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return (
        d.toLocaleDateString("de-DE", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }) +
        " " +
        d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    );
}

function roleBadgeVariant(role: Role): "default" | "secondary" | "outline" | "destructive" {
    switch (role) {
        case "ADMIN":
            return "destructive";
        case "TEAMLEITUNG":
            return "default";
        case "IEFK":
        case "FACHKRAFT":
            return "secondary";
        default:
            return "outline";
    }
}

function RoleBadge({ role }: { role: Role }) {
    return (
        <Badge variant={roleBadgeVariant(role)} className="gap-1">
            {role === "ADMIN" ? <Shield className="h-3.5 w-3.5" /> : null}
            <span>{role}</span>
        </Badge>
    );
}

function TeamBadge({ name }: { name: string }) {
    return (
        <Badge variant="outline" className="gap-1">
            <Users className="h-3.5 w-3.5" />
            <span className="truncate">{name}</span>
        </Badge>
    );
}

async function readErrorMessage(res: Response): Promise<string | null> {
    try {
        const data = await res.json();
        return data?.message || data?.error || data?.details || null;
    } catch {
        return null;
    }
}

export default function MitarbeiterPage() {
    const [me, setMe] = useState<Me | null>(null);
    const [rows, setRows] = useState<UserAdminRow[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    const [busyId, setBusyId] = useState<number | null>(null);

    // Create user dialog (nur privilegiert)
    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);

    // Team assign dialog
    const [openTeams, setOpenTeams] = useState(false);
    const [teamEditUser, setTeamEditUser] = useState<UserAdminRow | null>(null);
    const [teamSelection, setTeamSelection] = useState<number[]>([]);
    const [savingTeams, setSavingTeams] = useState(false);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
    const [teamFilter, setTeamFilter] = useState<number | "ALL">("ALL");

    const [form, setForm] = useState({
        email: "",
        password: "",
        vorname: "",
        nachname: "",
        role: "FACHKRAFT" as Role,
    });

    const isPrivileged = me?.role === "ADMIN" || me?.role === "TEAMLEITUNG";

    const loadMe = async () => {
        const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        if (res.ok) setMe(await res.json());
    };

    const loadUsers = async () => {
        const res = await fetch("/api/admin/users", { credentials: "include", cache: "no-store" });
        if (res.ok) setRows(await res.json());
        else toast.error("Mitarbeiter konnten nicht geladen werden");
    };

    const loadTeams = async () => {
        const res = await fetch("/api/admin/teams", { credentials: "include", cache: "no-store" });
        if (res.ok) setTeams(await res.json());
        else toast.error("Teams konnten nicht geladen werden");
    };

    const loadAll = async () => {
        setLoading(true);
        await Promise.all([loadMe(), loadUsers(), loadTeams()]);
        setLoading(false);
    };

    useEffect(() => {
        loadAll();
    }, []);

    const adminCount = useMemo(() => rows.filter((u) => u.role === "ADMIN").length, [rows]);

    const roleOptionsForUser = (u: UserAdminRow) => {
        if (!me) return [] as Array<{ role: Role; allowed: boolean; reason?: string }>;

        const opts = ALL_ROLES.map((candidate) => {
            const adminsLeftAfter = u.role === "ADMIN" && candidate !== "ADMIN" ? adminCount - 1 : adminCount;

            const d = canChangeRole({
                actor: me.role,
                target: u.role,
                next: candidate,
                isSelf: me.id === u.id,
                adminsLeftAfter,
            });

            return { role: candidate, allowed: d.allowed, reason: d.reason };
        });

        return opts.sort((a, b) => {
            if (a.allowed !== b.allowed) return a.allowed ? -1 : 1;
            const rk = rank(b.role) - rank(a.role);
            if (rk !== 0) return rk;
            return a.role.localeCompare(b.role);
        });
    };

    const createUser = async () => {
        if (!isPrivileged) return;

        try {
            setCreating(true);
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ ...form, email: form.email.trim() }),
            });

            if (!res.ok) {
                const msg = await readErrorMessage(res);
                throw new Error(msg ?? "Mitarbeiter konnte nicht angelegt werden");
            }

            toast.success("Mitarbeiter angelegt");
            setOpenCreate(false);
            setForm({ email: "", password: "", vorname: "", nachname: "", role: "FACHKRAFT" });
            await loadUsers();
        } catch (e: any) {
            toast.error(e?.message ?? "Mitarbeiter konnte nicht angelegt werden");
        } finally {
            setCreating(false);
        }
    };

    const updateRole = async (id: number, newRole: Role) => {
        if (!me || !isPrivileged) return;

        const oldUser = rows.find((u) => u.id === id);
        if (!oldUser) return;

        const adminsLeftAfter = oldUser.role === "ADMIN" && newRole !== "ADMIN" ? adminCount - 1 : adminCount;

        const decision = canChangeRole({
            actor: me.role,
            target: oldUser.role,
            next: newRole,
            isSelf: me.id === id,
            adminsLeftAfter,
        });

        if (!decision.allowed) {
            toast.error(decision.reason ?? "Nicht erlaubt");
            return;
        }

        const previous = rows;
        setRows((r) => r.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
        setBusyId(id);

        try {
            const res = await fetch(`/api/admin/users/${id}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ role: newRole }),
            });

            if (!res.ok) {
                const msg = await readErrorMessage(res);
                throw new Error(msg ?? "Rolle konnte nicht geändert werden");
            }

            const updated = await res.json();
            setRows((r) => r.map((u) => (u.id === id ? updated : u)));
            toast.success(`Rolle geändert: ${oldUser.role} → ${newRole}`);
        } catch (e: any) {
            setRows(previous);
            toast.error(e?.message ?? "Rolle konnte nicht geändert werden");
        } finally {
            setBusyId(null);
        }
    };

    // ✅ Teams bearbeiten öffnen
    const openTeamDialog = (u: UserAdminRow) => {
        setTeamEditUser(u);
        setTeamSelection((u.teams ?? []).map((t) => t.id));
        setOpenTeams(true);
    };

    // ✅ Teams speichern
    const saveTeams = async () => {
        if (!isPrivileged || !teamEditUser) return;

        try {
            setSavingTeams(true);
            const res = await fetch(`/api/admin/users/${teamEditUser.id}/teams`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ teamIds: teamSelection }),
            });

            if (!res.ok) {
                const msg = await readErrorMessage(res);
                throw new Error(msg ?? "Teams konnten nicht gespeichert werden");
            }

            const updated = await res.json();
            setRows((r) => r.map((u) => (u.id === updated.id ? updated : u)));
            toast.success("Teams gespeichert");
            setOpenTeams(false);
            setTeamEditUser(null);
        } catch (e: any) {
            toast.error(e?.message ?? "Teams konnten nicht gespeichert werden");
        } finally {
            setSavingTeams(false);
        }
    };

    const filteredRows = useMemo(() => {
        const q = search.toLowerCase().trim();

        return rows
            .filter((u) => (roleFilter === "ALL" ? true : u.role === roleFilter))
            .filter((u) => {
                if (teamFilter === "ALL") return true;
                return (u.teams ?? []).some((t) => t.id === teamFilter);
            })
            .filter((u) => {
                if (!q) return true;
                const teamStr = (u.teams ?? []).map((t) => t.name).join(" ").toLowerCase();
                return (
                    `${u.vorname ?? ""} ${u.nachname ?? ""}`.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    u.role.toLowerCase().includes(q) ||
                    teamStr.includes(q)
                );
            })
            .sort((a, b) => {
                const an = `${a.nachname ?? ""} ${a.vorname ?? ""}`.toLowerCase();
                const bn = `${b.nachname ?? ""} ${b.vorname ?? ""}`.toLowerCase();
                return an.localeCompare(bn);
            });
    }, [rows, search, roleFilter, teamFilter]);

    if (loading) return <div className="p-6">Lade…</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Mitarbeiter</h1>
                    <p className="text-sm text-muted-foreground">
                        {isPrivileged
                            ? "Benutzer verwalten (Rollen & Teams)"
                            : "Übersicht (Teams & Rollen nur lesend)"}
                    </p>
                </div>

                {isPrivileged ? (
                    <Button onClick={() => setOpenCreate(true)}>Neuer Mitarbeiter</Button>
                ) : null}
            </div>

            {!isPrivileged ? (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                    Du bist mit <span className="font-medium text-foreground">{me?.role ?? "—"}</span>{" "}
                    eingeloggt. Änderungen (Rollen/Teams) sind nur für{" "}
                    <span className="font-medium text-foreground">ADMIN</span> und{" "}
                    <span className="font-medium text-foreground">TEAMLEITUNG</span> möglich.
                </div>
            ) : null}

            {/* Suche + Filter */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <Input
                    placeholder="Suche nach Name, E-Mail, Rolle oder Team…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="lg:w-56">
                    <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Rollenfilter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Alle Rollen</SelectItem>
                            {ALL_ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                    {r}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="lg:w-56">
                    <Select value={String(teamFilter)} onValueChange={(v) => setTeamFilter(v === "ALL" ? "ALL" : Number(v))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Teamfilter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Alle Teams</SelectItem>
                            {teams.map((t) => (
                                <SelectItem key={t.id} value={String(t.id)}>
                                    {t.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    variant="outline"
                    onClick={() => {
                        setSearch("");
                        setRoleFilter("ALL");
                        setTeamFilter("ALL");
                    }}
                >
                    Zurücksetzen
                </Button>
            </div>

            {/* Tabelle */}
            <div className="rounded-lg border bg-background overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-3 text-xs font-medium text-muted-foreground border-b">
                    <div className="col-span-3">Name</div>
                    <div className="col-span-3">E-Mail</div>
                    <div className="col-span-2">Rolle</div>
                    <div className="col-span-3">Teams</div>
                    <div className="col-span-1">Letzter Login</div>
                </div>

                {filteredRows.map((u) => {
                    const isSelf = me?.id === u.id;
                    const options = roleOptionsForUser(u);
                    const canActuallyChangeRole =
                        !!me && isPrivileged && !isSelf && options.some((o) => o.allowed && o.role !== u.role);

                    const lockReason = (() => {
                        if (!me) return "Keine Berechtigung.";
                        if (isSelf) return "Eigene Rolle kann nicht geändert werden.";
                        const d = canChangeRole({
                            actor: me.role,
                            target: u.role,
                            next: u.role,
                            isSelf: false,
                            adminsLeftAfter: adminCount,
                        });
                        return d.reason ?? "Keine Berechtigung.";
                    })();

                    return (
                        <div
                            key={u.id}
                            className="grid grid-cols-12 gap-2 p-3 text-sm border-b last:border-b-0 items-center"
                        >
                            {/* Name */}
                            <div className="col-span-3 truncate flex items-center gap-2 min-w-0">
                <span className="truncate">
                  {`${u.vorname ?? ""} ${u.nachname ?? ""}`.trim() || "–"}
                </span>
                                {isSelf ? (
                                    <Badge variant="outline" className="gap-1 shrink-0">
                                        <UserIcon className="h-3.5 w-3.5" />
                                        Du
                                    </Badge>
                                ) : null}
                            </div>

                            {/* Email */}
                            <div className="col-span-3 truncate min-w-0">{u.email}</div>

                            {/* Role */}
                            <div className="col-span-2 min-w-0">
                                {!isPrivileged ? (
                                    <RoleBadge role={u.role} />
                                ) : isSelf ? (
                                    <div className="flex items-center gap-2 min-w-0">
                                        <RoleBadge role={u.role} />
                                        <span className="text-xs text-muted-foreground">nicht änderbar</span>
                                    </div>
                                ) : canActuallyChangeRole ? (
                                    <div className="min-w-0">
                                        <Select
                                            value={u.role}
                                            onValueChange={(v) => updateRole(u.id, v as Role)}
                                            disabled={busyId === u.id}
                                        >
                                            <SelectTrigger className="h-9 w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.map((o) => (
                                                    <SelectItem key={o.role} value={o.role} disabled={!o.allowed}>
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2">
                                  {o.role === "ADMIN" ? <Shield className="h-4 w-4" /> : null}
                                    <span>{o.role}</span>
                                </span>

                                                                {!o.allowed ? (
                                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                    <Lock className="h-3.5 w-3.5" />
                                    <span className="text-xs">gesperrt</span>
                                  </span>
                                                                ) : null}
                                                            </div>

                                                            {!o.allowed && o.reason ? (
                                                                <div className="text-xs text-muted-foreground">{o.reason}</div>
                                                            ) : null}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <RoleBadge role={u.role} />
                                        <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                                            <Lock className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{lockReason}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Teams */}
                            <div className="col-span-3 min-w-0">
                                <div className="flex flex-wrap gap-1.5 min-w-0">
                                    {(u.teams ?? []).length ? (
                                        (u.teams ?? []).map((t) => <TeamBadge key={t.id} name={t.name} />)
                                    ) : (
                                        <span className="text-xs text-muted-foreground">–</span>
                                    )}
                                </div>

                                {isPrivileged ? (
                                    <div className="mt-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openTeamDialog(u)}
                                            className="h-8"
                                        >
                                            Teams bearbeiten
                                        </Button>
                                    </div>
                                ) : null}
                            </div>

                            {/* Last login */}
                            <div className="col-span-1 truncate min-w-0 text-xs">
                                {formatLastLogin(u.lastLogin)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Dialog: Create user (nur privilegiert) */}
            {isPrivileged ? (
                <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Neuen Mitarbeiter anlegen</DialogTitle>
                            <DialogDescription>Rolle direkt vergeben.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3">
                            <Input
                                placeholder="E-Mail"
                                value={form.email}
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            />
                            <Input
                                placeholder="Initiales Passwort"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                            />
                            <Input
                                placeholder="Vorname"
                                value={form.vorname}
                                onChange={(e) => setForm((f) => ({ ...f, vorname: e.target.value }))}
                            />
                            <Input
                                placeholder="Nachname"
                                value={form.nachname}
                                onChange={(e) => setForm((f) => ({ ...f, nachname: e.target.value }))}
                            />

                            <Select
                                value={form.role}
                                onValueChange={(v) => setForm((f) => ({ ...f, role: v as Role }))}
                                disabled={!me}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    {me
                                        ? ALL_ROLES
                                            .map((r) => ({ role: r, allowed: rank(r) <= rank(me.role) }))
                                            .sort((a, b) => {
                                                if (a.allowed !== b.allowed) return a.allowed ? -1 : 1;
                                                return rank(b.role) - rank(a.role);
                                            })
                                            .map(({ role, allowed }) => (
                                                <SelectItem key={role} value={role} disabled={!allowed}>
                                                    <div className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-2">
                                {role === "ADMIN" ? <Shield className="h-4 w-4" /> : null}
                                  <span>{role}</span>
                              </span>
                                                        {!allowed ? (
                                                            <span className="flex items-center gap-1 text-muted-foreground">
                                  <Lock className="h-3.5 w-3.5" />
                                  <span className="text-xs">gesperrt</span>
                                </span>
                                                        ) : null}
                                                    </div>
                                                </SelectItem>
                                            ))
                                        : null}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={creating}>
                                Abbrechen
                            </Button>
                            <Button onClick={createUser} disabled={creating || !form.email || !form.password}>
                                {creating ? "Anlegen…" : "Anlegen"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            ) : null}

            {/* Dialog: Teams bearbeiten */}
            {isPrivileged ? (
                <Dialog
                    open={openTeams}
                    onOpenChange={(v) => {
                        setOpenTeams(v);
                        if (!v) {
                            setTeamEditUser(null);
                            setTeamSelection([]);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Teams zuordnen</DialogTitle>
                            <DialogDescription>
                                {teamEditUser
                                    ? `Teams für ${teamEditUser.vorname ?? ""} ${teamEditUser.nachname ?? ""}`.trim()
                                    : "Teams auswählen"}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                                Mehrfachauswahl möglich.
                            </div>

                            <ScrollArea className="h-56 rounded-md border p-2">
                                <div className="space-y-2">
                                    {teams.map((t) => {
                                        const checked = teamSelection.includes(t.id);
                                        return (
                                            <label
                                                key={t.id}
                                                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer"
                                            >
                                                <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={(v) => {
                                                        const isOn = v === true;
                                                        setTeamSelection((prev) => {
                                                            if (isOn) return prev.includes(t.id) ? prev : [...prev, t.id];
                                                            return prev.filter((id) => id !== t.id);
                                                        });
                                                    }}
                                                />
                                                <span className="text-sm">{t.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setOpenTeams(false)}
                                disabled={savingTeams}
                            >
                                Abbrechen
                            </Button>
                            <Button onClick={saveTeams} disabled={savingTeams}>
                                {savingTeams ? "Speichern…" : "Speichern"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            ) : null}
        </div>
    );
}
