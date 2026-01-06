'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log l'erreur pour le debugging
    console.error('Erreur application:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full"
      >
        <Card className="border-[#823F91]/20 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-[#823F91]/20 to-[#9D5FA8]/20 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-[#823F91]" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent">
              Oups ! Une erreur est survenue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-[#4A4A4A]">
              {error.message || 'Une erreur inattendue s\'est produite. Veuillez réessayer.'}
            </p>
            
            {process.env.NODE_ENV === 'development' && error.digest && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-mono text-gray-600">
                  Digest: {error.digest}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={reset}
                className="flex-1 bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1 border-[#823F91]/20 hover:bg-[#823F91]/10"
              >
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Retour à l'accueil
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

