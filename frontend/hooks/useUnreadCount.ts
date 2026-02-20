"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchUnreadCount } from "@/lib/messagesClient";

export function useUnreadCount() {
    const [count, setCount] = useState(0);

    const refresh = useCallback(async () => {
        const c = await fetchUnreadCount();
        setCount(c);
    }, []);

    useEffect(() => {
        refresh().catch(() => {});
    }, [refresh]);

    return { unreadCount: count, refreshUnreadCount: refresh, setUnreadCount: setCount };
}
