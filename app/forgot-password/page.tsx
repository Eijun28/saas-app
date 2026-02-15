'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Particles from '@/components/Particles'

const forgotPasswordSchema = z.object({
  email: z.string().email('Veuillez entrer une adresse email valide'),
})

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reduce particle count on mobile for performance
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const particleCount = isMobile ? 50 : 200

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })

      if (!res.ok) {
        setError('Une erreur est survenue. Veuillez réessayer.')
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
        <Particles
          particleCount={particleCount}
          particleSpread={10}
          speed={0.24}
          particleColors={["#823F91","#c081e3","#823F91"]}
          moveParticlesOnHover={false}
          particleHoverFactor={1}
          alphaParticles={false}
          particleBaseSize={50}
          sizeRandomness={0.5}
          cameraDistance={20}
          disableRotation={false}
          className=""
        />
      </div>

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-24 bg-background relative z-10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#823F91]/[0.03] to-transparent rounded-full blur-3xl" />
        </div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="relative w-full max-w-full sm:max-w-md"
        >
          <Card className="bg-white border-0 shadow-2xl shadow-purple-500/20 ring-1 ring-purple-200/50 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-purple-400/20 to-pink-300/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-purple-500/15 to-violet-300/15 rounded-full blur-3xl pointer-events-none" />

            <CardHeader className="text-center space-y-3 pb-2 relative z-10">
              <CardTitle className="text-2xl font-semibold bg-gradient-to-r from-[#823F91] to-[#B855D6] bg-clip-text text-transparent tracking-tight">
                {isSuccess ? 'Email envoyé !' : 'Mot de passe oublié ?'}
              </CardTitle>
              <CardDescription className="text-[#6B7280] text-sm sm:text-[15px] leading-relaxed px-2">
                {isSuccess
                  ? 'Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.'
                  : 'Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 relative z-10">
              {isSuccess ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-5"
                >
                  <motion.div
                    variants={itemVariants}
                    className="p-4 bg-green-50 border border-green-100 rounded-xl text-center"
                  >
                    <p className="text-sm text-green-700">
                      Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation dans quelques instants.
                    </p>
                  </motion.div>

                  <motion.div variants={itemVariants} className="pt-1">
                    <Link
                      href="/sign-in"
                      className="group relative flex items-center justify-center gap-2 w-full h-12 min-h-[44px] rounded-xl bg-gradient-to-r from-[#823F91] via-[#9D5FA8] to-[#B855D6] font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 text-sm sm:text-base"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Retour à la connexion
                    </Link>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.form
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-[#374151]">
                      Adresse email
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#9CA3AF] transition-colors group-focus-within:text-[#823F91]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        {...register('email')}
                        className="h-12 pl-11 pr-4 border-[#E5E7EB] bg-[#FAFAFA] rounded-xl text-base sm:text-[15px] placeholder:text-[#9CA3AF] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#823F91]/20 focus-visible:border-[#823F91] focus-visible:bg-white hover:border-[#D1D5DB]"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500 pl-1"
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </motion.div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="p-3.5 bg-red-50 border border-red-100 rounded-xl"
                    >
                      <p className="text-sm text-red-600 text-center">{error}</p>
                    </motion.div>
                  )}

                  <motion.div variants={itemVariants} className="pt-1">
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      className="group relative w-full h-12 sm:h-12 min-h-[44px] rounded-xl bg-gradient-to-r from-[#823F91] via-[#9D5FA8] to-[#B855D6] font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                            />
                            Envoi en cours...
                          </>
                        ) : (
                          'Envoyer le lien de réinitialisation'
                        )}
                      </span>
                    </motion.button>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-center gap-1.5 text-[13px] text-[#9CA3AF]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Connexion sécurisée et données protégées</span>
                  </motion.div>

                  <motion.div variants={itemVariants} className="pt-2">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#E5E7EB]" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-white text-[#9CA3AF]">Vous vous souvenez ?</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.p variants={itemVariants} className="text-center text-[15px] text-[#6B7280]">
                    <Link
                      href="/sign-in"
                      className="text-[#823F91] hover:text-[#6D3478] font-medium transition-colors inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Retour à la connexion
                    </Link>
                  </motion.p>
                </motion.form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  )
}
