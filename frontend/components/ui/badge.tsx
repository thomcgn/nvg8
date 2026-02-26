import React from "react";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
};

const tones: Record<NonNullable<Props["tone"]>, string> = {
  success: "bg-brand-success/10 text-brand-success border-brand-success/20",
  warning: "bg-brand-warning/12 text-brand-warning border-brand-warning/25",
  danger: "bg-brand-danger/10 text-brand-danger border-brand-danger/20",
  info: "bg-brand-info/10 text-brand-info border-brand-info/20",
  neutral: "bg-brand-bg text-brand-text2 border-brand-border"
};

export function Badge({ tone = "neutral", className = "", ...props }: Props) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold " +
        tones[tone] +
        " " +
        className
      }
      {...props}
    />
  );
}
