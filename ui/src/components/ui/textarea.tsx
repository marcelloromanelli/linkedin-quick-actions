import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Textarea - Multi-line text input
 *
 * Matches Input styling: subtle bg, clean borders.
 * Thin scrollbar for dense content.
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-border bg-input/50 px-2.5 py-2 text-xs leading-relaxed transition-colors duration-150 scrollbar-thin resize-none",
        "placeholder:text-muted-foreground",
        "hover:border-border hover:bg-input",
        "focus:bg-background focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
