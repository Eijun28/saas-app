import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface SectionProps {
  children: ReactNode
  className?: string
}

export function Section({ children, className }: SectionProps) {
  return (
    <section className={cn("relative py-16 md:py-24 lg:py-32", className)}>
      {children}
    </section>
  )
}

