"use client";

import { useRouter } from "next/navigation";

interface SidebarProps {
    onStartWizard?: () => void;
}

export default function Sidebar({ onStartWizard }: SidebarProps) {
    const router = useRouter();

    return (
        <aside className="w-64 bg-white border-r px-6 py-8">
            <h2 className="text-xl font-bold text-gray-900 mb-8">Navig8tor</h2>

            <nav className="space-y-4 text-gray-700">
                <div
                    onClick={() => router.push("/dashboard")}
                    className="cursor-pointer hover:text-gray-900"
                >
                    Übersicht
                </div>

                <div
                    onClick={() => router.push("/dashboard/cases")}
                    className="cursor-pointer hover:text-gray-900"
                >
                    Fälle
                </div>

                <div
                    onClick={() => onStartWizard?.()}
                    className="cursor-pointer font-medium text-indigo-600"
                >
                    Neuer Fall
                </div>

                <div
                    onClick={() => router.push("/dashboard/stammdaten")}
                    className="cursor-pointer hover:text-gray-900"
                >
                    Stammdaten
                </div>
            </nav>
        </aside>
    );
}
