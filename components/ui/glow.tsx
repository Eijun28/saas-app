import { cn } from "@/lib/utils"

interface GlowProps {
  variant?: "top" | "bottom" | "left" | "right" | "center"
  className?: string
}

export default function Glow({ variant = "bottom", className }: GlowProps) {
  const variantClasses = {
    top: "top-0 left-1/2 -translate-x-1/2",
    bottom: "bottom-0 left-1/2 -translate-x-1/2",
    left: "left-0 top-1/2 -translate-y-1/2",
    right: "right-0 top-1/2 -translate-y-1/2",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  }

  return (
    <div
      className={cn(
        "absolute h-[500px] w-[500px] rounded-full bg-gradient-to-r from-[#823F91]/20 via-[#823F91]/10 to-transparent blur-3xl",
        variantClasses[variant],
        className
      )}
    />
  )
}

