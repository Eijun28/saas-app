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
        "flex items-center justify-between gap-3 py-4 rounded-lg transition-all duration-200 font-medium relative",
        comingSoon
          ? "text-[#9CA3AF] cursor-not-allowed opacity-60"
          : isActive
          ? "bg-gradient-to-r from-[#823F91]/20 via-[#9D5FA8]/20 to-[#823F91]/20 text-[#823F91] border-l-4 border-[#823F91] shadow-sm shadow-[#823F91]/20"
          : "text-[#374151] hover:bg-gradient-to-r hover:from-[#823F91]/10 hover:via-[#9D5FA8]/10 hover:to-[#823F91]/10 hover:text-[#823F91] transition-all"
      )}
      whileHover={!comingSoon ? { x: 4 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="flex items-center gap-4">
        <Icon className="h-5 w-5 flex-shrink-0" />
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

