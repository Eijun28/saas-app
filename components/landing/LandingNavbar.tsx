'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RippleButton } from '@/components/ui/ripple-button'

export function LandingNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    // Vérifier que window existe (SSR)
    if (typeof window === 'undefined') return
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '#how-it-works', label: 'Comment ça marche' },
    { href: '/tarifs', label: 'Tarifs' },
    { href: '/blog', label: 'Blog' },
    { href: '#about', label: 'À propos' },
  ]

  const handleLinkClick = (href: string, e: React.MouseEvent) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const targetId = href.replace('#', '')
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      setIsMenuOpen(false)
    } else {
      // For regular links, just close the menu
      setIsMenuOpen(false)
    }
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      className={`fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-md border-b transition-all duration-200 ${
        isScrolled ? 'border-gray-200 shadow-sm' : 'border-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Image
                src="/images/logo.svg"
                alt="NUPLY Logo"
                width={46}
                height={44}
                className="h-8 w-auto"
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(link.href, e)}
                className="text-sm font-medium text-[#6B7280] hover:text-[#823F91] transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#823F91] transition-all duration-200 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/sign-in">
              <RippleButton
                className="text-sm font-medium px-4 h-8 text-white border-0 transition-all duration-200 hover:opacity-90"
                style={{ backgroundColor: '#823F91', color: 'white' }}
                rippleColor="#ffffff"
              >
                Se connecter
              </RippleButton>
            </Link>
            <Link href="/sign-up">
              <RippleButton
                className="bg-[#823F91] hover:bg-[#6D3478] text-white text-sm font-semibold px-4 h-8 rounded-lg transition-all duration-200 shadow-sm shadow-[#823F91]/20 hover:shadow-md hover:shadow-[#823F91]/30 border-0"
                rippleColor="#ffffff"
              >
                Commencer
              </RippleButton>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors duration-200 hover:bg-[#c081e3]/50"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <AnimatePresence mode="wait">
              {isMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-6 w-6 text-[#6B7280]" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-6 w-6 text-[#6B7280]" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden bg-white border-t border-gray-200"
            >
              <div className="px-4 py-4 space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleLinkClick(link.href, e)}
                    className="block text-base font-medium text-[#6B7280] hover:text-[#823F91] transition-colors duration-200 py-2"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex flex-col gap-2">
                    <Link href="/sign-in" onClick={() => setIsMenuOpen(false)} className="w-full">
                      <RippleButton
                        className="w-full h-9 text-xs font-medium text-white border-0 transition-all duration-200 hover:opacity-90"
                        style={{ backgroundColor: '#823F91', color: 'white' }}
                        rippleColor="#ffffff"
                      >
                        Se connecter
                      </RippleButton>
                    </Link>
                    <Link href="/sign-up" onClick={() => setIsMenuOpen(false)} className="w-full">
                      <RippleButton
                        className="w-full h-9 text-xs font-medium bg-[#823F91] hover:bg-[#6D3478] text-white border-0"
                        rippleColor="#ffffff"
                      >
                        Commencer
                      </RippleButton>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}

