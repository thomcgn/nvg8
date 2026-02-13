"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Secu from "../auth/Nvg8Auth";
import DashboardShell from "./components/DashboardShell";
import StatCard from "./components/StatCard";
import CaseTable from "./components/CaseTable";
import CaseWizard from "../cases/components/CaseWizard";

import { FaUsers, FaFolderOpen, FaExclamationTriangle } from "react-icons/fa";
import { Case } from "./components/types";

const mockCases: Case[] = [
    { id: 1, childName: "Lena M.", age: 4, status: "AKUT", lastActivity: "heute" },
    { id: 2, childName: "Tom S.", age: 9, status: "BEOBACHTUNG", lastActivity: "gestern" },
    { id: 3, childName: "Amir K.", age: 2, status: "RUHEND", lastActivity: "12.01.2026" },
];

export default function DashboardPage() {
    const [showWizard, setShowWizard] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (searchParams.get("wizard") === "1") {
            setShowWizard(true);
            router.replace("/dashboard");
        }
    }, [searchParams, router]);

    const cancelWizard = () => setShowWizard(false);

    return (
        <Secu fallback={<div className="p-6">Lade Dashboard…</div>}>
            {(user) => (
                <DashboardShell
                    userName={user.name}
                    userRole={user.role}
                    lastLogin={user.lastLogin}
                    onStartWizard={() => setShowWizard(true)}
                >
                    {showWizard ? (
                        <CaseWizard onCancel={cancelWizard} />
                    ) : (
                        <>
                            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
                                <StatCard title="Meine offenen Fälle" value={7} icon={<FaFolderOpen />} />
                                <StatCard title="Akut gefährdet" value={2} icon={<FaExclamationTriangle />} />
                                <StatCard title="Abgeschlossen (30 Tage)" value={5} />
                                <StatCard title="Kinder gesamt" value={18} icon={<FaUsers />} />
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold">Meine Fälle</h3>
                                <CaseTable cases={mockCases} />
                            </section>
                        </>
                    )}
                </DashboardShell>
            )}
        </Secu>
    );
}