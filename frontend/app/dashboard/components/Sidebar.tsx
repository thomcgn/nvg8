"use client";

import Link from "next/link";

export default function Sidebar() {
    return (
        <aside className="w-64 bg-gray-600 text-white min-h-screen flex flex-col p-6">
            <h2 className="text-2xl font-bold mb-8">Navig8tor</h2>
            <nav className="flex flex-col gap-4">
                <Link href="/dashboard" className="hover:bg-indigo-600 px-3 py-2 rounded">Dashboard</Link>
                <Link href="/dashboard/users" className="hover:bg-indigo-600 px-3 py-2 rounded">Benutzer</Link>
                <Link href="/dashboard/cases" className="hover:bg-indigo-600 px-3 py-2 rounded">Fälle</Link>
                <Link href="/dashboard/settings" className="hover:bg-indigo-600 px-3 py-2 rounded">Einstellungen</Link>
            </nav>
        </aside>
    );
}
