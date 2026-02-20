'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Inbox,
  Calendar,
  MessageCircle,
  BarChart3,
  Search,
  Sparkles,
  DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/use-notifications'

/* ─────────────────────────────────────────────
   Generic mobile bottom nav
   ───────────────────────────────────────────── */

export interface BottomNavItem {
  href: string
  label: string
  icon: React.FC<{ className?: string }>
  badge?: number
}

interface MobileBottomNavProps {
  items: BottomNavItem[]
  accentColor?: 'violet' | 'pink'
}

export function MobileBottomNav({ items, accentColor = 'violet' }: MobileBottomNavProps) {
  const pathname = usePathname()

  const activeClasses = accentColor === 'pink' ? 'text-pink-500' : 'text-violet-600'
  const activeDotClasses = accentColor === 'pink' ? 'bg-pink-500' : 'bg-violet-600'
  const badgeBgClasses = accentColor === 'pink' ? 'bg-pink-500' : 'bg-violet-600'

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[200]">
      <div
        className="flex items-stretch border-t border-gray-200/80 bg-white/92 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-colors select-none",
                isActive ? activeClasses : "text-gray-400 hover:text-gray-600"
              )}
              aria-label={item.label}
            >
              {/* Active top indicator */}
              {isActive && (
                <span className={cn("absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-b-full", activeDotClasses)} />
              )}
              <div className="relative">
                <Icon className="h-[22px] w-[22px]" />
                {item.badge && item.badge > 0 ? (
                  <span className={cn(
                    "absolute -top-1 -right-1.5 h-3.5 w-3.5 rounded-full text-white text-[8px] font-bold flex items-center justify-center",
                    badgeBgClasses
                  )}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </div>
              <span className={cn(
                "text-[10px] leading-tight",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

/* ─────────────────────────────────────────────
   Prestataire bottom nav — violet accent
   ───────────────────────────────────────────── */

export function PrestataireMobileNav() {
  const { counts } = useNotifications()

  const items: BottomNavItem[] = [
    { href: '/prestataire/dashboard', label: 'Accueil', icon: Home },
    { href: '/prestataire/demandes-recues', label: 'Demandes', icon: Inbox, badge: counts.newRequests },
    { href: '/prestataire/agenda', label: 'Agenda', icon: Calendar },
    { href: '/prestataire/messagerie', label: 'Messages', icon: MessageCircle, badge: counts.unreadMessages },
    { href: '/prestataire/analytics', label: 'Stats', icon: BarChart3 },
  ]

  return <MobileBottomNav items={items} accentColor="violet" />
}

/* ─────────────────────────────────────────────
   Couple bottom nav — pink accent
   ───────────────────────────────────────────── */

export function CoupleMobileNav() {
  const { counts } = useNotifications()

  const items: BottomNavItem[] = [
    { href: '/couple/dashboard', label: 'Accueil', icon: Home },
    { href: '/couple/recherche', label: 'Chercher', icon: Search },
    { href: '/couple/matching', label: 'Matching', icon: Sparkles },
    { href: '/couple/messagerie', label: 'Messages', icon: MessageCircle, badge: counts.unreadMessages },
    { href: '/couple/budget', label: 'Budget', icon: DollarSign },
  ]

  return <MobileBottomNav items={items} accentColor="pink" />
}
