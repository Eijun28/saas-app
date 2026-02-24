'use client'

import { useState, useEffect } from 'react'
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
  MoreHorizontal,
  X,
  Heart,
  FileText,
  UserCircle,
  Settings,
  PartyPopper,
  UserPlus,
  CreditCard,
  Receipt,
  CalendarCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/use-notifications'

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

export interface BottomNavItem {
  href: string
  label: string
  icon: React.FC<{ className?: string }>
  badge?: number
}

export interface BottomNavSection {
  title?: string
  items: BottomNavItem[]
}

interface MobileBottomNavProps {
  items: BottomNavItem[]
  moreItems?: BottomNavSection[]
  accentColor?: 'violet' | 'pink'
}

/* ─────────────────────────────────────────────
   Bottom Sheet — glisse depuis le bas
   ───────────────────────────────────────────── */

interface MoreSheetProps {
  sections: BottomNavSection[]
  accentColor: 'violet' | 'pink'
  onClose: () => void
}

function MoreSheet({ sections, accentColor, onClose }: MoreSheetProps) {
  const pathname = usePathname()

  const activeItemClasses =
    accentColor === 'pink'
      ? 'text-pink-600 bg-pink-50'
      : 'text-violet-600 bg-violet-50'
  const activeIconClasses =
    accentColor === 'pink' ? 'text-pink-500 bg-pink-100' : 'text-violet-600 bg-violet-100'
  const badgeBg = accentColor === 'pink' ? 'bg-pink-500' : 'bg-violet-600'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[300]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[301] bg-white rounded-t-3xl shadow-2xl flex flex-col"
        style={{
          maxHeight: '92dvh',
          animation: 'slideInFromBottom 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100 flex-shrink-0">
          <p className="text-[15px] font-bold text-gray-900">Toutes les pages</p>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Sections — zone scrollable isolée */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y px-4 pt-3 space-y-4 scrollbar-hide"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
        >
          {sections.map((section, i) => (
            <div key={i}>
              {section.title && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5 px-1">
                  {section.title}
                </p>
              )}
              <div className="grid grid-cols-3 gap-2">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    pathname === item.href || pathname?.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors active:scale-95',
                        isActive ? activeItemClasses : 'text-gray-600 active:bg-gray-50'
                      )}
                    >
                      <div className="relative">
                        <div
                          className={cn(
                            'h-11 w-11 rounded-xl flex items-center justify-center',
                            isActive ? activeIconClasses : 'bg-gray-100'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-5 w-5',
                              isActive
                                ? accentColor === 'pink'
                                  ? 'text-pink-500'
                                  : 'text-violet-600'
                                : 'text-gray-500'
                            )}
                          />
                        </div>
                        {item.badge && item.badge > 0 ? (
                          <span
                            className={cn(
                              'absolute -top-1 -right-1 h-4 w-4 rounded-full text-white text-[8px] font-bold flex items-center justify-center',
                              badgeBg
                            )}
                          >
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        ) : null}
                      </div>
                      <span
                        className={cn(
                          'text-[11px] font-medium text-center leading-tight',
                          isActive
                            ? accentColor === 'pink'
                              ? 'text-pink-600'
                              : 'text-violet-600'
                            : 'text-gray-600'
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────
   Generic mobile bottom nav
   ───────────────────────────────────────────── */

export function MobileBottomNav({ items, moreItems, accentColor = 'violet' }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  // Ferme le sheet automatiquement quand on navigue
  useEffect(() => {
    setShowMore(false)
  }, [pathname])

  // Pas besoin de bloquer le scroll du body — le layout est déjà un conteneur
  // h-svh overflow-hidden, le body ne scrolle pas. Le bloc overflow:hidden sur
  // iOS empêche également le scroll interne du MoreSheet (bug iOS Safari connu).

  const activeClasses = accentColor === 'pink' ? 'text-pink-500' : 'text-violet-600'
  const activeDotClasses = accentColor === 'pink' ? 'bg-pink-500' : 'bg-violet-600'
  const badgeBgClasses = accentColor === 'pink' ? 'bg-pink-500' : 'bg-violet-600'

  // Le bouton "Plus" est actif si la page courante est dans moreItems
  const isMoreActive =
    !showMore &&
    (moreItems?.some((section) =>
      section.items.some(
        (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
      )
    ) ?? false)

  return (
    <>
      {showMore && moreItems && (
        <MoreSheet
          sections={moreItems}
          accentColor={accentColor}
          onClose={() => setShowMore(false)}
        />
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[200]">
        <div
          className="flex items-stretch border-t border-gray-200/80 bg-white/95 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Regular nav items */}
          {items.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-colors select-none',
                  isActive ? activeClasses : 'text-gray-400 hover:text-gray-600'
                )}
                aria-label={item.label}
              >
                {isActive && (
                  <span
                    className={cn(
                      'absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-b-full',
                      activeDotClasses
                    )}
                  />
                )}
                <div className="relative">
                  <Icon className="h-[22px] w-[22px]" />
                  {item.badge && item.badge > 0 ? (
                    <span
                      className={cn(
                        'absolute -top-1 -right-1.5 h-3.5 w-3.5 rounded-full text-white text-[8px] font-bold flex items-center justify-center',
                        badgeBgClasses
                      )}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <span
                  className={cn(
                    'text-[10px] leading-tight',
                    isActive ? 'font-semibold' : 'font-medium'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* Bouton "Plus" */}
          {moreItems && (
            <button
              onClick={() => setShowMore((v) => !v)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-colors select-none',
                showMore || isMoreActive ? activeClasses : 'text-gray-400 hover:text-gray-600'
              )}
              aria-label="Plus"
            >
              {(showMore || isMoreActive) && (
                <span
                  className={cn(
                    'absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-b-full',
                    activeDotClasses
                  )}
                />
              )}
              <MoreHorizontal className="h-[22px] w-[22px]" />
              <span
                className={cn(
                  'text-[10px] leading-tight',
                  showMore || isMoreActive ? 'font-semibold' : 'font-medium'
                )}
              >
                Plus
              </span>
            </button>
          )}
        </div>
      </nav>
    </>
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
  ]

  const moreItems: BottomNavSection[] = [
    {
      title: 'Finances',
      items: [
        { href: '/prestataire/analytics', label: 'Statistiques', icon: BarChart3 },
        { href: '/prestataire/devis-factures', label: 'Devis & Factures', icon: FileText },
      ],
    },
    {
      title: 'Compte',
      items: [
        { href: '/prestataire/profil-public', label: 'Profil public', icon: UserCircle },
        { href: '/prestataire/disponibilites', label: 'Disponibilités', icon: CalendarCheck },
        { href: '/prestataire/parametres', label: 'Paramètres', icon: Settings },
      ],
    },
  ]

  return <MobileBottomNav items={items} moreItems={moreItems} accentColor="violet" />
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
  ]

  const moreItems: BottomNavSection[] = [
    {
      title: 'Organisation',
      items: [
        { href: '/couple/favoris', label: 'Favoris', icon: Heart },
        { href: '/couple/demandes', label: 'Devis', icon: FileText, badge: counts.newRequests },
        { href: '/couple/budget', label: 'Budget', icon: DollarSign },
        { href: '/couple/timeline', label: 'Calendrier', icon: Calendar },
        { href: '/couple/evenements', label: 'Événements', icon: PartyPopper },
        { href: '/couple/collaborateurs', label: 'Collaborateurs', icon: UserPlus },
      ],
    },
    {
      title: 'Finances',
      items: [
        { href: '/couple/paiements', label: 'Paiements', icon: CreditCard },
        { href: '/couple/factures', label: 'Factures', icon: Receipt },
      ],
    },
    {
      title: 'Compte',
      items: [
        { href: '/couple/profil', label: 'Profil', icon: UserCircle },
        { href: '/couple/parametres', label: 'Paramètres', icon: Settings },
      ],
    },
  ]

  return <MobileBottomNav items={items} moreItems={moreItems} accentColor="violet" />
}
