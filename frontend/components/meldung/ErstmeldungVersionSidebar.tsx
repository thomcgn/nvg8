"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type VersionItem = {
    id: number;
    versionNo: number;
    current: boolean;
    status: string;
    erfasstAm: string;
    submittedAt?: string | null;
};

export function ErstmeldungVersionSidebar(props: {
    loading: boolean;
    versions: VersionItem[];
    activeErstmeldungId: number | null;
    onSelectVersion: (id: number) => void;
    onNewVersion: () => void;
}) {
    const { loading, versions, activeErstmeldungId, onSelectVersion, onNewVersion } = props;

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between gap-4">
                <CardTitle className="text-base">Versionen</CardTitle>
                <Button size="sm" onClick={onNewVersion} disabled={loading}>
                    Neu
                </Button>
            </CardHeader>

            <CardContent className="space-y-2">
                {versions.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Keine Versionen gefunden.</div>
                ) : (
                    versions.map((v) => {
                        const active = activeErstmeldungId === v.id;
                        return (
                            <button
                                key={v.id}
                                onClick={() => onSelectVersion(v.id)}
                                className={[
                                    "w-full rounded-xl border p-3 text-left transition",
                                    active ? "border-primary/60 bg-accent" : "border-border hover:bg-accent/50",
                                ].join(" ")}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="font-medium">Version {v.versionNo}</div>
                                    <div className="flex items-center gap-2">
                                        {v.current ? <Badge variant="outline">current</Badge> : null}
                                        <Badge variant={v.status === "ABGESCHLOSSEN" ? "default" : "secondary"}>{v.status}</Badge>
                                    </div>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Erfasst: {new Date(v.erfasstAm).toLocaleString()}
                                    {v.submittedAt ? ` · Abgeschlossen: ${new Date(v.submittedAt).toLocaleString()}` : ""}
                                </div>
                            </button>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}