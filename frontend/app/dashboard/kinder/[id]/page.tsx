"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Briefcase, Calendar, CheckCircle2, Link2, Plus, Search, Trash2, UserRound, Users } from "lucide-react";

import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

import type {
    AddKindBezugspersonRequest,
    BezugspersonBeziehung,
    BezugspersonListItem,
    BezugspersonSearchResponse,
    CreateFalleroeffnungRequest,
    FalleroeffnungResponse,
    Gender,
    KindResponse,
    SorgerechtTyp,
} from "@/lib/types";

/**
 * Lokaler Typ, damit die Seite 100% kompiliert,
 * auch wenn lib/types.ts den Export (noch) nicht hat.
 */
type EndKindBezugspersonRequest = {
    validTo: string; // "YYYY-MM-DD"
};

/**
 * Robust: API kann id oder linkId liefern (falls dein Frontend-Type gerade falsch ist).
 */
type RawKindBezugsperson = {
    id?: number;
    linkId?: number;
    bezugspersonId: number | null;
    bezugspersonName: string;
    beziehung: string;
    sorgerecht: string;
    validFrom: string | null;
    validTo: string | null;
    hauptkontakt: boolean;
    lebtImHaushalt: boolean;
    enabled: boolean;
};

type KindBezugsperson = {
    id: number;
    bezugspersonId: number | null;
    bezugspersonName: string;
    beziehung: string;
    sorgerecht: string;
    validFrom: string | null;
    validTo: string | null;
    hauptkontakt: boolean;
    lebtImHaushalt: boolean;
    enabled: boolean;
};

function getErrorMessage(e: unknown, fallback: string) {
    if (e instanceof Error) return e.message || fallback;
    if (typeof e === "string") return e || fallback;
    return fallback;
}

function fmtDate(d?: string | null) {
    return d ? d : "—";
}

function toneForLink(l: KindBezugsperson): "success" | "neutral" | "warning" | "info" {
    if (!l.enabled) return "neutral";
    if (l.hauptkontakt) return "success";
    return "info";
}

const BEZIEHUNGEN: BezugspersonBeziehung[] = [
    "MUTTER",
    "VATER",
    "SORGEBERECHTIGT",
    "PFLEGEMUTTER",
    "PFLEGEVATER",
    "STIEFMUTTER",
    "STIEFVATER",
    "GROSSMUTTER",
    "GROSSVATER",
    "SONSTIGE",
];

const SORGERECHT: SorgerechtTyp[] = [
    "UNGEKLAERT",
    "GEMEINSAM",
    "ALLEIN",
    "KEIN",
    "AMTSPFLEGSCHAFT",
    "VORMUNDSCHAFT",
];

const GENDERS: Gender[] = ["UNBEKANNT", "MAENNLICH", "WEIBLICH", "DIVERS"];

