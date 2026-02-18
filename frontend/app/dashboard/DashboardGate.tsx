"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toRole } from "@/app/auth/rbac";
import DashboardShell from "./components/DashboardShell";

type User = {
    name: string;
    role: string;
    lastLogin?: string | null;
};

export default function DashboardGate({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/auth/me", {
                cache: "no-store",
                credentials: "include",
            });

            if (res.status === 401) {
                router.replace("/"); // dort ist dein Login
                return;
            }

            if (!res.ok) {
                router.replace("/"); // fallback
                return;
            }

            const data = (await res.json()) as User;
            setUser(data);
        })();
    }, [router]);

    if (!user) return null;

    const role = toRole(user.role);

    return (
        <DashboardShell
            userName={user.name}
            userRole={role}
            lastLogin={user.lastLogin ?? undefined}
            onStartWizard={() => router.push("/dashboard?wizard=1")}
        >
            {children}
        </DashboardShell>
    );
}
