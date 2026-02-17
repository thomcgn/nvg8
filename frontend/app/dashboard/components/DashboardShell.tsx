"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { Role } from "@/app/auth/rbac";

type Props = {
    userName: string;
    userRole: Role;              // ✅ war string
    lastLogin?: string;
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
            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
                <Sidebar userRole={userRole} onStartWizard={onStartWizard} />
            </div>

            {/* Mobile drawer */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="p-0 w-[320px]">
                    <Sidebar
                        userRole={userRole}
                        variant="drawer"
                        onClose={() => setMobileOpen(false)}
                        onStartWizard={onStartWizard}
                    />
                </SheetContent>

                {/* Main */}
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