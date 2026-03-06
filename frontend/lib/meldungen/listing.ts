import {apiFetch, FallMeldungListItem} from "@/lib/api";

export async function listMeldungenByFallId(fallId: number) {
    // Dein Backend liefert: https://localhost:8080/falloeffnungen/1/meldungen
    // -> das ist KEIN /api-prefix. Deshalb exakt so:
    return apiFetch<FallMeldungListItem[]>(`/falloeffnungen/${fallId}/meldungen`, { method: "GET" });
}