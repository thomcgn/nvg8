"use client";

interface SidebarProps {
    onStartWizard: () => void; // Callback an DashboardPage
}

export default function Sidebar({ onStartWizard }: SidebarProps) {
    return (
        <aside className="w-64 bg-white border-r px-6 py-8">
            <h2 className="text-xl font-bold text-gray-900 mb-8">
                Navig8tor
            </h2>

            <nav className="space-y-4 text-gray-700">
                <div
                    className="cursor-pointer hover:text-gray-900"
                    onClick={() => window.location.href = "/dashboard"}
                >
                    Übersicht
                </div>

                <div className="cursor-pointer hover:text-gray-900">
                    Fälle
                </div>

                <div
                    className="cursor-pointer font-medium text-indigo-600"
                    onClick={onStartWizard} // startet Wizard
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
