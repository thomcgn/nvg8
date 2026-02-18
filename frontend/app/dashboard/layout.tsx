import * as React from "react";
import DashboardGate from "./DashboardGate";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <DashboardGate>{children}</DashboardGate>;
}