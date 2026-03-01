"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Plus,
    Link2,
    UserPlus,
    XCircle,
    FilePlus2,
    CalendarDays,
} from "lucide-react";

import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader as ShadDialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import type {
    AddKindBezugspersonRequest,
    CreateBezugspersonRequest,
    CreateFalleroeffnungRequest,
    EndKindBezugspersonRequest,
    FalleroeffnungResponse,
    KindBezugspersonResponse,
    KindResponse,
    SorgerechtTyp,
} from "@/lib/types";

function todayISODate(): string {
    const d = new Date();
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function safeIdFromParams(v: unknown): number | null {
    if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }
    if (Array.isArray(v) && typeof v[0] === "string") {
        const n = Number(v[0]);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

function toneForSorgerecht(s: string): "neutral" | "info" | "warning" | "danger" {
    const x = (s || "").toLowerCase();
    if (x.includes("entz")) return "danger";
    if (x.includes("ungekl")) return "warning";
    if (x.includes("allein")) return "info";
    return "neutral";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-text2">{label}</label>
            {children}
        </div>
    );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className={
                "h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none " +
                "focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25 " +
                (props.className ?? "")
            }
        />
    );
}

function errorMessage(e: unknown, fallback: string) {
    if (
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof (e as { message?: unknown }).message === "string"
    ) {
        return (e as { message: string }).message;
    }
    return fallback;
}

/**
 * Robust: Backend kann linkId statt id liefern.
 * Wir akzeptieren id | linkId | linkID.
 */
function getLinkId(l: unknown): number | null {
    const obj = l as Record<string, unknown> | null;
    if (!obj) return null;
    const raw = obj.id ?? obj.linkId ?? obj.linkID ?? null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
}

