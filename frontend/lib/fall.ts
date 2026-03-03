import { meldungApi, type MeldungResponse } from "@/lib/api/meldung";

export type FallListItem = {
    id: number;
    fallNo: number | null;
    aktenzeichen: string | null;
    status: string | null;
    openedAt: string | null;
    createdAt: string | null;
};

export function isOpenFallStatus(status: string | null | undefined): boolean {
    const s = (status || "").trim().toUpperCase();
    return s === "OFFEN" || s === "OPEN";
}

export function isInPruefungStatus(status: string | null | undefined): boolean {
    const s = (status || "").trim().toUpperCase();
    return s === "IN_PRUEFUNG" || s === "INPRUEFUNG";
}

export function isAbgeschlossenStatus(status: string | null | undefined): boolean {
    const s = (status || "").trim().toUpperCase();
    return s === "ABGESCHLOSSEN" || s === "CLOSED" || s === "GESCHLOSSEN";
}

/**
 * Meldung ist "Draft", wenn Backend-Status ENTWURF.
 */
export function isMeldungDraftStatus(m: MeldungResponse | null | undefined): boolean {
    const s = (m?.status || "").trim().toUpperCase();
    return s === "ENTWURF" || s === "DRAFT";
}

/**
 * Lädt pro Fall die current Meldung und gibt eine Map fallId -> MeldungStatus zurück.
 * Fehler werden soft behandelt: fallId fehlt dann in der Map.
 */
export async function loadMeldungStatusByFallIds(fallIds: number[]): Promise<Record<number, string>> {
    const unique = Array.from(new Set(fallIds.filter((x) => Number.isFinite(x) && x > 0)));

    const entries = await Promise.all(
        unique.map(async (fallId) => {
            try {
                const cur = await meldungApi.current(fallId);
                return [fallId, cur.status || ""] as const;
            } catch {
                // z.B. noch keine Meldung => dann gilt es NICHT als "Draft block"
                return [fallId, ""] as const;
            }
        })
    );

    return Object.fromEntries(entries);
}

/**
 * TRUE, wenn es mindestens einen Fall gibt, dessen current Meldung ENTWURF ist.
 */
export function findFallWithDraftMeldung(
    items: FallListItem[],
    meldungStatusByFallId: Record<number, string>
): FallListItem | null {
    for (const f of items) {
        const ms = (meldungStatusByFallId[f.id] || "").trim().toUpperCase();
        if (ms === "ENTWURF" || ms === "DRAFT") return f;
    }
    return null;
}