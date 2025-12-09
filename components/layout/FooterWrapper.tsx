'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

export default function FooterWrapper() {
  const pathname = usePathname()
  const isDashboardPage = pathname?.startsWith('/couple') || pathname?.startsWith('/prestataire')

  // Ne pas afficher le footer sur les pages dashboard
  if (isDashboardPage) {
    return null
  }

  return <Footer />
}

