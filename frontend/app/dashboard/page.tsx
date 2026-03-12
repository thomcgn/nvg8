"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CalendarDays, CheckCircle2, ChevronLeft,
  ChevronRight, FileText, Siren,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import type { FalleroeffnungListResponse, FalleroeffnungListItem } from "@/lib/types";

/* ─── helpers ──────────────────────────────────────────────── */

function getAkutFlag(i: FalleroeffnungListItem): boolean | null {
  const a = i as any;
  if (typeof a.akutGefahrImVerzug === "boolean") return a.akutGefahrImVerzug;
  if (typeof a.akut === "boolean") return a.akut;
  return null;
}

function getDringlichkeit(i: FalleroeffnungListItem): string | null {
  const a = i as any;
  const v = a.dringlichkeit ?? a.prioritaet;
  return typeof v === "string" ? v : null;
}

function toneForStatus(s: string): "success" | "warning" | "danger" | "info" | "neutral" {
  const l = (s || "").toLowerCase();
  if (l.includes("abgesch") || l.includes("done")) return "success";
  if (l.includes("prüf") || l.includes("review")) return "warning";
  if (l.includes("offen") || l.includes("neu")) return "info";
  return "neutral";
}

function dringLabel(d: string | null): string {
  if (!d) return "—";
  if (d === "AKUT_HEUTE") return "Heute";
  if (d === "ZEITNAH_24_48H") return "24–48 h";
  if (d === "BEOBACHTEN") return "Beobachten";
  return d;
}

function dringTone(d: string | null): "danger" | "warning" | "info" | "neutral" {
  if (d === "AKUT_HEUTE") return "danger";
  if (d === "ZEITNAH_24_48H") return "warning";
  if (d === "BEOBACHTEN") return "info";
  return "neutral";
}

/* ─── calendar helpers ──────────────────────────────────────── */

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

/* ═══════════════════════════════════════════════════════════ */

