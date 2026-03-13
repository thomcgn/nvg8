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
import { anlassLabel } from "@/lib/anlass/catalog";
import {
    meldungApi,
    type MeldungListItemResponse,
    type MeldungResponse,
} from "@/lib/meldungApi";
import {
    FileText,
    RefreshCw,
    ArrowRight,
    Eye,
    CopyPlus,
    Wrench,
    AlertTriangle,
    X,
    Printer,
    Info,
    Shield,
} from "lucide-react";

/* =========================================================
   Fall · Meldungen
   - Liste ohne Accordion
   - Modal-Lesemodus
   - Druckansicht ohne Tabs
   - Korrektur-Markierung nur bei echter Korrektur
   - Anlass-Codes als Labels
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
    return (
        s.includes("abgesch") ||
        s.includes("abgeschlossen") ||
        s.includes("geschlossen") ||
        s.includes("done") ||
        s.includes("submitted")
    );
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
    return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(d);
}

function formatDateDE(value: string | null) {
    if (!value) return "—";
    const d = new Date(value + "T00:00:00");
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(d);
}

function cacheBust() {
    return `cb=${Date.now()}`;
}

function normalizeAuditValue(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";

    if (Array.isArray(value)) {
        return value.map((v: unknown) => normalizeAuditValue(v)).join(", ");
    }

    return String(value);
}

function formatAnlassList(values: unknown): string {
    if (!Array.isArray(values)) return "—";

    const mapped = values
        .map((v: unknown) => (typeof v === "string" ? anlassLabel(v) : String(v ?? "")))
        .filter((v): v is string => Boolean(v));

    return mapped.length ? mapped.join(", ") : "—";
}

function formatBooleanJaNein(value: unknown) {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Ja" : "Nein";
    if (value === "true") return "Ja";
    if (value === "false") return "Nein";
    return String(value);
}

function displayMeldeweg(value: string | null | undefined, sonstiges?: string | null) {
    if (!value) return "—";
    const labels: Record<string, string> = {
        TELEFON: "Telefon",
        EMAIL: "E-Mail",
        PERSOENLICH: "Persönlich",
        BRIEF: "Brief",
        SONSTIGES: "Sonstiges",
    };
    const base = labels[value] ?? value;
    return sonstiges ? `${base} (${sonstiges})` : base;
}

function displayDringlichkeit(value: string | null | undefined) {
    const labels: Record<string, string> = {
        AKUT_HEUTE: "Akut (heute)",
        ZEITNAH_24_48H: "Zeitnah (24–48h)",
        BEOBACHTEN: "Beobachten",
        UNKLAR: "Unklar",
    };
    return value ? labels[value] ?? value : "—";
}

function displayDatenbasis(value: string | null | undefined) {
    const labels: Record<string, string> = {
        BEOBACHTUNG: "Beobachtung",
        ERZAEHLUNG: "Erzählung",
        DOKUMENT: "Dokument",
        UNKLAR: "Unklar",
    };
    return value ? labels[value] ?? value : "—";
}

function displayAmpel(value: string | null | undefined) {
    const labels: Record<string, string> = {
        GRUEN: "Grün",
        GELB: "Gelb",
        ROT: "Rot",
    };
    return value ? labels[value] ?? value : "—";
}

function displayAbweichungZurAuto(value: string | null | undefined) {
    const labels: Record<string, string> = {
        GLEICH: "Keine Abweichung",
        NIEDRIGER: "Niedriger als Auto-Bewertung",
        HOEHER: "Höher als Auto-Bewertung",
    };
    return value ? labels[value] ?? value : "—";
}

function displayJaNeinUnklar(value: string | null | undefined) {
    const labels: Record<string, string> = {
        JA: "Ja",
        NEIN: "Nein",
        UNKLAR: "Unklar",
    };
    return value ? labels[value] ?? value : "—";
}

function displayKontaktStatus(value: string | null | undefined) {
    const labels: Record<string, string> = {
        GEPLANT: "Geplant",
        ERREICHT: "Erreicht",
        NICHT_ERREICHT: "Nicht erreicht",
        ABGEBROCHEN: "Abgebrochen",
    };
    return value ? labels[value] ?? value : "—";
}

/* ---------------- Generic UI ---------------- */

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
        <div className="-mx-1 overflow-x-auto print:hidden">
            <div className="mx-1 inline-flex w-max rounded-2xl border border-brand-border/40 bg-white p-1 gap-1">
                {items.map((it) => (
                    <Button
                        key={it.value}
                        type="button"
                        variant={value === it.value ? "default" : "secondary"}
                        className="h-10 px-4 whitespace-nowrap"
                        onClick={() => onChange(it.value)}
                    >
                        {it.label}
                    </Button>
                ))}
            </div>
        </div>
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
                    <div className="text-sm text-brand-text">{displayDringlichkeit(d.dringlichkeit)}</div>
                </div>

                <div className="min-w-0">
                    <div className="text-xs font-semibold text-brand-text2">Fach-Ampel</div>
                    <div className="text-sm text-brand-text">{displayAmpel(d.fachAmpel)}</div>
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
                    <div className="text-xs font-semibold text-brand-text2">Anlässe</div>
                    <div className="text-sm text-brand-text break-words">
                        {(d.anlassCodes ?? []).length ? (d.anlassCodes ?? []).map(anlassLabel).join(", ") : "—"}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------------- Audit / Changes ---------------- */

