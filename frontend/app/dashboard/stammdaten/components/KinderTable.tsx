"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type Kind = {
    id: number;
    vorname?: string;
    nachname?: string;
    name?: string;
    geburtsdatum?: string;
};

export default function KinderTable() {
    const [kinder, setKinder] = useState<Kind[]>([]);
    const [loading, setLoading] = useState(true);

    const mockKinder: Kind[] = [
        { id: 1, vorname: "Lena", nachname: "Müller", geburtsdatum: "2019-04-12" },
        { id: 2, vorname: "Tom", nachname: "Schneider", geburtsdatum: "2016-09-03" },
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            setKinder(mockKinder);
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kinder</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : kinder.length === 0 ? (
                    <div className="text-sm text-destructive">Keine Kinder vorhanden.</div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Geburtsdatum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {kinder.map((k) => {
                                    const displayName =
                                        k.name ?? [k.vorname, k.nachname].filter(Boolean).join(" ") ?? `#${k.id}`;

                                    const formattedDate = k.geburtsdatum
                                        ? new Date(k.geburtsdatum).toLocaleDateString("de-DE")
                                        : "–";

                                    return (
                                        <TableRow key={k.id}>
                                            <TableCell className="font-medium">{displayName}</TableCell>
                                            <TableCell className="text-muted-foreground">{formattedDate}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}