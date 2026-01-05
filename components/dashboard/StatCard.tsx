"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  delay?: number
}

export function StatCard({ title, value, subtitle, icon: Icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
      className="relative rounded-2xl bg-card p-5 shadow-soft transition-smooth hover:shadow-elevated"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      
      <div className="text-2xl font-semibold text-foreground tracking-tight mb-1">
        {value}
      </div>
      
      <p className="text-[12px] text-muted-foreground">{subtitle}</p>
    </motion.div>
  )
}

