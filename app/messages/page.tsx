'use client'

import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useUser } from '@/hooks/use-user'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export const dynamic = 'force-dynamic'

export default function MessagesPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, userLoading, router])

  if (userLoading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-center h-screen">
        <Card className="border-gray-200">
          <CardContent className="pt-12 pb-12 text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Messagerie en cours de développement
            </h3>
            <p className="text-gray-500">
              Cette fonctionnalité sera disponible prochainement
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
