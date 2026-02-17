"use client";

import { useState } from "react";

import KinderTable from "./components/KinderTable";
import ErziehungspersonTable from "./components/ErziehungspersonTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StammdatenPage() {
    const [activeTab, setActiveTab] = useState<"kinder" | "erziehungspersonen">("kinder");

    return (
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
    );
}