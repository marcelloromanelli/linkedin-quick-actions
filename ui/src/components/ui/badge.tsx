import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge - Apple Glass 2026
 *
 * Glassy status indicators with subtle glow.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium tracking-wide transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-primary/20 text-primary backdrop-blur-sm border border-primary/30",
        secondary:
          "bg-secondary/50 text-secondary-foreground backdrop-blur-sm border border-border",
        success:
          "bg-success/20 text-success backdrop-blur-sm border border-success/30",
        warning:
          "bg-warning/20 text-warning-foreground backdrop-blur-sm border border-warning/30",
        destructive:
          "bg-destructive/20 text-destructive backdrop-blur-sm border border-destructive/30",
        outline:
          "text-foreground backdrop-blur-sm border border-border",
        muted:
          "bg-muted/50 text-muted-foreground backdrop-blur-sm",
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
