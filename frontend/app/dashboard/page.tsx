"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, ShieldAlert, Siren } from "lucide-react";
import { useRouter } from "next/navigation";

import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import type { FalleroeffnungListResponse, FalleroeffnungListItem } from "@/lib/types";

/**
 * Backend-Felder für die Liste sind bei dir noch im Fluss.
 * Darum lesen wir "Akut/Dringlichkeit" defensiv aus optionalen Feldern,
 * ohne die Types kaputt zu machen.
 */
function getAkutFlag(i: FalleroeffnungListItem): boolean | null {
  const any = i as any;
  if (typeof any.akutGefahrImVerzug === "boolean") return any.akutGefahrImVerzug;
  if (typeof any.akut === "boolean") return any.akut;
  if (typeof any.isAkut === "boolean") return any.isAkut;
  return null;
}

function getDringlichkeit(i: FalleroeffnungListItem): string | null {
  const any = i as any;
  const v = any.dringlichkeit ?? any.prioritaet ?? any.priority;
  return typeof v === "string" ? v : null;
}

function toneForStatus(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  const s = (status || "").toLowerCase();
  if (s.includes("hoch") || s.includes("krit") || s.includes("risiko")) return "danger";
  if (s.includes("warn") || s.includes("prüf") || s.includes("review")) return "warning";
  if (s.includes("abgesch") || s.includes("done") || s.includes("geschlossen")) return "success";
  if (s.includes("offen") || s.includes("neu")) return "info";
  return "neutral";
}

function toneForDringlichkeit(d: string | null): "success" | "warning" | "danger" | "info" | "neutral" {
  const s = (d || "").toLowerCase();
  if (!s) return "neutral";
  if (s.includes("hoch") || s.includes("sofort") || s.includes("krit")) return "danger";
  if (s.includes("mittel") || s.includes("bald")) return "warning";
  if (s.includes("nied")) return "info";
  return "neutral";
}

const MOCK: FalleroeffnungListItem[] = [
  { id: 101, aktenzeichen: "KID-2026-001", status: "OFFEN", kindName: "M. (7)", createdAt: "2026-02-12" } as any,
  { id: 102, aktenzeichen: "KID-2026-002", status: "WARNUNG", kindName: "L. (12)", createdAt: "2026-02-13" } as any,
  { id: 103, aktenzeichen: "KID-2026-003", status: "RISIKO_HOCH", kindName: "S. (4)", createdAt: "2026-02-15" } as any,
  { id: 104, aktenzeichen: "KID-2026-004", status: "ABGESCHLOSSEN", kindName: "A. (9)", createdAt: "2026-02-18" } as any,
];

function filterItems(list: FalleroeffnungListItem[], q: string) {
  const qq = q.trim().toLowerCase();
  if (!qq) return list;
  return list.filter((i) => {
    const any = i as any;
    const akut = typeof any.akutGefahrImVerzug === "boolean" ? String(any.akutGefahrImVerzug) : "";
    const dring = typeof any.dringlichkeit === "string" ? any.dringlichkeit : "";
    const hay = `${i.aktenzeichen ?? ""} ${i.kindName ?? ""} ${i.status ?? ""} ${akut} ${dring}`.toLowerCase();
    return hay.includes(qq);
  });
}

