import { cn } from "@/lib/utils"
import { ReactNode, CSSProperties } from "react"

interface SectionProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function Section({ children, className, style }: SectionProps) {
  return (
    <section className={cn("relative py-16 md:py-24 lg:py-32", className)} style={style}>
      {children}
    </section>
  )
}

