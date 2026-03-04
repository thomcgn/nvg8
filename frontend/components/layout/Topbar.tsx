"use client";

import { Search, Bell, ClipboardCheck } from "lucide-react";
import { useMemo, useState } from "react";

export function Topbar({
                           title,
                           onSearch,
                           onNotifications,
                           onTickets,
                           notificationsCount = 0,
                           ticketsCount = 0,
                       }: {
    title: string;
    onSearch?: (q: string) => void;
    onNotifications?: () => void;
    onTickets?: () => void;
    notificationsCount?: number;
    ticketsCount?: number;
}) {
    const [q, setQ] = useState("");

    const notifLabel = useMemo(() => {
        if (!notificationsCount) return "Benachrichtigungen";
        return `Benachrichtigungen (${notificationsCount})`;
    }, [notificationsCount]);

    const ticketLabel = useMemo(() => {
        if (!ticketsCount) return "Tickets";
        return `Tickets (${ticketsCount})`;
    }, [ticketsCount]);

    return (
        <div
            className="
        sticky top-0 z-30
        border-b border-brand-border
        bg-brand-bg/80 backdrop-blur
        px-4
        pt-[calc(env(safe-area-inset-top)+10px)]
        pb-3
      "
        >
            {/* Row 1: Title + Actions */}
            <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                    <div className="text-base font-extrabold tracking-tight text-brand-navy leading-tight truncate">
                        {title}
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    {/* Notifications */}
                    <button
                        type="button"
                        onClick={onNotifications}
                        className="
              group relative inline-flex items-center gap-2
              h-10 rounded-xl
              border border-brand-border
              bg-white/80 backdrop-blur
              px-3 text-sm font-medium text-brand-text2
              shadow-sm
              transition-all duration-150
              hover:bg-brand-teal/15 hover:border-brand-teal/40 hover:text-brand-navy hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-brand-teal/25
              active:scale-[0.98]
            "
                        aria-label={notifLabel}
                    >
                        <span className="hidden sm:inline">Nachrichten</span>

                        <span className="relative">
              <Bell className="h-4 w-4 text-brand-text2 transition-colors group-hover:text-brand-navy" />
                            {notificationsCount > 0 && (
                                <span
                                    className="
                    absolute -right-1.5 -top-1.5
                    grid h-4 min-w-4 place-items-center rounded-full
                    bg-brand-teal text-[10px] font-bold leading-none text-white
                    px-1
                    ring-2 ring-white
                  "
                                    aria-hidden="true"
                                >
                  {notificationsCount > 99 ? "99+" : notificationsCount}
                </span>
                            )}
            </span>
                    </button>

                    {/* Tickets */}
                    <button
                        type="button"
                        onClick={onTickets}
                        className="
              group relative inline-flex items-center gap-2
              h-10 rounded-xl
              border border-brand-border
              bg-white/80 backdrop-blur
              px-3 text-sm font-medium text-brand-text2
              shadow-sm
              transition-all duration-150
              hover:bg-brand-teal/15 hover:border-brand-teal/40 hover:text-brand-navy hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-brand-teal/25
              active:scale-[0.98]
            "
                        aria-label={ticketLabel}
                    >
                        <span className="hidden sm:inline">Tickets</span>

                        <span className="relative">
              <ClipboardCheck className="h-4 w-4 text-brand-text2 transition-colors group-hover:text-brand-navy" />
                            {ticketsCount > 0 && (
                                <span
                                    className="
                    absolute -right-1.5 -top-1.5
                    grid h-4 min-w-4 place-items-center rounded-full
                    bg-brand-teal text-[10px] font-bold leading-none text-white
                    px-1
                    ring-2 ring-white
                  "
                                    aria-hidden="true"
                                >
                  {ticketsCount > 99 ? "99+" : ticketsCount}
                </span>
                            )}
            </span>
                    </button>
                </div>
            </div>

            {/* Row 2: Search */}
            <div className="mt-3 flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text2" />
                    <input
                        value={q}
                        onChange={(e) => {
                            setQ(e.target.value);
                            onSearch?.(e.target.value);
                        }}
                        placeholder="Suchen…"
                        className="
              h-11 w-full
              rounded-xl border border-brand-border
              bg-white/80 backdrop-blur
              pl-9 pr-3 text-sm
              shadow-sm
              outline-none
              transition
              focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25
            "
                    />
                </div>
            </div>
        </div>
    );
}