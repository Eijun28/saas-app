'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/auth/actions'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ProfileDropdown from '@/components/shadcn-studio/blocks/dropdown-profile'

export function CoupleHeader() {
  const { user } = useUser()
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
      <div className='w-full flex items-center justify-end gap-6 px-5 sm:px-6 relative z-[101]'>
        <div className="relative z-[103]">
          <ProfileDropdown
            trigger={
              <button className='h-auto gap-2 px-2 py-1.5 flex items-center cursor-pointer'>
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
            }
            user={profile || undefined}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  )
}

