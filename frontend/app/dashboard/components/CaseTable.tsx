import { Case, CaseStatus } from "./types";

function statusBadge(status: CaseStatus) {
    switch (status) {
        case "AKUT":
            return "bg-red-100 text-red-700";
        case "BEOBACHTUNG":
            return "bg-yellow-100 text-yellow-800";
        case "RUHEND":
            return "bg-blue-100 text-blue-700";
        case "ABGESCHLOSSEN":
            return "bg-green-100 text-green-700";
    }
}

export default function CaseTable({ cases }: { cases: Case[] }) {
    return (
        <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b">
            <tr>
                <th className="py-2">Kind</th>
                <th>Alter</th>
                <th>Status</th>
                <th>Letzte Aktivität</th>
            </tr>
            </thead>
            <tbody>
            {cases.map((c) => (
                <tr key={c.id} className="border-b last:border-none">
                    <td className="py-3 font-medium text-gray-900">
                        {c.childName}
                    </td>
                    <td>{c.age}</td>
                    <td>
              <span
                  className={`px-2 py-1 rounded text-xs font-medium ${statusBadge(
                      c.status
                  )}`}
              >
                {c.status}
              </span>
                    </td>
                    <td className="text-gray-600">{c.lastActivity}</td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}
