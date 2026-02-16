'use client'

import { Bell, Search, User, LogOut, MessageSquare, Wallet, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUser } from '@/hooks/use-user'
import { signOut } from '@/lib/auth/actions'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/ui/user-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopBarProps {
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
}

interface Notification {
  id: string
  type: 'message' | 'budget' | 'timeline'
  title: string
  description: string
  time: string
  href: string
}

export function TopBar({ title, breadcrumbs }: TopBarProps) {
  const { user } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  
  // Déterminer le titre automatiquement selon la page si non fourni
  const getPageTitle = () => {
    if (title) return title
    if (breadcrumbs && breadcrumbs.length > 0) return breadcrumbs[breadcrumbs.length - 1].label
    
    // Titres automatiques selon le pathname
    if (pathname?.startsWith('/couple/dashboard')) return 'Accueil'
    if (pathname?.startsWith('/couple/matching')) return 'Nuply Matching'
    if (pathname?.startsWith('/couple/messagerie')) return 'Messages'
    if (pathname?.startsWith('/couple/budget')) return 'Budget'
    if (pathname?.startsWith('/couple/profil')) return 'Profil'
    if (pathname?.startsWith('/couple/demandes')) return 'Demandes & Devis'
    if (pathname?.startsWith('/couple/timeline')) return 'Calendrier'
    if (pathname?.startsWith('/couple/collaborateurs')) return 'Collaborateurs'
    if (pathname?.startsWith('/couple/notifications')) return 'Notifications'
    if (pathname?.startsWith('/couple/recherche')) return 'Recherche'
    
    return 'Dashboard'
  }
  
  const pageTitle = getPageTitle()
  const [profile, setProfile] = useState<any>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'couple' | 'prestataire' | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const loadProfile = async () => {
    if (!user) return
    
    const supabase = createClient()
    
    // Vérifier d'abord dans la table couples
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('partner_1_name, partner_2_name, avatar_url')
      .eq('user_id', user.id)
      .single()
    
    if (coupleData && !coupleError) {
      // Formater les noms pour l'affichage
      const name1 = coupleData.partner_1_name || ''
      const name2 = coupleData.partner_2_name || ''
      const displayName = name1 && name2 ? `${name1} & ${name2}` : name1 || name2 || ''
      
      setProfile({
        partner_1_name: name1,
        partner_2_name: name2,
        displayName: displayName,
      })
      setUserRole('couple')
      if (coupleData.avatar_url) {
        setPhotoUrl(coupleData.avatar_url)
      }
    } else {
      // Sinon vérifier dans profiles (prestataires)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('prenom, nom, avatar_url, role')
        .eq('id', user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
        if (profileData.avatar_url) {
          setPhotoUrl(profileData.avatar_url)
        }
        if (profileData.role) {
          setUserRole(profileData.role as 'couple' | 'prestataire')
        }
      }
    }
  }

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  // Écouter les événements de mise à jour d'avatar
  useEffect(() => {
    const handleAvatarUpdate = () => {
      if (user) {
        loadProfile()
      }
    }

    window.addEventListener('avatar-updated', handleAvatarUpdate)
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate)
    }
  }, [user])

  useEffect(() => {
    if (user && userRole) {
      loadNotifications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userRole])

  const loadNotifications = async () => {
    if (!user || !userRole) return

    const supabase = createClient()
    const allNotifications: Notification[] = []

    try {
      if (userRole === 'couple') {
        // Messages désactivés temporairement

        // Récupérer les 3 dernières dépenses créées/modifiées
        const { data: budgetItems } = await supabase
          .from('budget_items')
          .select('id, title, amount, updated_at')
          .eq('couple_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(3)

        if (budgetItems && budgetItems.length > 0) {
          budgetItems.forEach((item) => {
            allNotifications.push({
              id: item.id,
              type: 'budget',
              title: 'Dépense mise à jour',
              description: `${item.title} - ${item.amount}€`,
              time: new Date(item.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
              href: '/couple/budget'
            })
          })
        }

        // Récupérer les 3 derniers événements créés/modifiés
        const { data: timelineEvents } = await supabase
          .from('timeline_events')
          .select('id, title, event_date, updated_at')
          .eq('couple_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(3)

        if (timelineEvents && timelineEvents.length > 0) {
          timelineEvents.forEach((event) => {
            allNotifications.push({
              id: event.id,
              type: 'timeline',
              title: 'Événement mis à jour',
              description: event.title,
              time: new Date(event.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
              href: '/couple/timeline'
            })
          })
        }
      } else if (userRole === 'prestataire') {
        // Notifications pour les prestataires
        // Récupérer les nouvelles demandes (requests)
        const { data: requests } = await supabase
          .from('requests')
          .select('id, initial_message, created_at, status')
          .eq('provider_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(3)

        if (requests && requests.length > 0) {
          requests.forEach((request) => {
            allNotifications.push({
              id: request.id,
              type: 'message',
              title: 'Nouvelle demande',
              description: request.initial_message || 'Nouvelle demande reçue',
              time: new Date(request.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
              href: '/prestataire/demandes-recues'
            })
          })
        }

        // Messages désactivés temporairement
      }

      // Trier par date et prendre les 3 plus récents
      allNotifications.sort((a, b) => {
        const dateA = new Date(a.time).getTime()
        const dateB = new Date(b.time).getTime()
        return dateB - dateA
      })

      setNotifications(allNotifications.slice(0, 3))
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      window.location.href = '/'
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Si on est dans le dashboard prestataire, on filtre les éléments de la page
      const isPrestataire = pathname?.startsWith('/prestataire')
      
      if (isPrestataire) {
        // Pour le dashboard prestataire, on stocke la recherche dans le sessionStorage
        // et on déclenche un événement personnalisé pour que la page puisse filtrer
        sessionStorage.setItem('prestataire_search_query', searchQuery)
        window.dispatchEvent(new CustomEvent('prestataire-search', { detail: searchQuery }))
        setIsSearchOpen(false)
        // Ne pas vider la recherche pour qu'elle reste visible
      } else {
        // Pour le couple, rediriger vers la page de recherche
        router.push(`/couple/recherche?q=${encodeURIComponent(searchQuery)}`)
        setIsSearchOpen(false)
        setSearchQuery('')
      }
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />
      case 'budget':
        return <Wallet className="h-4 w-4" />
      case 'timeline':
        return <Calendar className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 bg-white pl-6 pr-4 md:pr-6 lg:pr-8 py-3 md:py-4 border-b border-[#E5E7EB]"
    >
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div className="flex items-center gap-2">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="flex items-center gap-2 text-sm text-[#1F2937]">
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="flex items-center gap-2">
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-[#823F91] transition-colors">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-[#0B0E12] font-medium">{crumb.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 && <span>/</span>}
                </span>
              ))}
            </nav>
          ) : (
            <h1 className="text-xl md:text-2xl font-bold text-[#0B0E12]">{pageTitle}</h1>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Search Popover */}
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <div
              onMouseEnter={() => setIsSearchOpen(true)}
              onMouseLeave={() => setIsSearchOpen(false)}
              className="relative"
            >
              <PopoverTrigger asChild>
                <button
                  className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-[#823F91]/10 hover:to-[#9D5FA8]/10 transition-all"
                  title="Recherche"
                >
                  <Search className="h-5 w-5 text-[#1F2937] hover:text-[#823F91] transition-colors" />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 p-4" 
                align="end"
                onMouseEnter={() => setIsSearchOpen(true)}
                onMouseLeave={() => setIsSearchOpen(false)}
              >
                <form onSubmit={handleSearch} className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white px-4 py-2 rounded-lg hover:from-[#6D3478] hover:to-[#823F91] transition-all text-sm font-medium shadow-lg shadow-[#823F91]/30"
                  >
                    Rechercher
                  </button>
                </form>
              </PopoverContent>
            </div>
          </Popover>

          {/* Notifications Popover */}
          <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
            <div
              onMouseEnter={() => setIsNotificationsOpen(true)}
              onMouseLeave={() => setIsNotificationsOpen(false)}
              className="relative"
            >
              <PopoverTrigger asChild>
                <button
                  className="relative p-2 rounded-lg hover:bg-gradient-to-r hover:from-[#823F91]/10 hover:to-[#9D5FA8]/10 transition-all"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5 text-[#1F2937] hover:text-[#823F91] transition-colors" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-gradient-to-r from-[#823F91] to-[#9D5FA8] rounded-full shadow-md shadow-[#823F91]/50" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 p-0" 
                align="end"
                onMouseEnter={() => setIsNotificationsOpen(true)}
                onMouseLeave={() => setIsNotificationsOpen(false)}
              >
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-[#6B7280]">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Aucune notification</p>
                  </div>
                ) : (
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-[#0B0E12]">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-[#E8D4EF]/50 transition-colors border-b border-gray-100 last:border-b-0 cursor-default"
                        >
                          <div className={`mt-1 ${
                            notif.type === 'message' ? 'text-blue-500' :
                            notif.type === 'budget' ? 'text-green-500' :
                            'text-purple-500'
                          }`}>
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#0B0E12] truncate">
                              {notif.title}
                            </p>
                            <p className="text-xs text-[#374151] truncate mt-1">
                              {notif.description}
                            </p>
                            <p className="text-xs text-[#9CA3AF] mt-1">{notif.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </PopoverContent>
            </div>
          </Popover>

          {/* User profile */}
          {profile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-gradient-to-r hover:from-[#823F91]/10 hover:to-[#9D5FA8]/10 transition-all">
                  <UserAvatar
                    src={photoUrl}
                    fallback={
                      userRole === 'couple' && profile.partner_1_name && profile.partner_2_name
                        ? `${profile.partner_1_name[0] || ''}${profile.partner_2_name[0] || ''}`.trim() || user?.email?.[0]?.toUpperCase() || 'U'
                        : userRole === 'couple' && profile.partner_1_name
                        ? profile.partner_1_name[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                        : `${profile.prenom || ''} ${profile.nom || ''}`.trim() || user?.email?.[0]?.toUpperCase() || 'U'
                    }
                    size="md"
                    status="online"
                  />
                  <span className="text-sm text-[#5C2B66] hidden md:block font-medium">
                    {userRole === 'couple' && profile.displayName
                      ? profile.displayName
                      : `${profile.prenom || ''} ${profile.nom || ''}`.trim() || user?.email?.split('@')[0] || 'Utilisateur'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 !bg-gradient-to-br !from-[#823F91]/10 !via-[#9D5FA8]/10 !to-white border-[#823F91]/20 backdrop-blur-sm">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-[#0B0E12]">
                    {userRole === 'couple' && profile.displayName
                      ? profile.displayName
                      : `${profile.prenom || ''} ${profile.nom || ''}`.trim() || user?.email?.split('@')[0] || 'Utilisateur'}
                  </p>
                  <p className="text-xs text-[#4B5563] truncate">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    const profilePath = userRole === 'couple' ? '/couple/profil' : '/prestataire/profil-public'
                    router.push(profilePath)
                  }}
                  className="cursor-pointer"
                >
                  <User className="h-4 w-4 mr-2" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.header>
  )
}

