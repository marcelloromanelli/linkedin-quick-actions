import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

/**
 * Switch - Apple Glass 2026
 *
 * Premium toggle with glow effect when active.
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-40",
      "data-[state=checked]:bg-primary data-[state=checked]:border-primary/50 data-[state=checked]:shadow-[0_0_16px_rgba(34,211,238,0.4)]",
      "data-[state=unchecked]:bg-secondary/50 data-[state=unchecked]:border-border backdrop-blur-sm",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-all duration-200",
        "data-[state=checked]:translate-x-[22px]",
        "data-[state=unchecked]:translate-x-1"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
