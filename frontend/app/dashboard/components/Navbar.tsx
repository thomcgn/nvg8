"use client";

import { useEffect, useMemo, useState } from "react";

interface NavbarProps {
    userName: string;
    userRole: string;
    lastLogin?: string; // optional if you want to pass it, but we’ll also read from localStorage
    onOpenMenu?: () => void; // optional for mobile
}

export default function Navbar({ userName, userRole, onOpenMenu }: NavbarProps) {
    const [lastLogin, setLastLogin] = useState<string>("–");

    useEffect(() => {
        const lastLoginRaw = localStorage.getItem("lastLogin");
        const formatted = lastLoginRaw
            ? new Date(lastLoginRaw).toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
            })
            : "–";
        setLastLogin(formatted);
    }, []);

    const todayFormatted = useMemo(() => {
        return new Date().toLocaleDateString("de-DE", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }, []);

    return (
        <nav className="bg-white border-b shadow-sm">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Mobile menu button (only if provided) */}
                    {onOpenMenu && (
                        <button
                            type="button"
                            onClick={onOpenMenu}
                            className="lg:hidden inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium bg-white"
                            aria-label="Menü öffnen"
                        >
                            ☰
                        </button>
                    )}

                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">Angemeldet als</p>
                        <h2 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                            {userName} · {userRole}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {todayFormatted} · Letzter Login: {lastLogin}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        localStorage.removeItem("jwt");
                        localStorage.removeItem("lastLogin");
                        location.href = "/";
                    }}
                    className="bg-red-500 text-white px-3 sm:px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}
