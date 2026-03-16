"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe, logout } from "@/lib/auth";
import type { MeResponse } from "@/lib/auth";

type AuthState = {
    me: MeResponse | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function errorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim()) return error.message;
    if (typeof error === "string" && error.trim()) return error;
    return fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [me, setMe] = useState<MeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getMe(); // MeResponse | null
            setMe(data);
            // ✅ wenn nicht eingeloggt: kein "Fehler"
            if (!data) setError(null);
        } catch (e: unknown) {
            setMe(null);
            setError(errorMessage(e, "Nicht eingeloggt."));
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await logout();
        } finally {
            setMe(null);
            setError(null);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const value = useMemo<AuthState>(
        () => ({ me, loading, error, refresh, signOut }),
        [me, loading, error]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}