"use client";

import { ReactNode } from "react";

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar wird von DashboardPage mit Callback gesteuert */}
            {children}
        </div>
    );
}
