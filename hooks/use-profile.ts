'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id?: string
  user_id?: string
  role: 'couple' | 'prestataire'
  prenom?: string | null
  nom?: string | null
  email?: string | null
  [key: string]: any // Pour les autres champs spécifiques à chaque type
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Erreur session:', sessionError)
          setProfile(null)
          setLoading(false)
          return
        }

        if (!session?.user) {
          console.log('Pas de session utilisateur')
          setProfile(null)
          setLoading(false)
          return
        }

        // D'abord, vérifier si c'est un couple (table couples)
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (coupleData && !coupleError) {
          // C'est un couple
          setProfile({ ...coupleData, role: 'couple' })
          setLoading(false)
          return
        }

        // Si ce n'est pas un couple, vérifier si c'est un prestataire (table profiles)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          // Si c'est PGRST116, aucun profil trouvé (normal pour nouveau user)
          if (profileError.code === 'PGRST116') {
            console.log('Aucun profil trouvé - nouveau utilisateur')
            setProfile(null)
            setLoading(false)
            return
          }

          console.error('Erreur récupération profil:', profileError)
          setProfile(null)
          setLoading(false)
          return
        }

        if (profileData) {
          // C'est un prestataire
          setProfile({ ...profileData, role: profileData.role || 'prestataire' })
          setLoading(false)
          return
        }

        // Si aucun profil trouvé
        setProfile(null)
        setLoading(false)

      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error)
        setProfile(null)
        setLoading(false)
      }
    }

    loadProfile()

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadProfile()
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { profile, loading }
}

