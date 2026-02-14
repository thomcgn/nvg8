import { Card, CardContent } from "@/components/ui/card";
import React, {ReactNode} from "react";

interface Props {
    title: string;
    value: ReactNode;
    icon?: ReactNode;
}

export default function StatCard({ title, value, icon }: Props) {
    return (
        <Card>
            <CardContent className="p-6 flex items-center gap-4">
                {icon && <div className="text-primary text-xl">{icon}</div>}
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}