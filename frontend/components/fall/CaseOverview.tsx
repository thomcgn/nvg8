"use client";

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { caseModulePath } from '@/lib/case-engine/routing';
import { anlassLabel } from '@/lib/anlass/catalog';
import type { FalleroeffnungResponse } from '@/lib/types';
import { meldungApi, type MeldungListItemResponse } from '@/lib/meldungApi';
import { CheckCircle2, Clock3, FileOutput, FileText, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  fallId: string | number;
  akteId?: string | number | null;
  fall?: FalleroeffnungResponse | null;
  meldungen: MeldungListItemResponse[];
  loading?: boolean;
};

function fmtDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

function tone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const s = (status || '').toLowerCase();
  if (s.includes('hoch') || s.includes('krit') || s.includes('risiko')) return 'danger';
  if (s.includes('warn') || s.includes('prüf') || s.includes('review') || s.includes('in_pruef')) return 'warning';
  if (s.includes('abgesch') || s.includes('geschlossen') || s.includes('done') || s.includes('submitted')) return 'success';
  if (s.includes('entwurf') || s.includes('draft') || s.includes('offen') || s.includes('neu')) return 'info';
  return 'neutral';
}

function statusLabel(status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('entwurf') || s.includes('draft')) return 'Entwurf';
  if (s.includes('abgesch') || s.includes('geschlossen') || s.includes('done') || s.includes('submitted')) return 'Abgeschlossen';
  if (s.includes('offen') || s.includes('neu')) return 'Offen';
  return status || '—';
}

function isClosedStatus(status?: string | null) {
  const s = (status || '').toLowerCase();
  return s.includes('abgesch') || s.includes('geschlossen') || s.includes('done') || s.includes('submitted');
}

function isDraftStatus(status?: string | null) {
  const s = (status || '').toLowerCase();
  return s.includes('entwurf') || s.includes('draft');
}

function getMeldungTitle(meldung?: MeldungListItemResponse | null) {
  if (!meldung) return null;
  const detailTitle = meldung.detail?.kurzbeschreibung?.trim();
  const shortTitle = typeof meldung.kurzbeschreibung === 'string' ? meldung.kurzbeschreibung.trim() : '';
  if (detailTitle) return detailTitle;
  if (shortTitle) return shortTitle;
  if (meldung.type) return `Meldung (${meldung.type})`;
  return `Meldung #${meldung.id}`;
}

function getActivitySummary(meldung: MeldungListItemResponse) {
  const summary = meldung.detail?.kurzbeschreibung?.trim() || meldung.kurzbeschreibung?.trim();
  if (!summary) return null;
  return meldung.correctsId ? `Korrektur: ${summary}` : summary;
}

function normalizeAnlassCodes(value?: string[] | null): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((code) => (typeof code === 'string' ? code.trim() : ''))
    .filter((code): code is string => Boolean(code));
}

function formatAnlassDisplay(code: string) {
  const label = anlassLabel(code);
  if (label && label !== '—') return label;
  return code;
}

