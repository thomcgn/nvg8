"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface UserInfo {
    name: string;
    role: string;
    lastLogin: string;
}

interface AuthProps {
    children: (user: UserInfo) => ReactNode;
    fallback?: ReactNode;
}

export default function Secu({ children, fallback }: AuthProps) {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`/api/auth/me`, {
                    credentials: "include",
                });

                if (!res.ok) {
                    router.replace("/");
                    return;
                }

                const data = await res.json();
                setUser({
                    name: data.name,
                    role: data.role,
                    lastLogin: data.lastLogin
                        ? new Date(data.lastLogin).toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })
                        : "-",
                });
            } catch (err) {
                console.error(err);
                router.replace("/");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    if (loading) return fallback || <div>Lade Benutzerdaten…</div>;
    if (!user) return null;

    return <>{children(user)}</>;
}
