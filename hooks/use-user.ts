"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useUserContext } from "@/lib/context/user-context"

export function useUser() {
  // Try to get user from context (populated by server in couple/prestataire layouts)
  const ctx = useUserContext()

  // Fallback state — only used when outside a UserProvider (public pages, etc.)
  const [fallbackUser, setFallbackUser] = useState<User | null>(null)
  const [fallbackLoading, setFallbackLoading] = useState(ctx === null)

  useEffect(() => {
    // Context is available → already have the user, skip redundant auth call
    if (ctx !== null) return

    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error && !error.message?.includes("Auth session missing")) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error)
      }
      setFallbackUser(error ? null : user)
      setFallbackLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setFallbackUser(session?.user ?? null)
      setFallbackLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [ctx])

  // Context wins — instant, no loading
  if (ctx !== null) return ctx

  return { user: fallbackUser, loading: fallbackLoading }
}
