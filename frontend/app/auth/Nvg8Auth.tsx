"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface UserInfo {
    name: string;
    role: string;
    lastLogin: string;
}

interface AuthProps {
    children:(user:UserInfo) => ReactNode;
    fallback?: ReactNode;
}

export default function Secu({ children, fallback }: AuthProps) {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${API_URL}/auth/me`, {
                    credentials: "include",
                });

                if (!res.ok) {
                    router.replace("/"); // redirect auf Login
                    return;
                }

                const data = await res.json();
                setUser({
                    name: data.name,
                    role: data.role,
                    lastLogin: new Date(data.lastLogin).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                });
            } catch (err) {
                console.error(err);
                router.push("/");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router, API_URL]);

    if (loading) return fallback || <div>Lade Benutzerdaten…</div>;
    if (!user) return null;

    return <>{children(user)}</>;
}
