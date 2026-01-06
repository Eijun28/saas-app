'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center"
      >
        <Card className="border-[#823F91]/20 shadow-lg">
          <CardHeader>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4 h-24 w-24 rounded-full bg-gradient-to-br from-[#823F91]/20 to-[#9D5FA8]/20 flex items-center justify-center"
            >
              <span className="text-5xl font-bold text-[#823F91]">404</span>
            </motion.div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent">
              Page non trouvée
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[#4A4A4A]">
              Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                asChild
                className="flex-1 bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white"
              >
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Retour à l'accueil
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1 border-[#823F91]/20 hover:bg-[#823F91]/10"
              >
                <Link href="/couple/dashboard">
                  <Search className="h-4 w-4 mr-2" />
                  Aller au dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

