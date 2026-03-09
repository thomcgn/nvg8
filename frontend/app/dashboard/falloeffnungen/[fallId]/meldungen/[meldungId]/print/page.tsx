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
    process.env.API_BASE_URL ??
    process.env.API_BASE ??
    process.env.BACKEND_URL;

type ApiFetchError = Error & {
    status?: number;
    url?: string;
    responseText?: string;
    cause?: unknown;
};

async function serverApiFetch<T>(path: string): Promise<T> {
    if (!API_BASE) {
        const err: ApiFetchError = new Error(
            "API_BASE_URL/API_BASE/BACKEND_URL is not configured on the server."
        );
        err.url = path;
        throw err;
    }

    const cookieStore = await cookies();
    const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${API_BASE}${normalizedPath}`;

    let res: Response;

    try {
        res = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                ...(cookieHeader ? { Cookie: cookieHeader } : {}),
            },
            cache: "no-store",
        });
    } catch (cause) {
        const err: ApiFetchError = new Error(
            `Network error while fetching ${url}`
        );
        err.url = url;
        err.cause = cause;
        throw err;
    }

    if (res.status === 404) {
        notFound();
    }

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        const err: ApiFetchError = new Error(
            `API request failed with ${res.status} ${res.statusText}`
        );
        err.status = res.status;
        err.url = url;
        err.responseText = text;
        throw err;
    }

    if (res.status === 204) {
        return undefined as T;
    }

    try {
        return (await res.json()) as T;
    } catch (cause) {
        const err: ApiFetchError = new Error(`Invalid JSON from ${url}`);
        err.url = url;
        err.cause = cause;
        throw err;
    }
}

export default async function MeldungPrintPage({ params }: PageProps) {
    const { fallId, meldungId } = await params;

    const fallIdNum = Number(fallId);
    const meldungIdNum = Number(meldungId);

    if (!Number.isFinite(fallIdNum) || !Number.isFinite(meldungIdNum)) {
        notFound();
    }

    try {
        const [fall, meldung] = await Promise.all([
            serverApiFetch<FalleroeffnungResponse>(`/falloeffnungen/${fallIdNum}`),
            serverApiFetch<MeldungResponse>(
                `/falloeffnungen/${fallIdNum}/meldungen/${meldungIdNum}`
            ),
        ]);

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
    } catch (error) {
        console.error("MeldungPrintPage failed", {
            fallId,
            meldungId,
            apiBase: API_BASE,
            message: error instanceof Error ? error.message : String(error),
            status:
                typeof error === "object" && error && "status" in error
                    ? (error as ApiFetchError).status
                    : undefined,
            url:
                typeof error === "object" && error && "url" in error
                    ? (error as ApiFetchError).url
                    : undefined,
            responseText:
                typeof error === "object" && error && "responseText" in error
                    ? (error as ApiFetchError).responseText
                    : undefined,
            cause:
                typeof error === "object" && error && "cause" in error
                    ? (error as ApiFetchError).cause
                    : undefined,
        });

        throw error;
    }
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