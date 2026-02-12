"use client";

import { useState } from "react";
import Secu, { UserInfo } from "@/app/auth/Nvg8Auth";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import KinderTable from "./components/KinderTable";
import ErziehungspersonTable from "./components/ErziehungspersonTable";

export default function StammdatenPage() {
    const [activeTab, setActiveTab] = useState<"kinder" | "erziehungspersonen">("kinder");

    return (
        <Secu fallback={<div>Lade Benutzerdaten…</div>}>
            {(user: UserInfo) => (
                <div className="flex min-h-screen bg-gray-100">
                    <Sidebar />
                    <div className="flex-1 flex flex-col">
                        <Navbar userName={user.name} userRole={user.role} lastLogin={user.lastLogin} />

                        <main className="p-8 flex-1">
                            {/* Tabs */}
                            <div className="mb-6 flex gap-4 border-b">
                                <button
                                    className={`px-4 py-2 text-black ${activeTab === "kinder" ? "border-b-2 border-indigo-600 font-semibold" : "text-black"}`}
                                    onClick={() => setActiveTab("kinder")}
                                >
                                    Kinder
                                </button>
                                <button
                                    className={`px-4 py-2 text-black ${activeTab === "erziehungspersonen" ? "border-b-2 border-indigo-600 font-semibold" : "text-black"}`}
                                    onClick={() => setActiveTab("erziehungspersonen")}
                                >
                                    Erziehungspersonen
                                </button>
                            </div>

                            {/* Tabellen */}
                            {activeTab === "kinder" && <KinderTable />}
                            {activeTab === "erziehungspersonen" && <ErziehungspersonTable />}
                        </main>
                    </div>
                </div>
            )}
        </Secu>
    );
}
