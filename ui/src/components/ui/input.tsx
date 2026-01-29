import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input - Text field
 *
 * Compact height (h-8), subtle background on focus.
 * Clean borders, no shadows.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded-md border border-border bg-input/50 px-2.5 py-1.5 text-xs transition-colors duration-150",
          "placeholder:text-muted-foreground",
          "hover:border-border hover:bg-input",
          "focus:bg-background focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
