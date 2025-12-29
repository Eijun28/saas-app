'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserAvatar } from '@/components/ui/user-avatar'

interface PrestataireAvatarProps {
  userId?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showStatus?: boolean
  className?: string
}

export function PrestataireAvatar({
  userId,
  size = 'md',
  showStatus = false,
  className
}: PrestataireAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [fallback, setFallback] = useState<string>('P')

  useEffect(() => {
    const loadAvatar = async () => {
      if (!userId) return

      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, prenom, nom')
        .eq('id', userId)
        .single()

      if (data) {
        setAvatarUrl(data.avatar_url)
        const initials = `${data.prenom || ''}${data.nom || ''}`.trim()
        setFallback(initials ? initials[0].toUpperCase() : 'P')
      }
    }

    loadAvatar()

    // Écouter les mises à jour d'avatar
    const handleAvatarUpdate = () => loadAvatar()
    window.addEventListener('avatar-updated', handleAvatarUpdate)
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdate)
  }, [userId])

  // Si pas d'avatar, utiliser le gradient violet avec initiales
  if (!avatarUrl) {
    return (
      <div className={`relative inline-block ${className || ''}`}>
        <div className={`rounded-full bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center text-white font-semibold shadow-lg ${
          size === 'sm' ? 'w-8 h-8 text-sm' :
          size === 'md' ? 'w-12 h-12 text-base' :
          size === 'lg' ? 'w-14 h-14 text-xl' :
          'w-24 h-24 text-2xl'
        }`}>
          {fallback}
        </div>
        {showStatus && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>
    )
  }

  return (
    <UserAvatar
      src={avatarUrl}
      fallback={fallback}
      size={size}
      status={showStatus ? 'online' : undefined}
      className={className}
    />
  )
}

