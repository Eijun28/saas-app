'use client'

import * as React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'

/**
 * SidebarProvider qui démarre en mode "icônes seulement" (collapsed) sur tablette
 * (768px – 1023px) et en mode expanded sur desktop (1024px+).
 * Sur mobile (<768px) la sidebar est masquée par le sidebar-wrapper, ce
 * composant n'a donc pas d'effet à cette taille.
 */
export function TabletAwareSidebarProvider({ children }: { children: React.ReactNode }) {
  // Calculé une seule fois au montage — évite le flash expanded→collapsed
  const [defaultOpen] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 1024
  })

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {children}
    </SidebarProvider>
  )
}
