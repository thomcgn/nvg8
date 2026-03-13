
'use client';

import { AlertTriangle } from 'lucide-react';
import { getCasePageComponent } from '@/lib/case-engine/page-registry';

type Props = {
  step: string;
  inAkteContext?: boolean;
};

export function CaseStepRenderer({ step, inAkteContext = false }: Props) {
  const PageComponent = getCasePageComponent(step, inAkteContext);

  if (!PageComponent) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-5 w-5" />
            Modul nicht gefunden
          </div>
          <p className="mt-2 text-sm">
            Dieses Fallmodul ist nicht in der zentralen Step-Registry hinterlegt.
          </p>
        </div>
      </div>
    );
  }

  return <PageComponent />;
}

export default CaseStepRenderer;
