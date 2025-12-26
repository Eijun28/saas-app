'use client'

import { usePathname } from 'next/navigation'

export default function MainWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up')
  const isHomePage = pathname === '/'
  const isPublicPage = pathname === '/tarifs' // Pages publiques comme la home page
  const isDashboardPage = pathname?.startsWith('/couple') || pathname?.startsWith('/prestataire') || pathname?.startsWith('/dashboard')

  // Pas de padding pour les pages d'auth, landing page et pages publiques
  // Les dashboards ont leur propre layout donc pas besoin de padding
  if (isAuthPage || isHomePage || isPublicPage || isDashboardPage) {
    return <div className={isDashboardPage ? 'font-inter' : ''}>{children}</div>
  }

  // Padding pour les autres pages avec navbar
  return <div className="pt-16">{children}</div>
}

