
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import { renderPreviousValue } from "./meldungEditor.helpers";

export function SectionCard(props: { title: string; children: ReactNode; description?: string }) {
  return (
    <div className="rounded-2xl border border-brand-border/25 bg-white p-4 space-y-3">
      <div>
        <div className="text-sm font-semibold text-brand-text">{props.title}</div>
        {props.description ? <div className="text-sm text-brand-text2 mt-1">{props.description}</div> : null}
      </div>
      {props.children}
    </div>
  );
}

export function FieldRow(props: {
  label: string;
  children: ReactNode;
  hint?: string;
  labelClassName?: string;
  changed?: boolean;
  previousValue?: unknown;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Label className={props.labelClassName ?? "text-brand-text"}>{props.label}</Label>
        {props.changed ? <Badge tone="danger">geändert</Badge> : null}
      </div>
      {props.children}
      {props.changed ? <div className="text-xs text-red-700">Vorher: {renderPreviousValue(props.previousValue)}</div> : null}
      {props.hint ? (
        <div className={props.changed ? "text-xs text-red-700/80" : "text-xs text-brand-text2"}>{props.hint}</div>
      ) : null}
    </div>
  );
}

