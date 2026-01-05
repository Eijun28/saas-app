"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ModernCardProps {
  children: ReactNode
  delay?: number
  className?: string
  hover?: boolean
}

export function ModernCard({ children, delay = 0, className, hover = true }: ModernCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
      className={cn(
        "relative rounded-2xl bg-card p-5 shadow-soft transition-smooth",
        hover && "hover:shadow-elevated hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

