"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const [userName, setUserName] = useState<string>("–");
    const [userRole, setUserRole] = useState<string>("–");
    const [lastLogin, setLastLogin] = useState<string>("–");

    useEffect(() => {
        const token = localStorage.getItem("jwt");
        if (!token) {
            router.replace("/");
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setUserName(payload?.name || "–");
            setUserRole(payload?.role || "–");
            setLastLogin(payload?.lastLogin || "–"); // optional aus API
        } catch (err) {
            console.error("Fehler beim Lesen des Tokens:", err);
            router.replace("/");
        }
    }, [router]);

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar wird von DashboardPage mit Callback gesteuert */}
            {children}
        </div>
    );
}
