'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Heart, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingRolePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<'couple' | 'prestataire' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRoleSelect = async (role: 'couple' | 'prestataire') => {
    setIsLoading(role)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/sign-in')
        return
      }

      const res = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Erreur lors de la création du profil')
      }

      router.push(role === 'couple' ? '/couple/dashboard' : '/prestataire/onboarding')
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue, veuillez réessayer.')
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-[#823F91]" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#823F91] to-[#B855D6] bg-clip-text text-transparent">
            Bienvenue sur NUPLY
          </h1>
        </div>
        <p className="text-neutral-500 mb-8 text-sm">
          Une dernière étape — dites-nous qui vous êtes pour accéder à votre espace.
        </p>

        <div className="flex flex-col gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoleSelect('couple')}
            disabled={!!isLoading}
            className="flex items-center gap-4 w-full p-5 rounded-2xl border-2 border-purple-100 bg-white hover:border-[#823F91] hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <span className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 text-white shrink-0">
              <Heart className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-neutral-800">Je suis un couple</p>
              <p className="text-xs text-neutral-500 mt-0.5">Organisez votre mariage de rêve</p>
            </div>
            {isLoading === 'couple' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="ml-auto h-5 w-5 border-2 border-[#823F91] border-t-transparent rounded-full"
              />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoleSelect('prestataire')}
            disabled={!!isLoading}
            className="flex items-center gap-4 w-full p-5 rounded-2xl border-2 border-purple-100 bg-white hover:border-[#823F91] hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <span className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-[#823F91] to-[#B855D6] text-white shrink-0">
              <Building2 className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-neutral-800">Je suis un prestataire</p>
              <p className="text-xs text-neutral-500 mt-0.5">Développez votre activité mariage</p>
            </div>
            {isLoading === 'prestataire' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="ml-auto h-5 w-5 border-2 border-[#823F91] border-t-transparent rounded-full"
              />
            )}
          </motion.button>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}
