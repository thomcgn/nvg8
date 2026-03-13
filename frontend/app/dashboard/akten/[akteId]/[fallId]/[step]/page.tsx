
import { CaseStepRenderer } from '@/components/fall/CaseStepRenderer';

export default async function AktenCaseStepPage({
  params,
}: {
  params: Promise<{ akteId: string; fallId: string; step: string }>;
}) {
  const { step } = await params;
  return <CaseStepRenderer step={step} inAkteContext />;
}
