export type MeResponse = {
  userId: number;
  email: string;
  displayName: string;
  contextActive: boolean;
  traegerId: number | null;
  orgUnitId: number | null;
  roles: string[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

async function apiFetch<T>(
    path: string,
    options: Omit<RequestInit, "body"> & { body?: any } = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // ✅ Special case: /auth/me darf 401 liefern ohne "Error"
  if (path === "/auth/me" && res.status === 401) {
    return null as unknown as T;
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data?.detail || data?.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export async function login(email: string, password: string) {
  return apiFetch("/auth/login", { method: "POST", body: { email, password } });
}

// ✅ Switch Context: richtiger Endpoint + richtiger Body-Key
export async function selectContext(einrichtungOrgUnitId: number) {
  // ✅ Guard: niemals null/undefined/NaN/0 durchlassen
  if (!Number.isFinite(einrichtungOrgUnitId) || einrichtungOrgUnitId <= 0) {
    throw new Error("selectContext: einrichtungOrgUnitId ist ungültig.");
  }

  return apiFetch("/auth/context/switch", {
    method: "POST",
    body: { einrichtungOrgUnitId },
  });
}

// ✅ gibt jetzt MeResponse | null zurück (bei 401 null)
export async function getMe(): Promise<MeResponse | null> {
  return apiFetch<MeResponse | null>("/auth/me", { method: "GET" });
}

export async function logout(): Promise<void> {
  await apiFetch<void>("/auth/logout", { method: "POST" });
}