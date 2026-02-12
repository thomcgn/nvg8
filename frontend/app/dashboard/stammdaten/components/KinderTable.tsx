"use client";

import { useEffect, useState } from "react";

type Kind = {
    id: number;
    vorname?: string;
    nachname?: string;
    name?: string;
    geburtsdatum?: string;
};

export default function KinderTable() {
    const [kinder, setKinder] = useState<Kind[]>([]);
    const [loading, setLoading] = useState(true);

    // 🔹 MOCK DATEN
    const mockKinder: Kind[] = [
        {
            id: 1,
            vorname: "Lena",
            nachname: "Müller",
            geburtsdatum: "2019-04-12",
        },
        {
            id: 2,
            vorname: "Tom",
            nachname: "Schneider",
            geburtsdatum: "2016-09-03",
        },
    ];

    useEffect(() => {
        // Fake-Ladezeit simulieren
        const timer = setTimeout(() => {
            setKinder(mockKinder);
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    if (loading) return <div>Lade Kinder…</div>;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg text-black font-semibold mb-4">Kinder</h3>

            {kinder.length === 0 ? (
                <div className="text-red-500">Keine Kinder vorhanden.</div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="border-b">
                        <th className="py-2 text-black">Name</th>
                        <th className="py-2 text-black">Geburtsdatum</th>
                    </tr>
                    </thead>
                    <tbody>
                    {kinder.map((k) => {
                        const displayName =
                            k.name ??
                            [k.vorname, k.nachname].filter(Boolean).join(" ") ??
                            `#${k.id}`;

                        const formattedDate = k.geburtsdatum
                            ? new Date(k.geburtsdatum).toLocaleDateString("de-DE")
                            : "–";

                        return (
                            <tr
                                key={k.id}
                                className="border-b hover:bg-gray-50 transition"
                            >
                                <td className="py-2 font-medium text-black">{displayName}</td>
                                <td className="py-2 text-black">{formattedDate}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            )}
        </div>
    );
}
