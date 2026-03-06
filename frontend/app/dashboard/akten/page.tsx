"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { FileText, RefreshCw, ChevronRight } from "lucide-react";

type AkteListItem = {
  id: number; // akteId (KindDossier)
  kindId: number;
  kindName: string | null;
  createdAt: string | null;
  lastFallAt: string | null;
  fallCount: number;
};

type AkteListResponse = {
  items: AkteListItem[];
  total: number;
  page: number;
  size: number;
};

function toneForCount(n: number): "neutral" | "info" | "success" {
  if (!Number.isFinite(n) || n <= 0) return "neutral";
  if (n === 1) return "info";
  return "success";
}

function formatDateTimeDE(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export default function AktenPage() {
  const router = useRouter();

  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [size] = React.useState(10);

  const [data, setData] = React.useState<AkteListResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(
      async (currentQ?: string, currentPage?: number) => {
        setLoading(true);
        setErr(null);

        try {
          const params = new URLSearchParams();
          const qq = (currentQ ?? q).trim();
          const pp = currentPage ?? page;

          if (qq) params.set("q", qq);
          params.set("page", String(pp));
          params.set("size", String(size));

          const res = await apiFetch<AkteListResponse>(`/api/akten?${params.toString()}`, { method: "GET" });
          setData(res);
        } catch (e: any) {
          setErr(e?.message || "Konnte Aktenliste nicht laden.");
          setData(null);
        } finally {
          setLoading(false);
        }
      },
      [page, q, size]
  );

  // initial load
  React.useEffect(() => {
    load();
  }, [load]);

  // debounced search via Topbar
  React.useEffect(() => {
    const t = setTimeout(() => {
      load(q, 0);
      setPage(0);
    }, 250);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const items = data?.items || [];
  const totalLabel = loading ? "…" : `${data?.total ?? items.length} Einträge`;

  return (
      <AuthGate>
        <div className="min-h-screen bg-brand-bg overflow-x-hidden">
          <Topbar
              title="Akten"
              onSearch={(val) => {
                setQ(val);
              }}
          />

          <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 pb-12 pt-4 space-y-4">
            {err ? (
                <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                  {err}
                </div>
            ) : null}

            {/* Header card / actions */}
            <div className="rounded-2xl border border-brand-border/40 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-brand-text2 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-brand-text truncate">Akten</div>
                    <div className="mt-1 text-sm text-brand-text2 truncate">{totalLabel}</div>
                  </div>
                </div>

                <Button
                    variant="secondary"
                    onClick={() => load()}
                    disabled={loading}
                    className="gap-2 h-11 w-full sm:w-auto justify-center"
                >
                  <RefreshCw className="h-4 w-4" />
                  Aktualisieren
                </Button>
              </div>
            </div>

            <Card className="border border-brand-border/40 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="text-sm font-semibold text-brand-text">Liste</div>
                <div className="text-xs text-brand-text2">{totalLabel}</div>
              </CardHeader>

              <CardContent className="space-y-2">
                {!items.length ? (
                    <div className="rounded-2xl border border-brand-border/40 bg-white p-4 text-sm text-brand-text2">
                      {q.trim()
                          ? "Keine Akten zu dieser Suche gefunden."
                          : "Noch keine Akten vorhanden. Bitte nach Anlegen des Kindes über „Neue Akte“ eine eröffnen."}
                    </div>
                ) : (
                    <div className="space-y-2">
                      {items.map((a) => (
                          <button
                              key={a.id}
                              onClick={() => router.push(`/dashboard/akten/${a.id}`)}
                              className="w-full rounded-2xl border border-brand-border/25 bg-white p-3 text-left transition hover:bg-brand-bg/30"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="truncate text-sm font-semibold text-brand-text">
                                    {a.kindName || `Kind #${a.kindId}`}
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-brand-text2 shrink-0" />
                                </div>
                                <div className="mt-1 text-xs text-brand-text2">
                                  Akte #{a.id} · Kind #{a.kindId}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <Badge tone={toneForCount(a.fallCount)}>{a.fallCount} Fälle</Badge>
                              </div>
                            </div>

                            <div className="mt-2 text-xs text-brand-text2">
                              Erstellt: {formatDateTimeDE(a.createdAt)} · Letzter Fall: {formatDateTimeDE(a.lastFallAt)}
                            </div>
                          </button>
                      ))}
                    </div>
                )}

                {/* pagination */}
                <div className="mt-3 flex items-center justify-between">
                  <Button
                      variant="secondary"
                      onClick={() => {
                        setPage((p) => {
                          const next = Math.max(0, p - 1);
                          load(q, next);
                          return next;
                        });
                      }}
                      disabled={loading || page <= 0}
                  >
                    Zurück
                  </Button>

                  <div className="text-xs text-brand-text2">Seite {page + 1}</div>

                  <Button
                      variant="secondary"
                      onClick={() => {
                        setPage((p) => {
                          const next = p + 1;
                          load(q, next);
                          return next;
                        });
                      }}
                      disabled={loading || (data ? (page + 1) * size >= data.total : true)}
                  >
                    Weiter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGate>
  );
}