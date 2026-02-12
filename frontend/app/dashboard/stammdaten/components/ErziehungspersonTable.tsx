"use client";

import { useEffect, useState } from "react";

export interface Erziehungsperson {
    id: number;
    name: string;
    beziehung: string; // Mutter, Vater, Pflegeperson
    sorgerecht: string; // Voll, Teil, Kein
    aufenthaltsbestimmungsrecht: string; // Ja/Nein
    kontaktsperre: boolean;
}

export default function ErziehungspersonTable() {
    const [personen, setPersonen] = useState<Erziehungsperson[]>([]);
    const [loading, setLoading] = useState(true);

    // 🔹 MOCK DATEN
    const mockData: Erziehungsperson[] = [
        {
            id: 1,
            name: "Sabine Müller",
            beziehung: "Mutter",
            sorgerecht: "Voll",
            aufenthaltsbestimmungsrecht: "Ja",
            kontaktsperre: false,
        },
        {
            id: 2,
            name: "Thomas Müller",
            beziehung: "Vater",
            sorgerecht: "Kein",
            aufenthaltsbestimmungsrecht: "Nein",
            kontaktsperre: true,
        },
        {
            id: 3,
            name: "Petra Schneider",
            beziehung: "Pflegeperson",
            sorgerecht: "Kein",
            aufenthaltsbestimmungsrecht: "Nein",
            kontaktsperre: true,
        },
    ];

    useEffect(() => {
        // Fake-Ladezeit simulieren
        const timer = setTimeout(() => {
            setPersonen(mockData);
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    if (loading) return <div>Lade Erziehungspersonen…</div>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow">
                <thead>
                <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left text-black">Name</th>
                    <th className="px-4 py-2 text-left text-black">Beziehung</th>
                    <th className="px-4 py-2 text-left text-black">Sorgerecht</th>
                    <th className="px-4 py-2 text-left text-black">Aufenthaltsbestimmungsrecht</th>
                    <th className="px-4 py-2 text-left text-black">Kontaktsperre</th>
                    <th className="px-4 py-2 text-left text-black">Aktionen</th>
                </tr>
                </thead>

                <tbody>
                {personen.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50 transition">
                        <td className="px-4 py-2 text-black font-medium">{p.name}</td>
                        <td className="px-4 py-2 text-black">{p.beziehung}</td>
                        <td className="px-4 py-2">{p.sorgerecht ?(
                            <span className="text-red-600 font-semibold">Ja</span>
                        ) : (
                            <span className="text-green-600">Nein</span>
                        )}
                        </td>
                        <td className="px-4 py-2">{p.aufenthaltsbestimmungsrecht}</td>

                        <td className="px-4 py-2">
                            {p.kontaktsperre ? (
                                <span className="text-green-600 font-semibold">Ja</span>
                            ) : (
                                <span className="text-red-600">Nein</span>
                            )}
                        </td>

                        <td className="px-4 py-2 flex gap-2">
                            <button className="px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition">
                                Bearbeiten
                            </button>
                            <button className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition">
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