type ChangeInfo = {
    oldValue: string | null;
    newValue: string | null;
    reason: string | null;
    changedAt: string | null;
    changedByDisplayName: string | null;
};

function getChangedMap(changes: MeldungResponse["changes"] | undefined) {
    const map = new Map<string, ChangeInfo>();

    for (const c of changes ?? []) {
        const key = String(c.fieldPath ?? "").trim();
        if (!key) continue;

        map.set(key, {
            oldValue: c.oldValue ?? null,
            newValue: c.newValue ?? null,
            reason: c.reason ?? null,
            changedAt: c.changedAt ?? null,
            changedByDisplayName: c.changedByDisplayName ?? null,
        });
    }

    return map;
}

function formatDisplayValue(label: string, value: unknown): React.ReactNode {
    switch (label) {
        case "Anlass-Codes":
        case "Anlässe":
            return formatAnlassList(value);
        case "Meldeweg":
            return normalizeAuditValue(value);
        case "Dringlichkeit":
            return displayDringlichkeit(typeof value === "string" ? value : null);
        case "Datenbasis":
            return displayDatenbasis(typeof value === "string" ? value : null);
        case "Ampel":
            return displayAmpel(typeof value === "string" ? value : null);
        case "Abweichung zur Auto":
            return displayAbweichungZurAuto(typeof value === "string" ? value : null);
        case "Einwilligung vorhanden":
        case "Schweigepflichtentbindung vorhanden":
        case "Gefahr im Verzug":
        case "Notruf erforderlich":
            return formatBooleanJaNein(value);
        case "Kind sicher untergebracht":
            return displayJaNeinUnklar(typeof value === "string" ? value : null);
        default:
            return normalizeAuditValue(value);
    }
}

