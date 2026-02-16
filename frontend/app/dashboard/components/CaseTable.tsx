"use client";

import type { Case } from "@/lib/types";

type Props = {
    cases: Case[];
    onRowClick?: (c: Case) => void;
};

export default function CaseTable({ cases, onRowClick }: Props) {
    return (
        <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-muted/40">
                <tr>
                    <th className="text-left p-3">Kind</th>
                    <th className="text-left p-3">Alter</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Letzte Aktivität</th>
                </tr>
                </thead>

                <tbody>
                {cases.map((c) => (
                    <tr
                        key={c.id}
                        className={onRowClick ? "cursor-pointer hover:bg-muted/30" : ""}
                        onClick={onRowClick ? () => onRowClick(c) : undefined}
                    >
                        <td className="p-3">{c.childName}</td>
                        <td className="p-3">{c.age}</td>
                        <td className="p-3">{c.status}</td>
                        <td className="p-3">{c.lastActivity}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}