export default function KindDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { me } = useAuth();

    const kindId = Number(params?.id);

    const [kind, setKind] = useState<KindResponse | null>(null);
    const [links, setLinks] = useState<KindBezugsperson[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // Add modal
    const [addOpen, setAddOpen] = useState(false);
    const [mode, setMode] = useState<"existing" | "create">("existing");

    // existing search
    const [q, setQ] = useState("");
    const [searchRes, setSearchRes] = useState<BezugspersonListItem[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedExisting, setSelectedExisting] = useState<BezugspersonListItem | null>(null);

    // link fields
    const [beziehung, setBeziehung] = useState<BezugspersonBeziehung>("MUTTER");
    const [sorgerecht, setSorgerecht] = useState<SorgerechtTyp>("UNGEKLAERT");
    const [hauptkontakt, setHauptkontakt] = useState(false);
    const [lebtImHaushalt, setLebtImHaushalt] = useState(true);

    // create fields
    const [bpVorname, setBpVorname] = useState("");
    const [bpNachname, setBpNachname] = useState("");
    const [bpGeb, setBpGeb] = useState("");
    const [bpGender, setBpGender] = useState<Gender>("UNBEKANNT");
    const [bpTel, setBpTel] = useState("");
    const [bpMail, setBpMail] = useState("");

    // end link modal
    const [endOpen, setEndOpen] = useState(false);
    const [endLink, setEndLink] = useState<KindBezugsperson | null>(null);
    const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

    const displayName = useMemo(() => {
        if (!kind) return `Kind #${kindId || "—"}`;
        const n = `${kind.vorname ?? ""} ${kind.nachname ?? ""}`.trim();
        return n || `Kind #${kindId}`;
    }, [kind, kindId]);

    function normalizeLinks(raw: RawKindBezugsperson[]): KindBezugsperson[] {
        return (raw || [])
            .map((l) => {
                const id = typeof l.id === "number" ? l.id : typeof l.linkId === "number" ? l.linkId : NaN;
                if (!Number.isFinite(id)) return null;

                return {
                    id,
                    bezugspersonId: l.bezugspersonId ?? null,
                    bezugspersonName: l.bezugspersonName ?? "—",
                    beziehung: l.beziehung ?? "—",
                    sorgerecht: l.sorgerecht ?? "—",
                    validFrom: l.validFrom ?? null,
                    validTo: l.validTo ?? null,
                    hauptkontakt: Boolean(l.hauptkontakt),
                    lebtImHaushalt: Boolean(l.lebtImHaushalt),
                    enabled: Boolean(l.enabled),
                } as KindBezugsperson;
            })
            .filter((x): x is KindBezugsperson => x !== null);
    }

    async function loadAll() {
        if (!kindId || Number.isNaN(kindId)) return;

        setErr(null);
        setLoading(true);
        try {
            const k = await apiFetch<KindResponse>(`/kinder/${kindId}`, { method: "GET" });

            // Backend hat hier aktuell: GET /kinder/{id}/bezugspersonen (active)
            // Ich nutze deine Controller-Variante ohne Query: einfach die aktive Liste.
            const raw = await apiFetch<RawKindBezugsperson[]>(`/kinder/${kindId}/bezugspersonen`, {
                method: "GET",
            });

            setKind(k);
            setLinks(normalizeLinks(raw || []));
        } catch (e: unknown) {
            setErr(getErrorMessage(e, "Konnte Kind-Daten nicht laden."));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kindId]);

    // Search existing Bezugspersonen (wenn Modal offen & existing)
    useEffect(() => {
        if (!addOpen || mode !== "existing") return;

        let alive = true;

        async function run() {
            setSearchLoading(true);
            try {
                const res = await apiFetch<BezugspersonSearchResponse>(
                    `/bezugspersonen?q=${encodeURIComponent(q)}&size=10`,
                    { method: "GET" }
                );
                if (!alive) return;
                setSearchRes(res.items || []);
            } catch {
                if (!alive) return;
                setSearchRes([]);
            } finally {
                if (!alive) return;
                setSearchLoading(false);
            }
        }

        const t = setTimeout(run, 200);
        return () => {
            alive = false;
            clearTimeout(t);
        };
    }, [q, addOpen, mode]);

    function openAdd() {
        setErr(null);
        setAddOpen(true);
        setMode("existing");

        setQ("");
        setSearchRes([]);
        setSelectedExisting(null);

        setBeziehung("MUTTER");
        setSorgerecht("UNGEKLAERT");
        setHauptkontakt(false);
        setLebtImHaushalt(true);

        setBpVorname("");
        setBpNachname("");
        setBpGeb("");
        setBpGender("UNGEKLAERT" as unknown as Gender); // fallback falls enum mismatch
        setBpGender("UNBEKANNT");
        setBpTel("");
        setBpMail("");
    }

    async function submitAdd() {
        setErr(null);
        setLoading(true);
        try {
            const payload: AddKindBezugspersonRequest =
                mode === "existing"
                    ? {
                        existingBezugspersonId: selectedExisting?.id ?? null,
                        create: null,
                        beziehung,
                        sorgerecht,
                        validFrom: new Date().toISOString().slice(0, 10),
                        hauptkontakt,
                        lebtImHaushalt,
                    }
                    : {
                        existingBezugspersonId: null,
                        create: {
                            vorname: bpVorname.trim(),
                            nachname: bpNachname.trim(),
                            geburtsdatum: bpGeb ? bpGeb : null,
                            gender: bpGender,
                            telefon: bpTel.trim() ? bpTel.trim() : null,
                            kontaktEmail: bpMail.trim() ? bpMail.trim() : null,
                            strasse: null,
                            hausnummer: null,
                            plz: null,
                            ort: null,
                        },
                        beziehung,
                        sorgerecht,
                        validFrom: new Date().toISOString().slice(0, 10),
                        hauptkontakt,
                        lebtImHaushalt,
                    };

            if (mode === "existing" && !payload.existingBezugspersonId) {
                throw new Error("Bitte eine vorhandene Bezugsperson auswählen.");
            }
            if (mode === "create" && (!bpVorname.trim() || !bpNachname.trim())) {
                throw new Error("Vorname und Nachname sind Pflicht.");
            }

            await apiFetch(`/kinder/${kindId}/bezugspersonen`, {
                method: "POST",
                body: payload,
            });

            setAddOpen(false);
            await loadAll();
        } catch (e: unknown) {
            setErr(getErrorMessage(e, "Bezugsperson konnte nicht hinzugefügt werden."));
        } finally {
            setLoading(false);
        }
    }

    function openEnd(l: KindBezugsperson) {
        setErr(null);
        setEndLink(l);
        setEndDate(new Date().toISOString().slice(0, 10));
        setEndOpen(true);
    }

    async function submitEnd() {
        if (!endLink) return;

        setErr(null);
        setLoading(true);
        try {
            const payload: EndKindBezugspersonRequest = { validTo: endDate };

            await apiFetch(`/kinder/${kindId}/bezugspersonen/${endLink.id}/end`, {
                method: "PATCH",
                body: payload,
            });

            setEndOpen(false);
            setEndLink(null);
            await loadAll();
        } catch (e: unknown) {
            setErr(getErrorMessage(e, "Link konnte nicht beendet werden."));
        } finally {
            setLoading(false);
        }
    }

    async function startAkte() {
        setErr(null);
        setLoading(true);
        try {
            const einrichtungOrgUnitId = me?.orgUnitId;
            if (!einrichtungOrgUnitId) {
                throw new Error("Kein aktiver Einrichtungskontext gesetzt. Bitte neu einloggen / Kontext wählen.");
            }

            const body: CreateFalleroeffnungRequest = {
                kindId,
                einrichtungOrgUnitId,
                titel: `Fall für ${displayName}`,
                kurzbeschreibung: "Akte gestartet aus Kind-Detail.",
            };

            const res = await apiFetch<FalleroeffnungResponse>("/falloeffnungen", {
                method: "POST",
                body,
            });

            router.push(`/dashboard/akten/${res.id}`);
        } catch (e: unknown) {
            setErr(getErrorMessage(e, "Fall konnte nicht eröffnet werden."));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title={displayName} />

                <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-4 sm:px-6 space-y-4">
                    {err ? (
                        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                            {err}
                        </div>
                    ) : null}

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-brand-text">Stammdaten</div>
                                    <div className="mt-1 text-xs text-brand-text2">Kind #{kindId}</div>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <Button variant="secondary" className="gap-2" onClick={startAkte} disabled={loading}>
                                        <Briefcase className="h-4 w-4" />
                                        Akte starten
                                    </Button>

                                    <Button className="gap-2" onClick={openAdd} disabled={loading}>
                                        <Plus className="h-4 w-4" />
                                        Bezugsperson hinzufügen
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {loading && !kind ? <div className="text-sm text-brand-text2">Lade…</div> : null}

                                {kind ? (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-brand-border bg-white p-3">
                                            <div className="text-xs font-semibold text-brand-text2">Name</div>
                                            <div className="mt-1 text-sm font-semibold text-brand-text whitespace-normal break-words">
                                                {kind.vorname} {kind.nachname}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-brand-border bg-white p-3">
                                            <div className="text-xs font-semibold text-brand-text2">Geburtsdatum</div>
                                            <div className="mt-1 text-sm font-semibold text-brand-text flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-brand-text2" />
                                                {fmtDate(kind.geburtsdatum)}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-brand-border bg-white p-3">
                                            <div className="text-xs font-semibold text-brand-text2">Gender</div>
                                            <div className="mt-1 text-sm font-semibold text-brand-text">{kind.gender}</div>
                                        </div>

                                        <div className="rounded-2xl border border-brand-border bg-white p-3">
                                            <div className="text-xs font-semibold text-brand-text2">Förderbedarf</div>
                                            <div className="mt-1 text-sm font-semibold text-brand-text">
                                                {kind.foerderbedarf ? "Ja" : "Nein"}
                                            </div>
                                            {kind.foerderbedarf && kind.foerderbedarfDetails ? (
                                                <div className="mt-1 text-xs text-brand-text2 whitespace-normal break-words">
                                                    {kind.foerderbedarfDetails}
                                                </div>
                                            ) : null}
                                        </div>

                                        {kind.gesundheitsHinweise ? (
                                            <div className="sm:col-span-2 rounded-2xl border border-brand-border bg-white p-3">
                                                <div className="text-xs font-semibold text-brand-text2">Hinweise</div>
                                                <div className="mt-1 text-sm text-brand-text whitespace-normal break-words">
                                                    {kind.gesundheitsHinweise}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-brand-text2" />
                                    <div>
                                        <div className="text-sm font-semibold text-brand-text">Bezugspersonen</div>
                                        <div className="mt-1 text-xs text-brand-text2">{links.length} verknüpft</div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-2">
                                {links.map((l) => (
                                    <div key={l.id} className="rounded-2xl border border-brand-border bg-white p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <UserRound className="h-4 w-4 text-brand-text2" />
                                                    <div className="text-sm font-semibold text-brand-text whitespace-normal break-words">
                                                        {l.bezugspersonName}
                                                    </div>
                                                </div>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <Badge tone={toneForLink(l)}>{l.beziehung}</Badge>
                                                    <Badge tone="neutral">{l.sorgerecht}</Badge>
                                                    {l.hauptkontakt ? <Badge tone="success">Hauptkontakt</Badge> : null}
                                                    {l.lebtImHaushalt ? <Badge tone="info">Haushalt</Badge> : null}
                                                </div>

                                                <div className="mt-2 text-xs text-brand-text2">
                                                    gültig ab {fmtDate(l.validFrom)}
                                                    {l.validTo ? ` · bis ${fmtDate(l.validTo)}` : ""}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => openEnd(l)}
                                                className="grid h-10 w-10 place-items-center rounded-xl border border-brand-border bg-white text-brand-text2 hover:bg-brand-bg"
                                                aria-label="Link beenden"
                                                title="Link beenden"
                                                disabled={loading}
                                            >
                                                <Link2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {!links.length ? (
                                    <div className="rounded-2xl border border-brand-border bg-brand-bg p-4 text-sm text-brand-text2">
                                        Noch keine Bezugspersonen verknüpft.
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* ADD MODAL */}
                <Modal open={addOpen} title="Bezugsperson hinzufügen" onClose={() => setAddOpen(false)}>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <Button
                                variant={mode === "existing" ? "secondary" : "ghost"}
                                onClick={() => {
                                    setMode("existing");
                                    setSelectedExisting(null);
                                }}
                                disabled={loading}
                            >
                                Vorhanden
                            </Button>
                            <Button
                                variant={mode === "create" ? "secondary" : "ghost"}
                                onClick={() => {
                                    setMode("create");
                                    setSelectedExisting(null);
                                }}
                                disabled={loading}
                            >
                                Neu anlegen
                            </Button>
                        </div>

                        {mode === "existing" ? (
                            <div className="rounded-2xl border border-brand-border bg-white p-3">
                                <div className="text-xs font-semibold text-brand-text2 mb-2">Suchen</div>

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text2" />
                                    <input
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        placeholder="Name, E-Mail, Telefon…"
                                        className="h-10 w-full rounded-xl border border-brand-border bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                    />
                                </div>

                                <div className="mt-2 space-y-2">
                                    {searchLoading ? <div className="text-sm text-brand-text2">Suche…</div> : null}

                                    {!searchLoading && searchRes.length === 0 ? (
                                        <div className="text-sm text-brand-text2">Keine Treffer.</div>
                                    ) : null}

                                    {searchRes.map((bp) => (
                                        <button
                                            key={bp.id}
                                            onClick={() => setSelectedExisting(bp)}
                                            className={
                                                "w-full text-left rounded-xl border p-3 " +
                                                (selectedExisting?.id === bp.id
                                                    ? "border-brand-teal bg-brand-teal/10"
                                                    : "border-brand-border hover:bg-brand-bg")
                                            }
                                            disabled={loading}
                                        >
                                            <div className="text-sm font-semibold text-brand-text whitespace-normal break-words">
                                                {bp.displayName}
                                            </div>
                                            <div className="mt-0.5 text-xs text-brand-text2 whitespace-normal break-words">
                                                {bp.kontaktEmail ? bp.kontaktEmail : ""}
                                                {bp.telefon ? (bp.kontaktEmail ? " · " : "") + bp.telefon : ""}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Input label="Vorname *" value={bpVorname} onChange={(e) => setBpVorname(e.target.value)} />
                                    <Input label="Nachname *" value={bpNachname} onChange={(e) => setBpNachname(e.target.value)} />
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-xs font-semibold text-brand-text2">Geburtsdatum</div>
                                        <input
                                            type="date"
                                            value={bpGeb}
                                            onChange={(e) => setBpGeb(e.target.value)}
                                            className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-1 text-xs font-semibold text-brand-text2">Gender</div>
                                        <select
                                            value={bpGender}
                                            onChange={(e) => setBpGender(e.target.value as Gender)}
                                            className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                        >
                                            {GENDERS.map((g) => (
                                                <option key={g} value={g}>
                                                    {g}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Input label="Telefon" value={bpTel} onChange={(e) => setBpTel(e.target.value)} />
                                    <Input label="E-Mail" value={bpMail} onChange={(e) => setBpMail(e.target.value)} />
                                </div>
                            </div>
                        )}

                        {/* Link details */}
                        <div className="rounded-2xl border border-brand-border bg-white p-3 space-y-3">
                            <div className="text-xs font-semibold text-brand-text2">Verknüpfung</div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <div className="mb-1 text-xs font-semibold text-brand-text2">Beziehung</div>
                                    <select
                                        value={beziehung}
                                        onChange={(e) => setBeziehung(e.target.value as BezugspersonBeziehung)}
                                        className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                    >
                                        {BEZIEHUNGEN.map((x) => (
                                            <option key={x} value={x}>
                                                {x}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div className="mb-1 text-xs font-semibold text-brand-text2">Sorgerecht</div>
                                    <select
                                        value={sorgerecht}
                                        onChange={(e) => setSorgerecht(e.target.value as SorgerechtTyp)}
                                        className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                    >
                                        {SORGERECHT.map((x) => (
                                            <option key={x} value={x}>
                                                {x}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-brand-text">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={hauptkontakt}
                                        onChange={(e) => setHauptkontakt(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    Hauptkontakt
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={lebtImHaushalt}
                                        onChange={(e) => setLebtImHaushalt(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    lebt im Haushalt
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <Button variant="secondary" onClick={() => setAddOpen(false)} disabled={loading}>
                                Abbrechen
                            </Button>
                            <Button onClick={submitAdd} disabled={loading} className="gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Hinzufügen
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* END MODAL */}
                <Modal open={endOpen} title="Verknüpfung beenden" onClose={() => setEndOpen(false)}>
                    <div className="space-y-3">
                        <div className="rounded-2xl border border-brand-border bg-white p-3">
                            <div className="text-xs font-semibold text-brand-text2">Bezugsperson</div>
                            <div className="mt-1 text-sm font-semibold text-brand-text whitespace-normal break-words">
                                {endLink?.bezugspersonName ?? "—"}
                            </div>
                            <div className="mt-1 text-xs text-brand-text2">
                                Beziehung: {endLink?.beziehung ?? "—"} · Sorgerecht: {endLink?.sorgerecht ?? "—"}
                            </div>
                        </div>

                        <div>
                            <div className="mb-1 text-xs font-semibold text-brand-text2">Enddatum</div>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <Button variant="secondary" onClick={() => setEndOpen(false)} disabled={loading}>
                                Abbrechen
                            </Button>
                            <Button variant="danger" onClick={submitEnd} disabled={loading} className="gap-2">
                                <Trash2 className="h-4 w-4" />
                                Beenden
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AuthGate>
    );
}