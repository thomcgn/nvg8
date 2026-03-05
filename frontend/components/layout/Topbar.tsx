"use client";

import { Search, Bell, ClipboardCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TopbarProps = {
    title: string;

    /** called on every keystroke */
    onSearch?: (q: string) => void;

    /** open notifications/messages UI */
    onNotifications?: () => void;

    /** open tickets UI */
    onTickets?: () => void;

    /** badge counts */
    notificationsCount?: number;
    ticketsCount?: number;

    /** optional: start value for search input */
    initialQuery?: string;

    /** optional: hide search row entirely */
    hideSearch?: boolean;

    /** optional: disable buttons when handlers not provided */
    disableWhenNoHandler?: boolean;
};

function clampBadge(n: number) {
    if (n <= 0) return null;
    if (n > 99) return "99+";
    return String(n);
}

export function Topbar({
                           title,
                           onSearch,
                           onNotifications,
                           onTickets,
                           notificationsCount = 0,
                           ticketsCount = 0,
                           initialQuery = "",
                           hideSearch = false,
                           disableWhenNoHandler = true,
                       }: TopbarProps) {
    const [q, setQ] = useState(initialQuery);

    // keep input in sync when parent changes initialQuery (optional)
    useEffect(() => {
        setQ(initialQuery);
    }, [initialQuery]);

    const notifBadge = useMemo(() => clampBadge(notificationsCount), [notificationsCount]);
    const ticketsBadge = useMemo(() => clampBadge(ticketsCount), [ticketsCount]);

    const notifLabel = useMemo(() => {
        if (!notificationsCount) return "Nachrichten";
        return `Nachrichten (${notificationsCount > 99 ? "99+" : notificationsCount})`;
    }, [notificationsCount]);

    const ticketLabel = useMemo(() => {
        if (!ticketsCount) return "Tickets";
        return `Tickets (${ticketsCount > 99 ? "99+" : ticketsCount})`;
    }, [ticketsCount]);

    const notifDisabled = disableWhenNoHandler && !onNotifications;
    const ticketsDisabled = disableWhenNoHandler && !onTickets;

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
                    <div className="truncate text-base font-extrabold tracking-tight text-brand-navy leading-tight">
                        {title}
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    {/* Notifications */}
                    <button
                        type="button"
                        onClick={onNotifications}
                        disabled={notifDisabled}
                        className={[
                            "group relative inline-flex items-center gap-2",
                            "h-10 rounded-xl border border-brand-border",
                            "bg-white/80 backdrop-blur px-3 text-sm font-medium text-brand-text2 shadow-sm",
                            "transition-all duration-150",
                            notifDisabled
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-brand-teal/15 hover:border-brand-teal/40 hover:text-brand-navy hover:shadow-md active:scale-[0.98]",
                            "focus:outline-none focus:ring-2 focus:ring-brand-teal/25",
                        ].join(" ")}
                        aria-label={notifLabel}
                    >
                        <span className="hidden sm:inline">Nachrichten</span>

                        <span className="relative">
              <Bell className="h-4 w-4 text-brand-text2 transition-colors group-hover:text-brand-navy" />
                            {notifBadge && (
                                <span
                                    className="
                    absolute -right-1.5 -top-1.5
                    grid h-4 min-w-4 place-items-center rounded-full
                    bg-brand-teal text-[10px] font-bold leading-none text-white
                    px-1 ring-2 ring-white
                  "
                                    aria-hidden="true"
                                >
                  {notifBadge}
                </span>
                            )}
            </span>
                    </button>

                    {/* Tickets */}
                    <button
                        type="button"
                        onClick={onTickets}
                        disabled={ticketsDisabled}
                        className={[
                            "group relative inline-flex items-center gap-2",
                            "h-10 rounded-xl border border-brand-border",
                            "bg-white/80 backdrop-blur px-3 text-sm font-medium text-brand-text2 shadow-sm",
                            "transition-all duration-150",
                            ticketsDisabled
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-brand-teal/15 hover:border-brand-teal/40 hover:text-brand-navy hover:shadow-md active:scale-[0.98]",
                            "focus:outline-none focus:ring-2 focus:ring-brand-teal/25",
                        ].join(" ")}
                        aria-label={ticketLabel}
                    >
                        <span className="hidden sm:inline">Tickets</span>

                        <span className="relative">
              <ClipboardCheck className="h-4 w-4 text-brand-text2 transition-colors group-hover:text-brand-navy" />
                            {ticketsBadge && (
                                <span
                                    className="
                    absolute -right-1.5 -top-1.5
                    grid h-4 min-w-4 place-items-center rounded-full
                    bg-brand-teal text-[10px] font-bold leading-none text-white
                    px-1 ring-2 ring-white
                  "
                                    aria-hidden="true"
                                >
                  {ticketsBadge}
                </span>
                            )}
            </span>
                    </button>
                </div>
            </div>

            {/* Row 2: Search */}
            {!hideSearch && (
                <div className="mt-3 flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text2" />
                        <input
                            value={q}
                            onChange={(e) => {
                                const next = e.target.value;
                                setQ(next);
                                onSearch?.(next);
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
            )}
        </div>
    );
}