import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button variants - Apple Glass 2026
 *
 * Glassmorphism with glow effects. Smooth transitions.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-destructive/20 text-destructive backdrop-blur-sm border border-destructive/30 hover:bg-destructive/30 hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border border-border bg-card/50 backdrop-blur-md hover:bg-card hover:border-border/80 hover:scale-[1.02] active:scale-[0.98]",
        secondary:
          "bg-secondary/80 backdrop-blur-sm text-secondary-foreground hover:bg-secondary hover:scale-[1.02] active:scale-[0.98]",
        ghost:
          "hover:bg-secondary/50 backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98]",
        link:
          "text-primary underline-offset-4 hover:underline",
        glass:
          "bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs rounded-lg",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
