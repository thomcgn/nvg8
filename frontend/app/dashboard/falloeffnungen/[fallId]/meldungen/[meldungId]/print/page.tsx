import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { FalleroeffnungResponse } from "@/lib/types";
import type { MeldungResponse } from "@/lib/meldungApi";
import MeldungPrintDocument from "./MeldungPrintDocument";

type PageProps = {
    params: Promise<{
        fallId: string;
        meldungId: string;
    }>;
};

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE ??
    process.env.API_BASE;

async function serverApiFetch<T>(path: string): Promise<T> {
    if (!API_BASE) {
        throw new Error("API base URL is not configured.");
    }

    const cookieStore = await cookies();
    const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    const res = await fetch(`${API_BASE}${normalizedPath}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed with ${res.status}`);
    }

    if (res.status === 204) {
        return undefined as T;
    }

    return res.json() as Promise<T>;
}

export default async function MeldungPrintPage({ params }: PageProps) {
    const { fallId, meldungId } = await params;

    const fallIdNum = Number(fallId);
    const meldungIdNum = Number(meldungId);

    if (!Number.isFinite(fallIdNum) || !Number.isFinite(meldungIdNum)) {
        notFound();
    }

    let fall: FalleroeffnungResponse | null = null;
    let meldung: MeldungResponse | null = null;

    try {
        [fall, meldung] = await Promise.all([
            serverApiFetch<FalleroeffnungResponse>(`/falloeffnungen/${fallIdNum}`),
            serverApiFetch<MeldungResponse>(
                `/falloeffnungen/${fallIdNum}/meldungen/${meldungIdNum}`
            ),
        ]);
    } catch (error) {
        console.error("Print page load failed:", error);
        notFound();
    }

    if (!meldung) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-white text-slate-900">
            <AutoPrint />

            <div className="mx-auto w-full max-w-[960px] px-6 py-8 print-doc print:max-w-none print:px-0 print:py-0">
                <MeldungPrintDocument fall={fall} d={meldung} />
            </div>

            <style>{`
                @page {
                    size: A4;
                    margin: 14mm 12mm 16mm 12mm;
                }

                @media print {
                    html, body {
                        background: #fff !important;
                        color: #0f172a !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        font-size: 10.5pt;
                        line-height: 1.45;
                    }

                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    * {
                        box-shadow: none !important;
                    }

                    aside,
                    nav,
                    header,
                    .sidebar,
                    .topbar,
                    .print-hide,
                    [data-sidebar],
                    [data-topbar] {
                        display: none !important;
                    }

                    main {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        min-height: auto !important;
                    }

                    .print-doc {
                        width: 100% !important;
                        max-width: none !important;
                    }

                    .print-section {
                        margin: 0 0 8mm 0;
                    }

                    .print-section-title {
                        font-size: 14pt;
                        font-weight: 700;
                        margin: 0 0 4mm 0;
                        padding-bottom: 2mm;
                        border-bottom: 1px solid #cbd5e1;
                    }

                    .print-section,
                    .print-table-wrap,
                    .print-avoid-break,
                    .print-card,
                    .print-row {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }

                    .print-page-break {
                        break-before: page;
                        page-break-before: always;
                    }

                    .print-table {
                        width: 100%;
                        border-collapse: collapse;
                        table-layout: fixed;
                        font-size: 9.5pt;
                    }

                    .print-table thead {
                        display: table-header-group;
                    }

                    .print-table tfoot {
                        display: table-footer-group;
                    }

                    .print-table tr,
                    .print-table td,
                    .print-table th {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }

                    .print-table th,
                    .print-table td {
                        border: 1px solid #cbd5e1;
                        padding: 6px 8px;
                        vertical-align: top;
                        text-align: left;
                        word-break: break-word;
                        overflow-wrap: anywhere;
                    }

                    .print-table th {
                        background: #f8fafc !important;
                        font-weight: 700;
                    }

                    .print-small {
                        font-size: 8.8pt;
                        color: #475569;
                    }

                    .print-muted {
                        color: #64748b !important;
                    }

                    .print-korrektur {
                        border-left: 4px solid #dc2626 !important;
                        background: #fef2f2 !important;
                    }

                    .print-grid-2 {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                    }

                    .print-grid-1 {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 10px;
                    }

                    .print-toolbar {
                        display: none !important;
                    }
                }

                @media screen {
                    .print-only {
                        display: none !important;
                    }
                }
            `}</style>
        </main>
    );
}

function AutoPrint() {
    return (
        <script
            dangerouslySetInnerHTML={{
                __html: `
                    window.addEventListener("load", () => {
                        setTimeout(() => {
                            try {
                                window.print();
                            } catch (e) {
                                console.error("window.print failed", e);
                            }
                        }, 250);
                    });
                `,
            }}
        />
    );
}