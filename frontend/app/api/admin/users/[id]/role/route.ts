import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const backend = process.env.BACKEND_URL || "http://localhost:8080";

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const body = await req.text();

    const res = await fetch(`${backend}/admin/users/${params.id}/role`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            cookie: req.headers.get("cookie") ?? "",
        },
        body,
    });

    const text = await res.text();

    return new NextResponse(text, {
        status: res.status,
        headers: {
            "Content-Type":
                res.headers.get("content-type") ?? "application/json",
        },
    });
}
