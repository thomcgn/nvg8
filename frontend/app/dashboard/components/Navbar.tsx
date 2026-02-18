"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface NavbarProps {
    userName: string;
    userRole: string;
    lastLogin?: string;
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
    const router = useRouter();

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        } finally {
            window.location.href = "/";
        }
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3">
                <div className="flex items-center gap-3 min-w-0">
                    {onOpenMenu && (
                        <Button
                            type="button"
                            variant="outline"
                            className="lg:hidden"
                            onClick={onOpenMenu}
                            aria-label="Menü öffnen"
                        >
                            ☰
                        </Button>
                    )}

                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">Angemeldet als</p>
                        <h2 className="text-sm sm:text-lg font-semibold truncate">
                            {userName} · {userRole}
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {todayFormatted} · Letzter Login: {lastLogin}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/profil")}
                >
                    Profil
                </Button>
                <Button variant="destructive" onClick={logout}>
                    Logout
                </Button>
                </div>
            </div>
        </header>
    );
}