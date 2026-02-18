"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Role } from "@/app/auth/rbac";

type Props = {
    userName: string;
    userRole: Role;
    lastLogin?: string | undefined;
    children: React.ReactNode;
    onStartWizard?: () => void;
};

export default function DashboardShell({
                                           userName,
                                           userRole,
                                           lastLogin,
                                           children,
                                           onStartWizard,
                                       }: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen w-full bg-muted/40">
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
                <Sidebar userRole={userRole} onStartWizard={onStartWizard} />
            </div>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="p-0 w-[320px]">
                    {/* ✅ a11y: Title für Screenreader */}
                    <SheetHeader className="sr-only">
                        <SheetTitle>Menü</SheetTitle>
                    </SheetHeader>

                    <Sidebar
                        userRole={userRole}
                        variant="drawer"
                        onClose={() => setMobileOpen(false)}
                        onStartWizard={onStartWizard}
                    />
                </SheetContent>

                <div className="lg:pl-64">
                    <Navbar
                        userName={userName}
                        userRole={userRole}
                        lastLogin={lastLogin}
                        onOpenMenu={() => setMobileOpen(true)}
                    />
                    <main className="p-4 sm:p-6 lg:p-8">{children}</main>
                </div>
            </Sheet>
        </div>
    );
}