export default function DashboardHome() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);

  const [q, setQ] = useState("");
  const [items, setItems] = useState<FalleroeffnungListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* calendar nav */
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  async function load(currentQ: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<FalleroeffnungListResponse>(
        `/falloeffnungen?q=${encodeURIComponent(currentQ)}&size=50`,
        { method: "GET" }
      );
      setItems(res.items || []);
    } catch (e: any) {
      setItems([]);
      setError(e?.message || "Backend nicht erreichbar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(""); }, []); // eslint-disable-line
  useEffect(() => {
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line

  /* ─── stats ──────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total:  items.length,
    akut:   items.filter((i) => getAkutFlag(i) === true).length,
    offen:  items.filter((i) => toneForStatus(i.status) === "info").length,
    done:   items.filter((i) => toneForStatus(i.status) === "success").length,
  }), [items]);

  /* ─── calendar data ──────────────────────────────────────── */
  const byDay = useMemo(() => {
    const map = new Map<string, FalleroeffnungListItem[]>();
    for (const item of items) {
      const raw = (item as any).naechsteUeberpruefungAm as string | null;
      if (!raw) continue;
      const k = raw.substring(0, 10);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(item);
    }
    return map;
  }, [items]);

  const todayKey = dayKey(today);

  const upcomingAppointments = useMemo(() =>
    Array.from(byDay.entries())
      .filter(([k]) => k >= todayKey)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 6),
    [byDay, todayKey]
  );

  /* ─── calendar grid ──────────────────────────────────────── */
  const calFirstOffset = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const calDays = daysInMonth(calYear, calMonth);
  const calLabel = new Date(calYear, calMonth, 1).toLocaleDateString("de-DE", {
    month: "long", year: "numeric",
  });

  function calPrev() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }
  function calNext() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }

  /* ─── render ─────────────────────────────────────────────── */
  return (
    <AuthGate>
      <div className="min-h-screen bg-brand-bg">
        <Topbar title="Übersicht" onSearch={(val) => setQ(val)} />

        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-5 sm:px-6">

          {error && (
            <div className="mb-4 rounded border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-text">
              {error}
            </div>
          )}

          {/* ── Stat row ── */}
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="Fälle gesamt"
              value={stats.total}
              icon={<FileText className="h-4 w-4" />}
              onClick={() => router.push("/dashboard/falloeffnungen")}
            />
            <StatCard
              label="Gefahr im Verzug"
              value={stats.akut}
              icon={<Siren className="h-4 w-4" />}
              alert={stats.akut > 0}
              onClick={() => router.push("/dashboard/falloeffnungen")}
            />
            <StatCard
              label="Offen"
              value={stats.offen}
              icon={<AlertTriangle className="h-4 w-4" />}
              onClick={() => router.push("/dashboard/falloeffnungen?status=OFFEN")}
            />
            <StatCard
              label="Abgeschlossen"
              value={stats.done}
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => router.push("/dashboard/falloeffnungen?status=ABGESCHLOSSEN")}
            />
          </div>

          {/* ── Main two-column layout ── */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_296px]">

            {/* LEFT: case list */}
            <Card className="min-w-0">
              <CardHeader className="flex items-center justify-between pb-2">
                <span className="text-sm font-semibold text-brand-text">Aktuelle Fälle</span>
                <span className="text-xs text-brand-text2">
                  {loading ? "lädt…" : `${items.length} Einträge`}
                </span>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-brand-border/60">
                  {items.length === 0 && !loading && (
                    <div className="px-5 py-8 text-center text-sm text-brand-text2">
                      {q.trim() ? "Keine Treffer für diese Suche." : "Noch keine Fälle vorhanden."}
                    </div>
                  )}
                  {items.map((i) => {
                    const akut = getAkutFlag(i);
                    const dring = getDringlichkeit(i);
                    const isAkut = akut === true;

                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => router.push(`/dashboard/falloeffnungen/${i.id}`)}
                        className={[
                          "flex w-full items-start gap-4 px-5 py-3.5 text-left transition-colors",
                          "hover:bg-brand-border/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-border",
                          isAkut ? "border-l-2 border-brand-danger" : "border-l-2 border-transparent",
                        ].join(" ")}
                        aria-label={`Fall öffnen: ${i.aktenzeichen || `#${i.id}`}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            <span className="text-sm font-semibold text-brand-text">
                              {i.aktenzeichen || `#${i.id}`}
                            </span>
                            <span className="text-sm text-brand-text2">{i.kindName || "—"}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge tone={toneForStatus(i.status)} className="text-xs">{i.status}</Badge>
                            {dring && (
                              <Badge tone={dringTone(dring)} className="text-xs">{dringLabel(dring)}</Badge>
                            )}
                            {isAkut && (
                              <Badge tone="danger" className="text-xs">Gefahr im Verzug</Badge>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="text-xs text-brand-text2">
                            {i.createdAt
                              ? new Date(i.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })
                              : "—"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* RIGHT: calendar panel */}
            <div className="flex flex-col gap-4">

              {/* Mini calendar */}
              <Card>
                <CardHeader className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-brand-text2" />
                    <span className="text-sm font-semibold text-brand-text">{calLabel}</span>
                  </div>
                  <div className="flex gap-0.5">
                    <button
                      onClick={calPrev}
                      className="rounded p-1 text-brand-text2 transition-colors hover:bg-brand-border/40 hover:text-brand-text"
                      aria-label="Vorheriger Monat"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={calNext}
                      className="rounded p-1 text-brand-text2 transition-colors hover:bg-brand-border/40 hover:text-brand-text"
                      aria-label="Nächster Monat"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-7 mb-1">
                    {["Mo","Di","Mi","Do","Fr","Sa","So"].map((d) => (
                      <div key={d} className="text-center text-[10px] font-medium text-brand-text2 py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-0.5">
                    {Array.from({ length: calFirstOffset }).map((_, i) => (
                      <div key={`e${i}`} />
                    ))}
                    {Array.from({ length: calDays }).map((_, i) => {
                      const day = i + 1;
                      const k = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const entries = byDay.get(k) || [];
                      const isToday = k === todayKey;
                      const hasAkut = entries.some((e) => getAkutFlag(e) === true);

                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => entries.length > 0 && router.push("/dashboard/kalender")}
                          className={[
                            "relative flex flex-col items-center rounded py-1 text-xs transition-colors",
                            isToday
                              ? "font-semibold text-brand-text underline underline-offset-2"
                              : entries.length > 0
                                ? "cursor-pointer font-medium text-brand-text hover:bg-brand-border/30"
                                : "text-brand-text2",
                          ].join(" ")}
                          disabled={entries.length === 0}
                          title={entries.length > 0 ? entries.map((e) => e.aktenzeichen || `#${e.id}`).join(", ") : undefined}
                        >
                          {day}
                          {entries.length > 0 && (
                            <span className={[
                              "absolute bottom-0.5 h-1 w-1 rounded-full",
                              hasAkut ? "bg-brand-danger" : "bg-brand-text2",
                            ].join(" ")} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming appointments */}
              <Card>
                <CardHeader className="pb-2">
                  <span className="text-sm font-semibold text-brand-text">Nächste Überprüfungen</span>
                </CardHeader>
                <CardContent className="pt-0">
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-xs text-brand-text2">Keine anstehenden Termine.</p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingAppointments.map(([dateKey, entries]) => (
                        <div key={dateKey}>
                          <div className="mb-1 text-[10px] font-medium text-brand-text2">
                            {new Date(dateKey + "T00:00:00").toLocaleDateString("de-DE", {
                              weekday: "short", day: "2-digit", month: "2-digit",
                            })}
                          </div>
                          {entries.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => router.push(`/dashboard/falloeffnungen/${item.id}`)}
                              className="flex w-full items-center gap-2 rounded border border-brand-border/60 px-3 py-2 text-left text-xs transition-colors hover:bg-brand-border/20 focus:outline-none focus:ring-1 focus:ring-brand-border mb-1"
                            >
                              <span className="font-medium text-brand-text min-w-0 flex-1 truncate">
                                {item.aktenzeichen || `#${item.id}`}
                              </span>
                              <span className="truncate text-brand-text2 max-w-[80px]">
                                {item.kindName || "—"}
                              </span>
                              {getAkutFlag(item) && (
                                <Siren className="h-3 w-3 shrink-0 text-brand-danger" />
                              )}
                            </button>
                          ))}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard/kalender")}
                        className="mt-1 w-full rounded border border-brand-border py-2 text-xs text-brand-text2 transition-colors hover:bg-brand-border/20"
                      >
                        Alle Termine anzeigen
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>

        </div>
      </div>
    </AuthGate>
  );
}

/* ─── StatCard component ───────────────────────────────────── */
function StatCard({
  label, value, icon, alert = false, onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  alert?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-lg border bg-brand-surface px-4 py-3 text-left transition-colors",
        "hover:bg-brand-border/20 focus:outline-none focus:ring-1 focus:ring-brand-border",
        alert ? "border-brand-danger/40" : "border-brand-border",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-brand-text2">{label}</span>
        <span className={alert ? "text-brand-danger" : "text-brand-text2"}>{icon}</span>
      </div>
      <div className={[
        "mt-1.5 text-2xl font-bold tabular-nums",
        alert && value > 0 ? "text-brand-danger" : "text-brand-text",
      ].join(" ")}>
        {value}
      </div>
    </button>
  );
}
