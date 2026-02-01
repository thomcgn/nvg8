"use client";

export default function Sidebar() {
    const handleNewCaseClick = () => {
        window.dispatchEvent(new CustomEvent("start-new-case"));
    };

    return (
        <aside className="w-64 bg-white border-r px-6 py-8">
            <h2 className="text-xl font-bold text-gray-900 mb-8">Navig8tor</h2>

            <nav className="space-y-4 text-gray-700">
                <div className="font-medium text-indigo-600">Übersicht</div>
                <div className="hover:text-gray-900 cursor-pointer">Fälle</div>
                <div
                    className="hover:text-gray-900 cursor-pointer"
                    onClick={handleNewCaseClick}
                >
                    Neuer Fall
                </div>
                <div className="hover:text-gray-900 cursor-pointer">Stammdaten</div>
            </nav>
        </aside>
    );
}
