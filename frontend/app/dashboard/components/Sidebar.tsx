"use client";

interface SidebarProps {
    onStartWizard?: () => void; // Callback für "Neuer Fall"
}

import { useRouter } from "next/navigation";

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

                <div className="cursor-pointer hover:text-gray-900">
                    Fälle
                </div>

                <div
                    onClick={() => onStartWizard?.()} // Wizard starten
                    className="cursor-pointer font-medium text-indigo-600"
                >
                    Neuer Fall
                </div>

                <div className="cursor-pointer hover:text-gray-900">
                    Stammdaten
                </div>
            </nav>
        </aside>
    );
}
