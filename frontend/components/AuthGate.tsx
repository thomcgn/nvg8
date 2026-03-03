"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { selectContext } from "@/lib/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { me, loading, refresh } = useAuth();

  const [switching, setSwitching] = useState(false);
  const [switchErr, setSwitchErr] = useState<string | null>(null);
  const didAttemptSwitchRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    // nicht eingeloggt
    if (!me) {
      router.replace("/login");
      return;
    }

    // Kontext ist bereits aktiv -> nichts tun
    if (me.contextActive) return;

    // Kontext nicht aktiv -> 1x automatisch switchen (nur wenn orgUnitId da ist)
    if (didAttemptSwitchRef.current) return;
    didAttemptSwitchRef.current = true;

    const einrichtungOrgUnitId = me.orgUnitId;
    if (!einrichtungOrgUnitId) {
      // Wenn das jemals passiert, kann man hier später auf /context-wahl routen
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        setSwitchErr(null);
        setSwitching(true);

        await selectContext(einrichtungOrgUnitId);
        await refresh(); // /auth/me neu holen -> contextActive sollte true werden
      } catch (e: any) {
        setSwitchErr(e?.message || "Kontext konnte nicht gesetzt werden.");
        router.replace("/login");
      } finally {
        setSwitching(false);
      }
    })();
  }, [loading, me, refresh, router]);

  if (loading || switching) {
    return (
        <div className="min-h-screen grid place-items-center bg-brand-bg">
          <div className="text-sm text-brand-text2">
            {loading ? "Lade Sitzung…" : "Setze Kontext…"}
          </div>
          {switchErr ? (
              <div className="mt-2 text-xs text-red-500">{switchErr}</div>
          ) : null}
        </div>
    );
  }

  if (!me) return null;
  if (!me.contextActive) return null;

  return <>{children}</>;
}