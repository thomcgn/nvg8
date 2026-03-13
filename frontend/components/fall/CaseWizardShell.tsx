"use client";

import Link from 'next/link';
import { CASE_MODULES } from '@/lib/case-engine/modules';
import { caseBasePath, caseModulePath } from '@/lib/case-engine/routing';
import { Button } from '@/components/ui/button';
import { TopbarConnected as Topbar } from '@/components/layout/TopbarConnected';
import { AuthGate } from '@/components/AuthGate';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as React from 'react';

type Props = {
  title: string;
  fallId: string | number;
  akteId?: string | number | null;
  currentStep?: string | null;
  children: React.ReactNode;
};

export function CaseWizardShell({ title, fallId, akteId, currentStep, children }: Props) {
  const backHref = caseBasePath({ fallId, akteId });

  return (
    <AuthGate>
      <div className="min-h-screen bg-background text-foreground">
        <Topbar title={title} />

        <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-10 pt-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href={backHref}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zum Fall
              </Link>
            </Button>
            <div className="text-xs text-muted-foreground">Fall #{fallId}</div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-brand-border/40 bg-white p-2">
            <div className="flex min-w-max gap-2">
              {CASE_MODULES.map((module) => {
                const active = module.id === currentStep;
                const Icon = module.icon;
                return (
                  <Link
                    key={module.id}
                    href={caseModulePath({ fallId, akteId }, module.id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-brand-primary text-white'
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {module.title}
                  </Link>
                );
              })}
            </div>
          </div>

          {children}
        </div>
      </div>
    </AuthGate>
  );
}

export default CaseWizardShell;
