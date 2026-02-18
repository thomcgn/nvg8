"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Me = {
    name: string;
    role: string;
    lastLogin?: string | null;
};

const UserCtx = createContext<{
    me: Me | null;
    loading: boolean;
    reload: () => Promise<void>;
}>({ me: null, loading: true, reload: async () => {} });

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [me, setMe] = useState<Me | null>(null);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
            setMe(null);
            return;
        }
        setMe(await res.json());
    }, []);

    useEffect(() => {
        reload().finally(() => setLoading(false));
    }, [reload]);

    return (
        <UserCtx.Provider value={{ me, loading, reload }}>
            {children}
        </UserCtx.Provider>
    );
}

export const useMe = () => useContext(UserCtx);