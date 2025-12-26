"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Récupérer l'utilisateur initial
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      // Si erreur de session manquante, c'est normal pour les utilisateurs non connectés
      if (error && !error.message?.includes("Auth session missing")) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error)
      }
      setUser(error ? null : user)
      setLoading(false)
    })

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}

