'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'

interface NavProfile {
  role: 'couple' | 'prestataire'
  prenom: string
}

/**
 * Hook léger pour les composants de navigation (navbar publique).
 * Utilise useUser() (cache singleton) et ne fait qu'une seule query DB pour le rôle.
 */
export function useNavAuth() {
  const { user, loading: userLoading } = useUser()
  const [profile, setProfile] = useState<NavProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    let cancelled = false
    setProfileLoading(true)

    const supabase = createClient()

    // Query les deux tables en parallèle — une seule fois
    Promise.all([
      supabase.from('couples').select('partner_1_name').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('prenom, role').eq('id', user.id).maybeSingle(),
    ]).then(([coupleResult, profileResult]) => {
      if (cancelled) return

      if (coupleResult.data) {
        const name = coupleResult.data.partner_1_name || ''
        setProfile({
          role: 'couple',
          prenom: name.split(' ')[0] || '',
        })
      } else if (profileResult.data) {
        setProfile({
          role: 'prestataire',
          prenom: profileResult.data.prenom || '',
        })
      } else {
        setProfile(null)
      }
      setProfileLoading(false)
    }).catch(() => {
      if (!cancelled) {
        setProfile(null)
        setProfileLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [user])

  return {
    user,
    profile,
    loading: userLoading || profileLoading,
    dashboardUrl: profile?.role === 'couple' ? '/couple/dashboard' : '/prestataire/dashboard',
  }
}