export function CaseOverview({ fallId, akteId, fall, meldungen, loading }: Props) {
  const router = useRouter();
  const parsedFallId = typeof fallId === 'string' ? Number.parseInt(fallId, 10) : typeof fallId === 'number' ? fallId : NaN;
  const numericFallId = Number.isFinite(parsedFallId) ? parsedFallId : null;

  const sortedByRecent = meldungen
    .slice()
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime());
  const draftMeldung = sortedByRecent.find((m) => isDraftStatus(m.status));
  const current = meldungen.find((m) => m.current) ?? sortedByRecent[0] ?? null;
  const currentId = current?.id ?? null;

  const [fetchedAnlassCodes, setFetchedAnlassCodes] = useState<string[] | null>(null);
  const [isFetchingAnlass, setIsFetchingAnlass] = useState(false);
  const [anlassFetchFailed, setAnlassFetchFailed] = useState(false);

  useEffect(() => {
    setFetchedAnlassCodes(null);
    setIsFetchingAnlass(false);
    setAnlassFetchFailed(false);
  }, [currentId]);

  const initialAnlassCodes = (() => {
    if (!current && !fall?.anlassCodes?.length) return [];
    const detailCodes = normalizeAnlassCodes(current?.detail?.anlassCodes ?? null);
    if (detailCodes.length) return detailCodes;
    const meldCodes = normalizeAnlassCodes(current?.anlassCodes ?? null);
    if (meldCodes.length) return meldCodes;
    const fallCodes = normalizeAnlassCodes(fall?.anlassCodes ?? null);
    if (fallCodes.length) return fallCodes;
    return [];
  })();

  const hasInitialAnlassCodes = initialAnlassCodes.length > 0;

  useEffect(() => {
    if (!currentId || hasInitialAnlassCodes || numericFallId == null) return;
    let cancelled = false;
    setIsFetchingAnlass(true);
    (async () => {
      try {
        const detail = await meldungApi.get(numericFallId, currentId);
        if (cancelled) return;
        setFetchedAnlassCodes(normalizeAnlassCodes(detail.anlassCodes ?? null));
      } catch {
        if (cancelled) return;
        setFetchedAnlassCodes([]);
        setAnlassFetchFailed(true);
      } finally {
        if (!cancelled) setIsFetchingAnlass(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentId, hasInitialAnlassCodes, numericFallId]);

  const currentStatus = current?.status ?? null;
  const draftCount = meldungen.filter((m) => isDraftStatus(m.status)).length;
  const openCount = meldungen.filter((m) => !isClosedStatus(m.status)).length;
  const closedCount = meldungen.length - openCount;
  const hasMeldungen = meldungen.length > 0;
  const currentTitle = getMeldungTitle(current);
  const hasDescriptiveCurrentTitle = currentTitle ? !/^meldung\s*\(/i.test(currentTitle) : false;
  const currentTimestamp = current?.updatedAt ?? current?.createdAt ?? null;
  const currentAuthor = current?.createdByDisplayName?.trim() || null;
  const currentMetaLabel = currentTimestamp || currentAuthor ? `${currentTimestamp ? fmtDate(currentTimestamp) : 'Zeitpunkt unbekannt'}${currentAuthor ? ` · ${currentAuthor}` : ''}` : null;

  const activity = sortedByRecent.slice(0, 4);
  const lastActivityEntry = activity[0] ?? null;
  const lastActivityTimestamp = lastActivityEntry?.updatedAt ?? lastActivityEntry?.createdAt ?? currentTimestamp ?? fall?.updatedAt ?? fall?.createdAt ?? null;
  const lastActivityUser = lastActivityEntry?.createdByDisplayName ?? currentAuthor ?? null;
  const showCurrentStatusBadge = currentStatus ? !/bearbeitung/i.test(currentStatus) : false;
  const statusCardText = !hasMeldungen ? 'Noch kein Arbeitsstand' : openCount > 0 ? 'Bearbeitung läuft' : 'Derzeit abgeschlossen';
  const resolvedAnlassCodes = hasInitialAnlassCodes ? initialAnlassCodes : fetchedAnlassCodes ?? [];
  const showAnlassLoading = !hasInitialAnlassCodes && fetchedAnlassCodes === null && isFetchingAnlass;
  const showAnlassError = !hasInitialAnlassCodes && anlassFetchFailed;
  const anlassBadges = resolvedAnlassCodes.length
    ? (
        <ul className="list-disc space-y-1 pl-4 text-sm text-brand-text">
          {resolvedAnlassCodes.map((code) => (
            <li key={code}>{formatAnlassDisplay(code)}</li>
          ))}
        </ul>
      )
    : null;
  const anlassFallback = showAnlassLoading
    ? 'Anlass wird geladen…'
    : showAnlassError
      ? 'Anlass konnte nicht geladen werden'
      : fall?.anlass
        ? String(fall.anlass)
        : '—';
  const anlassContent = anlassBadges ?? anlassFallback;
  const newMeldungBlocked = Boolean(draftMeldung);
  const existingDraftHref = draftMeldung ? `/dashboard/falloeffnungen/${fallId}/meldung?meldungId=${draftMeldung.id}` : null;
  const draftBlockedText = draftMeldung ? `Es existiert bereits ein Entwurf (${fmtDate(draftMeldung.updatedAt ?? draftMeldung.createdAt)}). Bitte führen Sie diesen fort.` : null;

  const currentCardContent = current
    ? (
        <div className="space-y-1">
          <div className="text-sm font-semibold text-brand-text leading-relaxed">
            {hasDescriptiveCurrentTitle ? currentTitle : 'Aktueller Vorgang'}
          </div>
          {currentMetaLabel ? <div className="text-xs text-brand-text2">{currentMetaLabel}</div> : null}
        </div>
      )
    : loading
      ? 'Lade…'
      : 'Noch keine Meldung';

  const lastActivityContent = (
    <div className="space-y-1">
      <div>{lastActivityTimestamp ? fmtDate(lastActivityTimestamp) : '—'}</div>
      <div className="text-xs text-brand-text2">{lastActivityUser ? `von ${lastActivityUser}` : 'Person unbekannt'}</div>
    </div>
  );

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)] 2xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)] 2xl:gap-6">
        <div className="rounded-2xl border border-brand-border/40 bg-white p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-brand-text2">Fallübersicht</div>
              <div className="mt-1 text-xl font-semibold text-brand-text">
                {fall?.aktenzeichen ?? (loading ? 'Lade…' : `Fall #${fallId}`)}
              </div>
              <div className="mt-1 text-sm text-brand-text2">
                {fall?.kindName ? `Kind: ${fall.kindName}` : 'Kein Kind hinterlegt'}
              </div>
            </div>
            <Link href={caseModulePath({ fallId, akteId }, 'export')} className="w-full max-w-sm lg:w-auto">
              <Button variant="secondary" className="h-12 w-full gap-2 text-base">
                <FileOutput className="h-4 w-4" />
                PDF-Export
              </Button>
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Meldungen gesamt', value: meldungen.length },
              { label: 'Offen / in Arbeit', value: openCount },
              { label: 'Entwürfe', value: draftCount },
              { label: 'Abgeschlossen', value: closedCount },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-brand-border/30 bg-brand-bg p-4">
                <div className="text-xs font-medium text-brand-text2 tracking-wide uppercase">{item.label}</div>
                <div className="mt-1 text-2xl font-semibold text-brand-text sm:text-3xl">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Aktuelle Meldung',
                icon: FileText,
                content: currentCardContent,
                extra: showCurrentStatusBadge && currentStatus ? (
                  <Badge tone={tone(currentStatus)}>{statusLabel(currentStatus)}</Badge>
                ) : null,
              },
              {
                label: 'Letzte Aktivität',
                icon: Clock3,
                content: lastActivityContent,
              },
              {
                label: 'Anlass',
                icon: Shield,
                content: anlassContent,
              },
              {
                label: 'Status',
                icon: CheckCircle2,
                content: statusCardText,
              },
            ].map(({ label, icon: Icon, content, extra }) => (
              <div key={label} className="rounded-2xl border border-brand-border/30 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-text2">
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
                <div className="mt-2 text-sm font-medium text-brand-text leading-relaxed">{content}</div>
                {extra ? <div className="mt-2">{extra}</div> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border/40 bg-white p-4 sm:p-6 lg:p-7 flex h-full flex-col">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-brand-text">Letzte Aktivitäten</div>
            <span className="text-xs uppercase tracking-wide text-brand-text2">Max. 4 Meldungen</span>
          </div>
          <div className="mt-3 flex-1 space-y-3 overflow-hidden">
            {activity.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-border/40 p-4 text-sm text-brand-text2">
                Noch keine Aktivitäten vorhanden.
              </div>
            ) : (
              activity.map((item) => {
                const statusSlug = (item.status || '').toLowerCase();
                const isClosed =
                  statusSlug.includes('abgesch') ||
                  statusSlug.includes('geschlossen') ||
                  statusSlug.includes('submitted') ||
                  statusSlug.includes('done');
                const actionHref = isClosed
                  ? `/dashboard/falloeffnungen/${fallId}/meldung?meldungId=${item.id}&startCorrection=1`
                  : `/dashboard/falloeffnungen/${fallId}/meldung?meldungId=${item.id}`;
                const actionLabel = isClosed ? 'Korrektur' : 'In Draft springen';
                const changeSummary = getActivitySummary(item);
                return (
                  <div key={item.id} className="rounded-2xl border border-brand-border/30 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <Link
                        href={`/dashboard/falloeffnungen/${fallId}/meldung?meldungId=${item.id}`}
                        className="min-w-0 flex-1 transition-opacity hover:opacity-70"
                      >
                        <div className="text-sm font-semibold text-brand-text truncate">{getMeldungTitle(item)}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-brand-text2">
                          <span>{fmtDate(item.updatedAt ?? item.createdAt)}</span>
                          {item.createdByDisplayName ? (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {item.createdByDisplayName}
                            </span>
                          ) : null}
                        </div>
                        {changeSummary ? (
                          <div className="mt-1 text-xs text-brand-text2 leading-snug">{changeSummary}</div>
                        ) : null}
                      </Link>
                      <div className="flex items-center gap-2 md:gap-3">
                        <Badge tone={tone(item.status)}>{statusLabel(item.status)}</Badge>
                        <Link href={actionHref} className="flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-9 rounded-full px-3 text-sm transition-colors ${
                              isClosed ? 'text-amber-700 hover:bg-amber-50' : 'text-brand-text hover:bg-brand-bg'
                            }`}
                            title={actionLabel}
                          >
                            {isClosed ? 'Korrektur' : 'Weiter'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {draftMeldung ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="font-semibold">Entwurf bereits vorhanden</div>
              <div className="mt-1 text-xs text-amber-900/80 leading-relaxed">{draftBlockedText}</div>
              {existingDraftHref ? (
                <Button asChild size="sm" variant="outline" className="mt-3 w-full gap-2 text-xs sm:w-auto">
                  <Link href={existingDraftHref}>
                    <FileText className="h-4 w-4" />
                    Entwurf öffnen
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 pt-1">
            <Button
              size="lg"
              className="h-12 w-full gap-2 text-base"
              disabled={newMeldungBlocked}
              title={newMeldungBlocked ? 'Es existiert bereits ein Entwurf für diesen Fall.' : undefined}
              onClick={() => {
                if (newMeldungBlocked) return;
                router.push(`/dashboard/falloeffnungen/${fallId}/meldung?mode=create`);
              }}
            >
              <FileText className="h-5 w-5" />
              Neue Meldung
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseOverview;
