'use client'

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NavItemProps {
  href: string
  icon: LucideIcon
  label: string
  isActive: boolean
  comingSoon?: boolean
}

export function NavItem({ href, icon: Icon, label, isActive, comingSoon = false }: NavItemProps) {
  const content = (
    <motion.div
      className={cn(
        "flex items-center justify-between gap-3 px-6 py-4 rounded-lg transition-all duration-200 font-medium relative",
        comingSoon
          ? "text-[#9CA3AF] cursor-not-allowed opacity-60"
          : isActive
          ? "bg-[#E8D4EF] text-[#6D3478] border-l-4 border-[#6D3478]"
          : "text-[#374151] hover:bg-[#E8D4EF]/50"
      )}
      whileHover={!comingSoon ? { x: 4 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
        {comingSoon && (
          <span className="text-[#9CA3AF] text-xs font-normal">*</span>
        )}
      </div>
    </motion.div>
  )

  if (comingSoon) {
    return (
      <div className="block" onClick={(e) => e.preventDefault()}>
        {content}
      </div>
    )
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  )
}

