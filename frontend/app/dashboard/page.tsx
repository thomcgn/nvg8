"use client";

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import StatCard from "./components/StatCard";
import CaseTable from "./components/CaseTable";
import CaseWizard from "../cases/components/CaseWizard";
import { FaUsers, FaFolderOpen, FaExclamationTriangle } from "react-icons/fa";
import { Case } from "@/app/dashboard/components/types";

const mockCases: Case[] = [
    { id: 1, childName: "Lena M.", age: 4, status: "AKUT", lastActivity: "heute" },
    { id: 2, childName: "Tom S.", age: 9, status: "BEOBACHTUNG", lastActivity: "gestern" },
    { id: 3, childName: "Amir K.", age: 2, status: "RUHEND", lastActivity: "12.01.2026" },
];

export default function DashboardPage() {
    const [showWizard, setShowWizard] = useState(false);
    const [userName, setUserName] = useState("–");
    const [userRole, setUserRole] = useState("–");
    const [lastLogin, setLastLogin] = useState("–");
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    // User-Daten aus Backend holen
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("jwt");
                if (!token) return;

                const res = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error("Fehler beim Abrufen der Benutzerdaten");

                const data = await res.json();
                setUserName(data.name);
                setUserRole(data.role);
                setLastLogin(new Date(data.lastLogin).toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                }));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const cancelWizard = () => setShowWizard(false);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Lade Dashboard…</div>;
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar onStartWizard={() => setShowWizard(true)} />

            <div className="flex-1 flex flex-col">
                <Navbar userName={userName} userRole={userRole} lastLogin={lastLogin} />

                <main className="p-8 flex-1">
                    {showWizard ? (
                        <CaseWizard onCancel={cancelWizard} />
                    ) : (
                        <>
                            {/* STATCARDS */}
                            <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <StatCard title="Meine offenen Fälle" value={7} icon={<FaFolderOpen />} />
                                <StatCard title="Akut gefährdet" value={2} icon={<FaExclamationTriangle />} />
                                <StatCard title="Abgeschlossen (30 Tage)" value={5} />
                                <StatCard title="Kinder gesamt" value={18} icon={<FaUsers />} />
                            </section>

                            {/* CASETABLE */}
                            <section className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Meine Fälle
                                </h3>
                                <CaseTable cases={mockCases} />
                            </section>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
