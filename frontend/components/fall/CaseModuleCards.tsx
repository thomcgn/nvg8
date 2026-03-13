"use client";

import Link from 'next/link';
import { CASE_MODULES } from '@/lib/case-engine/modules';
import { caseModulePath } from '@/lib/case-engine/routing';
import { ArrowRight } from 'lucide-react';

type Props = {
  fallId: string | number;
  akteId?: string | number | null;
};

export function CaseModuleCards({ fallId, akteId }: Props) {
  return (
    <div className="grid gap-4">
      {CASE_MODULES.map((module) => {
        const Icon = module.icon;
        return (
          <div key={module.id} className="rounded-2xl border border-brand-border/40 bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <Icon className="h-5 w-5 text-brand-text2 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-base font-semibold text-brand-text">{module.title}</div>
                  <div className="mt-1 text-sm text-brand-text2">{module.description}</div>
                </div>
              </div>

              <Link
                href={caseModulePath({ fallId, akteId }, module.id)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground sm:w-auto"
              >
                {module.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CaseModuleCards;
