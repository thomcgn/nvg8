"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader as ShadDialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import type { LoginResponse, SelectContextResponse, AvailableContextDto } from "@/lib/types";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/lib/useAuth";

function errorMessage(e: unknown, fallback: string) {
  if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return fallback;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
      <div className="space-y-1.5">
        <div className="text-xs font-semibold text-brand-text2">{label}</div>
        {children}
      </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("demo@kidoc.local");
  const [password, setPassword] = useState("demo");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [contexts, setContexts] = useState<AvailableContextDto[]>([]);
  const [contextOpen, setContextOpen] = useState(false);

  const groupedContexts = useMemo(() => {
    return contexts.reduce<Record<string, AvailableContextDto[]>>((acc, c) => {
      const key = c.traegerName || `Träger ${c.traegerId}`;
      (acc[key] ||= []).push(c);
      return acc;
    }, {});
  }, [contexts]);

  async function onLogin() {
    setErr(null);
    setLoading(true);
    try {
      const res = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      // System-Admin: Access-Cookie wurde serverseitig direkt gesetzt, kein Context-Switch nötig
      if (res.systemAdmin) {
        await refresh();
        router.push("/dashboard");
        return;
      }

      const ctxs = res.contexts || [];
      setContexts(ctxs);

      if (ctxs.length === 0) {
        setErr("Ihr Konto hat keinen Einrichtungszugang. Bitte wenden Sie sich an den Administrator.");
      } else if (ctxs.length === 1) {
        await selectContext(ctxs[0].orgUnitId);
      } else {
        setContextOpen(true);
      }
    } catch (e: unknown) {
      setErr(errorMessage(e, "Login fehlgeschlagen."));
    } finally {
      setLoading(false);
    }
  }

  async function selectContext(orgUnitId: number) {
    setErr(null);
    setLoading(true);
    try {
      await apiFetch<SelectContextResponse>("/auth/context/switch", {
        method: "POST",
        body: { einrichtungOrgUnitId: orgUnitId },
      });

      await refresh();
      setContextOpen(false);
      router.push("/dashboard");
    } catch (e: unknown) {
      setErr(errorMessage(e, "Kontext konnte nicht gesetzt werden."));
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="min-h-screen bg-brand-bg">
        <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-stretch gap-8 px-6 py-8 md:grid-cols-2 md:items-center md:py-10">
          {/* LEFT (Desktop) */}
          <div className="hidden md:block">
            <div className="rounded-3xl bg-linear-to-br from-brand-navy to-brand-blue p-1 shadow-soft">
              <div className="rounded-[22px] bg-brand-navy p-10 text-white">
                <BrandMark />

                <div className="mt-10 max-w-md">
                  <div className="text-3xl font-extrabold leading-tight">Digitale Fachverfahren für §8a</div>
                  <p className="mt-3 text-white/80">
                    Schutz. Struktur. Verlässlichkeit. Rechtssicher – als Workflow, nicht als Papier.
                  </p>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    {[
                      { title: "Dossiers", desc: "Fallakte & Verlauf" },
                      { title: "Assessments", desc: "Einschätzung & Nachweise" },
                      { title: "Risikobewertung", desc: "Ampel & Maßnahmen" },
                      { title: "Audit", desc: "Protokoll & Nachvollzug" },
                    ].map((c) => (
                        <div key={c.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-sm font-semibold">{c.title}</div>
                          <div className="mt-1 text-xs text-white/70">{c.desc}</div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT (Login) */}
          <div className="flex w-full items-start md:items-center md:justify-center">
            <div className="w-full max-w-md">
              {/* Logo (bündig, kleine Lücke zur Card) */}
              <div className="mb-3 md:mb-4">
                <Image
                    src="/brand/kidoc-clean-transparent.png"
                    alt="KIDOC – Digitales Fachverfahren für §8a"
                    width={1200}
                    height={340}
                    priority
                    className="h-auto w-full"
                />
              </div>

              <Card className="w-full shadow-soft">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <BrandMark compact />
                    <div className="text-xs font-semibold text-brand-text2">Login</div>
                  </div>
                </CardHeader>

                <CardContent>
                  {err ? (
                      <div className="mb-4 rounded-xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                        {err}
                      </div>
                  ) : null}

                  <div className="space-y-4">
                    <Field label="E-Mail">
                      <Input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@behörde.de"
                          autoComplete="email"
                      />
                    </Field>

                    <Field label="Passwort">
                      <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="current-password"
                      />
                    </Field>

                    <Button onClick={onLogin} disabled={loading} className="w-full">
                      {loading ? "Bitte warten…" : "Anmelden"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-3 text-center text-xs text-brand-text2 md:mt-4">
                © {new Date().getFullYear()} KIDOC · Sicherer Zugang
              </div>
            </div>
          </div>
        </div>

        {/* Kontextwahl: shadcn Dialog */}
        <Dialog open={contextOpen} onOpenChange={setContextOpen}>
          <DialogContent className="max-w-2xl">
            <ShadDialogHeader>
              <DialogTitle>Einrichtung wählen</DialogTitle>
            </ShadDialogHeader>

            <div className="space-y-3">
              <div className="text-sm text-brand-text2">Bitte wähle Einrichtung für diese Sitzung.</div>

              <div className="space-y-4">
                {Object.entries(groupedContexts).map(([traegerName, list]) => (
                    <div key={traegerName} className="space-y-2">
                      <div className="px-1 text-xs font-semibold text-brand-text2">{traegerName}</div>

                      <div className="grid gap-2">
                        {list.map((c) => (
                            <button
                                key={c.orgUnitId}
                                className="flex items-center justify-between rounded-xl border border-brand-border bg-white p-3 text-left hover:bg-brand-bg disabled:opacity-60"
                                onClick={() => selectContext(c.orgUnitId)}
                                disabled={loading}
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-brand-text">{c.orgUnitName}</div>
                                <div className="mt-0.5 text-xs text-brand-text2">{c.traegerName}</div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-brand-text2" />
                            </button>
                        ))}
                      </div>
                    </div>
                ))}

                {!contexts.length ? (
                    <div className="rounded-xl border border-brand-border bg-brand-bg p-3 text-sm text-brand-text2">
                      Keine Kontexte vom Backend erhalten.
                    </div>
                ) : null}
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary" disabled={loading}>
                  Schließen
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}