import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const backend = process.env.BACKEND_URL || "http://localhost:8080";

export async function GET(req: NextRequest) {
    const res = await fetch(`${backend}/admin/users`, {
        method: "GET",
        headers: {
            cookie: req.headers.get("cookie") ?? "",
        },
    });

    const text = await res.text();
    return new NextResponse(text, {
        status: res.status,
        headers: {
            "Content-Type": res.headers.get("content-type") ?? "application/json",
        },
    });
}

export async function POST(req: NextRequest) {
    const body = await req.text();

    const res = await fetch(`${backend}/admin/users`, {
        method: "POST",
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
            "Content-Type": res.headers.get("content-type") ?? "application/json",
        },
    });
}
