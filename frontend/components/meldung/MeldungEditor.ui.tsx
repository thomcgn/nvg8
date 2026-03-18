
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import { renderPreviousValue } from "./meldungEditor.helpers";

export function SectionCard(props: { title: string; children: ReactNode; description?: string }) {
  return (
    <div className="rounded-3xl border border-brand-border/20 bg-white px-4 py-5 sm:px-6 sm:py-6 space-y-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="space-y-1">
        <div className="text-base font-semibold text-brand-text">{props.title}</div>
        {props.description ? <div className="text-sm text-brand-text2">{props.description}</div> : null}
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
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Label className={props.labelClassName ?? "text-brand-text text-base font-semibold"}>{props.label}</Label>
        {props.changed ? <Badge tone="danger">geändert</Badge> : null}
      </div>
      <div className="space-y-2 [&_input:not([type='checkbox'])]:h-12 [&_textarea]:rounded-2xl [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:text-base [&_textarea]:text-brand-text [&_input:not([type='checkbox'])]:rounded-2xl [&_input:not([type='checkbox'])]:border [&_input:not([type='checkbox'])]:border-brand-border/40 [&_input:not([type='checkbox'])]:bg-white [&_input:not([type='checkbox'])]:px-4 [&_input:not([type='checkbox'])]:text-base [&_input:not([type='checkbox'])]:text-brand-text [&_select]:h-12 [&_select]:rounded-2xl [&_select]:border [&_select]:border-brand-border/40 [&_select]:bg-white [&_select]:px-4 [&_select]:text-base [&_select]:text-brand-text [&_.touch-target]:min-h-[48px] [&_.touch-target]:px-4">
        {props.children}
      </div>
      {props.changed ? <div className="text-xs text-red-700">Vorher: {renderPreviousValue(props.previousValue)}</div> : null}
      {props.hint ? (
        <div className={props.changed ? "text-xs text-red-700/80" : "text-xs text-brand-text2"}>{props.hint}</div>
      ) : null}
    </div>
  );
}

