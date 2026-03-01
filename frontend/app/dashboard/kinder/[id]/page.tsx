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
    MapPin,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

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

// ---- Badge helpers ----

type Tone = "neutral" | "info" | "warning" | "danger" | "success";

function formatSorgerechtLabel(s: string | null | undefined): string {
    if (!s) return "Ungeklärt";
    const map: Record<string, string> = {
        UNGEKLAERT: "Ungeklärt",
        GEMEINSAM: "Gemeinsam",
        ALLEIN: "Allein",
        ENTZOGEN: "Entzogen",
        KEIN: "Kein",
        AMTSPFLEGSCHAFT: "Amtspflegschaft",
        VORMUNDSCHAFT: "Vormundschaft",
    };
    return map[s] ?? s.charAt(0) + s.slice(1).toLowerCase();
}

function toneForSorgerecht(s: string | null | undefined): Tone {
    switch (s) {
        case "ENTZOGEN":
            return "danger";
        case "UNGEKLAERT":
            return "warning";
        case "ALLEIN":
            return "info";
        case "GEMEINSAM":
            return "success";
        default:
            return "neutral";
    }
}

function BadgeWithLabel({
                            label,
                            tone,
                            children,
                        }: {
    label: string;
    tone: Tone;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
            <Badge tone={tone} className="w-fit">
                {children}
            </Badge>
        </div>
    );
}

// ---- Address helpers ----

function formatAddress(parts: {
    strasse?: string | null;
    hausnummer?: string | null;
    plz?: string | null;
    ort?: string | null;
}): string | null {
    const street = [parts.strasse, parts.hausnummer].filter(Boolean).join(" ");
    const city = [parts.plz, parts.ort].filter(Boolean).join(" ");
    const full = [street, city].filter(Boolean).join(", ").trim();
    return full.length ? full : null;
}

/**
 * KindAddress: sehr robust gegen verschiedene Backend-Fieldnames.
 * Falls du sicher weißt, dass es exakt strasse/hausnummer/plz/ort ist,
 * kannst du die Extraktion unten vereinfachen.
 */
function getKindAddress(kind: KindResponse | null): string | null {
    if (!kind) return null;
    const k = kind as any;

    // häufige Varianten:
    const strasse =
        k.strasse ??
        k.street ??
        k.adresseStrasse ??
        k.addressStreet ??
        k.address?.strasse ??
        k.address?.street ??
        null;

    const hausnummer =
        k.hausnummer ??
        k.houseNumber ??
        k.adresseHausnummer ??
        k.addressHouseNumber ??
        k.address?.hausnummer ??
        k.address?.houseNumber ??
        null;

    const plz =
        k.plz ??
        k.postleitzahl ??
        k.zip ??
        k.addressZip ??
        k.address?.plz ??
        k.address?.zip ??
        null;

    const ort =
        k.ort ??
        k.city ??
        k.addressCity ??
        k.address?.ort ??
        k.address?.city ??
        null;

    return formatAddress({ strasse, hausnummer, plz, ort });
}

function getBezugspersonAddress(l: KindBezugspersonResponse): string | null {
    const anyL = l as any;

    // 1) flach am Link
    const direct = formatAddress({
        strasse: anyL.strasse ?? anyL.street ?? null,
        hausnummer: anyL.hausnummer ?? anyL.houseNumber ?? null,
        plz: anyL.plz ?? anyL.postleitzahl ?? anyL.zip ?? null,
        ort: anyL.ort ?? anyL.city ?? null,
    });
    if (direct) return direct;

    // 2) nested (bezugsperson / person / bp)
    const nested = anyL.bezugsperson ?? anyL.person ?? anyL.bp ?? null;
    if (nested) {
        const nestedAddr = formatAddress({
            strasse: nested.strasse ?? nested.street ?? null,
            hausnummer: nested.hausnummer ?? nested.houseNumber ?? null,
            plz: nested.plz ?? nested.postleitzahl ?? nested.zip ?? null,
            ort: nested.ort ?? nested.city ?? null,
        });
        if (nestedAddr) return nestedAddr;
    }

    // 3) spezielle Feldnamen
    const specific = formatAddress({
        strasse: anyL.bezugspersonStrasse ?? anyL.bpStrasse ?? null,
        hausnummer: anyL.bezugspersonHausnummer ?? anyL.bpHausnummer ?? null,
        plz: anyL.bezugspersonPlz ?? anyL.bpPlz ?? null,
        ort: anyL.bezugspersonOrt ?? anyL.bpOrt ?? null,
    });
    return specific;
}

