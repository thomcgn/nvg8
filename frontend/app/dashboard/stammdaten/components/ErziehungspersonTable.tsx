"use client";

import { useEffect, useCallback, useState } from "react";

export interface Erziehungsperson {
    id: number;
    name: string;
    beziehung: string; // z.B. Mutter, Vater, Pflegeperson
    sorgerecht: string; // Voll, Teil, Kein
    aufenthaltsbestimmungsrecht: string; // Ja/Nein
    kontaktsperre: boolean;
}

export default function ErziehungspersonTable() {
    const [personen, setPersonen] = useState<Erziehungsperson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPersonen = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/cases/erziehungspersonen`, {
                credentials: "include",
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(
                    `Fehler beim Laden der Erziehungspersonen (${res.status})${
                        text ? ` ${text}` : ""
                    }`
                );
            }

            const data = (await res.json()) as Erziehungsperson[];
            setPersonen(data);
        } catch (err: any) {
            console.error(err);
            setError(err?.message ?? "Unbekannter Fehler");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPersonen();
    }, [fetchPersonen]);

    if (loading) return <div>Lade Erziehungspersonen…</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow">
                <thead>
                <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Beziehung</th>
                    <th className="px-4 py-2 text-left">Sorgerecht</th>
                    <th className="px-4 py-2 text-left">Aufenthaltsbestimmungsrecht</th>
                    <th className="px-4 py-2 text-left">Kontaktsperre</th>
                    <th className="px-4 py-2 text-left">Aktionen</th>
                </tr>
                </thead>
                <tbody>
                {personen.map((p) => (
                    <tr key={p.id} className="border-t">
                        <td className="px-4 py-2">{p.name}</td>
                        <td className="px-4 py-2">{p.beziehung}</td>
                        <td className="px-4 py-2">{p.sorgerecht}</td>
                        <td className="px-4 py-2">{p.aufenthaltsbestimmungsrecht}</td>
                        <td className="px-4 py-2">{p.kontaktsperre ? "Ja" : "Nein"}</td>
                        <td className="px-4 py-2 flex gap-2">
                            <button className="px-2 py-1 bg-indigo-500 text-white rounded">
                                Bearbeiten
                            </button>
                            <button className="px-2 py-1 bg-red-500 text-white rounded">
                                Löschen
                            </button>
                        </td>
                    </tr>
                ))}
                {personen.length === 0 && (
                    <tr>
                        <td className="px-4 py-3 text-gray-500" colSpan={6}>
                            Keine Erziehungspersonen vorhanden.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
}
