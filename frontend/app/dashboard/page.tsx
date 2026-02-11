"use client";

import { useState } from "react";
import Secu from "../auth/Nvg8Auth";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import StatCard from "./components/StatCard";
import CaseTable from "./components/CaseTable";
import CaseWizard from "../cases/components/CaseWizard";
import { FaUsers, FaFolderOpen, FaExclamationTriangle, FaPlus } from "react-icons/fa";
import type { Case } from "./components/types";

const mockCases: Case[] = [
    { id: 1, childName: "Lena M.", age: 4, status: "AKUT", lastActivity: "heute" },
    { id: 2, childName: "Tommy S.", age: 9, status: "BEOBACHTUNG", lastActivity: "gestern" },
    { id: 3, childName: "Amir K.", age: 2, status: "RUHEND", lastActivity: "12.01.2026" },
];

export default function DashboardPage() {
    const [showWizard, setShowWizard] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const startWizard = () => {
        setShowWizard(true);
        setSidebarOpen(false);
    };

    const cancelWizard = () => setShowWizard(false);

    return (
        <Secu fallback={<div className="p-4">Lade Dashboard…</div>}>
            {(user) => (
                <div className="min-h-screen bg-gray-100">
                    {/* Desktop layout wrapper */}
                    <div className="lg:flex lg:min-h-screen">
                        {/* Desktop Sidebar */}
                        <div className="hidden lg:block">
                            <Sidebar onStartWizard={startWizard} />
                        </div>

                        {/* Mobile Sidebar Drawer */}
                        <div className={`lg:hidden ${sidebarOpen ? "" : "pointer-events-none"}`}>
                            {/* Backdrop */}
                            <div
                                className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
                                    sidebarOpen ? "opacity-100" : "opacity-0"
                                }`}
                                onClick={() => setSidebarOpen(false)}
                            />
                            {/* Drawer */}
                            <div
                                className={`fixed left-0 top-0 z-50 h-full w-[82%] max-w-xs bg-white shadow-xl transition-transform ${
                                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                                }`}
                            >
                                <Sidebar onStartWizard={startWizard} />
                            </div>
                        </div>

                        {/* Main column */}
                        <div className="flex-1 flex flex-col">
                            {/* Navbar (make sure Navbar has a left "menu" trigger area or we add one here) */}
                            <div className="sticky top-0 z-30">
                                <div className="lg:hidden bg-white border-b">
                                    <div className="h-14 flex items-center gap-3 px-4">
                                        <button
                                            onClick={() => setSidebarOpen(true)}
                                            className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium bg-white"
                                            aria-label="Menü öffnen"
                                        >
                                            ☰
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 truncate">
                                                Dashboard
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {user.name} • {user.role}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Keep your existing Navbar for desktop (or for both if you prefer) */}
                                <div className="hidden lg:block">
                                    <Navbar
                                        userName={user.name}
                                        userRole={user.role}
                                        lastLogin={user.lastLogin}
                                    />
                                </div>
                            </div>

                            <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
                                {showWizard ? (
                                    <CaseWizard onCancel={cancelWizard} />
                                ) : (
                                    <>
                                        {/* Mobile-first grid: 1 col by default, grows with breakpoints */}
                                        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                                            <StatCard title="Meine offenen Fälle" value={7} icon={<FaFolderOpen />} />
                                            <StatCard title="Akut gefährdet" value={2} icon={<FaExclamationTriangle />} />
                                            <StatCard title="Abgeschlossen (30 Tage)" value={5} />
                                            <StatCard title="Kinder gesamt" value={18} icon={<FaUsers />} />
                                        </section>

                                        <section className="bg-white rounded-lg shadow p-4 sm:p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                                    Meine Fälle
                                                </h3>

                                                {/* Optional: quick action on mobile/tablet */}
                                                <button
                                                    onClick={() => setShowWizard(true)}
                                                    className="hidden sm:inline-flex lg:hidden items-center gap-2 rounded-md bg-gray-900 text-white px-3 py-2 text-sm font-medium"
                                                >
                                                    <FaPlus />
                                                    Neuer Fall
                                                </button>
                                            </div>

                                            <CaseTable cases={mockCases} />
                                        </section>
                                    </>
                                )}
                            </main>

                            {/* Mobile bottom action bar */}
                            {!showWizard && (
                                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t bg-white/95 backdrop-blur">
                                    <div className="p-3">
                                        <button
                                            onClick={() => setShowWizard(true)}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 text-white px-4 py-3 text-sm font-semibold"
                                        >
                                            <FaPlus />
                                            Neuen Fall starten
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Secu>
    );
}