export default function DashboardHome() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [items, setItems] = useState<FalleroeffnungListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [useMock, setUseMock] = useState(false);

  async function load(currentQ: string) {
    setLoading(true);

    const forceMock = process.env.NEXT_PUBLIC_FORCE_MOCK === "1";
    if (forceMock || useMock) {
      setItems(filterItems(MOCK, currentQ));
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch<FalleroeffnungListResponse>(`/falloeffnungen?q=${encodeURIComponent(currentQ)}&size=8`, {
        method: "GET",
      });
      setItems(res.items || []);
    } catch {
      setUseMock(true);
      setItems(filterItems(MOCK, currentQ));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, useMock]);

  const stats = useMemo(() => {
    const total = items.length;
    const high = items.filter((i) => toneForStatus(i.status) === "danger").length;
    const warn = items.filter((i) => toneForStatus(i.status) === "warning").length;
    const done = items.filter((i) => toneForStatus(i.status) === "success").length;
    return { total, high, warn, done };
  }, [items]);

  function goToCase(i: FalleroeffnungListItem) {
    router.push(`/dashboard/falloeffnungen/${i.id}`);
  }

  return (
      <AuthGate>
        <div className="min-h-screen bg-brand-bg overflow-x-hidden">
          <Topbar title="Übersicht" onSearch={(val) => setQ(val)} />

          <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-8 pt-4 sm:space-y-6 sm:px-6 md:px-8">
            {useMock ? (
                <div className="rounded-2xl border border-brand-warning/25 bg-brand-warning/10 p-4 text-sm text-brand-text">
                  Backend nicht erreichbar/unauthorisiert – zeige Mock-Daten (Suche läuft lokal).
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-brand-text2">Offene Fälle</div>
                  <FileText className="h-4 w-4 text-brand-blue shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-brand-navy">{stats.total}</div>
                  <div className="mt-1 text-xs text-brand-text2">inkl. Suche/Filter</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-brand-text2">Risiko hoch</div>
                  <ShieldAlert className="h-4 w-4 text-brand-danger shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-brand-navy">{stats.high}</div>
                  <div className="mt-1 text-xs text-brand-text2">Priorität: sofort</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-brand-text2">Warnungen</div>
                  <AlertTriangle className="h-4 w-4 text-brand-warning shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-brand-navy">{stats.warn}</div>
                  <div className="mt-1 text-xs text-brand-text2">prüfen & dokumentieren</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-brand-text2">Abgeschlossen</div>
                  <CheckCircle2 className="h-4 w-4 text-brand-success shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-brand-navy">{stats.done}</div>
                  <div className="mt-1 text-xs text-brand-text2">auditierbar</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-brand-text">Aktuelle Fälle</div>
                  <div className="mt-1 text-xs text-brand-text2">
                    Kurzliste aus <code className="rounded bg-brand-bg px-1">/falloeffnungen</code>
                  </div>
                </div>
                <div className="text-xs text-brand-text2">{loading ? "lädt…" : `${items.length} Einträge`}</div>
              </CardHeader>

              <CardContent>
                <div className="w-full max-w-full overflow-x-auto rounded-xl">
                  <table className="min-w-max w-full text-left text-sm">
                    <thead className="text-xs font-semibold text-brand-text2">
                    <tr className="border-b border-brand-border">
                      <th className="py-2 pr-4 whitespace-nowrap">Aktenzeichen</th>
                      <th className="py-2 pr-4 whitespace-nowrap">Kind</th>
                      <th className="py-2 pr-4 whitespace-nowrap">Status</th>
                      <th className="py-2 pr-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Siren className="h-3.5 w-3.5" />
                          Akut
                        </span>
                      </th>
                      <th className="py-2 pr-4 whitespace-nowrap">Dringlichkeit</th>
                      <th className="py-2 pr-0 whitespace-nowrap">Erstellt</th>
                    </tr>
                    </thead>

                    <tbody>
                    {items.map((i) => {
                      const akut = getAkutFlag(i);
                      const dring = getDringlichkeit(i);

                      return (
                          <tr
                              key={i.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => goToCase(i)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") goToCase(i);
                              }}
                              className="border-b border-brand-border/70 last:border-0 cursor-pointer hover:bg-brand-bg/60 focus:outline-none focus:ring-2 focus:ring-brand-teal/25"
                              aria-label={`Fall öffnen: ${i.aktenzeichen || `#${i.id}`}`}
                          >
                            <td className="py-3 pr-4 font-semibold text-brand-blue whitespace-nowrap">
                              {i.aktenzeichen || `#${i.id}`}
                            </td>
                            <td className="py-3 pr-4 text-brand-text whitespace-nowrap">{i.kindName || "—"}</td>
                            <td className="py-3 pr-4">
                              <Badge tone={toneForStatus(i.status)}>{i.status}</Badge>
                            </td>

                            <td className="py-3 pr-4 whitespace-nowrap">
                              {akut === true ? (
                                  <Badge tone="danger">AKUT</Badge>
                              ) : akut === false ? (
                                  <Badge tone="neutral">nein</Badge>
                              ) : (
                                  <span className="text-brand-text2">—</span>
                              )}
                            </td>

                            <td className="py-3 pr-4 whitespace-nowrap">
                              {dring ? <Badge tone={toneForDringlichkeit(dring)}>{dring}</Badge> : <span className="text-brand-text2">—</span>}
                            </td>

                            <td className="py-3 pr-0 text-brand-text2 whitespace-nowrap">{i.createdAt || "—"}</td>
                          </tr>
                      );
                    })}

                    {!items.length ? (
                        <tr>
                          <td className="py-6 text-center text-brand-text2" colSpan={6}>
                            Keine Daten.
                          </td>
                        </tr>
                    ) : null}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 text-xs text-brand-text2 sm:hidden">Tipp: Tabelle kann horizontal gescrollt werden.</div>

                {useMock ? (
                    <div className="mt-3 text-xs text-brand-text2">
                      Hinweis: In Mock-Daten sind <code className="rounded bg-brand-bg px-1">Akut</code> /{" "}
                      <code className="rounded bg-brand-bg px-1">Dringlichkeit</code> nicht hinterlegt – im Backend-Response erscheinen sie, sobald du sie
                      in <code className="rounded bg-brand-bg px-1">/falloeffnungen</code> mitsendest.
                    </div>
                ) : null}
              </CardContent>
            </Card>

            {/* §8a Prozess (Prototype) wurde entfernt */}
          </div>
        </div>
      </AuthGate>
  );
}