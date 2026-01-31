"use client";

import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Card from "./components/Card";
import { FaUsers, FaFolderOpen } from "react-icons/fa";

interface Case {
    id: number;
    title: string;
    status: string;
}

interface User {
    id: number;
    email: string;
    roles: string[];
}

export default function DashboardPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const token = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                const [usersRes, casesRes] = await Promise.all([
                    fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_URL}/cases`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);

                if (!usersRes.ok || !casesRes.ok) throw new Error("Fehler beim Laden der Daten");

                setUsers(await usersRes.json());
                setCases(await casesRes.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, API_URL]);

    return (
        <div className="flex">
            <Sidebar />

            <div className="flex-1 flex flex-col">
                <Navbar />

                <main className="p-6 bg-gray-600 flex-1">
                    <h2 className="text-2xl font-bold mb-6">Übersicht</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <Card title="Benutzer gesamt" value={users.length} icon={<FaUsers />} />
                        <Card title="Fälle gesamt" value={cases.length} icon={<FaFolderOpen />} />
                        <Card title="Offene Fälle" value={cases.filter(c => c.status === "offen").length} />
                        <Card title="Abgeschlossene Fälle" value={cases.filter(c => c.status === "abgeschlossen").length} />
                    </div>

                    <section className="bg-white rounded shadow p-4">
                        <h3 className="text-xl text-black font-semibold mb-4">Neueste Fälle</h3>
                        {loading ? (
                            <p className="text-black">Lade Daten...</p>
                        ) : (
                            <ul className="divide-y">
                                {cases.slice(0, 5).map(c => (
                                    <li key={c.id} className="py-2">
                                        <strong>{c.title}</strong> – {c.status}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}
