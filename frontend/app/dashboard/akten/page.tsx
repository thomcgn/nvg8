"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

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
      // whenever q changes, reset to first page
      load(q, 0);
      setPage(0);
    }, 250);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const items = data?.items || [];

  return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Topbar
              title="Akten"
              onSearch={(val) => {
                setQ(val);
              }}
          />

          <div className="mx-auto w-full max-w-6xl space-y-4 p-4 md:p-6">
            <div className="flex items-center justify-between">


              <Button variant="secondary" onClick={() => load()} disabled={loading}>
                Aktualisieren
              </Button>
            </div>

            {err ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>
            ) : null}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="text-sm font-semibold">Liste</div>
                <div className="text-xs text-muted-foreground">{loading ? "…" : `${data?.total ?? items.length} Einträge`}</div>
              </CardHeader>

              <CardContent className="space-y-2">
                {!items.length ? (
                    <div className="rounded-2xl border border-border bg-muted p-4 text-sm text-muted-foreground">
                      {q.trim()
                          ? "Keine Akten zu dieser Suche gefunden."
                          : "Noch keine Akten vorhanden. Bitte nach anlegen des Kindes über Neue Akte eine eröffnen."}
                    </div>
                ) : (
                    <div className="space-y-2">
                      {items.map((a) => (
                          <button
                              key={a.id}
                              onClick={() => router.push(`/dashboard/akten/${a.id}`)}
                              className="w-full rounded-2xl border border-border bg-card p-3 text-left transition hover:bg-accent"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold">{a.kindName || `Kind #${a.kindId}`}</div>
                                <div className="mt-1 text-xs text-muted-foreground">Akte #{a.id} · Kind #{a.kindId}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge tone={toneForCount(a.fallCount)}>{a.fallCount} Fälle</Badge>
                              </div>
                            </div>

                            <div className="mt-2 text-xs text-muted-foreground">
                              Erstellt: {a.createdAt || "—"} · Letzter Fall: {a.lastFallAt || "—"}
                            </div>
                          </button>
                      ))}
                    </div>
                )}

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

                  <div className="text-xs text-muted-foreground">Seite {page + 1}</div>

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