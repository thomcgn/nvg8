"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api";
import type { FalleroeffnungResponse } from "@/lib/types";
import {
    meldungApi,
    type MeldungListItemResponse,
    type MeldungResponse,
} from "@/lib/meldungApi";
import {
    FileText,
    RefreshCw,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Eye,
    CopyPlus,
    Wrench,
    AlertTriangle,
} from "lucide-react";

/* =========================================================
   Behörden-modern UI + robuste Params + klare Fachlogik
   - nutzt brand-* Tokens (wie in deinem anderen Screen)
   - robustes Param-Mapping (fallId / id / falloeffnungId)
   - Buttons: "Entwurf öffnen" / "Ansehen" / "Korrigieren" / "Neue Meldung"
   - Blockiert "Korrigieren" & "Neue Meldung", wenn ein Entwurf existiert (409 vermeiden)
   ========================================================= */

/* ---------------- Status Helpers ---------------- */

function toneForStatus(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
    const s = (status || "").toLowerCase();
    if (s.includes("hoch") || s.includes("krit") || s.includes("risiko")) return "danger";
    if (s.includes("warn") || s.includes("prüf") || s.includes("review") || s.includes("in_pruef")) return "warning";
    if (s.includes("abgesch") || s.includes("geschlossen") || s.includes("done") || s.includes("submitted")) return "success";
    if (s.includes("entwurf") || s.includes("draft") || s.includes("offen") || s.includes("neu")) return "info";
    return "neutral";
}

function isClosedStatus(status: string) {
    const s = (status || "").toLowerCase();
    return s.includes("abgesch") || s.includes("abgeschlossen") || s.includes("geschlossen") || s.includes("done") || s.includes("submitted");
}

function isDraftStatus(status: string) {
    const s = (status || "").toLowerCase();
    return s.includes("entwurf") || s.includes("draft");
}

function statusLabel(status: string) {
    const s = (status || "").toLowerCase();
    if (isDraftStatus(status)) return "Entwurf";
    if (isClosedStatus(status)) return "Abgeschlossen";
    if (s.includes("offen") || s.includes("neu")) return "Offen";
    return status || "—";
}

/* ---------------- Utils ---------------- */

function errorMessage(e: unknown, fallback: string) {
    if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
        return (e as { message: string }).message;
    }
    return fallback;
}

