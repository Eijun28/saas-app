"use client"

import { motion } from "framer-motion"
import { LucideIcon, ArrowRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SectionCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  gradient: string
  badge?: string
  delay?: number
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  href,
  gradient,
  badge,
  delay = 0,
}: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
    >
      <Link href={href} className="block group">
        <div className="relative h-full rounded-2xl bg-card p-5 shadow-soft transition-smooth hover:shadow-elevated hover:-translate-y-0.5">
          <div className="flex items-start justify-between mb-4">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl transition-smooth group-hover:scale-105 hover-gradient-purple",
                gradient
              )}
            >
              <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
            {badge && (
              <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {badge}
              </span>
            )}
          </div>

          <h3 className="text-[15px] font-semibold text-foreground mb-1.5 tracking-tight">
            {title}
          </h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
            {description}
          </p>

          <div className="flex items-center text-[13px] font-medium text-primary transition-smooth group-hover:gap-2">
            <span>Accéder</span>
            <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

