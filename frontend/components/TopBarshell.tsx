"use client";

import { useEffect, useState } from "react";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";;
import { TicketsModal } from "@/components/support/TicketsModal";
import { apiFetch } from "@/lib/api";

// optional, wenn du später einen Count-Endpoint hast
// import { fetchMyTicketsCount } from "@/lib/support-tickets";

export function TopbarShell({ title }: { title: string }) {
    const [ticketsOpen, setTicketsOpen] = useState(0);
    const [notificationsCount, setNotificationsCount] = useState(0);
    const [ticketsModalOpen, setTicketsModalOpen] = useState(false);

    async function refreshCounts() {
        // Messages badge (hast du schon)
        apiFetch<{ count: number }>("/messages/unread-count")
            .then((r) => setNotificationsCount(r.count ?? 0))
            .catch(() => {});

        // Tickets badge: solange du keinen Count-Endpoint hast:
        setTicketsOpen(0);

        // später:
        // fetchMyTicketsCount("OPEN").then(setTicketsOpen).catch(() => {});
    }

    useEffect(() => {
        refreshCounts();
    }, []);

    return (
        <>
            <Topbar
                title={title}
                notificationsCount={notificationsCount}
                ticketsCount={ticketsOpen}
                onNotifications={() => {
                    // dein Message Modal öffnen
                }}
                onTickets={() => setTicketsModalOpen(true)}
            />

            <TicketsModal
                open={ticketsModalOpen}
                onClose={() => {
                    setTicketsModalOpen(false);
                    refreshCounts();
                }}
            />
        </>
    );
}