'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { RippleButton } from '@/components/ui/ripple-button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'

// Variants d'animation pour le logo
const logoVariants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
  },
}

// Variants pour la navbar (show/hide sur scroll down)
const navbarVariants = {
  visible: {
    y: 0,
    opacity: 1,
  },
  hidden: {
    y: -100,
    opacity: 0,
  },
}

interface AnimatedHeaderProps {
  className?: string
}

export function AnimatedHeader({ className }: AnimatedHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const { scrollY } = useScroll()
  const router = useRouter()
  const pathname = usePathname()

  // Détection du scroll avec seuil à 50px
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const isAtTop = latest < 50
    const isScrollingDown = latest > lastScrollY && latest > 100

    setIsScrolled(!isAtTop)

    // Cache la navbar si scroll down rapide (optionnel, pour effet avancé)
    if (isScrollingDown && latest > 100 && !isAtTop) {
      setIsVisible(false)
    } else {
      setIsVisible(true)
    }

    setLastScrollY(latest)
  })

  // Récupération de l'utilisateur
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        // Vérifier d'abord dans la table couples
        supabase
          .from('couples')
          .select('id, prenom, nom')
          .eq('id', user.id)
          .single()
          .then(({ data: couple }) => {
            if (couple) {
              setProfile({ ...couple, role: 'couple' })
              return
            }
            // Sinon vérifier dans profiles (prestataires)
            supabase
              .from('profiles')
              .select('role, prenom, nom')
              .eq('id', user.id)
              .single()
              .then(({ data }) => setProfile(data))
          })
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Vérifier d'abord dans la table couples
        supabase
          .from('couples')
          .select('id, prenom, nom')
          .eq('id', session.user.id)
          .single()
          .then(({ data: couple }) => {
            if (couple) {
              setProfile({ ...couple, role: 'couple' })
              return
            }
            // Sinon vérifier dans profiles (prestataires)
            supabase
              .from('profiles')
              .select('role, prenom, nom')
              .eq('id', session.user.id)
              .single()
              .then(({ data }) => setProfile(data))
          })
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
    setIsMobileMenuOpen(false)
  }

  const handleLinkClick = (href: string) => {
    if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '')
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    setIsMobileMenuOpen(false)
  }

  // Ne pas afficher sur les pages dashboard
  const isDashboardPage = pathname?.startsWith('/couple') || pathname?.startsWith('/prestataire')
  if (isDashboardPage) {
    return null
  }

  const isHomePage = pathname === '/'

  return (
    <motion.header
      role="banner"
      aria-label="Navigation principale"
      variants={navbarVariants}
      animate={isVisible ? 'visible' : 'hidden'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'fixed top-0 inset-x-0 z-50',
        'transition-all duration-300 ease-in-out',
        isScrolled
          ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50'
          : 'bg-transparent',
        className
      )}
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo avec animation */}
          <motion.div
            variants={logoVariants}
            initial="hidden"
            animate={isScrolled ? 'visible' : 'hidden'}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex items-center"
          >
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/images/logo.svg"
                alt="NUPLY Logo"
                width={32}
                height={30}
                className="h-6 w-auto"
                priority
              />
              {isScrolled && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="text-xl font-bold text-gray-900 hidden sm:block"
                >
                  NUPLY
                </motion.span>
              )}
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#fonctionnement"
              onClick={() => handleLinkClick('/#fonctionnement')}
              className={cn(
                'text-sm font-medium transition-colors duration-300',
                isScrolled
                  ? 'text-gray-700 hover:text-gray-900'
                  : 'text-white hover:text-white/80'
              )}
            >
              Comment ça marche
            </Link>
            <Link
              href="/#prestataires"
              onClick={() => handleLinkClick('/#prestataires')}
              className={cn(
                'text-sm font-medium transition-colors duration-300',
                isScrolled
                  ? 'text-gray-700 hover:text-gray-900'
                  : 'text-white hover:text-white/80'
              )}
            >
              Prestataires
            </Link>
            <Link
              href="/tarifs"
              className={cn(
                'text-sm font-medium transition-colors duration-300',
                isScrolled
                  ? 'text-gray-700 hover:text-gray-900'
                  : 'text-white hover:text-white/80'
              )}
            >
              Tarifs
            </Link>
            <Link
              href="/blog"
              className={cn(
                'text-sm font-medium transition-colors duration-300',
                isScrolled
                  ? 'text-gray-700 hover:text-gray-900'
                  : 'text-white hover:text-white/80'
              )}
            >
              Blog
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {user && !isHomePage ? (
              <>
                <Link
                  href={profile?.role === 'couple' ? '/couple/dashboard' : '/prestataire/dashboard'}
                  className={cn(
                    'hidden md:inline-flex text-sm transition-colors duration-300',
                    isScrolled
                      ? 'text-gray-700 hover:text-gray-900'
                      : 'text-white hover:text-white/80'
                  )}
                >
                  {profile?.prenom ? `Bonjour ${profile.prenom}` : 'Mon espace'}
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'hidden md:inline-flex text-sm h-8',
                    isScrolled ? 'text-gray-700' : 'text-white'
                  )}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <RippleButton
                    size="sm"
                    className={cn(
                      'hidden md:inline-flex text-sm h-8 border-transparent bg-transparent',
                      isScrolled ? 'text-gray-700' : 'text-white'
                    )}
                    rippleColor={isScrolled ? '#374151' : '#ffffff'}
                  >
                    Se connecter
                  </RippleButton>
                </Link>
                <Link href="/sign-up">
                  <RippleButton
                    size="sm"
                    className={cn(
                      'text-sm h-8 text-white border-0',
                      isScrolled
                        ? 'bg-[#823F91] hover:bg-[#6D3478]'
                        : 'bg-[#823F91] hover:bg-[#6D3478]'
                    )}
                    rippleColor="#ffffff"
                  >
                    Commencer
                  </RippleButton>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'md:hidden',
                    isScrolled ? 'text-gray-900' : 'text-white'
                  )}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full">
                  {/* Mobile Logo */}
                  <div className="flex items-center space-x-2 mb-8">
                    <Image
                      src="/images/logo.svg"
                      alt="NUPLY Logo"
                      width={32}
                      height={30}
                      className="h-6 w-auto"
                    />
                    <span className="text-xl font-bold text-gray-900">NUPLY</span>
                  </div>

                  {/* Mobile Navigation Links */}
                  <nav className="flex-1 space-y-4">
                    <Link
                      href="/#fonctionnement"
                      onClick={() => handleLinkClick('/#fonctionnement')}
                      className="block text-base font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      Comment ça marche
                    </Link>
                    <Link
                      href="/#prestataires"
                      onClick={() => handleLinkClick('/#prestataires')}
                      className="block text-base font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      Prestataires
                    </Link>
                    <Link
                      href="/tarifs"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-base font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      Tarifs
                    </Link>
                    <Link
                      href="/blog"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-base font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      Blog
                    </Link>
                  </nav>

                  {/* Mobile CTA Buttons */}
                  <div className="pt-6 border-t border-gray-200 space-y-3">
                    {user && !isHomePage ? (
                      <>
                        <Link
                          href={profile?.role === 'couple' ? '/couple/dashboard' : '/prestataire/dashboard'}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                        >
                          {profile?.prenom ? `Bonjour ${profile.prenom}` : 'Mon espace'}
                        </Link>
                        <Button
                          onClick={handleSignOut}
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Déconnexion
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                          <RippleButton
                            className="w-full justify-start border-transparent bg-transparent"
                            rippleColor="#823F91"
                          >
                            Se connecter
                          </RippleButton>
                        </Link>
                        <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                          <RippleButton
                            className="w-full bg-[#823F91] hover:bg-[#6D3478] text-white border-0"
                            rippleColor="#ffffff"
                          >
                            Commencer
                          </RippleButton>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </motion.header>
  )
}

