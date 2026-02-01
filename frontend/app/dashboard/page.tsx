"use client";

import { useState } from "react";
import StatCard from "./components/StatCard";
import CaseTable from "./components/CaseTable";
import CaseWizard from "../cases/components/CaseWizard"; // Wizard import
import { FaUsers, FaFolderOpen, FaExclamationTriangle } from "react-icons/fa";
import { Case } from "@/app/dashboard/components/types";

const mockCases: Case[] = [
    { id: 1, childName: "Lena M.", age: 4, status: "AKUT", lastActivity: "heute" },
    { id: 2, childName: "Tom S.", age: 9, status: "BEOBACHTUNG", lastActivity: "gestern" },
    { id: 3, childName: "Amir K.", age: 2, status: "RUHEND", lastActivity: "12.01.2026" },
];

interface DashboardPageProps {
    startWizard?: () => void; // Callback von Sidebar
}

export default function DashboardPage({ startWizard }: DashboardPageProps) {
    const [showWizard, setShowWizard] = useState(false);

    // Wird vom Layout / Sidebar aufgerufen
    const openWizard = () => {
        setShowWizard(true);
        startWizard?.(); // optional, falls du im Layout noch was triggern willst
    };

    const cancelWizard = () => setShowWizard(false);

    return (
        <>
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Meine Fälle</h3>
                        <CaseTable cases={mockCases} />
                    </section>
                </>
            )}
        </>
    );
}
