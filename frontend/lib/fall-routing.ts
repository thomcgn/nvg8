export type FallRouteContext = {
  fallId: string | number;
  akteId?: string | number | null;
};

export function buildFallCasePath({ fallId, akteId }: FallRouteContext) {
  return akteId
    ? `/dashboard/akten/${akteId}/${fallId}`
    : `/dashboard/falloeffnungen/${fallId}`;
}

export function buildFallHomePath({ fallId, akteId }: FallRouteContext) {
  return akteId
    ? `/dashboard/akten/${akteId}`
    : `/dashboard/falloeffnungen/${fallId}`;
}

export function buildFallModulePath(
  ctx: FallRouteContext,
  modulePath: string,
) {
  const normalized = modulePath.startsWith("/") ? modulePath.slice(1) : modulePath;
  return `${buildFallCasePath(ctx)}/${normalized}`;
}