// ---- UI helpers ----

function Field({
                   label,
                   htmlFor,
                   children,
               }: {
    label: string;
    htmlFor?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1">
            <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
                {label}
            </Label>
            {children}
        </div>
    );
}

// ---- Options (UI only) ----

const BEZIEHUNG_OPTIONS: Array<{ value: string; label: string }> = [
    { value: "MUTTER", label: "Mutter" },
    { value: "VATER", label: "Vater" },
    { value: "SORGEBERECHTIGT", label: "Sorgeberechtigt" },
    { value: "PFLEGEMUTTER", label: "Pflegemutter" },
    { value: "PFLEGEVATER", label: "Pflegevater" },
    { value: "STIEFMUTTER", label: "Stiefmutter" },
    { value: "STIEFVATER", label: "Stiefvater" },
    { value: "GROSSMUTTER", label: "Großmutter" },
    { value: "GROSSVATER", label: "Großvater" },
    { value: "GESCHWISTER", label: "Geschwister" },
    { value: "SONSTIGE", label: "Sonstige" },
];

const SORGERECHT_OPTIONS: Array<{ value: SorgerechtTyp; label: string }> = [
    { value: "UNGEKLAERT", label: "Ungeklärt" },
    { value: "GEMEINSAM", label: "Gemeinsam" },
    { value: "ALLEIN", label: "Allein" },
    { value: "ENTZOGEN", label: "Entzogen" },
];

const GENDER_OPTIONS: Array<{ value: string; label: string }> = [
    { value: "UNBEKANNT", label: "Unbekannt" },
    { value: "MAENNLICH", label: "Männlich" },
    { value: "WEIBLICH", label: "Weiblich" },
    { value: "DIVERS", label: "Divers" },
];

