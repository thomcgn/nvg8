"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { FalleroeffnungResponse } from "@/lib/types";
import { meldungApi, type MeldungResponse, type MeldungListItemResponse } from "@/lib/api/meldung";
import { meldebogenApi, type MeldebogenResponse, type MeldebogenListItem } from "@/lib/api/meldebogen";
import {
  kinderschutzbogenApi,
  type KinderschutzbogenResponse,
  type KinderschutzbogenListItem,
} from "@/lib/api/kinderschutzbogen";
import { djiApi, type DjiAssessmentResponse, type DjiAssessmentListItem } from "@/lib/api/dji";
import { schutzplanApi, type SchutzplanResponse, type SchutzplanListItem } from "@/lib/api/schutzplan";
import { hausbesuchApi, type HausbesuchResponse, type HausbesuchListItem } from "@/lib/api/hausbesuch";
import CaseExportShell from "@/components/fall/CaseExportShell";
import { anlassLabel } from "@/lib/anlass/catalog";

type ExportPayload = {
  fall: FalleroeffnungResponse | null;
  meldungen: MeldungResponse[];
  meldeboegen: MeldebogenResponse[];
  kinderschutzboegen: KinderschutzbogenResponse[];
  dji: DjiAssessmentResponse[];
  schutzplaene: SchutzplanResponse[];
  hausbesuche: HausbesuchResponse[];
};

type TimelineEntry = {
  key: string;
  date: string | null | undefined;
  title: string;
  subtitle?: string;
  body?: string;
  section: string;
};

function parseId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function fmtDate(value: string | null | undefined, withTime = false) {
  if (!value) return "—";
  const date = new Date(withTime ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date(value);
    if (Number.isNaN(fallback.getTime())) return String(value);
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "medium",
      timeStyle: withTime ? "short" : undefined,
    }).format(fallback);
  }
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: withTime ? "short" : undefined,
  }).format(date);
}

function valueText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (Array.isArray(value)) return value.length ? value.map(valueText).join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

/** Abschnitt mit Trennlinie-Überschrift */
function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="print-section">
      <div className="border-b-2 border-gray-700 pb-1 mb-3">
        <div className="text-[11px] font-bold uppercase tracking-widest text-gray-700">{title}</div>
        {subtitle ? <div className="text-[10px] text-gray-500 mt-0.5">{subtitle}</div> : null}
      </div>
      {children}
    </section>
  );
}

/** Schlüssel-Wert-Zeile */
function Kv({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-x-4 border-b border-gray-100 py-1.5 text-sm">
      <div className="font-medium text-gray-500 shrink-0">{label}</div>
      <div className="whitespace-pre-wrap text-gray-900">{value}</div>
    </div>
  );
}

function isClosedStatus(status?: string | null) {
  const s = (status || "").toLowerCase();
  return s.includes("abgesch") || s.includes("geschlossen") || s.includes("done") || s.includes("submitted");
}

function isDraftStatus(status?: string | null) {
  const s = (status || "").toLowerCase();
  return s.includes("entwurf") || s.includes("draft");
}

async function loadByList<TList extends { id: number }, TDetail>(
  listLoader: () => Promise<TList[]>,
  detailLoader: (id: number) => Promise<TDetail>
) {
  const items = await listLoader();
  const details = await Promise.allSettled(items.map((item) => detailLoader(item.id)));
  return details.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
}

