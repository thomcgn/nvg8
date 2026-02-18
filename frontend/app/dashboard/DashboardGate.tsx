"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import Secu, { type UserInfo } from "@/app/auth/Nvg8Auth";
import DashboardShell from "@/app/dashboard/components/DashboardShell";
import { ME_REFRESH_EVENT } from "@/app/auth/meRefreshEvent";

export default function DashboardGate({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    // Wenn wir den key ändern, wird Secu remounted und lädt user/me neu
    const [meVersion, setMeVersion] = React.useState(0);

    React.useEffect(() => {
        const handler = () => setMeVersion((v) => v + 1);
        window.addEventListener(ME_REFRESH_EVENT, handler);
        return () => window.removeEventListener(ME_REFRESH_EVENT, handler);
    }, []);

    return (
        <Secu
            key={meVersion}
            fallback={<div className="p-6">Lade Benutzerdaten…</div>}
        >
            {(user: UserInfo) => (
                <DashboardShell
                    userName={user.name}
                    userRole={user.role}
                    lastLogin={user.lastLogin}
                    onStartWizard={() => router.push("/dashboard?wizard=1")}
                >
                    {children}
                </DashboardShell>
            )}
        </Secu>
    );
}