export default function KindDetailPage() {
    const router = useRouter();
    const params = useParams();
    const kindId = useMemo(() => safeIdFromParams((params as any)?.id), [params]);

    const { me } = useAuth();

    const [kind, setKind] = useState<KindResponse | null>(null);
    const [links, setLinks] = useState<KindBezugspersonResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // --- Dialog: Add Bezugsperson ---
    const [addOpen, setAddOpen] = useState(false);
    const [addMode, setAddMode] = useState<"existing" | "create">("create");

    const [existingId, setExistingId] = useState<string>("");

    const [createBp, setCreateBp] = useState<CreateBezugspersonRequest>({
        vorname: "",
        nachname: "",
        geburtsdatum: null,
        gender: "UNBEKANNT",
        telefon: null,
        kontaktEmail: null,
        strasse: null,
        hausnummer: null,
        plz: null,
        ort: null,
    });

    const [beziehung, setBeziehung] = useState<string>("MUTTER");
    const [sorgerecht, setSorgerecht] = useState<SorgerechtTyp>("UNGEKLAERT");
    const [hauptkontakt, setHauptkontakt] = useState<boolean>(true);
    const [lebtImHaushalt, setLebtImHaushalt] = useState<boolean>(true);

    // --- Dialog: End Link ---
    const [endOpen, setEndOpen] = useState(false);
    const [endLinkId, setEndLinkId] = useState<number | null>(null);
    const [validTo, setValidTo] = useState<string>(todayISODate());

    async function loadAll() {
        if (!kindId) {
            setErr("Ungültige Kind-ID in der URL.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setErr(null);

        try {
            const k = await apiFetch<KindResponse>(`/kinder/${kindId}`, { method: "GET" });
            const bps = await apiFetch<KindBezugspersonResponse[]>(`/kinder/${kindId}/bezugspersonen`, {
                method: "GET",
            });

            setKind(k);
            setLinks(Array.isArray(bps) ? bps : []);
        } catch (e: unknown) {
            setErr(errorMessage(e, "Fehler beim Laden."));
            setKind(null);
            setLinks([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kindId]);

    async function onAddBezugsperson() {
        if (!kindId) return;

        setErr(null);

        const payload: AddKindBezugspersonRequest = {
            beziehung,
            sorgerecht,
            hauptkontakt,
            lebtImHaushalt,
        };

        if (addMode === "existing") {
            const n = Number(existingId);
            if (!Number.isFinite(n) || n <= 0) {
                setErr("Bitte eine gültige Bezugsperson-ID eingeben.");
                return;
            }
            payload.existingBezugspersonId = n;
            payload.create = null;
        } else {
            if (!createBp.vorname?.trim() || !createBp.nachname?.trim()) {
                setErr("Vorname und Nachname sind erforderlich.");
                return;
            }
            payload.create = {
                ...createBp,
                vorname: String(createBp.vorname).trim(),
                nachname: String(createBp.nachname).trim(),
            };
            payload.existingBezugspersonId = null;
        }

        try {
            await apiFetch<KindBezugspersonResponse>(`/kinder/${kindId}/bezugspersonen`, {
                method: "POST",
                body: payload,
            });

            setAddOpen(false);
            setExistingId("");
            setCreateBp({
                vorname: "",
                nachname: "",
                geburtsdatum: null,
                gender: "UNBEKANNT",
                telefon: null,
                kontaktEmail: null,
                strasse: null,
                hausnummer: null,
                plz: null,
                ort: null,
            });

            await loadAll();
        } catch (e: unknown) {
            setErr(errorMessage(e, "Bezugsperson konnte nicht hinzugefügt werden."));
        }
    }

    function openEnd(linkId: number) {
        setEndLinkId(linkId);
        setValidTo(todayISODate());
        setEndOpen(true);
    }

    async function onEndLink() {
        if (!kindId) return;

        const linkId = endLinkId;
        if (!linkId || !Number.isFinite(linkId)) {
            setErr("Link-ID fehlt – Beziehung kann nicht beendet werden.");
            return;
        }

        setErr(null);

        if (!validTo) {
            setErr("Bitte ein Datum (validTo) auswählen.");
            return;
        }

        const payload: EndKindBezugspersonRequest = { validTo };

        try {
            // ✅ Netzwerk-Request muss hier sichtbar sein
            await apiFetch<KindBezugspersonResponse>(`/kinder/${kindId}/bezugspersonen/${linkId}/end`, {
                method: "PATCH",
                body: payload,
            });

            setEndOpen(false);
            setEndLinkId(null);
            await loadAll();
        } catch (e: unknown) {
            setErr(errorMessage(e, "Beziehung konnte nicht beendet werden."));
        }
    }

    async function onStartAkte() {
        if (!kindId) return;

        const einrichtungId = me?.orgUnitId;
        if (!einrichtungId) {
            setErr("Kein aktiver Einrichtungskontext gesetzt (me.orgUnitId fehlt).");
            return;
        }

        setErr(null);

        const req: CreateFalleroeffnungRequest = {
            kindId,
            einrichtungOrgUnitId: einrichtungId,
            teamOrgUnitId: null,
            titel: `Akte für ${kind?.vorname ?? ""} ${kind?.nachname ?? ""}`.trim(),
            kurzbeschreibung: "Akte gestartet aus Kind-Details.",
            anlassCodes: [],
        };

        try {
            const created = await apiFetch<FalleroeffnungResponse>("/falloeffnungen", {
                method: "POST",
                body: req,
            });

            // ✅ Dossier/Akte anlegen + Wizard direkt starten
            router.push(`/dashboard/akten/${created.id}?autostart=erstmeldung`);
        } catch (e: unknown) {
            setErr(errorMessage(e, "Akte konnte nicht gestartet werden."));
        }
    }

    return (
        <AuthGate>
            <div className="min-h-screen">
                <Topbar title="Kind" />

                <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Button variant="secondary" onClick={() => router.back()} className="w-full sm:w-auto">
                            <ArrowLeft className="h-4 w-4" />
                            Zurück
                        </Button>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Button variant="secondary" onClick={() => setAddOpen(true)} className="w-full sm:w-auto">
                                <UserPlus className="h-4 w-4" />
                                Bezugsperson hinzufügen
                            </Button>

                            <Button onClick={onStartAkte} className="w-full sm:w-auto">
                                <FilePlus2 className="h-4 w-4" />
                                Akte starten
                            </Button>
                        </div>
                    </div>

                    {err ? (
                        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm text-brand-danger">
                            {err}
                        </div>
                    ) : null}

                    <Card>
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <div className="text-sm font-semibold text-brand-text">Details</div>
                                <div className="mt-1 text-xs text-brand-text2">Stammdaten & Kontext</div>
                            </div>
                            <div className="text-xs text-brand-text2">{loading ? "lädt…" : kind ? `#${kind.id}` : "—"}</div>
                        </CardHeader>

                        <CardContent>
                            {loading ? (
                                <div className="text-sm text-brand-text2">Lade…</div>
                            ) : !kind ? (
                                <div className="text-sm text-brand-text2">Kein Kind geladen.</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-brand-border bg-white p-3">
                                        <div className="text-xs font-semibold text-brand-text2">Name</div>
                                        <div className="mt-1 text-sm font-extrabold text-brand-navy break-words">
                                            {kind.vorname} {kind.nachname}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-brand-border bg-white p-3">
                                        <div className="text-xs font-semibold text-brand-text2">Geburtsdatum</div>
                                        <div className="mt-1 text-sm font-semibold text-brand-text break-words">
                                            {kind.geburtsdatum || "—"}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-brand-border bg-white p-3">
                                        <div className="text-xs font-semibold text-brand-text2">Gender</div>
                                        <div className="mt-1 text-sm font-semibold text-brand-text break-words">{kind.gender || "—"}</div>
                                    </div>

                                    <div className="rounded-2xl border border-brand-border bg-white p-3">
                                        <div className="text-xs font-semibold text-brand-text2">Förderbedarf</div>
                                        <div className="mt-1 text-sm font-semibold text-brand-text">
                                            {kind.foerderbedarf ? "Ja" : "Nein"}
                                        </div>
                                        {kind.foerderbedarfDetails ? (
                                            <div className="mt-1 text-xs text-brand-text2 break-words">{kind.foerderbedarfDetails}</div>
                                        ) : null}
                                    </div>

                                    {kind.gesundheitsHinweise ? (
                                        <div className="sm:col-span-2 rounded-2xl border border-brand-border bg-white p-3">
                                            <div className="text-xs font-semibold text-brand-text2">Gesundheitshinweise</div>
                                            <div className="mt-1 text-sm text-brand-text break-words">{kind.gesundheitsHinweise}</div>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold text-brand-text">Bezugspersonen</div>
                                <div className="mt-1 text-xs text-brand-text2">
                                    Liste aus <code className="rounded bg-brand-bg px-1">/kinder/{kindId ?? "…"}/bezugspersonen</code>
                                </div>
                            </div>
                            <div className="text-xs text-brand-text2">{loading ? "…" : `${links.length} Einträge`}</div>
                        </CardHeader>

                        <CardContent>
                            {!links.length ? (
                                <div className="rounded-2xl border border-brand-border bg-brand-bg p-4 text-sm text-brand-text2">
                                    Noch keine Bezugspersonen verknüpft.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {links.map((l, idx) => {
                                        const linkId = getLinkId(l);
                                        const key = linkId
                                            ? `link-${linkId}`
                                            : `bp-${String((l as any)?.bezugspersonId ?? "na")}-${String((l as any)?.validFrom ?? "na")}-${idx}`;

                                        return (
                                            <div key={key} className="rounded-2xl border border-brand-border bg-white p-3">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <div className="text-sm font-extrabold text-brand-navy break-words">
                                                                {l.bezugspersonName || "—"}
                                                            </div>

                                                            <Badge tone={toneForSorgerecht(String(l.sorgerecht))}>
                                                                {String(l.sorgerecht || "UNGEKLAERT")}
                                                            </Badge>

                                                            {!l.enabled ? <Badge tone="neutral">inaktiv</Badge> : null}
                                                            {l.hauptkontakt ? <Badge tone="info">Hauptkontakt</Badge> : null}
                                                            {l.lebtImHaushalt ? <Badge tone="success">im Haushalt</Badge> : null}
                                                        </div>

                                                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-brand-text2 sm:grid-cols-3">
                                                            <div className="flex items-center gap-2">
                                                                <Link2 className="h-3.5 w-3.5" />
                                                                <span className="break-words">Beziehung: {l.beziehung || "—"}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <CalendarDays className="h-3.5 w-3.5" />
                                                                <span className="break-words">
                                  gültig: {l.validFrom || "—"} → {l.validTo || "offen"}
                                </span>
                                                            </div>
                                                            <div className="break-words">
                                                                BP-ID: {l.bezugspersonId ?? "—"} · Link-ID: {linkId ?? "—"}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 sm:pt-1">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setAddOpen(true);
                                                                setAddMode("existing");
                                                                setExistingId(l.bezugspersonId ? String(l.bezugspersonId) : "");
                                                                setBeziehung(l.beziehung || "SONSTIGE");
                                                                setSorgerecht(l.sorgerecht || "UNGEKLAERT");
                                                                setHauptkontakt(Boolean(l.hauptkontakt));
                                                                setLebtImHaushalt(Boolean(l.lebtImHaushalt));
                                                            }}
                                                            title="Als Vorlage übernehmen"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>

                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => {
                                                                const lid = getLinkId(l);
                                                                if (!lid) {
                                                                    setErr(
                                                                        "Link-ID fehlt (Backend liefert kein id/linkId) – Beziehung kann nicht beendet werden."
                                                                    );
                                                                    return;
                                                                }
                                                                openEnd(lid);
                                                            }}
                                                            disabled={!l.enabled}
                                                            title="Beziehung beenden"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Add Bezugsperson (shadcn Dialog) */}
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogContent className="max-w-2xl">
                        <ShadDialogHeader>
                            <DialogTitle>Bezugsperson hinzufügen</DialogTitle>
                        </ShadDialogHeader>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-brand-border bg-brand-bg p-3">
                                <div className="text-xs font-semibold text-brand-text2">Modus</div>
                                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                    <Button
                                        variant={addMode === "create" ? "default" : "secondary"}
                                        onClick={() => setAddMode("create")}
                                        className="w-full sm:w-auto"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Neu erstellen
                                    </Button>
                                    <Button
                                        variant={addMode === "existing" ? "default" : "secondary"}
                                        onClick={() => setAddMode("existing")}
                                        className="w-full sm:w-auto"
                                    >
                                        <Link2 className="h-4 w-4" />
                                        Existierende anhängen (ID)
                                    </Button>
                                </div>

                                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <Field label="Beziehung">
                                        <select
                                            value={beziehung}
                                            onChange={(e) => setBeziehung(e.target.value)}
                                            className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                        >
                                            {[
                                                "MUTTER",
                                                "VATER",
                                                "STIEFELTERNTEIL",
                                                "PFLEGEMUTTER",
                                                "PFLEGEVATER",
                                                "GROSSMUTTER",
                                                "GROSSVATER",
                                                "GESCHWISTER",
                                                "SONSTIGE",
                                            ].map((x) => (
                                                <option key={x} value={x}>
                                                    {x}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label="Sorgerecht">
                                        <select
                                            value={String(sorgerecht)}
                                            onChange={(e) => setSorgerecht(e.target.value as SorgerechtTyp)}
                                            className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                        >
                                            {["UNGEKLAERT", "GEMEINSAM", "ALLEIN", "ENTZOGEN"].map((x) => (
                                                <option key={x} value={x}>
                                                    {x}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    <label className="flex items-center gap-2 text-sm text-brand-text">
                                        <input
                                            type="checkbox"
                                            checked={hauptkontakt}
                                            onChange={(e) => setHauptkontakt(e.target.checked)}
                                        />
                                        Hauptkontakt
                                    </label>

                                    <label className="flex items-center gap-2 text-sm text-brand-text">
                                        <input
                                            type="checkbox"
                                            checked={lebtImHaushalt}
                                            onChange={(e) => setLebtImHaushalt(e.target.checked)}
                                        />
                                        Lebt im Haushalt
                                    </label>
                                </div>
                            </div>

                            {addMode === "existing" ? (
                                <Field label="Bezugsperson-ID">
                                    <TextInput
                                        value={existingId}
                                        onChange={(e) => setExistingId(e.target.value)}
                                        placeholder="z.B. 12"
                                        inputMode="numeric"
                                    />
                                </Field>
                            ) : (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="Vorname">
                                            <TextInput
                                                value={createBp.vorname ?? ""}
                                                onChange={(e) => setCreateBp((p) => ({ ...p, vorname: e.target.value }))}
                                                placeholder="Max"
                                            />
                                        </Field>
                                        <Field label="Nachname">
                                            <TextInput
                                                value={createBp.nachname ?? ""}
                                                onChange={(e) => setCreateBp((p) => ({ ...p, nachname: e.target.value }))}
                                                placeholder="Mustermann"
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="Geburtsdatum (optional)">
                                            <TextInput
                                                value={createBp.geburtsdatum ?? ""}
                                                onChange={(e) => setCreateBp((p) => ({ ...p, geburtsdatum: e.target.value || null }))}
                                                placeholder="YYYY-MM-DD"
                                            />
                                        </Field>

                                        <Field label="Gender (optional)">
                                            <select
                                                value={String(createBp.gender ?? "UNBEKANNT")}
                                                onChange={(e) => setCreateBp((p) => ({ ...p, gender: e.target.value }))}
                                                className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                            >
                                                {["UNBEKANNT", "MAENNLICH", "WEIBLICH", "DIVERS"].map((x) => (
                                                    <option key={x} value={x}>
                                                        {x}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="Telefon (optional)">
                                            <TextInput
                                                value={createBp.telefon ?? ""}
                                                onChange={(e) => setCreateBp((p) => ({ ...p, telefon: e.target.value || null }))}
                                                placeholder="+49 …"
                                            />
                                        </Field>
                                        <Field label="E-Mail (optional)">
                                            <TextInput
                                                value={createBp.kontaktEmail ?? ""}
                                                onChange={(e) => setCreateBp((p) => ({ ...p, kontaktEmail: e.target.value || null }))}
                                                placeholder="name@mail.de"
                                            />
                                        </Field>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="mt-2">
                            <DialogClose asChild>
                                <Button variant="secondary" className="w-full sm:w-auto">
                                    Abbrechen
                                </Button>
                            </DialogClose>

                            <Button onClick={onAddBezugsperson} className="w-full sm:w-auto">
                                Speichern
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* End Beziehung (shadcn Dialog) */}
                <Dialog
                    open={endOpen}
                    onOpenChange={(open) => {
                        setEndOpen(open);
                        if (!open) setEndLinkId(null);
                    }}
                >
                    <DialogContent className="max-w-lg">
                        <ShadDialogHeader>
                            <DialogTitle>Beziehung beenden</DialogTitle>
                        </ShadDialogHeader>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-brand-warning/25 bg-brand-warning/10 p-3 text-sm text-brand-text">
                                Du beendest den Link (validTo) – die Bezugsperson wird nicht gelöscht, nur die Verknüpfung wird inaktiv.
                            </div>

                            <Field label="Gültig bis (validTo)">
                                <TextInput
                                    value={validTo}
                                    onChange={(e) => setValidTo(e.target.value)}
                                    placeholder="YYYY-MM-DD"
                                />
                            </Field>
                        </div>

                        <DialogFooter className="mt-2">
                            <DialogClose asChild>
                                <Button variant="secondary" className="w-full sm:w-auto">
                                    Abbrechen
                                </Button>
                            </DialogClose>

                            <Button variant="destructive" onClick={onEndLink} className="w-full sm:w-auto">
                                Beenden
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AuthGate>
    );
}