function buildTimeline(data: ExportPayload): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  if (data.fall) {
    entries.push({
      key: `fall-${data.fall.id}`,
      date: data.fall.createdAt ?? null,
      title: "Fall angelegt",
      subtitle: data.fall.titel ?? `Fall #${data.fall.id}`,
      body: data.fall.kurzbeschreibung ?? undefined,
      section: "Fall",
    });
  }

  data.meldungen.forEach((item) => {
    entries.push({
      key: `meldung-${item.id}`,
      date: item.createdAt ?? null,
      title: `Meldung #${item.id}`,
      subtitle: item.status ?? undefined,
      body: item.kurzbeschreibung ?? item.fachText ?? item.zusammenfassung ?? undefined,
      section: "Meldung",
    });
  });

  data.meldeboegen.forEach((item) => {
    entries.push({
      key: `meldebogen-${item.id}`,
      date: item.eingangsdatum ?? null,
      title: `Meldebogen #${item.id}`,
      subtitle: item.meldungart ?? undefined,
      body: item.ersteinschaetzung ?? item.schilderung ?? undefined,
      section: "Eingangserfassung",
    });
  });

  data.kinderschutzboegen.forEach((item) => {
    entries.push({
      key: `kinderschutz-${item.id}`,
      date: item.bewertungsdatum ?? null,
      title: `Kinderschutzbogen #${item.id}`,
      subtitle: valueText(item.gesamteinschaetzungManuell ?? item.gesamteinschaetzungAuto),
      body: item.gesamteinschaetzungFreitext ?? undefined,
      section: "Kinderschutzbogen",
    });
  });

  data.dji.forEach((item) => {
    entries.push({
      key: `dji-${item.id}`,
      date: item.bewertungsdatum ?? null,
      title: `${item.formTypLabel ?? "DJI-Prüfbogen"} #${item.id}`,
      subtitle: item.gesamteinschaetzungLabel ?? item.gesamteinschaetzung ?? undefined,
      body: item.gesamtfreitext ?? undefined,
      section: "DJI",
    });
  });

  data.schutzplaene.forEach((item) => {
    entries.push({
      key: `schutzplan-${item.id}`,
      date: item.erstelltAm ?? null,
      title: `Schutzplan #${item.id}`,
      subtitle: item.status ?? undefined,
      body: item.gefaehrdungssituation ?? item.vereinbarungen ?? undefined,
      section: "Schutzplanung",
    });
  });

  data.hausbesuche.forEach((item) => {
    entries.push({
      key: `hausbesuch-${item.id}`,
      date: item.besuchsdatum ?? null,
      title: `Hausbesuch #${item.id}`,
      subtitle: item.einschaetzungAmpel ?? undefined,
      body: item.einschaetzungText ?? item.naechsteSchritte ?? undefined,
      section: "Hausbesuch",
    });
  });

  return entries.sort((a, b) => {
    const av = a.date ? new Date(a.date).getTime() : 0;
    const bv = b.date ? new Date(b.date).getTime() : 0;
    return av - bv;
  });
}

function SignatureBlock() {
  return (
    <Section title="Freigabe / Unterschrift">
      <div className="grid grid-cols-2 gap-10 mt-6">
        <div>
          <div className="h-14 border-b border-gray-500" />
          <div className="mt-1 text-xs text-gray-500">Datum / Ort</div>
        </div>
        <div>
          <div className="h-14 border-b border-gray-500" />
          <div className="mt-1 text-xs text-gray-500">Unterschrift / Stempel</div>
        </div>
      </div>
    </Section>
  );
}

