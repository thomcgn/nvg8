"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeamsRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/mitarbeiter?tab=struktur");
    }, [router]);

    return null;
}
