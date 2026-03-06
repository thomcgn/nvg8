"use client";

import { useEffect, useState } from "react";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import {
    fetchMyTickets,
    fetchMyOpenTicketsCount,
    type SupportTicket,
} from "@/lib/supportTickets";
import { ApiError } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TicketsPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [openCount, setOpenCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const [list, cnt] = await Promise.all([
                fetchMyTickets(),
                fetchMyOpenTicketsCount(),
            ]);
            setTickets(list);
            setOpenCount(cnt);
        } catch (e: unknown) {
            if (e instanceof ApiError) {
                setError(e.problem?.detail || e.message);
            } else if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("Unbekannter Fehler.");
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <>
            <Topbar
                title={`Tickets${openCount ? ` (${openCount} offen)` : ""}`}
                onNotifications={() => {
                }}
            />

            <div className="mx-auto w-full max-w-4xl px-4 pb-8 pt-4 sm:px-6 md:px-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold text-brand-text">
                                    Meine Tickets
                                </div>
                                <div className="mt-1 text-xs text-brand-text2">
                                    {openCount} offen • {tickets.length} gesamt
                                </div>
                            </div>

                            <Button variant="secondary" onClick={load} disabled={loading}>
                                {loading ? "Lade..." : "Neu laden"}
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {error && (
                            <div className="mb-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm">
                                {error}
                            </div>
                        )}

                        {loading && (
                            <div className="text-sm text-brand-text2">Lade…</div>
                        )}

                        {!loading && tickets.length === 0 && (
                            <div className="text-sm text-brand-text2">
                                Keine Tickets gefunden.
                            </div>
                        )}

                        {!loading && tickets.length > 0 && (
                            <div className="space-y-2">
                                {tickets.map((t) => (
                                    <div
                                        key={t.id}
                                        className="rounded-lg border border-brand-border p-3"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="text-sm font-medium text-brand-text">
                                                {t.title}
                                            </div>
                                            <div className="text-xs text-brand-text2">
                                                {t.status} • {t.priority} • {t.category}
                                            </div>
                                        </div>

                                        <div className="mt-1 text-sm text-brand-text2 whitespace-pre-wrap">
                                            {t.description}
                                        </div>

                                        {(t.githubIssueUrl || t.pageUrl) && (
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                {t.pageUrl && (
                                                    <a
                                                        className="underline text-brand-text"
                                                        href={t.pageUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Seite
                                                    </a>
                                                )}
                                                {t.githubIssueUrl && (
                                                    <a
                                                        className="underline text-brand-text"
                                                        href={t.githubIssueUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        GitHub Issue{t.githubIssueNumber
                                                        ? ` #${t.githubIssueNumber}`
                                                        : ""}
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}