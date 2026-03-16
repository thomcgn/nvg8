export function clampSeverity(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(3, Math.round(n)));
}

export function pick<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function nowIso() {
  return new Date().toISOString();
}

export function todayLocalDate() {
  return new Date().toISOString().split("T")[0];
}

export function normalizeCompareValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

export function isSameValue(a: unknown, b: unknown): boolean {
  return normalizeCompareValue(a) === normalizeCompareValue(b);
}

export function renderPreviousValue(v: unknown) {
  const s = normalizeCompareValue(v);
  return s ? s : "—";
}

export function changedInputClass(changed: boolean) {
  return changed ? "border-red-300 bg-red-50/40 focus-visible:ring-red-300" : "";
}

export function changedLabelClass(changed: boolean) {
  return changed ? "text-red-700" : "text-brand-text";
}

export function changeTooltip(changed: boolean, previousValue: unknown) {
  if (!changed) return undefined;
  return `Vorherige Version: ${renderPreviousValue(previousValue)}`;
}

export function isDoneStatus(status: string | null | undefined) {
  const s = String(status ?? "").toUpperCase();
  return s.includes("ABGESCH") || s.includes("GESCHLOSS") || s.includes("SUBMIT");
}

export function toLocalDate(value: string | null | undefined) {
  const s = String(value ?? "").trim();
  return s || null;
}

export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

