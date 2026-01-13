'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/auth/actions'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, PanelLeft, PanelLeftClose } from 'lucide-react'

export function CoupleHeader() {
  const { user } = useUser()
  const { openMobile, setOpenMobile, isMobile } = useSidebar()
  const [profile, setProfile] = useState<{
    name?: string
    email?: string
    avatar?: string
  } | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      const supabase = createClient()

      // Récupérer le profil du couple
      const { data: coupleData } = await supabase
        .from('couples')
        .select('partner_1_name, partner_2_name, avatar_url')
        .eq('user_id', user.id)
        .single()

      if (coupleData) {
        const name1 = coupleData.partner_1_name || ''
        const name2 = coupleData.partner_2_name || ''
        const displayName = name1 && name2 ? `${name1} & ${name2}` : name1 || name2 || 'Couple'
        
        setProfile({
          name: displayName,
          email: user.email || '',
          avatar: coupleData.avatar_url || undefined
        })
      } else {
        setProfile({
          name: 'Couple',
          email: user.email || '',
          avatar: undefined
        })
      }
    }

    loadProfile()
  }, [user])

  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      window.location.href = '/'
    }
  }

  return (
    <header className='h-[4.5rem] md:h-16 bg-white/95 backdrop-blur-md sticky top-0 z-[100] border-b border-[#E5E7EB] w-full shadow-md shadow-black/5 flex items-center'>
      <div className='w-full flex items-center justify-between gap-6 px-5 sm:px-6 relative z-[101]'>
        {/* ✅ Sidebar toggle button - MOBILE uniquement */}
        <div className='md:hidden'>
          <Button
            variant='ghost'
            size='icon'
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (process.env.NODE_ENV === 'development') {
                console.log('🔵 Toggle mobile couple - openMobile:', openMobile)
              }
              setOpenMobile(!openMobile)
            }}
            className={cn(
              'h-10 w-10 rounded-xl transition-all duration-200 flex-shrink-0',
              'hover:bg-gray-100',
              'focus-visible:ring-2 focus-visible:ring-[#823F91] focus-visible:ring-offset-2'
            )}
            style={{ pointerEvents: 'auto' }}
            aria-label={openMobile ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {openMobile ? (
              <PanelLeftClose className='h-6 w-6 text-black' strokeWidth={2.5} />
            ) : (
              <PanelLeft className='h-6 w-6 text-black' strokeWidth={2.5} />
            )}
          </Button>
        </div>

        {/* Avatar - aligné à droite */}
        <div className="relative z-[103] ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className='h-auto gap-2 px-2 py-1.5 flex items-center cursor-pointer hover:opacity-80 transition-opacity'>
                <Avatar className='h-9 w-9 rounded-xl'>
                  <AvatarImage src={profile?.avatar} alt={profile?.name} />
                  <AvatarFallback className='bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white font-semibold'>
                    {profile?.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'C'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/couple/profil" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  <span>Profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

