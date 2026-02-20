"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

// Module-level singleton cache — shared across all hook instances.
// Eliminates redundant getUser() network calls on every page mount.
let _cachedUser: User | null = null
let _cacheReady = false
let _pendingPromise: Promise<User | null> | null = null
const _listeners = new Set<(user: User | null) => void>()

function notifyListeners(user: User | null) {
  _listeners.forEach((fn) => fn(user))
}

function resolveUser(): Promise<User | null> {
  if (_cacheReady) return Promise.resolve(_cachedUser)
  if (_pendingPromise) return _pendingPromise

  _pendingPromise = createClient()
    .auth.getUser()
    .then(({ data: { user }, error }) => {
      if (error && !error.message?.includes("Auth session missing")) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error)
      }
      _cachedUser = error ? null : user
      _cacheReady = true
      _pendingPromise = null
      return _cachedUser
    })
    .catch(() => {
      _cacheReady = true
      _pendingPromise = null
      return null
    })

  return _pendingPromise
}

export function useUser() {
  const [user, setUser] = useState<User | null>(_cachedUser)
  const [loading, setLoading] = useState(!_cacheReady)

  useEffect(() => {
    // If already resolved, skip the async call entirely
    if (_cacheReady) {
      setUser(_cachedUser)
      setLoading(false)
    } else {
      resolveUser().then((u) => {
        setUser(u)
        setLoading(false)
      })
    }

    // Subscribe to future auth changes
    const listener = (u: User | null) => {
      setUser(u)
      setLoading(false)
    }
    _listeners.add(listener)

    // Set up auth state change listener once globally
    if (_listeners.size === 1) {
      const supabase = createClient()
      supabase.auth.onAuthStateChange((_event, session) => {
        _cachedUser = session?.user ?? null
        _cacheReady = true
        notifyListeners(_cachedUser)
      })
    }

    return () => {
      _listeners.delete(listener)
    }
  }, [])

  return { user, loading }
}
