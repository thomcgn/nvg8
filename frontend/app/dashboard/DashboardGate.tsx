"use client";

import * as React from "react";
import Secu from "../auth/Nvg8Auth";
import DashboardShell from "./components/DashboardShell";

type Props = { children: React.ReactNode };

export default function DashboardGate({ children }: Props) {
    return (
        <Secu fallback={<div className="p-6">Lade Dashboard…</div>}>
            {(user) => (
                <DashboardShell
                    userName={user.name}
                    userRole={user.role}
                    lastLogin={user.lastLogin}
                    onStartWizard={() => {
                        // optional: hier später router.push("/dashboard?wizard=1")
                    }}
                >
                    {children}
                </DashboardShell>
            )}
        </Secu>
    );
}