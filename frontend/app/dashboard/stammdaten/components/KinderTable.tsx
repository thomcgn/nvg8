"use client";

import { useEffect, useState } from "react";

export interface Kind {
    id: number;
    name: string;
    geburtsdatum: string;
    geschlecht: string;
    // weitere Felder nach §8a SGB VIII
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function KinderTable() {
    const [kinder, setKinder] = useState<Kind[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchKinder = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/kinder`, { credentials: "include" });
            if (!res.ok) throw new Error("Fehler beim Laden der Kinder");
            const data = await res.json();
            setKinder(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKinder();
    }, []);

    if (loading) return <div>Lade Kinder…</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow">
                <thead>
                <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Geburtsdatum</th>
                    <th className="px-4 py-2 text-left">Geschlecht</th>
                    <th className="px-4 py-2 text-left">Aktionen</th>
                </tr>
                </thead>
                <tbody>
                {kinder.map((k) => (
                    <tr key={k.id} className="border-t">
                        <td className="px-4 py-2">{k.name}</td>
                        <td className="px-4 py-2">{k.geburtsdatum}</td>
                        <td className="px-4 py-2">{k.geschlecht}</td>
                        <td className="px-4 py-2 flex gap-2">
                            <button className="px-2 py-1 bg-indigo-500 text-white rounded">Bearbeiten</button>
                            <button className="px-2 py-1 bg-red-500 text-white rounded">Löschen</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
