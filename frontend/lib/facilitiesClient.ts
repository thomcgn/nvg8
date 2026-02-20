import type { Facility } from "@/lib/types";

export async function fetchFacilities(): Promise<Facility[]> {
    const res = await fetch("/api/facilities/public", {
        method: "GET",
        // kein credentials nötig, ist public
        cache: "no-store",
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as Facility[]) : (data.items ?? []);
}
