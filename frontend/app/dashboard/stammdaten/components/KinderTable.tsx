"use client";

import { useEffect, useState } from "react";

type Kind = {
    id: number;
    vorname?: string;
    nachname?: string;
    name?: string; // falls dein DTO bereits "name" liefert
    geburtsdatum?: string;
};

export default function KinderTable() {
    const [kinder, setKinder] = useState<Kind[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchKinder = async () => {
            setLoading(true);
            setError(null);

            try {
                // Wichtig: über Next-Rewrite gehen, nicht über API_URL
                const res = await fetch("/api/cases/kinder", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                });

                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(
                        `Fehler beim Laden der Kinder (${res.status}) ${text ? text : ""}`.trim()
                    );
                }

                const data = (await res.json()) as Kind[];
                setKinder(Array.isArray(data) ? data : []);
            } catch (e: any) {
                setError(e?.message || "Fehler beim Laden der Kinder");
            } finally {
                setLoading(false);
            }
        };

        fetchKinder();
    }, []);

    if (loading) return <div>Lade Kinder…</div>;
    if (error) return <div className="text-red-600">{error}</div>;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Kinder</h3>

            {kinder.length === 0 ? (
                <div className="text-gray-600">Keine Kinder vorhanden.</div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="border-b">
                        <th className="py-2">Name</th>
                        <th className="py-2">Geburtsdatum</th>
                    </tr>
                    </thead>
                    <tbody>
                    {kinder.map((k) => {
                        const displayName =
                            k.name ??
                            [k.vorname, k.nachname].filter(Boolean).join(" ") ??
                            `#${k.id}`;

                        return (
                            <tr key={k.id} className="border-b">
                                <td className="py-2">{displayName}</td>
                                <td className="py-2">{k.geburtsdatum ?? "–"}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            )}
        </div>
    );
}
