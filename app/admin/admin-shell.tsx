'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/admin/bypass-confirmation',
    label: 'Bypass confirmation',
    icon: '🔑',
  },
  {
    href: '/admin/invitations-prestataires',
    label: 'Invitations',
    icon: '📩',
  },
  {
    href: '/admin/early-adopters-alerts',
    label: 'Early Adopters',
    icon: '⚡',
  },
  {
    href: '/admin/ambassadeurs',
    label: 'Ambassadeurs',
    icon: '🤝',
  },
  {
    href: '/admin/newsletter',
    label: 'Newsletter',
    icon: '📰',
  },
]

export function AdminShell({
  children,
  userEmail,
}: {
  children: React.ReactNode
  userEmail: string
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-30 h-screen w-64 border-r border-gray-200 bg-white flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#823F91] to-[#c081e3] flex items-center justify-center">
              <span className="text-white text-sm font-bold">N</span>
            </div>
            <div>
              <span className="font-bold text-[#0B0E12] text-sm">NUPLY</span>
              <span className="text-[10px] text-[#823F91] font-medium ml-1.5 bg-[#F5F0F7] px-1.5 py-0.5 rounded">Admin</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-[#F5F0F7] text-[#823F91]'
                    : 'text-[#374151] hover:bg-gray-50 hover:text-[#0B0E12]'
                )}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F5F0F7] flex items-center justify-center">
              <span className="text-xs font-semibold text-[#823F91]">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#374151] truncate">{userEmail}</p>
              <p className="text-[10px] text-[#9CA3AF]">Administrateur</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