export default function FallExportPage() {
  const params = useParams<{ fallId?: string | string[] }>();
  const fallId = parseId(params.fallId);
  const shellFallId = fallId ?? "";
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<ExportPayload | null>(null);

  React.useEffect(() => {
    if (!fallId) return;
    const fid: number = fallId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [fallRes, meldungenRes, meldeboegenRes, kinderschutzRes, djiRes, schutzplaeneRes, hausbesucheRes] =
          await Promise.allSettled([
            apiFetch<FalleroeffnungResponse>(`/falloeffnungen/${fid}`),
            loadByList<MeldungListItemResponse, MeldungResponse>(() => meldungApi.list(fid), (id) =>
              meldungApi.get(fid, id)
            ),
            loadByList<MeldebogenListItem, MeldebogenResponse>(() => meldebogenApi.list(fid), (id) =>
              meldebogenApi.get(fid, id)
            ),
            loadByList<KinderschutzbogenListItem, KinderschutzbogenResponse>(
              () => kinderschutzbogenApi.list(fid),
              (id) => kinderschutzbogenApi.get(fid, id)
            ),
            loadByList<DjiAssessmentListItem, DjiAssessmentResponse>(() => djiApi.list(fid), (id) =>
              djiApi.get(fid, id)
            ),
            loadByList<SchutzplanListItem, SchutzplanResponse>(() => schutzplanApi.list(fid), (id) =>
              schutzplanApi.get(fid, id)
            ),
            loadByList<HausbesuchListItem, HausbesuchResponse>(() => hausbesuchApi.list(fid), (id) =>
              hausbesuchApi.get(fid, id)
            ),
          ]);

        if (cancelled) return;

        setData({
          fall: fallRes.status === "fulfilled" ? fallRes.value : null,
          meldungen: meldungenRes.status === "fulfilled" ? meldungenRes.value : [],
          meldeboegen: meldeboegenRes.status === "fulfilled" ? meldeboegenRes.value : [],
          kinderschutzboegen: kinderschutzRes.status === "fulfilled" ? kinderschutzRes.value : [],
          dji: djiRes.status === "fulfilled" ? djiRes.value : [],
          schutzplaene: schutzplaeneRes.status === "fulfilled" ? schutzplaeneRes.value : [],
          hausbesuche: hausbesucheRes.status === "fulfilled" ? hausbesucheRes.value : [],
        });
      } catch {
        if (!cancelled) setError("Der Fall-Export konnte nicht geladen werden.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fallId]);

  const timeline = React.useMemo(() => (data ? buildTimeline(data) : []), [data]);

  return (
    <CaseExportShell title="Fallakte als PDF" fallId={shellFallId} subtitle="DIN A4 Exportansicht">
      {fallId == null ? (
        <p className="text-sm text-gray-600 p-4">Ungültige Fall-ID – die URL enthält keine gültige fallId.</p>
      ) : loading ? (
        <p className="text-sm text-gray-500 p-4">Export wird vorbereitet…</p>
      ) : error || !data ? (
        <p className="text-sm text-gray-600 p-4">{error ?? "Die Daten konnten nicht geladen werden."}</p>
      ) : (
        <div className="print-root">
          <div className="print-doc space-y-6">

            {/* Dokumentkopf */}
            <div className="border-b-2 border-gray-800 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                    Fallakte · Vollständige Dokumentation
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {data.fall?.titel ?? `Fall #${fallId}`}
                  </h1>
                </div>
                <div className="text-right text-xs text-gray-600 shrink-0 space-y-0.5">
                  <div><span className="font-medium">Fall-ID:</span> {data.fall?.id ?? fallId}</div>
                  <div><span className="font-medium">Aktenzeichen:</span> {data.fall?.aktenzeichen ?? "—"}</div>
                  <div><span className="font-medium">Status:</span> {data.fall?.status ?? "—"}</div>
                  <div><span className="font-medium">Kind:</span> {data.fall?.kindName ?? "—"}</div>
                  <div className="pt-1 text-gray-400">Exportiert: {fmtDate(new Date().toISOString(), true)}</div>
                </div>
              </div>
            </div>

            {/* Zusammenfassung */}
            <Section title="Zusammenfassung">
              <Kv label="Kurzbeschreibung" value={data.fall?.kurzbeschreibung ?? "—"} />
              <Kv label="Meldungen gesamt" value={data.meldungen.length} />
              <Kv label="davon abgeschlossen" value={data.meldungen.filter((m) => isClosedStatus(m.status)).length} />
              <Kv label="davon als Entwurf" value={data.meldungen.filter((m) => isDraftStatus(m.status)).length} />
              <Kv label="Schutzpläne" value={data.schutzplaene.length} />
              <Kv label="Chronologie-Einträge" value={timeline.length} />
              <Kv
                label="Letzter Eintrag"
                value={
                  timeline.length
                    ? `${fmtDate(timeline[timeline.length - 1]?.date, true)} · ${timeline[timeline.length - 1]?.title}`
                    : "—"
                }
              />
            </Section>

            {/* Stammdaten */}
            <Section title="Fallübersicht" subtitle="Stammdaten des Falls">
              <Kv label="Fall-ID" value={data.fall?.id ?? fallId} />
              <Kv label="Aktenzeichen" value={data.fall?.aktenzeichen ?? "—"} />
              <Kv label="Status" value={data.fall?.status ?? "—"} />
              <Kv label="Titel" value={data.fall?.titel ?? "—"} />
              <Kv label="Kurzbeschreibung" value={data.fall?.kurzbeschreibung ?? "—"} />
              <Kv label="Kind" value={data.fall?.kindName ?? "—"} />
              <Kv label="Angelegt" value={fmtDate(data.fall?.createdAt ?? null, true)} />
            </Section>

            {/* Chronologie */}
            <Section title="Fallchronologie" subtitle="Zeitliche Übersicht über alle registrierten Module">
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-500">Keine Chronologie-Einträge vorhanden.</p>
              ) : (
                <div>
                  {timeline.map((entry) => (
                    <div key={entry.key} className="print-avoid-break border-b border-gray-100 py-2">
                      <div className="flex items-start justify-between gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-900">{entry.title}</span>
                          {entry.subtitle ? (
                            <span className="ml-2 text-gray-500">· {entry.subtitle}</span>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-right text-xs text-gray-500">
                          <span className="mr-2 font-medium">[{entry.section}]</span>
                          {fmtDate(entry.date, true)}
                        </div>
                      </div>
                      {entry.body ? (
                        <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{entry.body}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Meldungen */}
            <Section title={`Meldungen (${data.meldungen.length})`}>
              {data.meldungen.length === 0 ? (
                <p className="text-sm text-gray-500">Keine Meldungen vorhanden.</p>
              ) : (
                data.meldungen.map((item) => (
                  <div key={item.id} className="print-avoid-break border border-gray-200 p-3 mb-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-1 mb-2 text-sm font-medium text-gray-900">
                      <span>Meldung #{item.id} · Version {item.versionNo}</span>
                      <span className="text-gray-500">{item.status ?? "—"}</span>
                    </div>
                    <Kv label="Angelegt von" value={item.createdByDisplayName ?? "—"} />
                    <Kv label="Angelegt am" value={fmtDate(item.createdAt ?? null, true)} />
                    <Kv
                      label="Anlässe"
                      value={
                        Array.isArray(item.anlassCodes)
                          ? item.anlassCodes.map((code) => anlassLabel(code)).join(", ")
                          : "—"
                      }
                    />
                    <Kv label="Kurzbeschreibung" value={item.kurzbeschreibung ?? "—"} />
                    <Kv label="Fachbewertung" value={item.fachText ?? "—"} />
                    <Kv label="Zusammenfassung" value={item.zusammenfassung ?? "—"} />
                  </div>
                ))
              )}
            </Section>

            {/* Meldebögen */}
            <Section title={`Meldebögen (${data.meldeboegen.length})`}>
              {data.meldeboegen.length === 0 ? (
                <p className="text-sm text-gray-500">Keine Meldebögen vorhanden.</p>
              ) : (
                data.meldeboegen.map((item) => (
                  <div key={item.id} className="print-avoid-break border border-gray-200 p-3 mb-3">
                    <div className="border-b border-gray-200 pb-1 mb-2 text-sm font-medium text-gray-900">
                      Meldebogen #{item.id}
                    </div>
                    <Kv label="Eingangsdatum" value={fmtDate(item.eingangsdatum)} />
                    <Kv label="Meldungsart" value={item.meldungart ?? "—"} />
                    <Kv label="Ersteinschätzung" value={item.ersteinschaetzung ?? "—"} />
                    <Kv label="Handlungsdringlichkeit" value={item.handlungsdringlichkeit ?? "—"} />
                    <Kv label="Schilderung" value={item.schilderung ?? "—"} />
                  </div>
                ))
              )}
            </Section>

            {/* Kinderschutzbögen */}
            <Section title={`Kinderschutzbögen (${data.kinderschutzboegen.length})`}>
              {data.kinderschutzboegen.length === 0 ? (
                <p className="text-sm text-gray-500">Keine Kinderschutzbögen vorhanden.</p>
              ) : (
                data.kinderschutzboegen.map((item) => (
                  <div key={item.id} className="print-avoid-break border border-gray-200 p-3 mb-3">
                    <div className="border-b border-gray-200 pb-1 mb-2 text-sm font-medium text-gray-900">
                      Assessment #{item.id}
                    </div>
                    <Kv label="Altersgruppe" value={item.altergruppeLabel ?? item.altersgruppe} />
                    <Kv label="Bewertungsdatum" value={fmtDate(item.bewertungsdatum)} />
                    <Kv label="Auto-Einschätzung" value={valueText(item.gesamteinschaetzungAuto)} />
                    <Kv label="Manuelle Einschätzung" value={valueText(item.gesamteinschaetzungManuell)} />
                    <Kv label="Freitext" value={item.gesamteinschaetzungFreitext ?? "—"} />
                  </div>
                ))
              )}
            </Section>

            {/* DJI */}
            <Section title={`DJI-Prüfbögen (${data.dji.length})`}>
              {data.dji.length === 0 ? (
                <p className="text-sm text-gray-500">Keine DJI-Prüfbögen vorhanden.</p>
              ) : (
                data.dji.map((item) => (
                  <div key={item.id} className="print-avoid-break border border-gray-200 p-3 mb-3">
                    <div className="border-b border-gray-200 pb-1 mb-2 text-sm font-medium text-gray-900">
                      {item.formTypLabel} #{item.id}
                    </div>
                    <Kv label="Bewertungsdatum" value={fmtDate(item.bewertungsdatum)} />
                    <Kv label="Gesamteinschätzung" value={item.gesamteinschaetzungLabel ?? item.gesamteinschaetzung ?? "—"} />
                    <Kv label="Freitext" value={item.gesamtfreitext ?? "—"} />
                  </div>
                ))
              )}
            </Section>

            {/* Schutzpläne */}
            <Section title={`Schutzpläne (${data.schutzplaene.length})`}>
              {data.schutzplaene.length === 0 ? (
                <p className="text-sm text-gray-500">Keine Schutzpläne vorhanden.</p>
              ) : (
                data.schutzplaene.map((item) => (
                  <div key={item.id} className="print-avoid-break border border-gray-200 p-3 mb-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-1 mb-2 text-sm font-medium text-gray-900">
                      <span>Schutzplan #{item.id}</span>
                      <span className="text-gray-500">{item.status ?? "—"}</span>
                    </div>
                    <Kv label="Erstellt am" value={fmtDate(item.erstelltAm)} />
                    <Kv label="Gültig bis" value={fmtDate(item.gueltigBis)} />
                    <Kv label="Gefährdungssituation" value={item.gefaehrdungssituation ?? "—"} />
                    <Kv label="Vereinbarungen" value={item.vereinbarungen ?? "—"} />
                    <Kv label="Beteiligte" value={item.beteiligte ?? "—"} />
                    <Kv
                      label="Maßnahmen"
                      value={
                        item.massnahmen.length
                          ? item.massnahmen.map((m) => `${m.position}. ${m.massnahme} (${m.status})`).join("\n")
                          : "—"
                      }
                    />
                  </div>
                ))
              )}
            </Section>

            {/* Hausbesuche */}
            <Section title={`Hausbesuche (${data.hausbesuche.length})`}>
              {data.hausbesuche.length === 0 ? (
                <p className="text-sm text-gray-500">Keine Hausbesuche vorhanden.</p>
              ) : (
                data.hausbesuche.map((item) => (
                  <div key={item.id} className="print-avoid-break border border-gray-200 p-3 mb-3">
                    <div className="border-b border-gray-200 pb-1 mb-2 text-sm font-medium text-gray-900">
                      Hausbesuch #{item.id}
                    </div>
                    <Kv label="Besuchsdatum" value={fmtDate(item.besuchsdatum)} />
                    <Kv label="Anwesende" value={item.anwesende ?? "—"} />
                    <Kv label="Ampel" value={item.einschaetzungAmpel ?? "—"} />
                    <Kv label="Einschätzung" value={item.einschaetzungText ?? "—"} />
                    <Kv label="Nächste Schritte" value={item.naechsteSchritte ?? "—"} />
                  </div>
                ))
              )}
            </Section>

            <SignatureBlock />
          </div>
        </div>
      )}
    </CaseExportShell>
  );
}
