"use client";

import { useRouter } from "next/navigation";
import { toRole } from "@/app/auth/rbac";
import DashboardShell from "./components/DashboardShell";

type User = {
    name: string;
    role: string;        // kommt als string vom Backend
    lastLogin: string | undefined;
};

type Props = {
    user: User;
};

export default function DashboardGate({ user }: Props) {
    const router = useRouter();

    // 🔐 sichere Typ-Umwandlung
    const role = toRole(user.role);

    return (
        <DashboardShell
            userName={user.name}
            userRole={role}
            lastLogin={user.lastLogin}
            onStartWizard={() => router.push("/dashboard?wizard=1")} children={undefined}        />
    );
}
