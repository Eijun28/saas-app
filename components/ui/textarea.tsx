import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
  return (
    <textarea
        ref={ref}
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full rounded-md bg-transparent px-3 py-2 text-base transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "border-0 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_0_0_1px_rgba(130,63,145,0.05)]",
        "focus-visible:shadow-[0_2px_6px_rgba(130,63,145,0.15),0_0_0_2px_rgba(130,63,145,0.2)] focus-visible:ring-0",
        "aria-invalid:shadow-[0_1px_3px_rgba(239,68,68,0.2),0_0_0_1px_rgba(239,68,68,0.3)]",
        className
      )}
      {...props}
    />
  )
}
)

Textarea.displayName = "Textarea"

export { Textarea }
