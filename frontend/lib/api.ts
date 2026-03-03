// lib/api.ts

import { getCurrentEinrichtungId } from "@/lib/context-store";
import { apiSwitchContext } from "@/lib/context";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
// lokal: http://localhost:8080
// prod: "" → same-origin (Caddy leitet ans Backend)

export type ProblemDetails = {
  status?: number;
  title?: string;
  detail?: string;
  code?: string;
  instance?: string;
  timestamp?: string;
  path?: string;
  meta?: any;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  problem?: ProblemDetails;

  constructor(message: string, status: number, problem?: ProblemDetails) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
    this.code = problem?.code;
  }
}

function isObject(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null;
}

function asProblemDetails(body: unknown): ProblemDetails | undefined {
  if (!isObject(body)) return undefined;

  const pd: ProblemDetails = {
    status: typeof body.status === "number" ? body.status : undefined,
    title: typeof body.title === "string" ? body.title : undefined,
    detail: typeof body.detail === "string" ? body.detail : undefined,
    code: typeof body.code === "string" ? body.code : undefined,
    instance: typeof body.instance === "string" ? body.instance : undefined,
    timestamp: typeof body.timestamp === "string" ? body.timestamp : undefined,
    path: typeof body.path === "string" ? body.path : undefined,
    meta: (body as any).meta,
  };

  if (!pd.status && !pd.title && !pd.detail && !pd.code) return undefined;
  return pd;
}

async function rawFetch<T>(
    path: string,
    options: Omit<RequestInit, "body"> & { body?: any } = {}
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const res = await fetch(`${API_BASE}${normalizedPath}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let problem: ProblemDetails | undefined;

    const ct = res.headers.get("content-type") || "";

    try {
      if (ct.includes("application/json")) {
        const body = await res.json();
        problem = asProblemDetails(body);
        message =
            problem?.detail ||
            problem?.title ||
            (typeof (body as any)?.message === "string"
                ? (body as any).message
                : message);
      } else {
        const text = await res.text();
        if (text) message = text;
      }
    } catch {}

    throw new ApiError(message, res.status, problem);
  }

  if (res.status === 204) return undefined as unknown as T;

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return (await res.text()) as unknown as T;

  return (await res.json()) as T;
}

export async function apiFetch<T>(
    path: string,
    options: Omit<RequestInit, "body"> & { body?: any } = {}
): Promise<T> {
  try {
    return await rawFetch<T>(path, options);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;

    const isContextRequired =
        e.status === 403 &&
        (e.code === "CONTEXT_REQUIRED" ||
            e.problem?.code === "CONTEXT_REQUIRED" ||
            e.message.includes("Switch context"));

    const desiredEinrichtungId = getCurrentEinrichtungId();

    if (!isContextRequired || !desiredEinrichtungId) {
      throw e;
    }

    await apiSwitchContext(desiredEinrichtungId);
    return await rawFetch<T>(path, options);
  }
}