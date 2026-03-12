"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Siren } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import type { FalleroeffnungListResponse, FalleroeffnungListItem } from "@/lib/types";

function isoToDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function KalenderPage() {
  const router = useRouter();
  const [items, setItems] = useState<FalleroeffnungListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch<FalleroeffnungListResponse>(`/falloeffnungen?size=200`, { method: "GET" })
      .then((res) => setItems(res.items || []))
      .catch((e: any) => setError(e?.message || "Fehler beim Laden."))
      .finally(() => setLoading(false));
  }, []);

  // Items with a review date
  const withDate = useMemo(
    () => items.filter((i) => (i as any).naechsteUeberpruefungAm),
    [items]
  );

  // Group by day key
  const byDay = useMemo(() => {
    const map = new Map<string, FalleroeffnungListItem[]>();
    for (const item of withDate) {
      const raw = (item as any).naechsteUeberpruefungAm as string;
      const key = raw.substring(0, 10); // YYYY-MM-DD
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [withDate]);

  // Upcoming list (from today)
  const upcoming = useMemo(() => {
    const todayKey = dayKey(today);
    return Array.from(byDay.entries())
      .filter(([k]) => k >= todayKey)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [byDay]);

  // Calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const startOffset = (firstDayOfMonth + 6) % 7; // Mon=0
  const totalDays = daysInMonth(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  return (
    <AuthGate>
      <div className="min-h-screen bg-brand-bg overflow-x-hidden">
        <Topbar title="Kalender – Überprüfungstermine" />

        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-8 pt-4 sm:px-6 md:px-8">
          {error && (
            <div className="rounded-2xl border border-brand-warning/25 bg-brand-warning/10 p-4 text-sm text-brand-text">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Calendar */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-brand-teal" />
                  <span className="text-sm font-semibold text-brand-text">{monthLabel}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={prevMonth}
                    className="rounded-lg p-1 hover:bg-brand-border/40"
                    aria-label="Vorheriger Monat"
                  >
                    <ChevronLeft className="h-4 w-4 text-brand-text2" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="rounded-lg p-1 hover:bg-brand-border/40"
                    aria-label="Nächster Monat"
                  >
                    <ChevronRight className="h-4 w-4 text-brand-text2" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-px text-center">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="py-1 text-xs font-semibold text-brand-text2">{d}</div>
                  ))}
                  {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: totalDays }).map((_, i) => {
                    const day = i + 1;
                    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const entries = byDay.get(key) || [];
                    const isToday = key === dayKey(today);
                    const hasEntries = entries.length > 0;
                    const hasAkut = entries.some((e) => (e as any).akutGefahrImVerzug === true);

                    return (
                      <div
                        key={key}
                        className={[
                          "relative flex flex-col items-center rounded-lg py-1 text-sm transition-colors",
                          isToday ? "bg-brand-teal/10 font-bold text-brand-teal" : "text-brand-text",
                          hasEntries ? "cursor-pointer hover:bg-brand-border/30" : "",
                        ].join(" ")}
                        title={hasEntries ? entries.map((e) => e.aktenzeichen || `#${e.id}`).join(", ") : undefined}
                      >
                        <span>{day}</span>
                        {hasEntries && (
                          <span
                            className={[
                              "mt-0.5 h-1.5 w-1.5 rounded-full",
                              hasAkut ? "bg-brand-danger" : "bg-brand-teal",
                            ].join(" ")}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming list */}
            <Card>
              <CardHeader className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-brand-teal" />
                <span className="text-sm font-semibold text-brand-text">Nächste Termine</span>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading && <div className="text-xs text-brand-text2">lädt…</div>}
                {!loading && upcoming.length === 0 && (
                  <div className="text-xs text-brand-text2">Keine anstehenden Überprüfungstermine.</div>
                )}
                {upcoming.slice(0, 15).map(([dateKey, entries]) => {
                  const d = isoToDate(dateKey);
                  const isPast = dateKey < dayKey(today);
                  return (
                    <div key={dateKey} className="space-y-1">
                      <div className={["text-xs font-semibold", isPast ? "text-brand-danger" : "text-brand-text2"].join(" ")}>
                        {d ? formatDate(d) : dateKey}
                      </div>
                      {entries.map((item) => (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/dashboard/falloeffnungen/${item.id}`)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push(`/dashboard/falloeffnungen/${item.id}`); }}
                          className="flex items-center justify-between rounded-lg border border-brand-border/60 px-3 py-2 text-xs cursor-pointer hover:bg-brand-border/20 focus:outline-none focus:ring-2 focus:ring-brand-teal/25"
                        >
                          <div>
                            <div className="font-semibold text-brand-blue">{item.aktenzeichen || `#${item.id}`}</div>
                            <div className="text-brand-text2">{item.kindName || "—"}</div>
                          </div>
                          {(item as any).akutGefahrImVerzug && (
                            <Siren className="h-3.5 w-3.5 text-brand-danger shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* All entries with date */}
          {withDate.length > 0 && (
            <Card>
              <CardHeader>
                <span className="text-sm font-semibold text-brand-text">Alle Fälle mit Überprüfungsdatum ({withDate.length})</span>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <table className="min-w-max w-full text-left text-sm">
                    <thead className="text-xs font-semibold text-brand-text2">
                      <tr className="border-b border-brand-border">
                        <th className="py-2 pr-4 whitespace-nowrap">Überprüfung am</th>
                        <th className="py-2 pr-4 whitespace-nowrap">Aktenzeichen</th>
                        <th className="py-2 pr-4 whitespace-nowrap">Kind</th>
                        <th className="py-2 pr-4 whitespace-nowrap">Status</th>
                        <th className="py-2 pr-0 whitespace-nowrap">Akut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(byDay.entries())
                        .sort(([a], [b]) => a.localeCompare(b))
                        .flatMap(([dateKey, entries]) =>
                          entries.map((item) => {
                            const isPast = dateKey < dayKey(today);
                            return (
                              <tr
                                key={`${dateKey}-${item.id}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => router.push(`/dashboard/falloeffnungen/${item.id}`)}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push(`/dashboard/falloeffnungen/${item.id}`); }}
                                className="border-b border-brand-border/70 last:border-0 cursor-pointer hover:bg-brand-bg/60"
                              >
                                <td className={["py-3 pr-4 whitespace-nowrap font-semibold", isPast ? "text-brand-danger" : "text-brand-text"].join(" ")}>
                                  {dateKey}
                                </td>
                                <td className="py-3 pr-4 font-semibold text-brand-blue whitespace-nowrap">
                                  {item.aktenzeichen || `#${item.id}`}
                                </td>
                                <td className="py-3 pr-4 text-brand-text whitespace-nowrap">{item.kindName || "—"}</td>
                                <td className="py-3 pr-4">
                                  <Badge tone="neutral">{item.status}</Badge>
                                </td>
                                <td className="py-3 pr-0">
                                  {(item as any).akutGefahrImVerzug ? (
                                    <Badge tone="danger">AKUT</Badge>
                                  ) : (
                                    <span className="text-brand-text2">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
