// lib/context.ts

import { apiFetch } from "@/lib/api";
import { setCurrentEinrichtungId } from "@/lib/context-store";

export async function apiSwitchContext(einrichtungId: number): Promise<void> {
    await apiFetch("/auth/context/switch", {
        method: "POST",
        body: { einrichtungId },
    });

    // Wenn erfolgreich → lokal merken
    setCurrentEinrichtungId(einrichtungId);
}