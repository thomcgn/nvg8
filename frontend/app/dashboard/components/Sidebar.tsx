"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { FaHome, FaFolderOpen, FaPlus, FaDatabase } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Role } from "@/app/auth/rbac";
import { canReadCases, canWriteCases, canSeeMasterData } from "@/app/auth/rbac";

interface SidebarProps {
    userRole: Role;                 // ✅ neu
    onStartWizard?: () => void;
    onClose?: () => void;
    variant?: "sidebar" | "drawer";
}

export default function Sidebar({
                                    userRole,
                                    onStartWizard,
                                    onClose,
                                    variant = "sidebar",
                                }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const isDrawer = variant === "drawer";

    const NavItem = ({
                         label,
                         href,
                         icon,
                     }: {
        label: string;
        href: string;
        icon?: React.ReactNode;
    }) => {
        const active = pathname === href;

        return (
            <Button
                type="button"
                variant={active ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => {
                    router.push(href);
                    onClose?.();
                }}
            >
                <span className="text-base">{icon}</span>
                <span className="truncate">{label}</span>
            </Button>
        );
    };

    const handleNewCase = () => {
        if (onStartWizard) {
            onStartWizard();
            onClose?.();
            return;
        }
        router.push("/dashboard?wizard=1");
        onClose?.();
    };

    return (
        <aside
            className={[
                "h-full bg-background",
                isDrawer ? "w-full p-4" : "w-64 p-6 border-r",
            ].join(" ")}
        >
            <div className="flex items-center justify-between">
                <div className="min-w-0">
                    <div className="text-lg font-semibold leading-none">Navig8tor</div>
                    <div className="text-xs text-muted-foreground mt-1">Dashboard</div>
                </div>

                {isDrawer && (
                    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Menü schließen">
                        ✕
                    </Button>
                )}
            </div>

            <Separator className="my-4" />

            <nav className="space-y-1">
                <NavItem label="Übersicht" href="/dashboard" icon={<FaHome />} />

                {canReadCases(userRole) && (
                    <NavItem label="Fälle" href="/dashboard/cases" icon={<FaFolderOpen />} />
                )}

                {canWriteCases(userRole) && (
                    <Button type="button" onClick={handleNewCase} className="w-full justify-start gap-3">
            <span className="text-base">
              <FaPlus />
            </span>
                        <span className="truncate">Neuer Fall</span>
                    </Button>
                )}

                {canSeeMasterData(userRole) && (
                    <NavItem label="Stammdaten" href="/dashboard/stammdaten" icon={<FaDatabase />} />
                )}
            </nav>
        </aside>
    );
}