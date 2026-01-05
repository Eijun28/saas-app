'use client'

import { Bell, Inbox, Calendar, MessageSquare } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/auth/actions'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

import ProfileDropdown from '@/components/shadcn-studio/blocks/dropdown-profile'

const getBreadcrumbs = (pathname: string) => {
  const paths = pathname.split('/').filter(Boolean)
  const breadcrumbs: Array<{ label: string; href?: string }> = []

  // Page d'accueil
  breadcrumbs.push({ label: 'Home', href: '/prestataire/dashboard' })

  if (paths.length > 1) {
    const page = paths[1]
    const pageLabels: Record<string, string> = {
      dashboard: 'Dashboard',
      'demandes-recues': 'Demandes reçues',
      agenda: 'Agenda',
      messagerie: 'Messagerie',
      'profil-public': 'Profil public',
      demandes: 'Demandes'
    }

    if (pageLabels[page]) {
      if (paths.length === 2) {
        breadcrumbs.push({ label: pageLabels[page] })
      } else {
        breadcrumbs.push({ label: pageLabels[page], href: `/prestataire/${page}` })
        breadcrumbs.push({ label: 'Détails' })
      }
    }
  }

  return breadcrumbs
}

export function PrestataireHeader() {
  const pathname = usePathname()
  const { user } = useUser()
  const [profile, setProfile] = useState<{
    name?: string
    email?: string
    avatar?: string
  } | null>(null)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'demande' | 'evenement' | 'message'
    title: string
    message: string
    date: string
    link?: string
  }>>([])
  const breadcrumbs = getBreadcrumbs(pathname || '')

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      const supabase = createClient()

      // Récupérer le profil du prestataire
      const { data: profileData } = await supabase
        .from('profiles')
        .select('prenom, nom, email, avatar_url')
        .eq('id', user.id)
        .single()

      if (profileData) {
        const fullName = [profileData.prenom, profileData.nom].filter(Boolean).join(' ') || 'Prestataire'
        setProfile({
          name: fullName,
          email: profileData.email || user.email || '',
          avatar: profileData.avatar_url || undefined
        })
      } else {
        setProfile({
          name: 'Prestataire',
          email: user.email || '',
          avatar: undefined
        })
      }
    }

    loadProfile()
  }, [user])

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return

      const supabase = createClient()
      const notificationsList: Array<{
        id: string
        type: 'demande' | 'evenement' | 'message'
        title: string
        message: string
        date: string
        link?: string
      }> = []

      try {
        // Récupérer les nouvelles demandes
        const { data: demandes } = await supabase
          .from('demandes')
          .select('id, created_at, couple_id, profiles!demandes_couple_id_fkey(nom)')
          .eq('prestataire_id', user.id)
          .eq('status', 'new')
          .order('created_at', { ascending: false })
          .limit(5)

        if (demandes) {
          demandes.forEach((demande: any) => {
            const coupleNom = demande.profiles?.nom || 'un couple'
            notificationsList.push({
              id: demande.id,
              type: 'demande',
              title: 'Nouvelle demande',
              message: `Nouvelle demande de ${coupleNom}`,
              date: demande.created_at,
              link: '/prestataire/demandes-recues'
            })
          })
        }

        // Récupérer les événements à venir
        const { data: evenements } = await supabase
          .from('events')
          .select('id, title, date, time')
          .eq('prestataire_id', user.id)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(5)

        if (evenements) {
          evenements.forEach((evenement: any) => {
            notificationsList.push({
              id: evenement.id,
              type: 'evenement',
              title: 'Événement à venir',
              message: evenement.title || 'Événement prévu',
              date: `${evenement.date}T${evenement.time}`,
              link: '/prestataire/agenda'
            })
          })
        }

        // Récupérer les messages non lus
        // D'abord récupérer les conversations du prestataire
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id, couple_id, profiles!conversations_couple_id_fkey(nom)')
          .eq('prestataire_id', user.id)

        if (conversations && conversations.length > 0) {
          const conversationIds = conversations.map(c => c.id)
          
          // Récupérer les messages non lus dans ces conversations où le sender n'est pas le prestataire
          const { data: messages } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id, conversation_id')
            .in('conversation_id', conversationIds)
            .neq('sender_id', user.id)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(5)

          if (messages) {
            messages.forEach((message: any) => {
              const conversation: any = conversations.find(c => c.id === message.conversation_id)
              const coupleNom = conversation?.profiles?.nom || 'Un couple'
              notificationsList.push({
                id: message.id,
                type: 'message',
                title: 'Nouveau message',
                message: `${coupleNom}: ${message.content?.substring(0, 50)}...`,
                date: message.created_at,
                link: '/prestataire/messagerie'
              })
            })
          }
        }

        // Trier par date (plus récent en premier)
        notificationsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setNotifications(notificationsList.slice(0, 10))
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error)
      }
    }

    loadNotifications()
    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // En cas d'erreur, rediriger quand même vers la landing page
      window.location.href = '/'
    }
  }

  return (
    <header className='h-16 bg-white sticky top-0 z-50 border-b border-[#E5E7EB] w-full shadow-sm flex items-center'>
      <div className='w-full flex items-center justify-between gap-6 px-4 sm:px-6'>
        <div className='flex items-center gap-4'>
          <SidebarTrigger className='[&_svg]:!size-5' />
          <Separator orientation='vertical' className='hidden h-6 sm:block bg-[#823F91]' />
          <Breadcrumb className='hidden sm:block'>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className='flex items-center'>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.href ? (
                      <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
              <div className='flex items-center gap-3'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon'>
                      <Bell className='size-5' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-80'>
                    <div className='p-2'>
                      <div className='px-2 py-1.5 text-sm font-semibold'>Notifications</div>
                      <div className='max-h-96 overflow-y-auto'>
                        {notifications.length === 0 ? (
                          <div className='px-2 py-8 text-center text-sm text-muted-foreground'>
                            Aucune notification
                          </div>
                        ) : (
                          notifications.map((notification) => {
                            const Icon = notification.type === 'demande' ? Inbox :
                                         notification.type === 'evenement' ? Calendar : MessageSquare
                            return (
                              <DropdownMenuItem
                                key={notification.id}
                                className='flex items-start gap-3 p-3 cursor-pointer'
                                onClick={() => {
                                  if (notification.link) {
                                    window.location.href = notification.link
                                  }
                                }}
                              >
                                <div className='mt-0.5'>
                                  <Icon className='h-4 w-4 text-[#823F91]' />
                                </div>
                                <div className='flex-1 min-w-0'>
                                  <div className='text-sm font-medium'>{notification.title}</div>
                                  <div className='text-xs text-muted-foreground truncate'>
                                    {notification.message}
                                  </div>
                                  <div className='text-xs text-muted-foreground mt-1'>
                                    {new Date(notification.date).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </DropdownMenuItem>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ProfileDropdown
                  trigger={
                    <Button variant='ghost' className='h-auto gap-2 px-2 py-1.5'>
                      <Avatar className='h-9 w-9 rounded-md'>
                        <AvatarImage src={profile?.avatar} alt={profile?.name} />
                        <AvatarFallback>
                          {profile?.name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <span className='hidden sm:block text-sm font-medium text-gray-700'>
                        {profile?.name || 'Prestataire'}
                      </span>
                    </Button>
                  }
                  user={profile || undefined}
                  onLogout={handleLogout}
                />
              </div>
      </div>
    </header>
  )
}

