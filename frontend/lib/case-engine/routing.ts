import { resolveCaseModule, type CaseModuleDef } from '@/lib/case-engine/modules';

export type CaseRouteContext = {
  fallId: string | number;
  akteId?: string | number | null;
};

function asSegment(value: string | number) {
  return encodeURIComponent(String(value));
}

export function caseBasePath({ fallId, akteId }: CaseRouteContext) {
  if (akteId !== undefined && akteId !== null && akteId !== '') {
    return `/dashboard/akten/${asSegment(akteId)}/${asSegment(fallId)}`;
  }
  return `/dashboard/falloeffnungen/${asSegment(fallId)}`;
}

export function caseModulePath(context: CaseRouteContext, step: string) {
  const resolved = resolveCaseModule(step);
  return `${caseBasePath(context)}/${resolved?.id ?? step}`;
}

export function caseModuleTarget(context: CaseRouteContext, step: string) {
  const module = resolveCaseModule(step);
  return {
    module,
    href: caseModulePath(context, step),
  } satisfies { module: CaseModuleDef | null; href: string };
}
