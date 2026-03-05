"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { RequireAuth } from "@/lib/RequireAuth";
import { TicketsUIProvider } from "@/components/support/TicketsUIProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <RequireAuth requireContext>
            <TicketsUIProvider>
                <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                    <div className="flex min-w-0">
                        <Sidebar />
                        <main className="flex-1 min-w-0">
                            <div className="p-4 sm:p-6 lg:p-6">{children}</div>
                        </main>
                    </div>
                </div>
            </TicketsUIProvider>
        </RequireAuth>
    );
}