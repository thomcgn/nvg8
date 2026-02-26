"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

export function RequireAuth({
                                children,
                                requireContext = true,
                            }: {
    children: React.ReactNode;
    requireContext?: boolean;
}) {
    const router = useRouter();
    const { me, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        // nicht eingeloggt
        if (!me) {
            router.replace("/login");
            return;
        }

        // eingeloggt aber kein Kontext gesetzt (optional)
        if (requireContext && !me.contextActive) {
            router.replace("/login");
            return;
        }
    }, [loading, me, requireContext, router]);

    if (loading) {
        return (
            <div className="min-h-screen grid place-items-center bg-brand-bg">
                <div className="text-sm text-brand-text2">Lade Sitzung…</div>
            </div>
        );
    }

    // während redirect
    if (!me) return null;
    if (requireContext && !me.contextActive) return null;

    return <>{children}</>;
}