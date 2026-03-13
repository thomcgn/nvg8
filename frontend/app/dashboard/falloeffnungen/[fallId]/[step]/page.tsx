
import { CaseStepRenderer } from '@/components/fall/CaseStepRenderer';

export default async function FallCaseStepPage({
  params,
}: {
  params: Promise<{ fallId: string; step: string }>;
}) {
  const { step } = await params;
  return <CaseStepRenderer step={step} />;
}
