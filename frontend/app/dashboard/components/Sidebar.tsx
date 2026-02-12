"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { FaHome, FaFolderOpen, FaPlus, FaDatabase } from "react-icons/fa";

interface SidebarProps {
    onStartWizard?: () => void;

    // optional: only used when sidebar is rendered as a drawer on mobile
    onClose?: () => void;
    variant?: "sidebar" | "drawer";
}

export default function Sidebar({
                                    onStartWizard,
                                    onClose,
                                    variant = "sidebar",
                                }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();

    const isDrawer = variant === "drawer";

    const Item = ({
                      label,
                      href,
                      icon,
                  }: {
        label: string;
        href?: string;
        icon?: React.ReactNode;
    }) => {
        const active = href ? pathname === href : false;

        return (
            <button
                type="button"
                onClick={() => {
                    if (href) router.push(href);
                    onClose?.();
                }}
                className={[
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium",
                    active
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                ].join(" ")}
            >
                <span className="text-base">{icon}</span>
                <span className="truncate">{label}</span>
            </button>
        );
    };

    const handleNewCase = () => {
        // Wenn die Seite den Wizard direkt steuern kann (DashboardPage), nutze das.
        if (onStartWizard) {
            onStartWizard();
            onClose?.();
            return;
        }

        // Sonst: immer zuverlässig auf Dashboard navigieren + Wizard anfordern
        router.push("/dashboard?wizard=1");
        onClose?.();
    };

    return (
        <aside
            className={[
                "bg-white border-r",
                isDrawer ? "h-full w-full px-4 py-4" : "w-64 px-6 py-8",
            ].join(" ")}
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Navig8tor</h2>

                {isDrawer && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border px-3 py-2 text-sm font-medium bg-white"
                        aria-label="Menü schließen"
                    >
                        ✕
                    </button>
                )}
            </div>

            <nav className="space-y-1">
                <Item label="Übersicht" href="/dashboard" icon={<FaHome />} />
                <Item label="Fälle" href="/dashboard/cases" icon={<FaFolderOpen />} />

                <button
                    type="button"
                    onClick={handleNewCase}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                >
          <span className="text-base">
            <FaPlus />
          </span>
                    <span className="truncate">Neuer Fall</span>
                </button>

                <Item label="Stammdaten" href="/dashboard/stammdaten" icon={<FaDatabase />} />
            </nav>
        </aside>
    );
}
