"use client";

import { Topbar } from "@/components/layout/Topbar";
import { useTicketsUIOptional } from "@/components/support/TicketsUIProvider";

export function TopbarConnected({
                                    title,
                                    onSearch,
                                    onNotifications,
                                }: {
    title: string;
    onSearch?: (q: string) => void;
    onNotifications?: () => void;
}) {
    const ctx = useTicketsUIOptional();

    return (
        <Topbar
            title={title}
            onSearch={onSearch}
            onNotifications={onNotifications ?? ctx?.openMessenger}
            onTickets={ctx?.openTickets}
            notificationsCount={ctx?.notificationsCount ?? 0}
            ticketsCount={ctx?.ticketsCount ?? 0}
        />
    );
}