function BezugspersonCardBody({
                                  l,
                                  idx,
                                  onTemplate,
                                  onEnd,
                                  setErr,
                              }: {
    l: KindBezugspersonResponse;
    idx: number;
    onTemplate: () => void;
    onEnd: () => void;
    setErr: (v: string) => void;
}) {
    const linkId = getLinkId(l);
    const isEnabled = Boolean((l as any)?.enabled);
    const isHaupt = Boolean((l as any)?.hauptkontakt);
    const isHaushalt = Boolean((l as any)?.lebtImHaushalt);
    const sorgerechtRaw = String((l as any)?.sorgerecht ?? "UNGEKLAERT");
    const sorgerechtLabel = formatSorgerechtLabel((l as any)?.sorgerecht);
    const addr = getBezugspersonAddress(l);

    return (
        <div className="rounded-2xl border border-border bg-card p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-col gap-2">
                        <div className="text-sm font-extrabold break-words">
                            {l.bezugspersonName || `Bezugsperson ${idx + 1}`}
                        </div>

                        <div className="flex flex-wrap items-start gap-4">
                            <BadgeWithLabel label="Sorgerecht" tone={toneForSorgerecht(sorgerechtRaw)}>
                                {sorgerechtLabel}
                            </BadgeWithLabel>

                            <BadgeWithLabel label="Status" tone={isEnabled ? "success" : "neutral"}>
                                {isEnabled ? "Aktiv" : "Inaktiv"}
                            </BadgeWithLabel>

                            <BadgeWithLabel label="Kontakt" tone={isHaupt ? "info" : "neutral"}>
                                {isHaupt ? "Hauptkontakt" : "—"}
                            </BadgeWithLabel>

                            <BadgeWithLabel label="Haushalt" tone={isHaushalt ? "success" : "neutral"}>
                                {isHaushalt ? "Im Haushalt" : "—"}
                            </BadgeWithLabel>
                        </div>

                        {addr ? (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                <span className="break-words">{addr}</span>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                <span className="break-words">—</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
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
                    <Button variant="secondary" size="sm" onClick={onTemplate} title="Als Vorlage übernehmen">
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
                            onEnd();
                        }}
                        disabled={!isEnabled}
                        title="Beziehung beenden"
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
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
            const k = await apiFetch<KindResponse>(`/kinder/${kindId}`, {
                method: "GET",
            });
            const bps = await apiFetch<KindBezugspersonResponse[]>(
                `/kinder/${kindId}/bezugspersonen`,
                { method: "GET" }
            );

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
            await apiFetch<KindBezugspersonResponse>(
                `/kinder/${kindId}/bezugspersonen/${linkId}/end`,
                { method: "PATCH", body: payload }
            );

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

            // ✅ direkt in den Wizard (Route existiert unter /dashboard/falloeffnungen/[fallId]/erstmeldung)
            router.push(`/dashboard/falloeffnungen/${created.id}/erstmeldung`);
        } catch (e: unknown) {
            setErr(errorMessage(e, "Akte konnte nicht gestartet werden."));
        }
    }

    const kindAddress = getKindAddress(kind);

    return (
        <AuthGate>
            <div className="min-h-screen bg-background text-foreground">
                <Topbar title="Kind" />

                <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                            variant="secondary"
                            onClick={() => router.back()}
                            className="w-full sm:w-auto"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Zurück
                        </Button>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Button
                                variant="secondary"
                                onClick={() => setAddOpen(true)}
                                className="w-full sm:w-auto"
                            >
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
                        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                            {err}
                        </div>
                    ) : null}

                    <Card>
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <div className="text-sm font-semibold">Details</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Stammdaten & Kontext
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {loading ? "lädt…" : kind ? `#${kind.id}` : "—"}
                            </div>
                        </CardHeader>

                        <CardContent>
                            {loading ? (
                                <div className="text-sm text-muted-foreground">Lade…</div>
                            ) : !kind ? (
                                <div className="text-sm text-muted-foreground">Kein Kind geladen.</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-border bg-card p-3">
                                        <div className="text-xs font-semibold text-muted-foreground">Name</div>
                                        <div className="mt-1 text-sm font-extrabold break-words">
                                            {kind.vorname} {kind.nachname}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-border bg-card p-3">
                                        <div className="text-xs font-semibold text-muted-foreground">
                                            Geburtsdatum
                                        </div>
                                        <div className="mt-1 text-sm font-semibold break-words">
                                            {kind.geburtsdatum || "—"}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-border bg-card p-3">
                                        <div className="text-xs font-semibold text-muted-foreground">Gender</div>
                                        <div className="mt-1 text-sm font-semibold break-words">
                                            {kind.gender || "—"}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-border bg-card p-3">
                                        <div className="text-xs font-semibold text-muted-foreground">
                                            Förderbedarf
                                        </div>
                                        <div className="mt-1 text-sm font-semibold">
                                            {kind.foerderbedarf ? "Ja" : "Nein"}
                                        </div>
                                        {kind.foerderbedarfDetails ? (
                                            <div className="mt-1 text-xs text-muted-foreground break-words">
                                                {kind.foerderbedarfDetails}
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* ✅ Kind-Adresse: immer sichtbar (wenn leer dann —) */}
                                    <div className="sm:col-span-2 rounded-2xl border border-border bg-card p-3">
                                        <div className="text-xs font-semibold text-muted-foreground">
                                            Adresse
                                        </div>
                                        <div className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span className="break-words">{kindAddress ?? "—"}</span>
                                        </div>
                                    </div>

                                    {kind.gesundheitsHinweise ? (
                                        <div className="sm:col-span-2 rounded-2xl border border-border bg-card p-3">
                                            <div className="text-xs font-semibold text-muted-foreground">
                                                Gesundheitshinweise
                                            </div>
                                            <div className="mt-1 text-sm break-words">
                                                {kind.gesundheitsHinweise}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold">Bezugspersonen</div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {loading ? "…" : `${links.length} Einträge`}
                            </div>
                        </CardHeader>

                        <CardContent>
                            {!links.length ? (
                                <div className="rounded-2xl border border-border bg-muted p-4 text-sm text-muted-foreground">
                                    Noch keine Bezugspersonen verknüpft.
                                </div>
                            ) : links.length === 1 ? (
                                <BezugspersonCardBody
                                    l={links[0]}
                                    idx={0}
                                    setErr={(v) => setErr(v)}
                                    onTemplate={() => {
                                        const l = links[0];
                                        setAddOpen(true);
                                        setAddMode("existing");
                                        setExistingId(l.bezugspersonId ? String(l.bezugspersonId) : "");
                                        setBeziehung(l.beziehung || "SONSTIGE");
                                        setSorgerecht((l.sorgerecht as SorgerechtTyp) || "UNGEKLAERT");
                                        setHauptkontakt(Boolean(l.hauptkontakt));
                                        setLebtImHaushalt(Boolean(l.lebtImHaushalt));
                                    }}
                                    onEnd={() => {
                                        const lid = getLinkId(links[0]);
                                        if (!lid) {
                                            setErr(
                                                "Link-ID fehlt (Backend liefert kein id/linkId) – Beziehung kann nicht beendet werden."
                                            );
                                            return;
                                        }
                                        openEnd(lid);
                                    }}
                                />
                            ) : (
                                <Accordion type="multiple" className="w-full">
                                    {links.map((l, idx) => {
                                        const linkId = getLinkId(l);
                                        const key = linkId
                                            ? `link-${linkId}`
                                            : `bp-${String((l as any)?.bezugspersonId ?? "na")}-${String(
                                                (l as any)?.validFrom ?? "na"
                                            )}-${idx}`;

                                        const title = l.bezugspersonName || `Bezugsperson ${idx + 1}`;
                                        const sub = [
                                            l.beziehung ? `Beziehung: ${l.beziehung}` : null,
                                            (l as any)?.sorgerecht
                                                ? `Sorgerecht: ${formatSorgerechtLabel((l as any)?.sorgerecht)}`
                                                : null,
                                        ]
                                            .filter(Boolean)
                                            .join(" · ");

                                        return (
                                            <AccordionItem key={key} value={key} className="border-b-0">
                                                <div className="rounded-2xl border border-border bg-card">
                                                    <AccordionTrigger className="px-3 py-3 hover:no-underline">
                                                        <div className="flex min-w-0 flex-col items-start text-left">
                                                            <div className="truncate text-sm font-semibold">{title}</div>
                                                            {sub ? (
                                                                <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                                                                    {sub}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </AccordionTrigger>

                                                    <AccordionContent className="px-3 pb-3">
                                                        <BezugspersonCardBody
                                                            l={l}
                                                            idx={idx}
                                                            setErr={(v) => setErr(v)}
                                                            onTemplate={() => {
                                                                setAddOpen(true);
                                                                setAddMode("existing");
                                                                setExistingId(l.bezugspersonId ? String(l.bezugspersonId) : "");
                                                                setBeziehung(l.beziehung || "SONSTIGE");
                                                                setSorgerecht((l.sorgerecht as SorgerechtTyp) || "UNGEKLAERT");
                                                                setHauptkontakt(Boolean(l.hauptkontakt));
                                                                setLebtImHaushalt(Boolean(l.lebtImHaushalt));
                                                            }}
                                                            onEnd={() => {
                                                                const lid = getLinkId(l);
                                                                if (!lid) {
                                                                    setErr(
                                                                        "Link-ID fehlt (Backend liefert kein id/linkId) – Beziehung kann nicht beendet werden."
                                                                    );
                                                                    return;
                                                                }
                                                                openEnd(lid);
                                                            }}
                                                        />
                                                    </AccordionContent>
                                                </div>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
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
                            <div className="rounded-2xl border border-border bg-muted p-3">
                                <div className="text-xs font-semibold text-muted-foreground">Modus</div>
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

                                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Field label="Beziehung">
                                        <Select value={beziehung} onValueChange={setBeziehung}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Bitte wählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BEZIEHUNG_OPTIONS.map((o) => (
                                                    <SelectItem key={o.value} value={o.value}>
                                                        {o.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    <Field label="Sorgerecht">
                                        <Select
                                            value={String(sorgerecht)}
                                            onValueChange={(v) => setSorgerecht(v as SorgerechtTyp)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Bitte wählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SORGERECHT_OPTIONS.map((o) => (
                                                    <SelectItem key={String(o.value)} value={String(o.value)}>
                                                        {o.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    <div className="flex items-center gap-2 pt-1">
                                        <Checkbox
                                            id="bp-hauptkontakt"
                                            checked={hauptkontakt}
                                            onCheckedChange={(v) => setHauptkontakt(Boolean(v))}
                                        />
                                        <Label htmlFor="bp-hauptkontakt" className="text-sm">
                                            Hauptkontakt
                                        </Label>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <Checkbox
                                            id="bp-haushalt"
                                            checked={lebtImHaushalt}
                                            onCheckedChange={(v) => setLebtImHaushalt(Boolean(v))}
                                        />
                                        <Label htmlFor="bp-haushalt" className="text-sm">
                                            Lebt im Haushalt
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            {addMode === "existing" ? (
                                <Field label="Bezugsperson-ID" htmlFor="existingId">
                                    <Input
                                        id="existingId"
                                        value={existingId}
                                        onChange={(e) => setExistingId(e.target.value)}
                                        placeholder="z.B. 12"
                                        inputMode="numeric"
                                    />
                                </Field>
                            ) : (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="Vorname" htmlFor="bp-vorname">
                                            <Input
                                                id="bp-vorname"
                                                value={createBp.vorname ?? ""}
                                                onChange={(e) => setCreateBp((p) => ({ ...p, vorname: e.target.value }))}
                                                placeholder="Max"
                                            />
                                        </Field>
                                        <Field label="Nachname" htmlFor="bp-nachname">
                                            <Input
                                                id="bp-nachname"
                                                value={createBp.nachname ?? ""}
                                                onChange={(e) =>
                                                    setCreateBp((p) => ({
                                                        ...p,
                                                        nachname: e.target.value,
                                                    }))
                                                }
                                                placeholder="Mustermann"
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="Geburtsdatum (optional)" htmlFor="bp-geb">
                                            <Input
                                                id="bp-geb"
                                                type="date"
                                                value={createBp.geburtsdatum ?? ""}
                                                onChange={(e) =>
                                                    setCreateBp((p) => ({
                                                        ...p,
                                                        geburtsdatum: e.target.value || null,
                                                    }))
                                                }
                                            />
                                        </Field>

                                        <Field label="Gender (optional)">
                                            <Select
                                                value={String(createBp.gender ?? "UNBEKANNT")}
                                                onValueChange={(v) => setCreateBp((p) => ({ ...p, gender: v as any }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Bitte wählen" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {GENDER_OPTIONS.map((o) => (
                                                        <SelectItem key={o.value} value={o.value}>
                                                            {o.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="Telefon (optional)" htmlFor="bp-telefon">
                                            <Input
                                                id="bp-telefon"
                                                value={createBp.telefon ?? ""}
                                                onChange={(e) =>
                                                    setCreateBp((p) => ({
                                                        ...p,
                                                        telefon: e.target.value || null,
                                                    }))
                                                }
                                                placeholder="+49 …"
                                            />
                                        </Field>
                                        <Field label="E-Mail (optional)" htmlFor="bp-email">
                                            <Input
                                                id="bp-email"
                                                value={createBp.kontaktEmail ?? ""}
                                                onChange={(e) =>
                                                    setCreateBp((p) => ({
                                                        ...p,
                                                        kontaktEmail: e.target.value || null,
                                                    }))
                                                }
                                                placeholder="name@mail.de"
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="Straße (optional)" htmlFor="bp-str">
                                            <Input
                                                id="bp-str"
                                                value={createBp.strasse ?? ""}
                                                onChange={(e) =>
                                                    setCreateBp((p) => ({
                                                        ...p,
                                                        strasse: e.target.value || null,
                                                    }))
                                                }
                                            />
                                        </Field>
                                        <Field label="Hausnr. (optional)" htmlFor="bp-hnr">
                                            <Input
                                                id="bp-hnr"
                                                value={createBp.hausnummer ?? ""}
                                                onChange={(e) =>
                                                    setCreateBp((p) => ({
                                                        ...p,
                                                        hausnummer: e.target.value || null,
                                                    }))
                                                }
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="PLZ (optional)" htmlFor="bp-plz">
                                            <Input
                                                id="bp-plz"
                                                value={createBp.plz ?? ""}
                                                onChange={(e) =>
                                                    setCreateBp((p) => ({
                                                        ...p,
                                                        plz: e.target.value || null,
                                                    }))
                                                }
                                            />
                                        </Field>
                                        <Field label="Ort (optional)" htmlFor="bp-ort">
                                            <Input
                                                id="bp-ort"
                                                value={createBp.ort ?? ""}
                                                onChange={(e) =>
                                                    setCreateBp((p) => ({
                                                        ...p,
                                                        ort: e.target.value || null,
                                                    }))
                                                }
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
                            <div className="rounded-2xl border border-border bg-muted p-3 text-sm">
                                Du beendest den Link (gültig bis) – die Bezugsperson wird nicht gelöscht,
                                nur die Verknüpfung wird inaktiv.
                            </div>

                            <Field label="Gültig bis (validTo)" htmlFor="validTo">
                                <Input id="validTo" type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
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