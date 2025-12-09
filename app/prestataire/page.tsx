'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'

export default function PrestatairePage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/prestataire/dashboard')
  }, [router])

  return <LoadingSpinner size="md" text="Redirection..." />
}
