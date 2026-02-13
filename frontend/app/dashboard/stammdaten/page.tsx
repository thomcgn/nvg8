"use client";

import { useState } from "react";
import Secu, { UserInfo } from "@/app/auth/Nvg8Auth";

import DashboardShell from "@/app/dashboard/components/DashboardShell";
import KinderTable from "./components/KinderTable";
import ErziehungspersonTable from "./components/ErziehungspersonTable";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StammdatenPage() {
    const [activeTab, setActiveTab] = useState<"kinder" | "erziehungspersonen">("kinder");

    return (
        <Secu fallback={<div className="p-6">Lade Benutzerdaten…</div>}>
            {(user: UserInfo) => (
                <DashboardShell userName={user.name} userRole={user.role} lastLogin={user.lastLogin}>
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="kinder">Kinder</TabsTrigger>
                            <TabsTrigger value="erziehungspersonen">Erziehungspersonen</TabsTrigger>
                        </TabsList>

                        <TabsContent value="kinder">
                            <KinderTable />
                        </TabsContent>

                        <TabsContent value="erziehungspersonen">
                            <ErziehungspersonTable />
                        </TabsContent>
                    </Tabs>
                </DashboardShell>
            )}
        </Secu>
    );
}