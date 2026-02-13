"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export interface Erziehungsperson {
    id: number;
    name: string;
    beziehung: string;
    sorgerecht: string; // Voll, Teil, Kein
    aufenthaltsbestimmungsrecht: string; // Ja/Nein
    kontaktsperre: boolean;
}

export default function ErziehungspersonTable() {
    const [personen, setPersonen] = useState<Erziehungsperson[]>([]);
    const [loading, setLoading] = useState(true);

    const mockData: Erziehungsperson[] = [
        {
            id: 1,
            name: "Sabine Müller",
            beziehung: "Mutter",
            sorgerecht: "Voll",
            aufenthaltsbestimmungsrecht: "Ja",
            kontaktsperre: false,
        },
        {
            id: 2,
            name: "Thomas Müller",
            beziehung: "Vater",
            sorgerecht: "Kein",
            aufenthaltsbestimmungsrecht: "Nein",
            kontaktsperre: true,
        },
        {
            id: 3,
            name: "Petra Schneider",
            beziehung: "Pflegeperson",
            sorgerecht: "Kein",
            aufenthaltsbestimmungsrecht: "Nein",
            kontaktsperre: true,
        },
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            setPersonen(mockData);
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Erziehungspersonen</CardTitle>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : personen.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Keine Erziehungspersonen vorhanden.</div>
                ) : (
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Beziehung</TableHead>
                                    <TableHead>Sorgerecht</TableHead>
                                    <TableHead>Aufenthaltsbestimmungsrecht</TableHead>
                                    <TableHead>Kontaktsperre</TableHead>
                                    <TableHead className="text-right">Aktionen</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {personen.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{p.name}</TableCell>
                                        <TableCell>{p.beziehung}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{p.sorgerecht}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={p.aufenthaltsbestimmungsrecht === "Ja" ? "default" : "secondary"}>
                                                {p.aufenthaltsbestimmungsrecht}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={p.kontaktsperre ? "destructive" : "secondary"}>
                                                {p.kontaktsperre ? "Ja" : "Nein"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm">
                                                Bearbeiten
                                            </Button>
                                            <Button variant="destructive" size="sm">
                                                Löschen
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}