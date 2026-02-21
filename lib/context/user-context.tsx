'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserContextValue {
  user: User | null
  loading: boolean
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: User | null
}) {
  const [user, setUser] = useState<User | null>(initialUser)

  useEffect(() => {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <UserContext.Provider value={{ user, loading: false }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserContext(): UserContextValue | null {
  return useContext(UserContext)
}
