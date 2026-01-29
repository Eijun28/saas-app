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
  badge?: number | null
  onClick?: () => void
}

export function NavItem({ href, icon: Icon, label, isActive, comingSoon = false, badge, onClick }: NavItemProps) {
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
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="truncate">{label}</span>
        {comingSoon && (
          <span className="text-[#9CA3AF] text-xs font-normal">*</span>
        )}
      </div>
      {badge !== undefined && badge !== null && badge > 0 && (
        <span className="h-5 w-5 rounded-full bg-[#823F91] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
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
    <Link href={href} className="block" onClick={onClick}>
      {content}
    </Link>
  )
}

