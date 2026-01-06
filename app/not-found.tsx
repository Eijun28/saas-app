'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function NotFound() {
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
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto mb-4"
            >
              <div className="text-6xl font-bold text-[#823F91]">404</div>
            </motion.div>
            <CardTitle className="text-2xl text-[#0D0D0D]">
              Page introuvable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-[#4A4A4A]">
              Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button
                  className="w-full sm:w-auto bg-[#823F91] hover:bg-[#6A1FA8] text-white"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full sm:w-auto border-[#823F91] text-[#823F91] hover:bg-[#E8D4EF]"
                onClick={() => window.history.back()}
              >
                <Search className="h-4 w-4 mr-2" />
                Retour en arrière
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