function ChangedField({
                          label,
                          fallbackValue,
                          change,
                          enableChangeHighlight = true,
                      }: {
    label: string;
    fallbackValue: React.ReactNode;
    change?: ChangeInfo;
    enableChangeHighlight?: boolean;
}) {
    const changed = enableChangeHighlight && !!change;
    const currentValue = changed ? formatDisplayValue(label, change?.newValue) : fallbackValue ?? "—";
    const previousValue = changed ? formatDisplayValue(label, change?.oldValue) : null;

    return (
        <div
            className={[
                "min-w-0 rounded-2xl border p-3",
                changed ? "border-red-200 bg-red-50/60" : "border-brand-border/20 bg-white",
            ].join(" ")}
            title={changed ? `Vorher: ${normalizeAuditValue(change?.oldValue)}` : undefined}
        >
            <div className="flex items-center gap-2">
                <div className={changed ? "text-xs font-semibold text-red-700" : "text-xs font-semibold text-brand-text2"}>
                    {label}
                </div>
                {changed ? <Badge tone="danger">geändert</Badge> : null}
            </div>

            <div
                className={
                    changed
                        ? "mt-1 text-sm text-red-900 whitespace-pre-wrap break-words"
                        : "mt-1 text-sm text-brand-text whitespace-pre-wrap break-words"
                }
            >
                {currentValue}
            </div>

            {changed ? (
                <div className="mt-2 space-y-1 text-xs">
                    <div className="text-red-700">
                        <span className="font-semibold">Vorher:</span> {previousValue}
                    </div>
                    {change?.reason ? (
                        <div className="text-red-700/90">
                            <span className="font-semibold">Grund:</span> {change.reason}
                        </div>
                    ) : null}
                    {(change?.changedAt || change?.changedByDisplayName) ? (
                        <div className="text-red-700/80">
                            <span className="font-semibold">Änderung:</span>{" "}
                            {change?.changedAt ? formatDateTimeDE(change.changedAt) : "—"}
                            {change?.changedByDisplayName ? ` · ${change.changedByDisplayName}` : ""}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

/* ---------------- Blocks ---------------- */

type ChangeLookup = (fieldPath: string) => ChangeInfo | undefined;

function MeldungBlockInhalt({
                                d,
                                ch,
                                isCorrection,
                            }: {
    d: MeldungResponse;
    ch: ChangeLookup;
    isCorrection: boolean;
}) {
    return (
        <Section title="Inhalt">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <ChangedField
                        label="Kurzbeschreibung (Sachlage)"
                        fallbackValue={d.kurzbeschreibung ?? "—"}
                        change={ch("kurzbeschreibung")}
                        enableChangeHighlight={isCorrection}
                    />
                </div>

                <ChangedField
                    label="Anlass-Codes"
                    fallbackValue={(d.anlassCodes ?? []).length ? (d.anlassCodes ?? []).map(anlassLabel).join(", ") : "—"}
                    change={ch("anlassCodes")}
                    enableChangeHighlight={isCorrection}
                />

                <div className="sm:col-span-2">
                    <ChangedField
                        label="Zusammenfassung"
                        fallbackValue={d.zusammenfassung ?? "—"}
                        change={ch("zusammenfassung")}
                        enableChangeHighlight={isCorrection}
                    />
                </div>
            </div>
        </Section>
    );
}

function MeldungBlockMeta({
                              d,
                              ch,
                              isCorrection,
                          }: {
    d: MeldungResponse;
    ch: ChangeLookup;
    isCorrection: boolean;
}) {
    return (
        <Section title="Meta">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ChangedField
                    label="Erfasst von Rolle"
                    fallbackValue={d.erfasstVonRolle ?? "—"}
                    change={ch("erfasstVonRolle")}
                    enableChangeHighlight={isCorrection}
                />

                <ChangedField
                    label="Meldeweg"
                    fallbackValue={displayMeldeweg(d.meldeweg, d.meldewegSonstiges)}
                    change={ch("meldeweg")}
                    enableChangeHighlight={isCorrection}
                />

                <ChangedField
                    label="Meldende Stelle Kontakt"
                    fallbackValue={d.meldendeStelleKontakt ?? "—"}
                    change={ch("meldendeStelleKontakt")}
                    enableChangeHighlight={isCorrection}
                />

                <ChangedField
                    label="Dringlichkeit"
                    fallbackValue={displayDringlichkeit(d.dringlichkeit)}
                    change={ch("dringlichkeit")}
                    enableChangeHighlight={isCorrection}
                />

                <ChangedField
                    label="Datenbasis"
                    fallbackValue={displayDatenbasis(d.datenbasis)}
                    change={ch("datenbasis")}
                    enableChangeHighlight={isCorrection}
                />

                <ChangedField
                    label="Einwilligung vorhanden"
                    fallbackValue={formatBooleanJaNein(d.einwilligungVorhanden)}
                    change={ch("einwilligungVorhanden")}
                    enableChangeHighlight={isCorrection}
                />

                <ChangedField
                    label="Schweigepflichtentbindung vorhanden"
                    fallbackValue={formatBooleanJaNein(d.schweigepflichtentbindungVorhanden)}
                    change={ch("schweigepflichtentbindungVorhanden")}
                    enableChangeHighlight={isCorrection}
                />
            </div>
        </Section>
    );
}

function MeldungBlockFach({
                              d,
                              ch,
                              isCorrection,
                          }: {
    d: MeldungResponse;
    ch: ChangeLookup;
    isCorrection: boolean;
}) {
    return (
        <Section title="Fach">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ChangedField
                    label="Ampel"
                    fallbackValue={displayAmpel(d.fachAmpel)}
                    change={ch("fachAmpel")}
                    enableChangeHighlight={isCorrection}
                />

                <div className="sm:col-span-2">
                    <ChangedField
                        label="Fachtext"
                        fallbackValue={d.fachText ?? "—"}
                        change={ch("fachText")}
                        enableChangeHighlight={isCorrection}
                    />
                </div>

                <ChangedField
                    label="Abweichung zur Auto"
                    fallbackValue={displayAbweichungZurAuto(d.abweichungZurAuto)}
                    change={ch("abweichungZurAuto")}
                    enableChangeHighlight={isCorrection}
                />

                <div className="sm:col-span-2">
                    <ChangedField
                        label="Abweichungs-Begründung"
                        fallbackValue={d.abweichungsBegruendung ?? "—"}
                        change={ch("abweichungsBegruendung")}
                        enableChangeHighlight={isCorrection}
                    />
                </div>
            </div>
        </Section>
    );
}

function MeldungBlockAkut({
                              d,
                              ch,
                              isCorrection,
                          }: {
    d: MeldungResponse;
    ch: ChangeLookup;
    isCorrection: boolean;
}) {
    return (
        <Section title="Akut">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ChangedField
                    label="Gefahr im Verzug"
                    fallbackValue={d.akutGefahrImVerzug ? "Ja" : "Nein"}
                    change={ch("akutGefahrImVerzug")}
                    enableChangeHighlight={isCorrection}
                />

                <ChangedField
                    label="Notruf erforderlich"
                    fallbackValue={formatBooleanJaNein(d.akutNotrufErforderlich)}
                    change={ch("akutNotrufErforderlich")}
                    enableChangeHighlight={isCorrection}
                />

                <ChangedField
                    label="Kind sicher untergebracht"
                    fallbackValue={displayJaNeinUnklar(d.akutKindSicherUntergebracht)}
                    change={ch("akutKindSicherUntergebracht")}
                    enableChangeHighlight={isCorrection}
                />

                <div className="sm:col-span-2">
                    <ChangedField
                        label="Begründung"
                        fallbackValue={d.akutBegruendung ?? "—"}
                        change={ch("akutBegruendung")}
                        enableChangeHighlight={isCorrection}
                    />
                </div>
            </div>

            <Separator className="my-3" />

            <div className="text-sm font-semibold text-brand-text">Jugendamt</div>
            <div className="mt-3">
                {d.jugendamt ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <ChangedField
                            label="Informiert"
                            fallbackValue={displayJaNeinUnklar(d.jugendamt.informiert)}
                            change={ch("jugendamt.informiert")}
                            enableChangeHighlight={isCorrection}
                        />
                        <ChangedField
                            label="Kontakt am"
                            fallbackValue={formatDateTimeDE(d.jugendamt.kontaktAm)}
                            change={ch("jugendamt.kontaktAm")}
                            enableChangeHighlight={isCorrection}
                        />
                        <ChangedField
                            label="Kontaktart"
                            fallbackValue={d.jugendamt.kontaktart ?? "—"}
                            change={ch("jugendamt.kontaktart")}
                            enableChangeHighlight={isCorrection}
                        />
                        <ChangedField
                            label="Aktenzeichen"
                            fallbackValue={d.jugendamt.aktenzeichen ?? "—"}
                            change={ch("jugendamt.aktenzeichen")}
                            enableChangeHighlight={isCorrection}
                        />
                        <div className="sm:col-span-2">
                            <ChangedField
                                label="Begründung"
                                fallbackValue={d.jugendamt.begruendung ?? "—"}
                                change={ch("jugendamt.begruendung")}
                                enableChangeHighlight={isCorrection}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-brand-text2">—</div>
                )}
            </div>
        </Section>
    );
}

function MeldungBlockPlanung({
                                 d,
                                 ch,
                                 isCorrection,
                             }: {
    d: MeldungResponse;
    ch: ChangeLookup;
    isCorrection: boolean;
}) {
    return (
        <Section title="Planung">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ChangedField
                    label="Verantwortliche Fachkraft (UserId)"
                    fallbackValue={d.verantwortlicheFachkraftUserId ?? "—"}
                    change={ch("verantwortlicheFachkraftUserId")}
                    enableChangeHighlight={isCorrection}
                />

                <ChangedField
                    label="Nächste Überprüfung am"
                    fallbackValue={formatDateDE(d.naechsteUeberpruefungAm)}
                    change={ch("naechsteUeberpruefungAm")}
                    enableChangeHighlight={isCorrection}
                />

                <div className="sm:col-span-2">
                    <ChangedField
                        label="Zusammenfassung"
                        fallbackValue={d.zusammenfassung ?? "—"}
                        change={ch("zusammenfassung")}
                        enableChangeHighlight={isCorrection}
                    />
                </div>
            </div>
        </Section>
    );
}

function MeldungBlockListen({ d }: { d: MeldungResponse }) {
    return (
        <div className="space-y-6">
            <Section title="Beobachtungen">
                <SimpleTable
                    columns={[
                        { key: "zeit", label: "Zeitpunkt" },
                        { key: "zeitraum", label: "Zeitraum" },
                        { key: "ort", label: "Ort" },
                        { key: "quelle", label: "Quelle" },
                        { key: "text", label: "Text", className: "min-w-[320px]" },
                        { key: "woertlich", label: "Wörtliches Zitat", className: "min-w-[240px]" },
                        { key: "koerperbefund", label: "Körperbefund", className: "min-w-[220px]" },
                        { key: "verhaltenKind", label: "Verhalten Kind", className: "min-w-[220px]" },
                        { key: "verhaltenBezug", label: "Verhalten Bezug", className: "min-w-[220px]" },
                        { key: "sichtbarkeit", label: "Sichtbarkeit" },
                        { key: "tags", label: "Tags", className: "min-w-[260px]" },
                    ]}
                    rows={(d.observations ?? []).map((o) => ({
                        zeit: formatDateTimeDE(o.zeitpunkt),
                        zeitraum: o.zeitraum ?? "—",
                        ort: o.ortSonstiges ? `${o.ort ?? "—"} (${o.ortSonstiges})` : (o.ort ?? "—"),
                        quelle: o.quelle ?? "—",
                        text: o.text ?? "—",
                        woertlich: o.woertlichesZitat ?? "—",
                        koerperbefund: o.koerperbefund ?? "—",
                        verhaltenKind: o.verhaltenKind ?? "—",
                        verhaltenBezug: o.verhaltenBezug ?? "—",
                        sichtbarkeit: o.sichtbarkeit ?? "—",
                        tags: (o.tags ?? []).length
                            ? o.tags
                                .map((t) =>
                                    [
                                        anlassLabel(t.anlassCode),
                                        t.indicatorId,
                                        t.severity != null ? `S${t.severity}` : null,
                                        t.comment,
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")
                                )
                                .join(" | ")
                            : "—",
                    }))}
                />
            </Section>

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
                        status: displayKontaktStatus(c.status),
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
    );
}

function MeldungBlockAudit({ d }: { d: MeldungResponse }) {
    return (
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
                    maxHeightClassName="max-h-[42vh] md:max-h-[52vh] print:max-h-none"
                    columns={[
                        { key: "section", label: "Sektion" },
                        { key: "field", label: "Feld" },
                        { key: "at", label: "Zeit" },
                        { key: "old", label: "Alt", className: "min-w-[220px]" },
                        { key: "neu", label: "Neu", className: "min-w-[220px]" },
                        { key: "reason", label: "Grund", className: "min-w-[220px]" },
                        { key: "by", label: "Von" },
                    ]}
                    rows={(d.changes ?? []).map((c) => ({
                        section: c.section ?? "—",
                        field: c.fieldPath ?? "—",
                        at: formatDateTimeDE(c.changedAt),
                        old:
                            c.fieldPath === "anlassCodes"
                                ? formatAnlassList(c.oldValue ? JSON.parseSafe?.(c.oldValue) : c.oldValue)
                                : c.oldValue ?? "—",
                        neu:
                            c.fieldPath === "anlassCodes"
                                ? formatAnlassList(c.newValue ? JSON.parseSafe?.(c.newValue) : c.newValue)
                                : c.newValue ?? "—",
                        reason: c.reason ?? "—",
                        by: c.changedByDisplayName ?? "—",
                    }))}
                />
            </Section>
        </div>
    );
}

/* ---------------- Details Content ---------------- */

function MeldungDetailsContent({ d }: { d: MeldungResponse }) {
    const [tab, setTab] = useState<"inhalt" | "meta" | "fach" | "akut" | "planung" | "listen" | "audit">("inhalt");
    const isCorrection = String(d.type ?? "").toUpperCase() === "KORREKTUR" || !!d.correctsId;

    const changedMap = useMemo(() => getChangedMap(d.changes), [d.changes]);
    const ch: ChangeLookup = (fieldPath: string) => changedMap.get(fieldPath);

    return (
        <div className="space-y-4">
            {isCorrection ? (
                <div className="rounded-2xl border border-brand-warning/25 bg-brand-warning/10 p-3 text-sm text-brand-text">
                    <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 text-brand-text2" />
                        <div>
                            <div className="font-semibold">Korrekturvermerk</div>
                            <div className="text-brand-text2">
                                Diese Meldung ist eine Korrektur{d.correctsId ? ` zur Meldung #${d.correctsId}` : ""}. Geänderte Felder sind rot markiert.
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            <KeyFactsBar d={d} />

            <div className="print:hidden space-y-4">
                <Segmented
                    value={tab}
                    onChange={(v) => setTab(v as "inhalt" | "meta" | "fach" | "akut" | "planung" | "listen" | "audit")}
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

                {tab === "inhalt" ? <MeldungBlockInhalt d={d} ch={ch} isCorrection={isCorrection} /> : null}
                {tab === "meta" ? <MeldungBlockMeta d={d} ch={ch} isCorrection={isCorrection} /> : null}
                {tab === "fach" ? <MeldungBlockFach d={d} ch={ch} isCorrection={isCorrection} /> : null}
                {tab === "akut" ? <MeldungBlockAkut d={d} ch={ch} isCorrection={isCorrection} /> : null}
                {tab === "planung" ? <MeldungBlockPlanung d={d} ch={ch} isCorrection={isCorrection} /> : null}
                {tab === "listen" ? <MeldungBlockListen d={d} /> : null}
                {tab === "audit" ? <MeldungBlockAudit d={d} /> : null}
            </div>

            <div className="hidden print:block space-y-8">
                <MeldungBlockInhalt d={d} ch={ch} isCorrection={isCorrection} />
                <MeldungBlockMeta d={d} ch={ch} isCorrection={isCorrection} />
                <MeldungBlockFach d={d} ch={ch} isCorrection={isCorrection} />
                <MeldungBlockAkut d={d} ch={ch} isCorrection={isCorrection} />
                <MeldungBlockPlanung d={d} ch={ch} isCorrection={isCorrection} />
                <MeldungBlockListen d={d} />
                <MeldungBlockAudit d={d} />
            </div>
        </div>
    );
}

/* ---------------- Modal ---------------- */

function MeldungViewModal({
                              open,
                              onClose,
                              meldung,
                              title,
                              printUrl,
                          }: {
    open: boolean;
    onClose: () => void;
    meldung: MeldungResponse | null;
    title: string;
    printUrl: string | null;
}) {
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        if (open) window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 print:static print:block">
            <div className="absolute inset-0 bg-black/35 print:hidden" onClick={onClose} />

            <div className="absolute inset-x-2 top-2 bottom-2 sm:inset-x-6 sm:top-6 sm:bottom-6 lg:left-1/2 lg:w-[1100px] lg:-translate-x-1/2 print:static print:inset-auto print:w-auto print:translate-x-0">
                <div className="flex h-full flex-col rounded-3xl border border-brand-border/40 bg-brand-bg shadow-2xl print:block print:h-auto print:rounded-none print:border-0 print:bg-white print:shadow-none">
                    <div className="flex items-center justify-between gap-3 border-b border-brand-border/40 bg-white px-4 py-3 sm:px-5 print:hidden">
                        <div className="min-w-0">
                            <div className="text-base font-semibold text-brand-text truncate">{title}</div>
                            <div className="text-xs text-brand-text2">Lesemodus · druck- und PDF-taugliche Darstellung</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                className="h-10 gap-2"
                                onClick={() => {
                                    if (!printUrl) return;
                                    window.open(printUrl, "_blank", "noopener,noreferrer");
                                }}
                                title="Drucken / Als PDF sichern"
                                disabled={!printUrl}
                            >
                                <Printer className="h-4 w-4" />
                                Drucken
                            </Button>

                            <Button variant="secondary" className="h-10 w-10 p-0" onClick={onClose} title="Schließen">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 print:overflow-visible print:p-0">
                        {meldung ? (
                            <div className="mx-auto w-full max-w-5xl rounded-3xl border border-brand-border/40 bg-white p-4 sm:p-6 print:max-w-none print:rounded-none print:border-0 print:p-0">
                                <MeldungDetailsContent d={meldung} />
                            </div>
                        ) : (
                            <div className="mx-auto w-full max-w-5xl rounded-3xl border border-brand-border/40 bg-white p-6 text-sm text-brand-text2">
                                Lade Meldung…
                            </div>
                        )}
                    </div>
                </div>
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

    const fallId = useMemo(() => {
        const p = params as Record<string, string | string[] | undefined>;
        return safeNumber(p?.fallId) ?? null;
    }, [params]);

    const [data, setData] = useState<FalleroeffnungResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [meldungen, setMeldungen] = useState<MeldungVM[]>([]);
    const [meldLoading, setMeldLoading] = useState(false);
    const [meldErr, setMeldErr] = useState<string | null>(null);

    const [actionBusyId, setActionBusyId] = useState<number | null>(null);
    const [viewId, setViewId] = useState<number | null>(null);

    const autostartMeldungen = searchParams?.get("autostart") === "meldungen";

    function meldungEditorUrl(meldungId?: number, readonly?: boolean) {
        if (!fallId) return "/dashboard";

        const qs = new URLSearchParams();
        if (readonly) qs.set("mode", "readonly");
        if (typeof meldungId === "number") qs.set("meldungId", String(meldungId));

        const q = qs.toString();
        return `/dashboard/falloeffnungen/${fallId}/meldung${q ? `?${q}` : ""}`;
    }

    function meldungPrintUrl(meldungId?: number | null) {
        if (!fallId || typeof meldungId !== "number") return null;
        return `/dashboard/falloeffnungen/${fallId}/meldungen/${meldungId}/print`;
    }

    const hasAnyDraft = useMemo(() => meldungen.some((m) => isDraftStatus(m.status)), [meldungen]);
    const draftItem = useMemo(() => meldungen.find((m) => isDraftStatus(m.status)) ?? null, [meldungen]);

    const viewedItem = useMemo(() => meldungen.find((m) => m.id === viewId) ?? null, [meldungen, viewId]);
    const viewedDetail = viewedItem?.detail ?? null;

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
        const res: any = await apiFetch<any>(`/falloeffnungen/${fallIdValue}/meldungen?${cacheBust()}`, { method: "GET" });
        return Array.isArray(res) ? res : (res?.items ?? res?.data ?? res?.meldungen ?? []);
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
        if (!fallId) return m.detail ?? null;
        if (m.detail) return m.detail;

        try {
            const d = await getMeldungFresh(fallId, m.id);
            setMeldungen((prev) => prev.map((x) => (x.id === m.id ? { ...x, detail: d } : x)));
            return d;
        } catch (e) {
            console.error("detail error =", e);
            return null;
        }
    }

    async function openViewModal(m: MeldungVM) {
        setViewId(m.id);
        void ensureDetail(m);
    }

    async function doCorrect(targetId: number) {
        if (!fallId) return;

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
            router.push(meldungEditorUrl(created.id));
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
            router.push(meldungEditorUrl(created.id));
        } catch (e: unknown) {
            console.error(e);
            setMeldErr(errorMessage(e, "Neue Meldung konnte nicht gestartet werden."));
        } finally {
            setActionBusyId(null);
        }
    }

    useEffect(() => {
        loadFall();
        loadMeldungen();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fallId]);

    useEffect(() => {
        if (fallId && autostartMeldungen) {
            console.log("[FallMeldungenPage] autostart=meldungen");
        }
    }, [fallId, autostartMeldungen]);

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Fall · Meldungen" />

                <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 pb-12 pt-4 space-y-4">
                    {err ? (
                        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                            {err}
                        </div>
                    ) : null}

                    {meldErr ? (
                        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                            {meldErr}
                        </div>
                    ) : null}

                    {hasAnyDraft ? (
                        <div className="rounded-2xl border border-brand-warning/25 bg-brand-warning/10 p-3 text-sm text-brand-text">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 text-brand-text2" />
                                <div className="min-w-0">
                                    <div className="font-semibold">Entwurf vorhanden</div>
                                    <div className="text-brand-text2">
                                        Es existiert bereits ein Entwurf{draftItem ? ` (Meldung #${draftItem.id})` : ""}. Solange dieser Entwurf existiert, sind
                                        <span className="font-semibold"> „Korrigieren“</span> und <span className="font-semibold"> „Neue Meldung“</span> gesperrt.
                                    </div>
                                    <div className="mt-2">
                                        <Button
                                            className="h-10 gap-2"
                                            onClick={() => {
                                                if (draftItem) router.push(meldungEditorUrl(draftItem.id));
                                            }}
                                            disabled={!draftItem}
                                        >
                                            Entwurf öffnen
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className="rounded-2xl border border-brand-border/40 bg-white p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3 min-w-0">
                                <FileText className="h-5 w-5 text-brand-text2 mt-0.5" />
                                <div className="min-w-0">
                                    <div className="text-base font-semibold text-brand-text truncate">
                                        {data?.aktenzeichen ?? (loading ? "Lade…" : fallId ? `Fall #${fallId}` : "Fall")}
                                    </div>
                                    <div className="mt-1 text-sm text-brand-text2 truncate">
                                        {data?.kindName ? `Kind: ${data.kindName}` : "—"}
                                    </div>
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

                    {/* Kinderschutzbogen */}
                    <div className="rounded-2xl border border-brand-border/40 bg-white p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3 min-w-0">
                                <Shield className="h-5 w-5 text-brand-text2 mt-0.5" />
                                <div className="min-w-0">
                                    <div className="text-base font-semibold text-brand-text">
                                        Kinderschutzbogen
                                    </div>
                                    <div className="mt-1 text-sm text-brand-text2">
                                        Stuttgarter Kinderschutzbogen – Gefährdungseinschätzung
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    router.push(
                                        `/dashboard/falloeffnungen/${fallId}/kinderschutzbogen`
                                    )
                                }
                                className="gap-2 h-11 w-full sm:w-auto justify-center"
                            >
                                Assessments
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-end justify-between px-1">
                            <div>
                                <div className="text-sm font-semibold text-brand-text">Meldungen</div>
                                <div className="text-xs text-brand-text2">
                                    {meldLoading ? "Lade…" : `${meldungen.length} Einträge`}
                                </div>
                            </div>
                        </div>

                        {meldungen.length === 0 && !meldLoading ? (
                            <div className="rounded-2xl border border-brand-border/40 bg-white p-4 text-sm text-brand-text2">
                                Keine Meldungen vorhanden.
                            </div>
                        ) : null}

                        <div className="space-y-3">
                            {meldungen.map((m) => {
                                const d = m.detail;
                                const sachlage = d?.kurzbeschreibung ?? "—";
                                const createdBy = d?.createdByDisplayName ?? m.createdByDisplayName ?? "Unbekannt";
                                const createdAt = formatDateTimeDE(d?.createdAt ?? m.createdAt);

                                const closed = isClosedStatus(m.status);
                                const draft = isDraftStatus(m.status);
                                const busy = actionBusyId === m.id;

                                const canStartNewMeldung = closed && !!m.current && !hasAnyDraft;
                                const canCorrect = closed && !hasAnyDraft;

                                return (
                                    <Card key={m.id} className="border border-brand-border/25 shadow-sm">
                                        <CardHeader className="py-4">
                                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start gap-3">
                                                        <div className="rounded-2xl border border-brand-border/30 bg-brand-bg p-2 shrink-0">
                                                            <FileText className="h-5 w-5 text-brand-text2" />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm font-semibold text-brand-text break-words">
                                                                {sachlage}
                                                            </div>
                                                            <div className="mt-1 text-xs text-brand-text2">
                                                                Erstellt von {createdBy} am {createdAt}
                                                            </div>

                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <Badge tone={toneForStatus(m.status)}>{statusLabel(m.status)}</Badge>
                                                                {m.current ? <Badge tone="info">aktuell</Badge> : <Badge tone="neutral">v{m.versionNo}</Badge>}
                                                                {m.type ? <Badge tone="neutral">{m.type}</Badge> : null}
                                                                {m.correctsId ? <Badge tone="warning">korrigiert #{m.correctsId}</Badge> : null}
                                                                {m.supersedesId ? <Badge tone="neutral">ersetzt #{m.supersedesId}</Badge> : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                                    <Button
                                                        className="h-11 w-11 rounded-2xl p-0 shadow-sm"
                                                        onClick={() => void openViewModal(m)}
                                                        title="Meldung ansehen"
                                                        aria-label="Meldung ansehen"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </Button>

                                                    {draft ? (
                                                        <Button
                                                            onClick={() => router.push(meldungEditorUrl(m.id))}
                                                            className="h-11 gap-2"
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
                                                            onClick={() => void doCorrect(m.id)}
                                                            className="h-11 gap-2"
                                                            title={!canCorrect ? "Gesperrt: Entwurf vorhanden" : "Korrektur starten"}
                                                        >
                                                            <Wrench className="h-4 w-4" />
                                                            Korrigieren
                                                        </Button>
                                                    ) : null}

                                                    {canStartNewMeldung ? (
                                                        <Button
                                                            variant="secondary"
                                                            disabled={busy}
                                                            onClick={() => void doNewMeldungFromCurrent(m.id)}
                                                            className="h-11 gap-2"
                                                            title="Neue Meldung als Folgemeldung starten"
                                                        >
                                                            <CopyPlus className="h-4 w-4" />
                                                            Neue Meldung
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="pt-0">
                                            <Separator className="mb-4" />

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                                <div className="rounded-2xl border border-brand-border/25 bg-white p-3">
                                                    <div className="text-xs font-semibold text-brand-text2">Status</div>
                                                    <div className="mt-1 text-sm text-brand-text">{statusLabel(m.status)}</div>
                                                </div>

                                                <div className="rounded-2xl border border-brand-border/25 bg-white p-3">
                                                    <div className="text-xs font-semibold text-brand-text2">Typ</div>
                                                    <div className="mt-1 text-sm text-brand-text">{m.type || "—"}</div>
                                                </div>

                                                <div className="rounded-2xl border border-brand-border/25 bg-white p-3">
                                                    <div className="text-xs font-semibold text-brand-text2">Version</div>
                                                    <div className="mt-1 text-sm text-brand-text">v{m.versionNo}</div>
                                                </div>

                                                <div className="rounded-2xl border border-brand-border/25 bg-white p-3">
                                                    <div className="text-xs font-semibold text-brand-text2">Bezug</div>
                                                    <div className="mt-1 text-sm text-brand-text">
                                                        {m.correctsId ? `Korrigiert #${m.correctsId}` : m.supersedesId ? `Ersetzt #${m.supersedesId}` : "—"}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <MeldungViewModal
                    open={viewId !== null}
                    onClose={() => setViewId(null)}
                    meldung={viewedDetail}
                    printUrl={meldungPrintUrl(viewedItem?.id ?? null)}
                    title={
                        viewedItem
                            ? `Meldung #${viewedItem.id} · ${viewedItem.type || "Meldung"} · v${viewedItem.versionNo}`
                            : "Meldung ansehen"
                    }
                />
            </div>
        </AuthGate>
    );
}

/* ---------------- Safe JSON helper ---------------- */

declare global {
    interface JSON {
        parseSafe?: (value: string) => unknown;
    }
}

if (!JSON.parseSafe) {
    JSON.parseSafe = (value: string) => {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    };
}