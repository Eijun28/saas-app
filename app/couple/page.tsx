'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CouplePage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/couple/dashboard')
  }, [router])

  return null
}
