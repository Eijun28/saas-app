'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User, ChevronUp, ChevronDown } from 'lucide-react'
import { UserAvatar } from '@/components/ui/user-avatar'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { signOut } from '@/lib/auth/actions'

interface SidebarUserMenuProps {
  role: 'couple' | 'prestataire'
}

export function SidebarUserMenu({ role }: SidebarUserMenuProps) {
  const router = useRouter()
  const { user } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [coupleData, setCoupleData] = useState<{
    partner_1_name: string | null
    partner_2_name: string | null
    avatar_url: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const loadCoupleData = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('couples')
        .select('partner_1_name, partner_2_name, avatar_url')
        .eq('user_id', user.id)
        .single()

      if (!error && data) {
        setCoupleData({
          partner_1_name: data.partner_1_name,
          partner_2_name: data.partner_2_name,
          avatar_url: data.avatar_url,
        })
      }
    } catch (error) {
      console.error('Erreur chargement données couple:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user && role === 'couple') {
      loadCoupleData()
    } else if (user && role !== 'couple') {
      setLoading(false)
    }
  }, [user, role, loadCoupleData])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleProfileClick = () => {
    setIsOpen(false)
    router.push(`/${role}/profil`)
  }

  if (!user) {
    return null
  }

  const displayName = role === 'couple' && coupleData
    ? (() => {
        const name1 = coupleData.partner_1_name || ''
        const name2 = coupleData.partner_2_name || ''
        if (name1 && name2) {
          return `${name1} & ${name2}`
        } else if (name1) {
          return name1
        } else if (name2) {
          return name2
        }
        return user.email?.split('@')[0] || 'Couple'
      })()
    : user.email?.split('@')[0] || 'Utilisateur'

  const avatarUrl = role === 'couple' && coupleData?.avatar_url
    ? coupleData.avatar_url
    : null

  const avatarFallback = role === 'couple' && coupleData
    ? `${coupleData.partner_1_name?.[0] || ''}${coupleData.partner_2_name?.[0] || ''}`.trim() || user.email?.[0]?.toUpperCase() || 'U'
    : user.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className="relative border-t border-[#E5E7EB] p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#F9FAFB] transition-colors"
      >
        <UserAvatar
          src={avatarUrl}
          fallback={avatarFallback}
          size="sm"
          className="flex-shrink-0"
        />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-[#111827] truncate">
            {displayName}
          </p>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-[#6B7280] flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#6B7280] flex-shrink-0" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-[#E5E7EB] z-20 overflow-hidden">
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#374151] hover:bg-[#E8D4EF] transition-colors text-left"
            >
              <User className="h-4 w-4" />
              Profil
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#374151] hover:bg-[#E8D4EF] transition-colors border-t border-[#E5E7EB] text-left"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </>
      )}
    </div>
  )
}

