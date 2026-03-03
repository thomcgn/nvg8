"use client";

import { Search, Bell } from "lucide-react";
import { useState } from "react";

export function Topbar({
                           title,
                           onSearch,
                       }: {
    title: string;
    onSearch?: (q: string) => void;
}) {
    const [q, setQ] = useState("");

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
            {/* Row 1: Title + Bell */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-base font-extrabold tracking-tight text-brand-navy leading-tight break-words">
                        {title}
                    </div>
                </div>

                <button
                    type="button"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-border bg-white text-brand-text2 hover:bg-brand-bg"
                    aria-label="Benachrichtigungen"
                >
                    <Bell className="h-4 w-4" /> Nachrichten
                </button>
            </div>

            {/* Row 2: Search full width */}
            <div className="mt-3">
                <div className="relative w-full">
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
              rounded-xl border border-brand-border bg-white
              pl-9 pr-3 text-sm
              outline-none
              focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25
            "
                    />
                </div>
            </div>
        </div>
    );
}