import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition " +
  "focus:outline-none focus:ring-2 focus:ring-brand-teal/40 disabled:opacity-60 disabled:cursor-not-allowed";

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-brand-blue text-white shadow-soft hover:bg-brand-blue/95 active:translate-y-[1px]",
  secondary:
    "bg-white text-brand-blue border border-brand-border hover:bg-brand-bg active:translate-y-[1px]",
  ghost: "bg-transparent text-brand-blue hover:bg-brand-bg",
  danger: "bg-brand-danger text-white hover:bg-brand-danger/95"
};

const sizes: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base"
};

export function Button({ variant = "primary", size = "md", className = "", ...props }: Props) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
