
"use client";

import * as React from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { FalleroeffnungResponse } from '@/lib/types';
import { meldungApi, type MeldungResponse, type MeldungListItemResponse } from '@/lib/api/meldung';
import { meldebogenApi, type MeldebogenResponse, type MeldebogenListItem } from '@/lib/api/meldebogen';
import { kinderschutzbogenApi, type KinderschutzbogenResponse, type KinderschutzbogenListItem } from '@/lib/api/kinderschutzbogen';
import { djiApi, type DjiAssessmentResponse, type DjiAssessmentListItem } from '@/lib/api/dji';
import { schutzplanApi, type SchutzplanResponse, type SchutzplanListItem } from '@/lib/api/schutzplan';
import { hausbesuchApi, type HausbesuchResponse, type HausbesuchListItem } from '@/lib/api/hausbesuch';
import CaseWizardShell from '@/components/fall/CaseWizardShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Printer, FileOutput, ShieldCheck, Clock3, CheckCircle2 } from 'lucide-react';
import { anlassLabel } from '@/lib/anlass/catalog';

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
  if (!value) return '—';
  const date = new Date(withTime ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date(value);
    if (Number.isNaN(fallback.getTime())) return String(value);
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: withTime ? 'short' : undefined }).format(fallback);
  }
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: withTime ? 'short' : undefined }).format(date);
}

function valueText(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  if (Array.isArray(value)) return value.length ? value.map(valueText).join(', ') : '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="print-section rounded-2xl border border-brand-border/40 bg-white p-4 sm:p-5">
      <div className="mb-3">
        <div className="text-base font-semibold text-brand-text">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-brand-text2">{subtitle}</div> : null}
      </div>
      {children}
    </section>
  );
}

function Kv({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[220px_1fr] sm:gap-4">
      <div className="text-sm font-medium text-brand-text2">{label}</div>
      <div className="whitespace-pre-wrap text-sm text-brand-text">{value}</div>
    </div>
  );
}

function FactCard({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-border/30 bg-white p-4">
      <div className="flex items-center gap-2 text-sm text-brand-text2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-brand-text">{value}</div>
    </div>
  );
}

function isClosedStatus(status?: string | null) {
  const s = (status || '').toLowerCase();
  return s.includes('abgesch') || s.includes('geschlossen') || s.includes('done') || s.includes('submitted');
}

function isDraftStatus(status?: string | null) {
  const s = (status || '').toLowerCase();
  return s.includes('entwurf') || s.includes('draft');
}

async function loadByList<TList extends { id: number }, TDetail>(
  listLoader: () => Promise<TList[]>,
  detailLoader: (id: number) => Promise<TDetail>,
) {
  const items = await listLoader();
  const details = await Promise.allSettled(items.map((item) => detailLoader(item.id)));
  return details.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
}

