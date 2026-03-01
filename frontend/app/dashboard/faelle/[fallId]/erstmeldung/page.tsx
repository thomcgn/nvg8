"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function FallErstmeldungAliasPage() {
    const params = useParams();
    const router = useRouter();
    const fallId = (params as any)?.fallId;

    useEffect(() => {
        if (fallId) router.replace(`/dashboard/faelle/${fallId}/meldungen?open=erstmeldung`);
    }, [fallId, router]);

    return null;
}