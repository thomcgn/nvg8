
import React from "react";
import { CaseModuleCards } from "@/components/fall/CaseModuleCards";

type FallAssessmentModulesProps = {
  fallId: string | number;
  akteId?: string | number | null;
  onNavigate: (href: string) => void;
};

export function FallAssessmentModules(props: FallAssessmentModulesProps) {
  return <CaseModuleCards {...props} />;
}