function buildTimeline(data: ExportPayload): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  if (data.fall) {
    entries.push({
      key: `fall-${data.fall.id}`,
      date: data.fall.createdAt ?? null,
      title: 'Fall angelegt',
      subtitle: data.fall.titel ?? `Fall #${data.fall.id}`,
      body: data.fall.kurzbeschreibung ?? undefined,
      section: 'Fall',
    });
  }

  data.meldungen.forEach((item) => {
    entries.push({
      key: `meldung-${item.id}`,
      date: item.createdAt ?? null,
      title: `Meldung #${item.id}`,
      subtitle: item.status ?? undefined,
      body: item.kurzbeschreibung ?? item.fachlicheBewertung ?? undefined,
      section: 'Meldung',
    });
  });

  data.meldeboegen.forEach((item) => {
    entries.push({
      key: `meldebogen-${item.id}`,
      date: item.eingangsdatum ?? null,
      title: `Meldebogen #${item.id}`,
      subtitle: item.meldungart ?? undefined,
      body: item.ersteinschaetzung ?? item.schilderung ?? undefined,
      section: 'Eingangserfassung',
    });
  });

  data.kinderschutzboegen.forEach((item) => {
    entries.push({
      key: `kinderschutz-${item.id}`,
      date: item.bewertungsdatum ?? null,
      title: `Kinderschutzbogen #${item.id}`,
      subtitle: valueText(item.gesamteinschaetzungManuell ?? item.gesamteinschaetzungAuto),
      body: item.gesamteinschaetzungFreitext ?? undefined,
      section: 'Kinderschutzbogen',
    });
  });

  data.dji.forEach((item) => {
    entries.push({
      key: `dji-${item.id}`,
      date: item.bewertungsdatum ?? null,
      title: `${item.formTypLabel ?? 'DJI-Prüfbogen'} #${item.id}`,
      subtitle: item.gesamteinschaetzungLabel ?? item.gesamteinschaetzung ?? undefined,
      body: item.gesamtfreitext ?? undefined,
      section: 'DJI',
    });
  });

  data.schutzplaene.forEach((item) => {
    entries.push({
      key: `schutzplan-${item.id}`,
      date: item.erstelltAm ?? null,
      title: `Schutzplan #${item.id}`,
      subtitle: item.status ?? undefined,
      body: item.gefaehrdungssituation ?? item.vereinbarungen ?? undefined,
      section: 'Schutzplanung',
    });
  });

  data.hausbesuche.forEach((item) => {
    entries.push({
      key: `hausbesuch-${item.id}`,
      date: item.besuchsdatum ?? null,
      title: `Hausbesuch #${item.id}`,
      subtitle: item.einschaetzungAmpel ?? undefined,
      body: item.einschaetzungText ?? item.naechsteSchritte ?? undefined,
      section: 'Hausbesuch',
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
    <Section title="Freigabe / Unterschrift" subtitle="Für Ausdruck oder PDF-Abnahme">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="h-20 rounded-xl border border-dashed border-brand-border/60" />
          <div className="mt-2 text-sm text-brand-text2">Datum / Ort</div>
        </div>
        <div>
          <div className="h-20 rounded-xl border border-dashed border-brand-border/60" />
          <div className="mt-2 text-sm text-brand-text2">Unterschrift / Name</div>
        </div>
      </div>
    </Section>
  );
}

export default function FallExportPage() {
  const params = useParams<{ fallId?: string | string[] }>();
  const fallId = parseId(params.fallId);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<ExportPayload | null>(null);

  React.useEffect(() => {
    if (!fallId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [fallRes, meldungenRes, meldeboegenRes, kinderschutzRes, djiRes, schutzplaeneRes, hausbesucheRes] = await Promise.allSettled([
          apiFetch<FalleroeffnungResponse>(`/falloeffnungen/${fallId}`),
          loadByList<MeldungListItemResponse, MeldungResponse>(() => meldungApi.list(fallId), (id) => meldungApi.get(fallId, id)),
          loadByList<MeldebogenListItem, MeldebogenResponse>(() => meldebogenApi.list(fallId), (id) => meldebogenApi.get(fallId, id)),
          loadByList<KinderschutzbogenListItem, KinderschutzbogenResponse>(() => kinderschutzbogenApi.list(fallId), (id) => kinderschutzbogenApi.get(fallId, id)),
          loadByList<DjiAssessmentListItem, DjiAssessmentResponse>(() => djiApi.list(fallId), (id) => djiApi.get(fallId, id)),
          loadByList<SchutzplanListItem, SchutzplanResponse>(() => schutzplanApi.list(fallId), (id) => schutzplanApi.get(fallId, id)),
          loadByList<HausbesuchListItem, HausbesuchResponse>(() => hausbesuchApi.list(fallId), (id) => hausbesuchApi.get(fallId, id)),
        ]);

        if (cancelled) return;

        setData({
          fall: fallRes.status === 'fulfilled' ? fallRes.value : null,
          meldungen: meldungenRes.status === 'fulfilled' ? meldungenRes.value : [],
          meldeboegen: meldeboegenRes.status === 'fulfilled' ? meldeboegenRes.value : [],
          kinderschutzboegen: kinderschutzRes.status === 'fulfilled' ? kinderschutzRes.value : [],
          dji: djiRes.status === 'fulfilled' ? djiRes.value : [],
          schutzplaene: schutzplaeneRes.status === 'fulfilled' ? schutzplaeneRes.value : [],
          hausbesuche: hausbesucheRes.status === 'fulfilled' ? hausbesucheRes.value : [],
        });
      } catch {
        if (!cancelled) setError('Der Fall-Export konnte nicht geladen werden.');
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
    <CaseWizardShell title="Fallakte als PDF" fallId={fallId ?? '—'} currentStep="export">
      <div className="print:hidden flex justify-end">
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          Als PDF / drucken
        </Button>
      </div>

      {fallId == null ? (
        <Alert>
          <AlertTitle>Ungültige Fall-ID</AlertTitle>
          <AlertDescription>Die URL enthält keine gültige fallId.</AlertDescription>
        </Alert>
      ) : loading ? (
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">Export wird vorbereitet…</div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Bitte einen Moment.</CardContent>
        </Card>
      ) : error || !data ? (
        <Alert>
          <AlertTitle>Export nicht verfügbar</AlertTitle>
          <AlertDescription>{error ?? 'Die Daten konnten nicht geladen werden.'}</AlertDescription>
        </Alert>
      ) : (
        <div className="print-root space-y-4">
          <div className="print-doc space-y-4">
            <section className="rounded-3xl border border-brand-border/40 bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-border/40 px-3 py-1 text-xs font-medium text-brand-text2">
                    <FileOutput className="h-3.5 w-3.5" />
                    Vollständige Fallakte
                  </div>
                  <h1 className="mt-4 text-2xl font-bold text-brand-text sm:text-3xl">
                    {data.fall?.titel ?? `Fall #${fallId}`}
                  </h1>
                  <div className="mt-2 text-sm text-brand-text2">
                    Exportiert am {fmtDate(new Date().toISOString(), true)}
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-brand-text2">
                  <div><span className="font-medium text-brand-text">Fall-ID:</span> {data.fall?.id ?? fallId}</div>
                  <div><span className="font-medium text-brand-text">Aktenzeichen:</span> {data.fall?.aktenzeichen ?? '—'}</div>
                  <div><span className="font-medium text-brand-text">Status:</span> {data.fall?.status ?? '—'}</div>
                  <div><span className="font-medium text-brand-text">Kind:</span> {data.fall?.kindName ?? '—'}</div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <FactCard label="Meldungen" value={data.meldungen.length} icon={<CheckCircle2 className="h-4 w-4" />} />
                <FactCard label="Offene / Entwürfe" value={data.meldungen.filter((m) => !isClosedStatus(m.status)).length} icon={<Clock3 className="h-4 w-4" />} />
                <FactCard label="Schutzpläne" value={data.schutzplaene.length} icon={<ShieldCheck className="h-4 w-4" />} />
                <FactCard label="Chronologie-Einträge" value={timeline.length} icon={<FileOutput className="h-4 w-4" />} />
              </div>
            </section>

            <Section title="Management Summary" subtitle="Verdichteter Überblick für Fallakte und PDF">
              <Kv label="Kurzbeschreibung" value={data.fall?.kurzbeschreibung ?? '—'} />
              <Kv label="Meldungen abgeschlossen" value={data.meldungen.filter((m) => isClosedStatus(m.status)).length} />
              <Kv label="Meldungen als Entwurf" value={data.meldungen.filter((m) => isDraftStatus(m.status)).length} />
              <Kv label="Letzter Chronologie-Eintrag" value={timeline.length ? `${fmtDate(timeline[timeline.length - 1]?.date, true)} · ${timeline[timeline.length - 1]?.title}` : '—'} />
            </Section>

            <Section title="Fallübersicht" subtitle="Stammdaten des Falls">
              <Kv label="Fall-ID" value={data.fall?.id ?? fallId} />
              <Kv label="Aktenzeichen" value={data.fall?.aktenzeichen ?? '—'} />
              <Kv label="Status" value={data.fall?.status ?? '—'} />
              <Kv label="Titel" value={data.fall?.titel ?? '—'} />
              <Kv label="Kurzbeschreibung" value={data.fall?.kurzbeschreibung ?? '—'} />
              <Kv label="Kind" value={data.fall?.kindName ?? '—'} />
              <Kv label="Angelegt" value={fmtDate(data.fall?.createdAt ?? null, true)} />
            </Section>

            <Section title="Fallchronologie" subtitle="Zeitliche Übersicht über alle registrierten Module">
              {timeline.length === 0 ? (
                <div className="text-sm text-brand-text2">Keine Chronologie-Einträge vorhanden.</div>
              ) : (
                <div className="space-y-3">
                  {timeline.map((entry, index) => (
                    <div key={entry.key} className="print-avoid-break rounded-2xl border border-brand-border/30 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-medium text-brand-text">{entry.title}</div>
                          <div className="mt-1 text-sm text-brand-text2">{entry.subtitle || '—'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{entry.section}</Badge>
                          <span className="text-sm text-brand-text2">{fmtDate(entry.date, true)}</span>
                        </div>
                      </div>
                      {entry.body ? <div className="mt-3 whitespace-pre-wrap text-sm text-brand-text">{entry.body}</div> : null}
                      {index < timeline.length - 1 ? <Separator className="mt-4" /> : null}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title={`Meldungen (${data.meldungen.length})`}>
              {data.meldungen.length === 0 ? (
                <div className="text-sm text-brand-text2">Keine Meldungen vorhanden.</div>
              ) : data.meldungen.map((item, index) => (
                <div key={item.id} className="print-avoid-break rounded-xl border border-brand-border/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-brand-text">Meldung #{item.id} · Version {item.versionNo}</div>
                    <Badge variant="outline">{item.status ?? '—'}</Badge>
                  </div>
                  <Kv label="Angelegt von" value={item.createdByDisplayName ?? '—'} />
                  <Kv label="Angelegt am" value={fmtDate(item.createdAt ?? null, true)} />
                  <Kv label="Anlässe" value={Array.isArray(item.anlassCodes) ? item.anlassCodes.map((code) => anlassLabel(code)).join(', ') : '—'} />
                  <Kv label="Kurzbeschreibung" value={item.kurzbeschreibung ?? '—'} />
                  <Kv label="Bewertung" value={item.fachlicheBewertung ?? '—'} />
                  <Kv label="Maßnahmen" value={item.massnahmenEmpfohlen ?? '—'} />
                  {index < data.meldungen.length - 1 ? <Separator className="mt-3" /> : null}
                </div>
              ))}
            </Section>

            <Section title={`Meldebögen (${data.meldeboegen.length})`}>
              {data.meldeboegen.length === 0 ? (
                <div className="text-sm text-brand-text2">Keine Meldebögen vorhanden.</div>
              ) : data.meldeboegen.map((item) => (
                <div key={item.id} className="print-avoid-break rounded-xl border border-brand-border/30 p-3">
                  <div className="font-medium text-brand-text">Meldebogen #{item.id}</div>
                  <Kv label="Eingangsdatum" value={fmtDate(item.eingangsdatum)} />
                  <Kv label="Meldungsart" value={item.meldungart ?? '—'} />
                  <Kv label="Ersteinschätzung" value={item.ersteinschaetzung ?? '—'} />
                  <Kv label="Handlungsdringlichkeit" value={item.handlungsdringlichkeit ?? '—'} />
                  <Kv label="Schilderung" value={item.schilderung ?? '—'} />
                </div>
              ))}
            </Section>

            <Section title={`Kinderschutzbögen (${data.kinderschutzboegen.length})`}>
              {data.kinderschutzboegen.length === 0 ? (
                <div className="text-sm text-brand-text2">Keine Kinderschutzbögen vorhanden.</div>
              ) : data.kinderschutzboegen.map((item) => (
                <div key={item.id} className="print-avoid-break rounded-xl border border-brand-border/30 p-3">
                  <div className="font-medium text-brand-text">Assessment #{item.id}</div>
                  <Kv label="Altersgruppe" value={item.altergruppeLabel ?? item.altersgruppe} />
                  <Kv label="Bewertungsdatum" value={fmtDate(item.bewertungsdatum)} />
                  <Kv label="Auto-Einschätzung" value={valueText(item.gesamteinschaetzungAuto)} />
                  <Kv label="Manuelle Einschätzung" value={valueText(item.gesamteinschaetzungManuell)} />
                  <Kv label="Freitext" value={item.gesamteinschaetzungFreitext ?? '—'} />
                </div>
              ))}
            </Section>

            <Section title={`DJI-Prüfbögen (${data.dji.length})`}>
              {data.dji.length === 0 ? (
                <div className="text-sm text-brand-text2">Keine DJI-Prüfbögen vorhanden.</div>
              ) : data.dji.map((item) => (
                <div key={item.id} className="print-avoid-break rounded-xl border border-brand-border/30 p-3">
                  <div className="font-medium text-brand-text">{item.formTypLabel} #{item.id}</div>
                  <Kv label="Bewertungsdatum" value={fmtDate(item.bewertungsdatum)} />
                  <Kv label="Gesamteinschätzung" value={item.gesamteinschaetzungLabel ?? item.gesamteinschaetzung ?? '—'} />
                  <Kv label="Freitext" value={item.gesamtfreitext ?? '—'} />
                </div>
              ))}
            </Section>

            <Section title={`Schutzpläne (${data.schutzplaene.length})`}>
              {data.schutzplaene.length === 0 ? (
                <div className="text-sm text-brand-text2">Keine Schutzpläne vorhanden.</div>
              ) : data.schutzplaene.map((item) => (
                <div key={item.id} className="print-avoid-break rounded-xl border border-brand-border/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-brand-text">Schutzplan #{item.id}</div>
                    <Badge variant="outline">{item.status ?? '—'}</Badge>
                  </div>
                  <Kv label="Erstellt am" value={fmtDate(item.erstelltAm)} />
                  <Kv label="Gültig bis" value={fmtDate(item.gueltigBis)} />
                  <Kv label="Gefährdungssituation" value={item.gefaehrdungssituation ?? '—'} />
                  <Kv label="Vereinbarungen" value={item.vereinbarungen ?? '—'} />
                  <Kv label="Beteiligte" value={item.beteiligte ?? '—'} />
                  <Kv label="Maßnahmen" value={item.massnahmen.length ? item.massnahmen.map((m) => `${m.position}. ${m.massnahme} (${m.status})`).join('\n') : '—'} />
                </div>
              ))}
            </Section>

            <Section title={`Hausbesuche (${data.hausbesuche.length})`}>
              {data.hausbesuche.length === 0 ? (
                <div className="text-sm text-brand-text2">Keine Hausbesuche vorhanden.</div>
              ) : data.hausbesuche.map((item) => (
                <div key={item.id} className="print-avoid-break rounded-xl border border-brand-border/30 p-3">
                  <div className="font-medium text-brand-text">Hausbesuch #{item.id}</div>
                  <Kv label="Besuchsdatum" value={fmtDate(item.besuchsdatum)} />
                  <Kv label="Anwesende" value={item.anwesende ?? '—'} />
                  <Kv label="Ampel" value={item.einschaetzungAmpel ?? '—'} />
                  <Kv label="Einschätzung" value={item.einschaetzungText ?? '—'} />
                  <Kv label="Nächste Schritte" value={item.naechsteSchritte ?? '—'} />
                </div>
              ))}
            </Section>

            <SignatureBlock />
          </div>
        </div>
      )}
    </CaseWizardShell>
  );
}
