"use client";

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { caseModulePath } from '@/lib/case-engine/routing';
import type { FalleroeffnungResponse } from '@/lib/types';
import type { MeldungListItemResponse } from '@/lib/meldungApi';
import { AlertTriangle, CheckCircle2, Clock3, FileOutput, FileText, Shield } from 'lucide-react';

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

export function CaseOverview({ fallId, akteId, fall, meldungen, loading }: Props) {
  const current = meldungen.find((m) => m.current) ?? meldungen[0] ?? null;
  const draftCount = meldungen.filter((m) => (m.status || '').toLowerCase().includes('entwurf') || (m.status || '').toLowerCase().includes('draft')).length;
  const closedCount = meldungen.filter((m) => {
    const s = (m.status || '').toLowerCase();
    return s.includes('abgesch') || s.includes('geschlossen') || s.includes('done') || s.includes('submitted');
  }).length;
  const openCount = Math.max(meldungen.length - closedCount, 0);

  const activity = meldungen
    .slice()
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-brand-border/40 bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-brand-text2">Fallübersicht</div>
              <div className="mt-1 text-xl font-semibold text-brand-text">
                {fall?.aktenzeichen ?? (loading ? 'Lade…' : `Fall #${fallId}`)}
              </div>
              <div className="mt-1 text-sm text-brand-text2">
                {fall?.kindName ? `Kind: ${fall.kindName}` : 'Kein Kind hinterlegt'}
              </div>
            </div>
            <Link href={caseModulePath({ fallId, akteId }, 'export')}>
              <Button variant="secondary" className="gap-2 h-10">
                <FileOutput className="h-4 w-4" />
                PDF-Export
              </Button>
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-brand-border/30 bg-brand-bg p-3">
              <div className="text-xs text-brand-text2">Meldungen gesamt</div>
              <div className="mt-1 text-2xl font-semibold text-brand-text">{meldungen.length}</div>
            </div>
            <div className="rounded-xl border border-brand-border/30 bg-brand-bg p-3">
              <div className="text-xs text-brand-text2">Offen / in Arbeit</div>
              <div className="mt-1 text-2xl font-semibold text-brand-text">{openCount}</div>
            </div>
            <div className="rounded-xl border border-brand-border/30 bg-brand-bg p-3">
              <div className="text-xs text-brand-text2">Entwürfe</div>
              <div className="mt-1 text-2xl font-semibold text-brand-text">{draftCount}</div>
            </div>
            <div className="rounded-xl border border-brand-border/30 bg-brand-bg p-3">
              <div className="text-xs text-brand-text2">Abgeschlossen</div>
              <div className="mt-1 text-2xl font-semibold text-brand-text">{closedCount}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-brand-border/30 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-brand-text2"><FileText className="h-4 w-4" /> Aktuelle Meldung</div>
              <div className="mt-2 text-sm font-medium text-brand-text">{current?.detail?.kurzbeschreibung ?? 'Noch keine Meldung'}</div>
              {current?.status ? <div className="mt-2"><Badge tone={tone(current.status)}>{statusLabel(current.status)}</Badge></div> : null}
            </div>
            <div className="rounded-xl border border-brand-border/30 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-brand-text2"><Clock3 className="h-4 w-4" /> Letzte Aktivität</div>
              <div className="mt-2 text-sm text-brand-text">{fmtDate(current?.updatedAt ?? current?.createdAt ?? fall?.updatedAt ?? fall?.createdAt ?? null)}</div>
            </div>
            <div className="rounded-xl border border-brand-border/30 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-brand-text2"><Shield className="h-4 w-4" /> Anlass</div>
              <div className="mt-2 text-sm text-brand-text">{fall?.anlass ? String(fall.anlass) : '—'}</div>
            </div>
            <div className="rounded-xl border border-brand-border/30 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-brand-text2"><CheckCircle2 className="h-4 w-4" /> Status</div>
              <div className="mt-2 text-sm text-brand-text">{openCount > 0 ? 'Bearbeitung läuft' : meldungen.length ? 'Derzeit abgeschlossen' : 'Noch kein Arbeitsstand'}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border/40 bg-white p-4 sm:p-5">
          <div className="text-sm font-semibold text-brand-text">Letzte Aktivitäten</div>
          <div className="mt-3 space-y-3">
            {activity.length === 0 ? (
              <div className="rounded-xl border border-dashed border-brand-border/40 p-3 text-sm text-brand-text2">
                Noch keine Aktivitäten vorhanden.
              </div>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="rounded-xl border border-brand-border/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-brand-text truncate">{item.detail?.kurzbeschreibung ?? 'Meldung'}</div>
                      <div className="mt-1 text-xs text-brand-text2">{fmtDate(item.updatedAt ?? item.createdAt)}</div>
                    </div>
                    <Badge tone={tone(item.status)}>{statusLabel(item.status)}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>Diese Übersicht ist die neue zentrale Einstiegskarte für den Fall. Von hier aus gehen Navigation, Status und PDF-Export zusammen.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseOverview;
