"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { RequireAuth } from "@/lib/RequireAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <RequireAuth requireContext>
            {/* Wichtig: verhindert horizontales "Leaken" */}
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <div className="flex min-w-0">
                    {/* Sidebar: auf mobile/iPad nur Topbar+Drawer, auf lg+ feste Sidebar */}
                    <Sidebar />

                    {/* Main: min-w-0 verhindert, dass Childs overflowen */}
                    <main className="flex-1 min-w-0">
                        {/* Content padding mobile-first */}
                        <div className="p-4 sm:p-6 lg:p-6">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </RequireAuth>
    );
}