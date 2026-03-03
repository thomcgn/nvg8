import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * shadcn Badge – erweitert um:
 * - zusätzliche Varianten: info, warning, success, neutral
 * - Legacy-Prop: tone="neutral|info|warning|danger|success"
 *
 * Du kannst weiterhin "variant" nutzen (shadcn style),
 * aber alter Code mit "tone" funktioniert ebenfalls.
 */

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors " +
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
      variants: {
        variant: {
          default: "border-transparent bg-primary text-primary-foreground",
          secondary: "border-transparent bg-secondary text-secondary-foreground",
          destructive: "border-transparent bg-destructive text-destructive-foreground",
          outline: "text-foreground",

          // ✅ Zusätzliche Varianten (passen zu deinem Brand System via CSS Vars)
          neutral: "border-transparent bg-muted text-muted-foreground",
          info: "border-transparent bg-[color:var(--color-brand-info)] text-white",
          warning:
              "border-transparent bg-[color:var(--color-brand-warning)] text-black",
          success:
              "border-transparent bg-[color:var(--color-brand-success)] text-white",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    }
);

type Tone = "neutral" | "info" | "warning" | "danger" | "success";

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof badgeVariants> {
  /**
   * Legacy-Prop (aus altem Design System).
   * Wird intern auf variant gemappt.
   */
  tone?: Tone;
}

function Badge({ className, variant, tone, ...props }: BadgeProps) {
  const mappedVariant =
      variant ??
      (tone === "danger"
          ? "destructive"
          : tone === "neutral"
              ? "neutral"
              : tone === "info"
                  ? "info"
                  : tone === "warning"
                      ? "warning"
                      : tone === "success"
                          ? "success"
                          : undefined);

  return (
      <span
          className={cn(badgeVariants({ variant: mappedVariant }), className)}
          {...props}
      />
  );
}

export { Badge, badgeVariants };