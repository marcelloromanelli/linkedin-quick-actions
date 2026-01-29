import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge - Status indicator
 *
 * Color for meaning only. Semantic variants for status.
 * Tight, compact, technical feel.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-primary/15 text-primary border border-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground border border-border",
        success:
          "bg-success/15 text-success border border-success/20",
        warning:
          "bg-warning/15 text-warning border border-warning/20",
        destructive:
          "bg-destructive/15 text-destructive border border-destructive/20",
        outline:
          "text-foreground border border-border",
        muted:
          "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
