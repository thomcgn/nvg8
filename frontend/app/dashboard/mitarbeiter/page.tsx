"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    name: string;
    role: string;
    lastLogin: string | null;
};

type UserAdminRow = {
    id: number;
    email: string;
    vorname: string | null;
    nachname: string | null;
    role: Role;
    lastLogin: string | null;
};

const ALL_ROLES: Role[] = [
    "ADMIN",
    "FACHKRAFT",
    "TEAMLEITUNG",
    "IEFK",
    "READ_ONLY",
    "DATENSCHUTZBEAUFTRAGTER",
];

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

export default function MitarbeiterPage() {
    const [me, setMe] = useState<Me | null>(null);
    const [rows, setRows] = useState<UserAdminRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);

    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");

    const [form, setForm] = useState({
        email: "",
        password: "",
        vorname: "",
        nachname: "",
        role: "FACHKRAFT" as Role,
    });

    const isTeamleitung = me?.role === "TEAMLEITUNG";

    const availableRoles: Role[] = useMemo(() => {
        if (isTeamleitung) return ALL_ROLES.filter((r) => r !== "ADMIN");
        return ALL_ROLES;
    }, [isTeamleitung]);

    const loadMe = async () => {
        const res = await fetch("/api/auth/me", {
            credentials: "include",
            cache: "no-store",
        });
        if (res.ok) setMe(await res.json());
    };

    const loadUsers = async () => {
        setLoading(true);
        const res = await fetch("/api/admin/users", {
            credentials: "include",
            cache: "no-store",
        });
        if (res.ok) {
            setRows(await res.json());
        } else {
            toast.error("Mitarbeiter konnten nicht geladen werden");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadMe();
        loadUsers();
    }, []);

    const createUser = async () => {
        try {
            setCreating(true);

            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    ...form,
                    email: form.email.trim(),
                }),
            });

            if (!res.ok) throw new Error();

            toast.success("Mitarbeiter angelegt");

            setOpen(false);
            setForm({
                email: "",
                password: "",
                vorname: "",
                nachname: "",
                role: "FACHKRAFT",
            });

            await loadUsers();
        } catch {
            toast.error("Mitarbeiter konnte nicht angelegt werden");
        } finally {
            setCreating(false);
        }
    };

    // ✅ Optimistic Role Update
    const updateRole = async (id: number, newRole: Role) => {
        if (isTeamleitung && newRole === "ADMIN") return;

        const previous = rows;
        const oldUser = rows.find((u) => u.id === id);
        if (!oldUser) return;

        setRows((r) =>
            r.map((u) => (u.id === id ? { ...u, role: newRole } : u))
        );
        setBusyId(id);

        try {
            const res = await fetch(`/api/admin/users/${id}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ role: newRole }),
            });

            if (!res.ok) throw new Error();

            const updated = await res.json();
            setRows((r) => r.map((u) => (u.id === id ? updated : u)));

            toast.success(`Rolle geändert: ${oldUser.role} → ${newRole}`);
        } catch {
            setRows(previous);
            toast.error("Rolle konnte nicht geändert werden");
        } finally {
            setBusyId(null);
        }
    };

    const filteredRows = useMemo(() => {
        const q = search.toLowerCase().trim();

        return rows
            .filter((u) =>
                roleFilter === "ALL" ? true : u.role === roleFilter
            )
            .filter((u) => {
                if (!q) return true;
                return (
                    `${u.vorname ?? ""} ${u.nachname ?? ""}`
                        .toLowerCase()
                        .includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    u.role.toLowerCase().includes(q)
                );
            })
            .sort((a, b) => {
                const an = `${a.nachname ?? ""} ${a.vorname ?? ""}`
                    .toLowerCase();
                const bn = `${b.nachname ?? ""} ${b.vorname ?? ""}`
                    .toLowerCase();
                return an.localeCompare(bn);
            });
    }, [rows, search, roleFilter]);

    if (loading) return <div className="p-6">Lade…</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Mitarbeiter</h1>
                    <p className="text-sm text-muted-foreground">
                        Benutzer verwalten (ADMIN & TEAMLEITUNG)
                    </p>
                </div>

                <Button onClick={() => setOpen(true)}>
                    Neuer Mitarbeiter
                </Button>
            </div>

            {/* Suche + Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                    placeholder="Suche nach Name, E-Mail oder Rolle…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="sm:w-64">
                    <Select
                        value={roleFilter}
                        onValueChange={(v) => setRoleFilter(v as any)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Rollenfilter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Alle Rollen</SelectItem>
                            {availableRoles.map((r) => (
                                <SelectItem key={r} value={r}>
                                    {r}
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
                    }}
                >
                    Zurücksetzen
                </Button>
            </div>

            {/* Tabelle */}
            <div className="rounded-lg border bg-background overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-3 text-xs font-medium text-muted-foreground border-b">
                    <div className="col-span-3">Name</div>
                    <div className="col-span-4">E-Mail</div>
                    <div className="col-span-3">Rolle</div>
                    <div className="col-span-2">Letzter Login</div>
                </div>

                {filteredRows.map((u) => (
                    <div
                        key={u.id}
                        className="grid grid-cols-12 gap-2 p-3 text-sm border-b last:border-b-0 items-center"
                    >
                        <div className="col-span-3 truncate">
                            {`${u.vorname ?? ""} ${u.nachname ?? ""}`.trim() || "–"}
                        </div>

                        <div className="col-span-4 truncate">{u.email}</div>

                        <div className="col-span-3">
                            <Select
                                value={u.role}
                                onValueChange={(v) =>
                                    updateRole(u.id, v as Role)
                                }
                                disabled={busyId === u.id}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableRoles.map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {r}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-2 truncate">
                            {formatLastLogin(u.lastLogin)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Neuen Mitarbeiter anlegen</DialogTitle>
                        <DialogDescription>
                            Rolle direkt vergeben.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Input
                            placeholder="E-Mail"
                            value={form.email}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, email: e.target.value }))
                            }
                        />
                        <Input
                            placeholder="Initiales Passwort"
                            type="password"
                            value={form.password}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, password: e.target.value }))
                            }
                        />
                        <Input
                            placeholder="Vorname"
                            value={form.vorname}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, vorname: e.target.value }))
                            }
                        />
                        <Input
                            placeholder="Nachname"
                            value={form.nachname}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, nachname: e.target.value }))
                            }
                        />

                        <Select
                            value={form.role}
                            onValueChange={(v) =>
                                setForm((f) => ({ ...f, role: v as Role }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles.map((r) => (
                                    <SelectItem key={r} value={r}>
                                        {r}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={creating}
                        >
                            Abbrechen
                        </Button>
                        <Button
                            onClick={createUser}
                            disabled={creating || !form.email || !form.password}
                        >
                            {creating ? "Anlegen…" : "Anlegen"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}