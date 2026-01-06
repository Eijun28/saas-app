'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInSchema, type SignInInput } from '@/lib/validations/auth.schema'
import { signIn } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

// Animation variants pour une entrée élégante
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

export default function SignInPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn(data.email, data.password)
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      } else if (result?.success && result?.redirectTo) {
        router.push(result.redirectTo)
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-6 py-24 bg-background"
    >
      {/* Subtle decorative gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#823F91]/[0.03] to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md"
      >
        <Card className="bg-white border-0 shadow-2xl shadow-purple-500/20 ring-1 ring-purple-200/50 relative overflow-hidden">
          {/* Reflets violets */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-purple-400/20 to-pink-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-purple-500/15 to-violet-300/15 rounded-full blur-3xl pointer-events-none" />
          <CardHeader className="text-center space-y-3 pb-2 relative z-10">
            <CardTitle className="text-2xl font-semibold bg-gradient-to-r from-[#823F91] to-[#B855D6] bg-clip-text text-transparent tracking-tight">
              Retrouvez votre espace mariage
            </CardTitle>
            <CardDescription className="text-[#6B7280] text-[15px] leading-relaxed">
              Vos préparatifs vous attendent, exactement là où vous les avez laissés.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 relative z-10">
            <motion.form
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >
              {/* Champ Email */}
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
                    className="h-12 pl-11 pr-4 border-[#E5E7EB] bg-[#FAFAFA] rounded-xl text-[15px] placeholder:text-[#9CA3AF] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#823F91]/20 focus-visible:border-[#823F91] focus-visible:bg-white hover:border-[#D1D5DB]"
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

              {/* Champ Mot de passe */}
              <motion.div variants={itemVariants} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-[#374151]">
                    Mot de passe
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-[13px] text-[#823F91] hover:text-[#6D3478] transition-colors font-medium"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#9CA3AF] transition-colors group-focus-within:text-[#823F91]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Votre mot de passe"
                    {...register('password')}
                    className="h-12 pl-11 pr-12 border-[#E5E7EB] bg-[#FAFAFA] rounded-xl text-[15px] placeholder:text-[#9CA3AF] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#823F91]/20 focus-visible:border-[#823F91] focus-visible:bg-white hover:border-[#D1D5DB]"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors p-1 rounded-md hover:bg-[#F3F4F6]"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 pl-1"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Message d'erreur global */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="p-3.5 bg-red-50 border border-red-100 rounded-xl"
                >
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </motion.div>
              )}

              {/* CTA principal */}
              <motion.div variants={itemVariants} className="pt-1">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="group relative w-full h-12 rounded-xl bg-gradient-to-r from-[#823F91] via-[#9D5FA8] to-[#B855D6] font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Connexion en cours...
                      </>
                    ) : (
                      'Accéder à mon espace mariage'
                    )}
                  </span>
                </motion.button>
              </motion.div>

              {/* Micro-reassurance */}
              <motion.div
                variants={itemVariants}
                className="flex items-center justify-center gap-1.5 text-[13px] text-[#9CA3AF]"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Connexion sécurisée et données protégées</span>
              </motion.div>

              {/* Lien inscription */}
              <motion.div variants={itemVariants} className="pt-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E5E7EB]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-[#9CA3AF]">Première visite ?</span>
                  </div>
                </div>
              </motion.div>

              <motion.p variants={itemVariants} className="text-center text-[15px] text-[#6B7280]">
                <Link
                  href="/sign-up"
                  className="text-[#823F91] hover:text-[#6D3478] font-medium transition-colors inline-flex items-center gap-1"
                >
                  Créer votre espace mariage
                  <span aria-hidden="true">→</span>
                </Link>
              </motion.p>
            </motion.form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
