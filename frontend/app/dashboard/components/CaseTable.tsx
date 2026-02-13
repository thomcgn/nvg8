import { Case, CaseStatus } from "./types";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

function badgeVariant(status: CaseStatus): "destructive" | "secondary" | "default" | "outline" {
    switch (status) {
        case "AKUT":
            return "destructive";
        case "BEOBACHTUNG":
            return "secondary";
        case "RUHEND":
            return "outline";
        case "ABGESCHLOSSEN":
            return "default";
    }
}

export default function CaseTable({ cases }: { cases: Case[] }) {
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kind</TableHead>
                            <TableHead>Alter</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Letzte Aktivität</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cases.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell className="font-medium">{c.childName}</TableCell>
                                <TableCell>{c.age}</TableCell>
                                <TableCell>
                                    <Badge variant={badgeVariant(c.status)}>{c.status}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{c.lastActivity}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}