"use client";

import { Search, Bell, ClipboardCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type TopbarProps = {
  title: string;

  onSearch?: (q: string) => void;
  onNotifications?: () => void;
  onTickets?: () => void;

  notificationsCount?: number;
  ticketsCount?: number;

  initialQuery?: string;

  hideSearch?: boolean;
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

  useEffect(() => {
    setQ(initialQuery);
  }, [initialQuery]);

  const notifBadge = useMemo(() => clampBadge(notificationsCount), [notificationsCount]);
  const ticketsBadge = useMemo(() => clampBadge(ticketsCount), [ticketsCount]);

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
      {/* Row 1 */}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-extrabold tracking-tight text-brand-navy leading-tight">
            {title}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">

          <button
            type="button"
            onClick={onNotifications}
            disabled={notifDisabled}
            className={[
              "group relative inline-flex items-center gap-2",
              "h-10 rounded-xl border border-brand-border",
              "bg-white/80 backdrop-blur px-3 text-sm font-medium text-brand-text2 shadow-sm",
              notifDisabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-brand-teal/15 hover:border-brand-teal/40 hover:text-brand-navy",
            ].join(" ")}
          >
            <span className="hidden sm:inline">Nachrichten</span>

            <span className="relative">
              <Bell className="h-4 w-4" />

              {notifBadge && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-teal text-[10px] text-white px-1">
                  {notifBadge}
                </span>
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={onTickets}
            disabled={ticketsDisabled}
            className={[
              "group relative inline-flex items-center gap-2",
              "h-10 rounded-xl border border-brand-border",
              "bg-white/80 backdrop-blur px-3 text-sm font-medium text-brand-text2 shadow-sm",
              ticketsDisabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-brand-teal/15 hover:border-brand-teal/40 hover:text-brand-navy",
            ].join(" ")}
          >
            <span className="hidden sm:inline">Tickets</span>

            <span className="relative">
              <ClipboardCheck className="h-4 w-4" />

              {ticketsBadge && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-teal text-[10px] text-white px-1">
                  {ticketsBadge}
                </span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Row 2 Search */}
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
              className="h-11 w-full rounded-xl border border-brand-border bg-white/80 pl-9 pr-3 text-sm shadow-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}