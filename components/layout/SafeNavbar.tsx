'use client'

import { Component, type ReactNode } from 'react'
import { NuplyNavbarMenu } from '@/components/NuplyNavbarMenu'

/**
 * Error boundary qui protège le rendu de la page si la navbar crash.
 * Sans ça, un bug dans NuplyNavbarMenu (ex: erreur DB, import cassé)
 * fait crasher TOUTE la page, y compris sign-in et sign-up.
 */
class NavbarErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[NavbarErrorBoundary] Navbar crash intercepté:', error.message)
  }

  render() {
    if (this.state.hasError) {
      // Navbar invisible mais la page continue de fonctionner
      return null
    }
    return this.props.children
  }
}

export function SafeNavbar() {
  return (
    <NavbarErrorBoundary>
      <NuplyNavbarMenu />
    </NavbarErrorBoundary>
  )
}
