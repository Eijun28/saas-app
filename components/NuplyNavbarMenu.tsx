"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/ui/ripple-button";
import { Menu as MenuIcon, X, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";
import { useScrollPosition } from "@/hooks/useScrollPosition";

export function NuplyNavbarMenu() {
  const [active, setActive] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const supabase = createClient();
      
      // Récupérer l'utilisateur
      supabase.auth.getUser().then(({ data: { user }, error }) => {
        // Si erreur de session manquante, c'est normal pour les utilisateurs non connectés
        if (error && !error.message?.includes('Auth session missing')) {
          console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        }
        setUser(error ? null : user);
        if (user) {
          // Vérifier d'abord dans la table couples
          supabase
            .from('couples')
            .select('id, partner_1_name, partner_2_name')
            .eq('user_id', user.id)
            .single()
            .then(({ data: couple, error: coupleError }) => {
              if (couple && !coupleError) {
                // Extraire prenom et nom de partner_1_name
                const partner1Name = couple.partner_1_name || '';
                const nameParts = partner1Name.split(' ');
                setProfile({ 
                  ...couple, 
                  role: 'couple',
                  prenom: nameParts[0] || '',
                  nom: nameParts.slice(1).join(' ') || ''
                });
                return;
              }
              // Sinon vérifier dans profiles (prestataires)
              supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
                .then(({ data, error: profileError }) => {
                  // Ignorer l'erreur si le profil n'existe pas (utilisateur non configuré)
                  if (profileError && profileError.code !== 'PGRST116') {
                    console.error('Erreur lors de la récupération du profil:', profileError);
                  }
                  if (data) {
                    setProfile(data);
                  }
                });
            });
        }
      }).catch((error) => {
        console.error('Erreur lors de l\'initialisation de Supabase:', error);
      });

      // Écouter les changements d'authentification
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Vérifier d'abord dans la table couples
          supabase
            .from('couples')
            .select('id, partner_1_name, partner_2_name')
            .eq('user_id', session.user.id)
            .single()
            .then(({ data: couple, error: coupleError }) => {
              if (couple && !coupleError) {
                // Extraire prenom et nom de partner_1_name
                const partner1Name = couple.partner_1_name || '';
                const nameParts = partner1Name.split(' ');
                setProfile({ 
                  ...couple, 
                  role: 'couple',
                  prenom: nameParts[0] || '',
                  nom: nameParts.slice(1).join(' ') || ''
                });
                return;
              }
              // Sinon vérifier dans profiles (prestataires)
              supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()
                .then(({ data, error: profileError }) => {
                  // Ignorer l'erreur si le profil n'existe pas (utilisateur non configuré)
                  if (profileError && profileError.code !== 'PGRST116') {
                    console.error('Erreur lors de la récupération du profil:', profileError);
                  }
                  if (data) {
                    setProfile(data);
                  }
                });
            });
        } else {
          setProfile(null);
        }
      });

      return () => subscription.unsubscribe();
    } catch (error: any) {
      console.error('Erreur lors de la création du client Supabase:', error);
      // Si c'est une erreur de configuration, on ne bloque pas l'interface
      if (error.message?.includes('Variables d\'environnement') || error.message?.includes('Invalid API key')) {
        console.error('Configuration Supabase invalide. Vérifiez vos variables d\'environnement.');
      }
    }
  }, [mounted]);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    router.push('/');
  };

  // Ne pas afficher la navbar sur les pages dashboard (elles ont leur propre header)
  const isDashboardPage = pathname?.startsWith('/couple') || pathname?.startsWith('/prestataire');
  if (isDashboardPage) {
    return null;
  }

  // Sur la page d'accueil, toujours afficher "Se connecter" et "Commencer"
  const isHomePage = pathname === '/';

  // Ne pas rendre le contenu dépendant de l'utilisateur jusqu'à ce que le composant soit monté
  // Cela évite les erreurs d'hydratation
  if (!mounted) {
    return (
      <div className="relative w-full flex items-center justify-center">
        <Navbar 
          className="top-2" 
          active={active} 
          setActive={setActive}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          user={null}
          profile={null}
          onSignOut={handleSignOut}
          isHomePage={isHomePage}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full flex items-center justify-center" style={{ pointerEvents: 'none', zIndex: 99999 }}>
      <Navbar 
        className="top-2" 
        active={active} 
        setActive={setActive}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        user={user}
        profile={profile}
        onSignOut={handleSignOut}
        isHomePage={isHomePage}
      />
    </div>
  );
}