function safeNumber(v: unknown): number | null {
    if (typeof v === "number") return Number.isFinite(v) ? v : null;

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

function formatDateTimeDE(value: string | null) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function formatDateDE(value: string | null) {
    if (!value) return "—";
    const d = new Date(value + "T00:00:00");
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(d);
}

function Row({ label, value }: { label: string; value: any }) {
    const v =
        value === null || value === undefined || value === ""
            ? "—"
            : typeof value === "boolean"
                ? value
                    ? "Ja"
                    : "Nein"
                : String(value);

    return (
        <div className="min-w-0">
            <div className="text-xs font-semibold text-brand-text2">{label}</div>
            <div className="text-sm text-brand-text whitespace-pre-wrap break-words">{v}</div>
        </div>
    );
}

function stop(e: React.SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();
}

function cacheBust() {
    return `cb=${Date.now()}`;
}

/* ---------------- UI Helpers ---------------- */

function Segmented({
                       value,
                       onChange,
                       items,
                   }: {
    value: string;
    onChange: (v: string) => void;
    items: { value: string; label: string }[];
}) {
    return (
        <div className="-mx-1 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mx-1 inline-flex w-max rounded-2xl border border-brand-border/40 bg-white p-1 gap-1">
                {items.map((it) => (
                    <Button
                        key={it.value}
                        type="button"
                        variant={value === it.value ? "default" : "secondary"}
                        className="h-10 px-4 whitespace-nowrap"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(it.value);
                        }}
                    >
                        {it.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}

function KeyGrid({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="bg-white">
            <div className="text-sm font-semibold text-brand-text">{title}</div>
            <div className="mt-3">{children}</div>
        </section>
    );
}

function SimpleTable({
                         columns,
                         rows,
                         containerClassName,
                         maxHeightClassName,
                         stickyHeader,
                     }: {
    columns: { key: string; label: string; className?: string }[];
    rows: Record<string, any>[];
    containerClassName?: string;
    maxHeightClassName?: string;
    stickyHeader?: boolean;
}) {
    const containerBase = "rounded-2xl border border-brand-border/40 bg-white";
    const overflow = maxHeightClassName ? `${maxHeightClassName} overflow-auto` : "overflow-x-auto";

    return (
        <div className={[containerBase, overflow, containerClassName ?? ""].join(" ")}>
            <table className="w-full text-sm border-separate border-spacing-0">
                <thead className={stickyHeader ? "sticky top-0 z-10" : undefined}>
                <tr className="border-b border-brand-border/40 bg-white">
                    {columns.map((c) => (
                        <th
                            key={c.key}
                            className={[
                                "px-3 py-2 text-left text-xs font-semibold text-brand-text2",
                                stickyHeader ? "bg-white" : "",
                                c.className ?? "",
                            ].join(" ")}
                        >
                            {c.label}
                        </th>
                    ))}
                </tr>
                </thead>

                <tbody>
                {rows.length ? (
                    rows.map((r, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-brand-bg/30"}>
                            {columns.map((c) => (
                                <td key={c.key} className={`px-3 py-2 align-top text-brand-text ${c.className ?? ""}`}>
                                    {r[c.key] ?? "—"}
                                </td>
                            ))}
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td className="px-3 py-3 text-brand-text2" colSpan={columns.length}>
                            —
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
}

function KeyFactsBar({ d }: { d: MeldungResponse }) {
    return (
        <div className="rounded-2xl border border-brand-border/30 bg-white p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="min-w-0">
                    <div className="text-xs font-semibold text-brand-text2">Dringlichkeit</div>
                    <div className="text-sm text-brand-text">{d.dringlichkeit ?? "—"}</div>
                </div>

                <div className="min-w-0">
                    <div className="text-xs font-semibold text-brand-text2">Fach-Ampel</div>
                    <div className="text-sm text-brand-text">{d.fachAmpel ?? "—"}</div>
                </div>

                <div className="min-w-0">
                    <div className="text-xs font-semibold text-brand-text2">Akut</div>
                    <div className="text-sm text-brand-text">{d.akutGefahrImVerzug ? "Gefahr im Verzug" : "—"}</div>
                </div>

                <div className="min-w-0">
                    <div className="text-xs font-semibold text-brand-text2">Nächste Überprüfung</div>
                    <div className="text-sm text-brand-text">{formatDateDE(d.naechsteUeberpruefungAm)}</div>
                </div>

                <div className="min-w-0">
                    <div className="text-xs font-semibold text-brand-text2">Anlass-Codes</div>
                    <div className="text-sm text-brand-text break-words">
                        {(d.anlassCodes ?? []).length ? d.anlassCodes!.join(", ") : "—"}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------------- Details ---------------- */

function MeldungDetailsFlat({ d }: { d: MeldungResponse }) {
    const [tab, setTab] = useState<"inhalt" | "meta" | "fach" | "akut" | "planung" | "listen" | "audit">("inhalt");

    return (
        <div className="pt-3" onClick={(e) => e.stopPropagation()}>
            <Separator className="mb-3" />

            <Segmented
                value={tab}
                onChange={(v) => setTab(v as any)}
                items={[
                    { value: "inhalt", label: "Inhalt" },
                    { value: "meta", label: "Meta" },
                    { value: "fach", label: "Fach" },
                    { value: "akut", label: "Akut" },
                    { value: "planung", label: "Planung" },
                    { value: "listen", label: "Listen" },
                    { value: "audit", label: "Audit" },
                ]}
            />

            <div className="mt-3">
                <KeyFactsBar d={d} />
            </div>

            <div className="mt-4">
                {tab === "inhalt" ? (
                    <Section title="Inhalt">
                        <KeyGrid>
                            <div className="sm:col-span-2">
                                <Row label="Kurzbeschreibung (Sachlage)" value={d.kurzbeschreibung} />
                            </div>
                            <Row label="Anlass-Codes" value={(d.anlassCodes ?? []).length ? d.anlassCodes.join(", ") : "—"} />
                            <div className="sm:col-span-2">
                                <Row label="Zusammenfassung" value={d.zusammenfassung} />
                            </div>
                        </KeyGrid>
                    </Section>
                ) : null}

                {tab === "meta" ? (
                    <Section title="Meta">
                        <KeyGrid>
                            <Row label="Erfasst von Rolle" value={d.erfasstVonRolle} />
                            <Row
                                label="Meldeweg"
                                value={
                                    d.meldeweg
                                        ? d.meldewegSonstiges
                                            ? `${d.meldeweg} (${d.meldewegSonstiges})`
                                            : d.meldeweg
                                        : "—"
                                }
                            />
                            <Row label="Meldende Stelle Kontakt" value={d.meldendeStelleKontakt} />
                            <Row label="Dringlichkeit" value={d.dringlichkeit} />
                            <Row label="Datenbasis" value={d.datenbasis} />
                            <Row label="Einwilligung vorhanden" value={d.einwilligungVorhanden} />
                            <Row label="Schweigepflichtentbindung vorhanden" value={d.schweigepflichtentbindungVorhanden} />
                        </KeyGrid>
                    </Section>
                ) : null}

                {tab === "fach" ? (
                    <Section title="Fach">
                        <KeyGrid>
                            <Row label="Ampel" value={d.fachAmpel} />
                            <div className="sm:col-span-2">
                                <Row label="Fachtext" value={d.fachText} />
                            </div>
                            <Row label="Abweichung zur Auto" value={d.abweichungZurAuto} />
                            <div className="sm:col-span-2">
                                <Row label="Abweichungs-Begründung" value={d.abweichungsBegruendung} />
                            </div>
                        </KeyGrid>
                    </Section>
                ) : null}

                {tab === "akut" ? (
                    <Section title="Akut">
                        <KeyGrid>
                            <Row label="Gefahr im Verzug" value={d.akutGefahrImVerzug} />
                            <Row label="Notruf erforderlich" value={d.akutNotrufErforderlich} />
                            <Row label="Kind sicher untergebracht" value={d.akutKindSicherUntergebracht} />
                            <div className="sm:col-span-2">
                                <Row label="Begründung" value={d.akutBegruendung} />
                            </div>
                        </KeyGrid>

                        <Separator className="my-3" />

                        <div className="text-sm font-semibold text-brand-text">Jugendamt</div>
                        <div className="mt-3">
                            {d.jugendamt ? (
                                <KeyGrid>
                                    <Row label="Informiert" value={d.jugendamt.informiert} />
                                    <Row label="Kontakt am" value={formatDateTimeDE(d.jugendamt.kontaktAm)} />
                                    <Row label="Kontaktart" value={d.jugendamt.kontaktart} />
                                    <Row label="Aktenzeichen" value={d.jugendamt.aktenzeichen} />
                                    <div className="sm:col-span-2">
                                        <Row label="Begründung" value={d.jugendamt.begruendung} />
                                    </div>
                                </KeyGrid>
                            ) : (
                                <div className="text-sm text-brand-text2">—</div>
                            )}
                        </div>
                    </Section>
                ) : null}

                {tab === "planung" ? (
                    <Section title="Planung">
                        <KeyGrid>
                            <Row label="Verantwortliche Fachkraft (UserId)" value={d.verantwortlicheFachkraftUserId} />
                            <Row label="Nächste Überprüfung am" value={formatDateDE(d.naechsteUeberpruefungAm)} />
                            <div className="sm:col-span-2">
                                <Row label="Zusammenfassung" value={d.zusammenfassung} />
                            </div>
                        </KeyGrid>
                    </Section>
                ) : null}

                {tab === "listen" ? (
                    <div className="space-y-6">
                        <Section title="Kontakte">
                            <SimpleTable
                                columns={[
                                    { key: "mit", label: "Kontakt mit" },
                                    { key: "am", label: "Kontakt am" },
                                    { key: "status", label: "Status" },
                                    { key: "ergebnis", label: "Ergebnis" },
                                    { key: "notiz", label: "Notiz", className: "min-w-[260px]" },
                                ]}
                                rows={(d.contacts ?? []).map((c) => ({
                                    mit: c.kontaktMit ?? "—",
                                    am: formatDateTimeDE(c.kontaktAm),
                                    status: c.status ?? "—",
                                    ergebnis: c.ergebnis ?? "—",
                                    notiz: c.notiz ?? "—",
                                }))}
                            />
                        </Section>

                        <Section title="Extern">
                            <SimpleTable
                                columns={[
                                    { key: "stelle", label: "Stelle" },
                                    { key: "am", label: "Am" },
                                    { key: "sonst", label: "Stelle sonstiges" },
                                    { key: "ergebnis", label: "Ergebnis" },
                                    { key: "begruendung", label: "Begründung", className: "min-w-[260px]" },
                                ]}
                                rows={(d.extern ?? []).map((x) => ({
                                    stelle: x.stelle ?? "—",
                                    am: formatDateTimeDE(x.am),
                                    sonst: x.stelleSonstiges ?? "—",
                                    ergebnis: x.ergebnis ?? "—",
                                    begruendung: x.begruendung ?? "—",
                                }))}
                            />
                        </Section>

                        <Section title="Anhänge">
                            <SimpleTable
                                columns={[
                                    { key: "titel", label: "Titel" },
                                    { key: "typ", label: "Typ" },
                                    { key: "sicht", label: "Sichtbarkeit" },
                                    { key: "file", label: "FileId" },
                                    { key: "besch", label: "Beschreibung", className: "min-w-[260px]" },
                                    { key: "rg", label: "Rechtsgrundlage", className: "min-w-[260px]" },
                                ]}
                                rows={(d.attachments ?? []).map((a) => ({
                                    titel: a.titel ?? "—",
                                    typ: a.typ ?? "—",
                                    sicht: a.sichtbarkeit ?? "—",
                                    file: a.fileId ?? "—",
                                    besch: a.beschreibung ?? "—",
                                    rg: a.rechtsgrundlageHinweis ?? "—",
                                }))}
                            />
                        </Section>
                    </div>
                ) : null}

                {tab === "audit" ? (
                    <div className="space-y-6">
                        <Section title="Freigabe / Submit">
                            <KeyGrid>
                                <Row label="Submitted am" value={formatDateTimeDE(d.submittedAt)} />
                                <Row label="Submitted von" value={d.submittedByDisplayName} />
                                <Row label="Freigabe am" value={formatDateTimeDE(d.freigabeAm)} />
                                <Row label="Freigabe von" value={d.freigabeVonDisplayName} />
                            </KeyGrid>
                        </Section>

                        <Section title="Änderungen">
                            <SimpleTable
                                stickyHeader
                                maxHeightClassName="max-h-[50vh] md:max-h-[60vh]"
                                columns={[
                                    { key: "section", label: "Sektion" },
                                    { key: "field", label: "Feld" },
                                    { key: "at", label: "Zeit" },
                                    { key: "old", label: "Alt", className: "min-w-[260px]" },
                                    { key: "neu", label: "Neu", className: "min-w-[260px]" },
                                    { key: "reason", label: "Grund", className: "min-w-[260px]" },
                                    { key: "by", label: "Von" },
                                ]}
                                rows={(d.changes ?? []).map((c) => ({
                                    section: c.section ?? "—",
                                    field: c.fieldPath ?? "—",
                                    at: formatDateTimeDE(c.changedAt),
                                    old: c.oldValue ?? "—",
                                    neu: c.newValue ?? "—",
                                    reason: c.reason ?? "—",
                                    by: c.changedByDisplayName ?? "—",
                                }))}
                            />
                        </Section>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

/* ---------------- Page ---------------- */

type MeldungVM = MeldungListItemResponse & { detail?: MeldungResponse | null };

export default function FallMeldungenPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();

    // robust: akzeptiert /dashboard/falloeffnungen/[fallId] ODER [id] etc.
    const fallId = useMemo(() => {
        const p: any = params as any;
        return safeNumber(p?.fallId) ?? safeNumber(p?.id) ?? safeNumber(p?.falloeffnungId) ?? null;
    }, [params]);

    const [data, setData] = useState<FalleroeffnungResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [meldungen, setMeldungen] = useState<MeldungVM[]>([]);
    const [meldLoading, setMeldLoading] = useState(false);
    const [meldErr, setMeldErr] = useState<string | null>(null);

    const [openId, setOpenId] = useState<number | null>(null);
    const [actionBusyId, setActionBusyId] = useState<number | null>(null);

    const autostartMeldungen = searchParams?.get("autostart") === "meldungen";

    // Editor-Route: bei dir ist das bereits etabliert
    function editorUrl(opts: { meldungId?: number; readonly?: boolean }) {
        if (!fallId) return "/dashboard";
        const qs = new URLSearchParams();
        if (opts.readonly) qs.set("mode", "readonly");
        if (typeof opts.meldungId === "number") qs.set("meldungId", String(opts.meldungId));
        const q = qs.toString();
        return `/dashboard/falloeffnungen/${fallId}/meldung${q ? `?${q}` : ""}`;
    }

    // Draft-Sperre (409 vermeiden): Wenn irgendeine Meldung ENTWURF ist -> keine Korrektur / neue Meldung starten
    const hasAnyDraft = useMemo(() => meldungen.some((m) => isDraftStatus(m.status)), [meldungen]);
    const draftItem = useMemo(() => meldungen.find((m) => isDraftStatus(m.status)) ?? null, [meldungen]);

    async function loadFall() {
        if (!fallId) return;

        setErr(null);
        setLoading(true);

        try {
            const res = await apiFetch<FalleroeffnungResponse>(`/falloeffnungen/${fallId}?${cacheBust()}`, { method: "GET" });
            setData(res);
        } catch (e: unknown) {
            setErr(errorMessage(e, "Konnte Fall nicht laden."));
            setData(null);
        } finally {
            setLoading(false);
        }
    }

    async function listMeldungenFresh(fallIdValue: number) {
        // nutzt dein existierendes Endpoint-Shape:
        const res: any = await apiFetch<any>(`/falloeffnungen/${fallIdValue}/meldungen?${cacheBust()}`, { method: "GET" });
        const list: MeldungListItemResponse[] = Array.isArray(res) ? res : (res?.items ?? res?.data ?? res?.meldungen ?? []);
        return list;
    }

    async function getMeldungFresh(fallIdValue: number, meldungId: number) {
        return apiFetch<MeldungResponse>(`/falloeffnungen/${fallIdValue}/meldungen/${meldungId}?${cacheBust()}`, { method: "GET" });
    }

    async function prefetchMeldungDetails(list: MeldungListItemResponse[]) {
        if (!fallId) return;
        const slice = list.slice(0, 30);

        await Promise.allSettled(
            slice.map(async (m) => {
                const d = await getMeldungFresh(fallId, m.id);
                setMeldungen((prev) => prev.map((x) => (x.id === m.id ? { ...x, detail: x.detail ?? d } : x)));
            })
        );
    }

    async function loadMeldungen() {
        if (!fallId) return;

        setMeldErr(null);
        setMeldLoading(true);

        try {
            const list = await listMeldungenFresh(fallId);
            setMeldungen(list);
            void prefetchMeldungDetails(list);
        } catch (e: unknown) {
            setMeldErr(errorMessage(e, "Konnte Meldungen nicht laden."));
            setMeldungen([]);
        } finally {
            setMeldLoading(false);
        }
    }

    async function ensureDetail(m: MeldungVM) {
        if (!fallId) return;

        try {
            const d = await getMeldungFresh(fallId, m.id);
            setMeldungen((prev) => prev.map((x) => (x.id === m.id ? { ...x, detail: d } : x)));
        } catch (e) {
            console.error("detail error =", e);
        }
    }

    async function toggleOpen(m: MeldungVM) {
        const next = openId === m.id ? null : m.id;
        setOpenId(next);
        if (next) void ensureDetail(m);
    }

    // jump helper (für spätere Referenzen / korrigiert/ersetzt)
    function jumpTo(id: number) {
        setOpenId(id);
        const found = meldungen.find((x) => x.id === id);
        if (found) void ensureDetail(found);

        requestAnimationFrame(() => {
            const el = document.getElementById(`meldung-${id}`);
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    async function doCorrect(targetId: number) {
        if (!fallId) return;

        // hard block, um 409/constraint-konflikte sauber zu vermeiden
        if (hasAnyDraft) {
            setMeldErr(
                `Aktion nicht möglich: Es existiert bereits ein Entwurf (${draftItem ? `#${draftItem.id}` : "—"}). Bitte zuerst Entwurf abschließen oder verwerfen.`
            );
            return;
        }

        setActionBusyId(targetId);
        setMeldErr(null);

        try {
            const created = await meldungApi.startCorrection(fallId, { targetMeldungId: targetId });
            router.push(editorUrl({ meldungId: created.id }));
        } catch (e: unknown) {
            console.error(e);
            setMeldErr(errorMessage(e, "Korrigieren fehlgeschlagen."));
        } finally {
            setActionBusyId(null);
        }
    }

    async function doNewMeldungFromCurrent(currentId: number) {
        if (!fallId) return;

        if (hasAnyDraft) {
            setMeldErr(
                `Aktion nicht möglich: Es existiert bereits ein Entwurf (${draftItem ? `#${draftItem.id}` : "—"}). Bitte zuerst Entwurf abschließen oder verwerfen.`
            );
            return;
        }

        setActionBusyId(currentId);
        setMeldErr(null);

        try {
            const created = await meldungApi.createNew(fallId, { supersedesId: currentId });
            router.push(editorUrl({ meldungId: created.id }));
        } catch (e: unknown) {
            console.error(e);
            setMeldErr(errorMessage(e, "Neue Meldung konnte nicht gestartet werden."));
        } finally {
            setActionBusyId(null);
        }
    }

    useEffect(() => {
        setOpenId(null);
    }, [fallId]);

    useEffect(() => {
        loadFall();
        loadMeldungen();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fallId]);

    useEffect(() => {
        if (fallId && autostartMeldungen) {
            // bewusst: kein redirect – nur Hook für deine Logik
            console.log("[FallMeldungenPage] autostart=meldungen");
        }
    }, [fallId, autostartMeldungen]);

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Fall · Meldungen" />

                <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 pb-12 pt-4 space-y-4">
                    {err ? (
                        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">{err}</div>
                    ) : null}

                    {meldErr ? (
                        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">{meldErr}</div>
                    ) : null}

                    {/* Draft notice (blocker) */}
                    {hasAnyDraft ? (
                        <div className="rounded-2xl border border-brand-warning/25 bg-brand-warning/10 p-3 text-sm text-brand-text">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 text-brand-text2" />
                                <div className="min-w-0">
                                    <div className="font-semibold">Entwurf vorhanden</div>
                                    <div className="text-brand-text2">
                                        Es existiert bereits ein Entwurf{draftItem ? ` (Meldung #${draftItem.id})` : ""}. Solange dieser Entwurf existiert, sind
                                        <span className="font-semibold"> „Korrigieren“</span> und <span className="font-semibold">„Neue Meldung“</span> gesperrt.
                                    </div>
                                    <div className="mt-2">
                                        <Button
                                            className="h-10 gap-2"
                                            onClick={() => {
                                                if (draftItem) router.push(editorUrl({ meldungId: draftItem.id }));
                                            }}
                                            disabled={!draftItem}
                                            title={!draftItem ? "Entwurf konnte nicht ermittelt werden." : undefined}
                                        >
                                            Entwurf öffnen
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Header */}
                    <div className="rounded-2xl border border-brand-border/40 bg-white p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3 min-w-0">
                                <FileText className="h-5 w-5 text-brand-text2 mt-0.5" />
                                <div className="min-w-0">
                                    <div className="text-base font-semibold text-brand-text truncate">
                                        {data?.aktenzeichen ?? (loading ? "Lade…" : fallId ? `Fall #${fallId}` : "Fall")}
                                    </div>
                                    <div className="mt-1 text-sm text-brand-text2 truncate">{data?.kindName ? `Kind: ${data.kindName}` : "—"}</div>
                                </div>
                            </div>

                            <Button
                                variant="secondary"
                                onClick={() => {
                                    loadFall();
                                    loadMeldungen();
                                }}
                                disabled={loading || meldLoading}
                                className="gap-2 h-11 w-full sm:w-auto justify-center"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Aktualisieren
                            </Button>
                        </div>
                    </div>

                    {/* List header */}
                    <div className="space-y-3">
                        <div className="flex items-end justify-between px-1">
                            <div>
                                <div className="text-sm font-semibold text-brand-text">Meldungen</div>
                                <div className="text-xs text-brand-text2">{meldLoading ? "Lade…" : `${meldungen.length} Einträge`}</div>
                            </div>
                        </div>

                        {meldungen.length === 0 && !meldLoading ? (
                            <div className="rounded-2xl border border-brand-border/40 bg-white p-4 text-sm text-brand-text2">
                                Keine Meldungen vorhanden.
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            {meldungen.map((m) => {
                                const d = m.detail;

                                const sachlage = d?.kurzbeschreibung ?? "—";
                                const createdBy = d?.createdByDisplayName ?? m.createdByDisplayName ?? "Unbekannt";
                                const createdAt = formatDateTimeDE(d?.createdAt ?? m.createdAt);
                                const isOpen = openId === m.id;

                                const closed = isClosedStatus(m.status);
                                const draft = isDraftStatus(m.status);
                                const busy = actionBusyId === m.id;

                                // Fachlogik:
                                // - "Neue Meldung" nur von current UND abgeschlossen
                                // - "Korrigieren" nur wenn abgeschlossen
                                // - beides zusätzlich gesperrt wenn irgendein Draft existiert
                                const canStartNewMeldung = closed && !!m.current && !hasAnyDraft;
                                const canCorrect = closed && !hasAnyDraft;

                                return (
                                    <Card key={m.id} id={`meldung-${m.id}`} className="border border-brand-border/25 shadow-sm">
                                        <CardHeader
                                            className="py-3 cursor-pointer select-none"
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => toggleOpen(m)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    toggleOpen(m);
                                                }
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-semibold text-brand-text break-words">Sachlage: {sachlage}</div>
                                                            <div className="mt-1 text-xs text-brand-text2">
                                                                Erstellt von {createdBy} am {createdAt}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <Badge tone={toneForStatus(m.status)}>{statusLabel(m.status)}</Badge>

                                                            {m.current ? <Badge tone="info">aktuell</Badge> : <Badge tone="neutral">v{m.versionNo}</Badge>}

                                                            {m.type ? <Badge tone="neutral">{m.type}</Badge> : null}

                                                            {m.correctsId ? <Badge tone="warning">korrigiert #{m.correctsId}</Badge> : null}
                                                            {m.supersedesId ? <Badge tone="neutral">ersetzt #{m.supersedesId}</Badge> : null}

                                                            <Button
                                                                variant="secondary"
                                                                onClick={(e) => {
                                                                    stop(e);
                                                                    router.push(editorUrl({ meldungId: m.id, readonly: true }));
                                                                }}
                                                                className="h-9 px-3 gap-2"
                                                                title="Meldung im Lesemodus öffnen"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                Ansehen
                                                            </Button>

                                                            {draft ? (
                                                                <Button
                                                                    onClick={(e) => {
                                                                        stop(e);
                                                                        router.push(editorUrl({ meldungId: m.id }));
                                                                    }}
                                                                    className="h-9 px-3 gap-2"
                                                                    title="Entwurf weiterbearbeiten"
                                                                >
                                                                    Entwurf öffnen
                                                                    <ArrowRight className="h-4 w-4" />
                                                                </Button>
                                                            ) : null}

                                                            {closed ? (
                                                                <Button
                                                                    variant="default"
                                                                    disabled={busy || !canCorrect}
                                                                    onClick={(e) => {
                                                                        stop(e);
                                                                        void doCorrect(m.id);
                                                                    }}
                                                                    className="h-9 px-3 gap-2"
                                                                    title={!canCorrect ? "Gesperrt: Entwurf vorhanden" : "Korrektur (mit Vorbefüllung) starten"}
                                                                >
                                                                    <Wrench className="h-4 w-4" />
                                                                    Korrigieren
                                                                </Button>
                                                            ) : null}

                                                            {canStartNewMeldung ? (
                                                                <Button
                                                                    variant="secondary"
                                                                    disabled={busy}
                                                                    onClick={(e) => {
                                                                        stop(e);
                                                                        void doNewMeldungFromCurrent(m.id);
                                                                    }}
                                                                    className="h-9 px-3 gap-2"
                                                                    title="Neue Meldung als Folgemeldung starten"
                                                                >
                                                                    <CopyPlus className="h-4 w-4" />
                                                                    Neue Meldung
                                                                </Button>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="shrink-0 mt-0.5">
                                                    {isOpen ? <ChevronUp className="h-7 w-7 text-brand-text2" /> : <ChevronDown className="h-7 w-7 text-brand-text2" />}
                                                </div>
                                            </div>
                                        </CardHeader>

                                        {isOpen ? (
                                            <CardContent className="pt-0 pb-4">
                                                {!d ? (
                                                    <div className="rounded-2xl border border-brand-border/40 bg-white p-4 text-sm text-brand-text2">
                                                        Lade Details…
                                                    </div>
                                                ) : (
                                                    <MeldungDetailsFlat d={d} />
                                                )}

                                                {(d?.supersedesId || d?.correctsId) ? (
                                                    <div className="mt-3 rounded-2xl border border-brand-border/30 bg-white p-3">
                                                        <div className="text-sm font-semibold text-brand-text">Referenzen</div>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {d?.supersedesId ? (
                                                                <Button
                                                                    type="button"
                                                                    variant="secondary"
                                                                    className="h-9 gap-2"
                                                                    onClick={() => jumpTo(d.supersedesId!)}
                                                                >
                                                                    <ArrowRight className="h-4 w-4" />
                                                                    Ersetzt #{d.supersedesId} öffnen
                                                                </Button>
                                                            ) : null}

                                                            {d?.correctsId ? (
                                                                <Button
                                                                    type="button"
                                                                    variant="secondary"
                                                                    className="h-9 gap-2"
                                                                    onClick={() => jumpTo(d.correctsId!)}
                                                                >
                                                                    <ArrowRight className="h-4 w-4" />
                                                                    Korrigiert #{d.correctsId} öffnen
                                                                </Button>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </CardContent>
                                        ) : null}
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AuthGate>
    );
}