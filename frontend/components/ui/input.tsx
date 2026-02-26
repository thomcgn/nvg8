import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className = "", ...props }: Props) {
  return (
    <label className="block">
      {label ? (
        <div className="mb-1 text-sm font-medium text-brand-text">{label}</div>
      ) : null}
      <input
        className={
          "h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition " +
          "border-brand-border focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25 " +
          (error ? "border-brand-danger focus:border-brand-danger focus:ring-brand-danger/20 " : "") +
          className
        }
        {...props}
      />
      {error ? (
        <div className="mt-1 text-xs text-brand-danger">{error}</div>
      ) : hint ? (
        <div className="mt-1 text-xs text-brand-text2">{hint}</div>
      ) : null}
    </label>
  );
}