function Navbar({
  className,
  active,
  setActive,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  user,
  profile,
  onSignOut,
  isHomePage,
}: {
  className?: string;
  active: string | null;
  setActive: (item: string | null) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  user: any;
  profile: any;
  onSignOut: () => void;
  isHomePage: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  const handleLinkClick = (href: string) => {
    if (href.startsWith('/#')) {
      // Vérifier que nous sommes côté client
      if (typeof window !== 'undefined') {
        const targetId = href.replace('/#', '');
        
        // Si on est déjà sur la page d'accueil, scroller directement
        if (pathname === '/') {
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          // Sinon, naviguer vers la page d'accueil avec le hash
          router.push(href);
        }
      }
    }
    setIsMobileMenuOpen(false);
    setActive(null);
  };

  const handleSignOutClick = () => {
    onSignOut();
    setIsMobileMenuOpen(false);
    setActive(null);
  };

  const scrolled = useScrollPosition();

  return (
    <div
      className={cn("fixed top-4 inset-x-0 max-w-4xl mx-auto px-4", className)}
      style={{ zIndex: 99999, pointerEvents: 'auto', position: 'fixed' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className={cn(
          "flex items-center justify-between rounded-full",
          scrolled 
            ? "bg-white/95 backdrop-blur-md shadow-lg border px-4 py-1.5" 
            : "bg-transparent backdrop-blur-none shadow-none border-transparent px-4 py-2"
        )}
        style={{
          borderColor: scrolled ? '#EBE4DA' : 'transparent',
          transition: 'background-color 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), padding 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), backdrop-filter 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          position: 'relative',
          zIndex: 99999,
          pointerEvents: 'auto',
          willChange: 'background-color, padding, box-shadow'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center h-8" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}>
          <Image
            src="/images/logo.svg"
            alt="NUPLY Logo"
            width={32}
            height={30}
            className="h-6 w-auto"
            priority
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6" style={{ 
          pointerEvents: 'auto', 
          position: 'relative', 
          zIndex: 100000
        }}>
          <Link
            href="/#trouver-un-prestataire"
            prefetch={false}
            onClick={(e) => {
              e.preventDefault();
              setActive(null);
              handleLinkClick("/#trouver-un-prestataire");
            }}
            className="text-base font-bold cursor-pointer transition-colors"
            style={{ 
              color: '#823F91',
              pointerEvents: 'auto',
              transition: 'color 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#a720f2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#823F91'
            }}
          >
            Trouver un prestataire
          </Link>
          <Link
            href="/tarifs"
            onClick={() => setActive(null)}
            className="text-base font-bold cursor-pointer transition-colors"
            style={{ 
              color: '#823F91',
              pointerEvents: 'auto',
              transition: 'color 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#a720f2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#823F91'
            }}
          >
            Tarifs
          </Link>
          <Link
            href="/notre-vision"
            onClick={() => setActive(null)}
            className="text-base font-bold cursor-pointer transition-colors"
            style={{
              color: '#823F91',
              pointerEvents: 'auto',
              transition: 'color 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#a720f2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#823F91'
            }}
          >
            Notre vision
          </Link>
          <Link
            href="/blog"
            onClick={() => setActive(null)}
            className="text-base font-bold cursor-pointer transition-colors"
            style={{ 
              color: '#823F91',
              pointerEvents: 'auto',
              transition: 'color 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#a720f2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#823F91'
            }}
          >
            Blog
          </Link>
        </div>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center gap-3" style={{ 
          pointerEvents: 'auto', 
          position: 'relative', 
          zIndex: 100000
        }}>
          {user && !isHomePage ? (
            <>
              <Link
                href={profile?.role === 'couple' ? '/couple/dashboard' : '/prestataire/dashboard'}
                className="text-base font-bold cursor-pointer transition-colors flex items-center h-8"
                style={{
                  color: '#823F91',
                  pointerEvents: 'auto',
                  position: 'relative',
                  zIndex: 100000,
                  transition: 'color 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#a720f2'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#823F91'
                }}
              >
                {profile?.prenom ? `Bonjour ${profile.prenom}` : 'Mon espace'}
              </Link>
              <button
                onClick={handleSignOutClick}
                className="text-base font-bold cursor-pointer transition-colors flex items-center h-8 gap-1"
                style={{
                  color: '#823F91',
                  pointerEvents: 'auto',
                  position: 'relative',
                  zIndex: 100000,
                  transition: 'color 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: 'none',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#a720f2'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#823F91'
                }}
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </>
            ) : (
            <>
              <Link href="/sign-in" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}>
                <RippleButton
                  className="text-sm h-8 px-4 border-0 font-medium"
                  style={{ backgroundColor: '#823F91', color: 'white', pointerEvents: 'auto' }}
                  rippleColor="#ffffff"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#6D3478'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#823F91'
                    e.currentTarget.style.color = 'white'
                  }}
                >
                  <span style={{ color: 'white' }}>Se connecter</span>
                </RippleButton>
              </Link>
              <Link href="/sign-up" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}>
                <RippleButton
                  className="text-sm h-8 px-4 border-0 font-medium"
                  style={{ backgroundColor: '#c081e3', color: 'white', pointerEvents: 'auto' }}
                  rippleColor="#ffffff"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#a865d0'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#c081e3'
                    e.currentTarget.style.color = 'white'
                  }}
                >
                  <span style={{ color: 'white' }}>Commencer</span>
                </RippleButton>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
          style={{ pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}
        >
          <AnimatePresence mode="wait">
            {isMobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MenuIcon className="h-6 w-6" style={{ color: 'rgba(139, 90, 159, 1)' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden mt-2 overflow-hidden bg-white rounded-2xl border border-black/[0.1] shadow-xl"
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}
          >
            <div className="px-4 py-4 space-y-4">
              <div className="flex flex-col space-y-2">
                <Link
                  href="/#trouver-un-prestataire"
                  prefetch={false}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick("/#trouver-un-prestataire");
                  }}
                  className="text-base py-2 transition-colors"
                  style={{ 
                    color: '#823F91',
                    transition: 'color 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#a720f2'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#823F91'
                  }}
                >
                  Trouver un prestataire
                </Link>
                <Link
                  href="/tarifs"
                  onClick={() => handleLinkClick("/tarifs")}
                  className="text-base py-2 transition-colors"
                  style={{ 
                    color: '#823F91',
                    transition: 'color 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#a720f2'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#823F91'
                  }}
                >
                  Tarifs
                </Link>
                <Link
                  href="/notre-vision"
                  onClick={() => handleLinkClick("/notre-vision")}
                  className="text-base py-2 transition-colors"
                  style={{
                    color: '#823F91',
                    transition: 'color 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#a720f2'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#823F91'
                  }}
                >
                  Notre vision
                </Link>
                <Link
                  href="/blog"
                  onClick={() => handleLinkClick("/blog")}
                  className="text-base py-2 transition-colors"
                  style={{ 
                    color: '#823F91',
                    transition: 'color 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#a720f2'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#823F91'
                  }}
                >
                  Blog
                </Link>
              </div>
              <div className="pt-4 border-t border-gray-200">
                {user && !isHomePage ? (
                  <div className="space-y-2">
                    <Link
                      href={profile?.role === 'couple' ? '/couple/dashboard' : '/prestataire/dashboard'}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-left px-3 py-2 text-base transition-colors"
                      style={{
                        color: '#823F91',
                        transition: 'color 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#a720f2'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#823F91'
                      }}
                    >
                      {profile?.prenom ? `Bonjour ${profile.prenom}` : 'Mon espace'}
                    </Link>
                    <button
                      onClick={handleSignOutClick}
                      className="w-full text-left px-3 py-2 text-base flex items-center gap-2 transition-colors"
                      style={{
                        color: '#823F91',
                        background: 'none',
                        border: 'none',
                        transition: 'color 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#a720f2'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#823F91'
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Déconnexion
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                      <RippleButton
                        className="w-full h-9 text-base font-medium border-0"
                        style={{ backgroundColor: '#823F91', color: 'white' }}
                        rippleColor="#ffffff"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#6D3478'
                          e.currentTarget.style.color = 'white'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#823F91'
                          e.currentTarget.style.color = 'white'
                        }}
                      >
                        <span style={{ color: 'white' }}>Se connecter</span>
                      </RippleButton>
                    </Link>
                    <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                      <RippleButton
                        className="w-full h-9 text-base font-medium border-0"
                        style={{ backgroundColor: '#c081e3', color: 'white' }}
                        rippleColor="#ffffff"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#a865d0'
                          e.currentTarget.style.color = 'white'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#c081e3'
                          e.currentTarget.style.color = 'white'
                        }}
                      >
                        <span style={{ color: 'white' }}>Commencer</span>
                      </RippleButton>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
