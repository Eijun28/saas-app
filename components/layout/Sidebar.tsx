'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { NavItem } from './NavItem'
import { LucideIcon } from 'lucide-react'

interface SidebarItem {
  href: string
  icon: LucideIcon
  label: string
  comingSoon?: boolean
}

interface SidebarProps {
  role: 'couple' | 'prestataire'
  items: SidebarItem[]
}

export function Sidebar({ role, items }: SidebarProps) {
  const pathname = usePathname()

  return (
    <motion.aside
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-[#E5E7EB] z-40 hidden lg:block"
    >
      <div className="flex flex-col h-full">
        {/* Logo NUPLY */}
        <div className="p-6 border-b border-[#E5E7EB]">
          <Link href={`/${role}`} className="flex items-center gap-2">
            <Image
              src="/images/logo.svg"
              alt="NUPLY Logo"
              width={46}
              height={44}
              className="h-8 w-auto"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
              comingSoon={item.comingSoon}
            />
          ))}
        </nav>

        {/* Bottom logo icon */}
        <div className="p-4 border-t border-[#E5E7EB]">
          <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
            <span className="text-sm font-bold text-[#823F91]">N</span>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}

