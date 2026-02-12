"use client";

import { useMemo } from "react";

interface NavbarProps {
    userName: string;
    userRole: string;
    lastLogin?: string; // kommt vom Secu/UserInfo
    onOpenMenu?: () => void;
}

export default function Navbar({
                                   userName,
                                   userRole,
                                   lastLogin = "–",
                                   onOpenMenu,
                               }: NavbarProps) {
    const todayFormatted = useMemo(() => {
        return new Date().toLocaleDateString("de-DE", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }, []);

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
        } finally {
            window.location.href = "/";
        }
    };

    return (
        <nav className="bg-white border-b shadow-sm">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3">
                <div className="flex items-center gap-3 min-w-0">
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
                    onClick={logout}
                    className="bg-red-500 text-white px-3 sm:px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}
