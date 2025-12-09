"use client";

import React, { useState, useEffect } from "react";
import { HoveredLink, Menu, MenuItem } from "@/components/ui/navbar-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu as MenuIcon, X, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";

export function NuplyNavbarMenu() {
  const [active, setActive] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    
    // Récupérer l'utilisateur
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Récupérer le profil
        supabase
          .from('profiles')
          .select('role, prenom, nom')
          .eq('id', user.id)
          .single()
          .then(({ data }) => setProfile(data));
      }
    });

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('role, prenom, nom')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  return (
    <div className="relative w-full flex items-center justify-center">
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
  const handleLinkClick = (href: string) => {
    if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  return (
    <div
      className={cn("fixed top-4 inset-x-0 max-w-4xl mx-auto z-50 px-4", className)}
    >
      <div className="flex items-center justify-between bg-white dark:bg-black rounded-full border border-transparent dark:border-white/[0.2] shadow-input px-4 py-2">
        {/* Logo */}
        <Link href="/" className="flex items-center h-8">
          <Image
            src="/images/logo.svg"
            alt="NUPLY Logo"
            width={32}
            height={30}
            className="h-6 w-auto"
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:block">
          <Menu setActive={setActive}>
            <MenuItem setActive={setActive} active={active} item="Services" href="/#prestataires">
              <div className="flex flex-col space-y-4 text-sm">
                <HoveredLink href="/#prestataires">Trouver un prestataire</HoveredLink>
                <HoveredLink href="/#fonctionnement">Comment ça marche</HoveredLink>
                <HoveredLink href="/#features">Fonctionnalités</HoveredLink>
                <HoveredLink href="/#testimonials">Témoignages</HoveredLink>
              </div>
            </MenuItem>
            <Link
              href="/tarifs"
              onClick={() => setActive(null)}
              className="text-black hover:opacity-[0.9] dark:text-white text-sm font-medium cursor-pointer flex items-center h-8"
            >
              Tarifs
            </Link>
            <MenuItem setActive={setActive} active={active} item="Ressources" href="/blog">
              <div className="flex flex-col space-y-4 text-sm">
                <HoveredLink href="/blog">Blog</HoveredLink>
                <HoveredLink href="/guides">Guides</HoveredLink>
                <HoveredLink href="/templates">Modèles</HoveredLink>
                <HoveredLink href="/contact">Contact</HoveredLink>
              </div>
            </MenuItem>
          </Menu>
        </div>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {user && !isHomePage ? (
            <>
              <Link
                href={profile?.role === 'couple' ? '/couple' : '/prestataire'}
                className="text-sm text-[#374151] hover:text-[#823F91] transition-colors flex items-center h-8"
              >
                {profile?.prenom ? `Bonjour ${profile.prenom}` : 'Mon espace'}
              </Link>
              <Button
                onClick={handleSignOutClick}
                variant="ghost"
                size="sm"
                className="text-sm h-8"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-sm h-8"
              >
                <Link href="/sign-in">Se connecter</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="text-sm h-8 bg-[#823F91] hover:bg-[#6D3478]"
              >
                <Link href="/sign-up">Commencer</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle menu"
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
                <MenuIcon className="h-6 w-6" />
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
            className="md:hidden mt-2 overflow-hidden bg-white dark:bg-black rounded-2xl border border-black/[0.2] dark:border-white/[0.2] shadow-xl"
          >
            <div className="px-6 py-4 space-y-4">
              <div className="flex flex-col space-y-3">
                <Link
                  href="/#prestataires"
                  onClick={() => handleLinkClick("/#prestataires")}
                  className="text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white text-sm"
                >
                  Trouver un prestataire
                </Link>
                <Link
                  href="/#fonctionnement"
                  onClick={() => handleLinkClick("/#fonctionnement")}
                  className="text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white text-sm"
                >
                  Comment ça marche
                </Link>
                <Link
                  href="/tarifs"
                  onClick={() => handleLinkClick("/tarifs")}
                  className="text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white text-sm"
                >
                  Tarifs
                </Link>
                <Link
                  href="/blog"
                  onClick={() => handleLinkClick("/blog")}
                  className="text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white text-sm"
                >
                  Blog
                </Link>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                {user && !isHomePage ? (
                  <>
                    <Link
                      href={profile?.role === 'couple' ? '/couple' : '/prestataire'}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white"
                    >
                      {profile?.prenom ? `Bonjour ${profile.prenom}` : 'Mon espace'}
                    </Link>
                    <Button
                      onClick={handleSignOutClick}
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                        Se connecter
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="w-full bg-[#823F91] hover:bg-[#6D3478]"
                    >
                      <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                        Commencer
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

