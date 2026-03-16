"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

import { AuthGate } from "@/components/AuthGate";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { caseBasePath } from "@/lib/case-engine/routing";

type Props = {
  title: string;
  fallId: string | number;
  akteId?: string | number | null;
  subtitle?: string;
  children: React.ReactNode;
};

export function CaseExportShell({ title, fallId, akteId, subtitle, children }: Props) {
  const displayFallId = fallId === "" ? "—" : fallId;
  const backHref = React.useMemo(() => {
    if (fallId === "") {
      return "/dashboard/falloeffnungen";
    }
    return caseBasePath({ fallId, akteId });
  }, [fallId, akteId]);

  const handlePrint = React.useCallback(() => {
    window.print();
  }, []);

  return (
    <AuthGate>
      <div className="min-h-screen bg-muted/30 text-foreground print:bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-16 pt-6 print:gap-0 print:px-0 print:pb-0 print:pt-0 sm:px-6">
          <header className="print:hidden rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <BrandMark />
                <div className="mt-3 text-sm text-muted-foreground">{subtitle ?? "Fallakte-Export"}</div>
                <h1 className="mt-1 text-2xl font-semibold text-brand-text">{title}</h1>
                <p className="text-sm text-muted-foreground">Fall #{displayFallId}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={backHref}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück zum Fall
                  </Link>
                </Button>
                <Button onClick={handlePrint} className="gap-2" size="sm">
                  <Printer className="h-4 w-4" />
                  Drucken / PDF
                </Button>
              </div>
            </div>
          </header>

          <main className="print-root w-full print:bg-white">{children}</main>
        </div>
      </div>
    </AuthGate>
  );
}

export default CaseExportShell;

