'use client'

import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavItem } from './NavItem'
import { LucideIcon } from 'lucide-react'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  items: Array<{ href: string; icon: LucideIcon; label: string; comingSoon?: boolean }>
}

export function MobileMenu({ isOpen, onClose, items }: MobileMenuProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
          />

          {/* Menu */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-screen w-[280px] bg-white z-50 lg:hidden shadow-xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
                <Image
                  src="/images/logo.svg"
                  alt="NUPLY Logo"
                  width={46}
                  height={44}
                  className="h-8 w-auto"
                />
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[#E8D4EF] transition-colors"
                >
                  <X className="h-5 w-5 text-[#374151]" />
                </button>
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
                    onClick={onClose}
                  />
                ))}
              </nav>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

