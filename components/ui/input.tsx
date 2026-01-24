import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-11 w-full min-w-0 rounded-xl bg-transparent px-4 py-2 text-base transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "border-0 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_0_0_1px_rgba(130,63,145,0.05)]",
        "focus-visible:shadow-[0_2px_6px_rgba(130,63,145,0.15),0_0_0_2px_rgba(130,63,145,0.2)] focus-visible:ring-0",
        "aria-invalid:shadow-[0_1px_3px_rgba(239,68,68,0.2),0_0_0_1px_rgba(239,68,68,0.3)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
