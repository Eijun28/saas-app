'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createBrowserClient } from '@supabase/ssr'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const Particles = dynamic(() => import('@/components/Particles'), { ssr: false })

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pageState, setPageState] = useState<'loading' | 'ready' | 'expired'>('loading')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const password = watch('password', '')

  // Reduce particle count on mobile for performance
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const particleCount = isMobile ? 50 : 200

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    let resolved = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && !resolved) {
        resolved = true
        setPageState('ready')
      }
    })

    // Vérifier si une session existe déjà
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !resolved) {
        resolved = true
        setPageState('ready')
      }
    })

    // Timeout après 5 secondes : le lien est invalide ou expiré
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        setPageState('expired')
      }
    }, 5000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        setError('Une erreur est survenue. Veuillez réessayer ou demander un nouveau lien.')
        setIsLoading(false)
        return
      }

      router.push('/sign-in?message=password_updated')
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const particlesBlock = (
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
  )

  if (pageState === 'loading') {
    return (
      <>
        {particlesBlock}
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-24 bg-background relative z-10">
          <Card className="bg-white border-0 shadow-2xl shadow-purple-500/20 ring-1 ring-purple-200/50 relative overflow-hidden w-full max-w-md">
            <CardHeader className="text-center space-y-3 pb-2">
              <CardTitle className="text-2xl font-semibold bg-gradient-to-r from-[#823F91] to-[#B855D6] bg-clip-text text-transparent">
                Vérification en cours...
              </CardTitle>
              <CardDescription className="text-[#6B7280] text-sm sm:text-[15px] leading-relaxed px-2">
                Nous vérifions votre lien de réinitialisation.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-8 w-8 border-[3px] border-[#823F91] border-t-transparent rounded-full inline-block"
              />
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (pageState === 'expired') {
    return (
      <>
        {particlesBlock}
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-24 bg-background relative z-10">
          <motion.div variants={cardVariants} initial="hidden" animate="visible" className="relative w-full max-w-full sm:max-w-md">
            <Card className="bg-white border-0 shadow-2xl shadow-purple-500/20 ring-1 ring-purple-200/50 relative overflow-hidden">
              <CardHeader className="text-center space-y-3 pb-2">
                <CardTitle className="text-2xl font-semibold bg-gradient-to-r from-[#823F91] to-[#B855D6] bg-clip-text text-transparent">
                  Lien expiré ou invalide
                </CardTitle>
                <CardDescription className="text-[#6B7280] text-sm sm:text-[15px] leading-relaxed px-2">
                  Ce lien de réinitialisation n&apos;est plus valide. Veuillez en demander un nouveau.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <Link
                  href="/forgot-password"
                  className="group relative flex items-center justify-center gap-2 w-full h-12 min-h-[44px] rounded-xl bg-gradient-to-r from-[#823F91] via-[#9D5FA8] to-[#B855D6] font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 text-sm sm:text-base"
                >
                  Demander un nouveau lien
                </Link>
                <p className="text-center text-[15px] text-[#6B7280]">
                  <Link href="/sign-in" className="text-[#823F91] hover:text-[#6D3478] font-medium transition-colors inline-flex items-center gap-1">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Retour à la connexion
                  </Link>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      {particlesBlock}
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
                Nouveau mot de passe
              </CardTitle>
              <CardDescription className="text-[#6B7280] text-sm sm:text-[15px] leading-relaxed px-2">
                Choisissez un nouveau mot de passe pour votre compte.
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
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-[#374151]">
                    Nouveau mot de passe
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#9CA3AF] transition-colors group-focus-within:text-[#823F91]" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 caractères"
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
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-500 pl-1">
                      {errors.password.message}
                    </motion.p>
                  )}
                  {password && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-neutral-600 font-medium">Prérequis :</p>
                      <ul className="text-xs text-neutral-500 space-y-0.5 ml-2">
                        <li className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-600' : ''}`}>
                          <span>{password.length >= 8 ? '✓' : '○'}</span>
                          <span>Au moins 8 caractères</span>
                        </li>
                        <li className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-green-600' : ''}`}>
                          <span>{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                          <span>Au moins une majuscule</span>
                        </li>
                        <li className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-green-600' : ''}`}>
                          <span>{/[0-9]/.test(password) ? '✓' : '○'}</span>
                          <span>Au moins un chiffre</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#374151]">
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#9CA3AF] transition-colors group-focus-within:text-[#823F91]" />
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirmez votre mot de passe"
                      {...register('confirmPassword')}
                      className="h-12 pl-11 pr-12 border-[#E5E7EB] bg-[#FAFAFA] rounded-xl text-[15px] placeholder:text-[#9CA3AF] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#823F91]/20 focus-visible:border-[#823F91] focus-visible:bg-white hover:border-[#D1D5DB]"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors p-1 rounded-md hover:bg-[#F3F4F6]"
                      aria-label={showConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showConfirm ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-500 pl-1">
                      {errors.confirmPassword.message}
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
                          Modification en cours...
                        </>
                      ) : (
                        'Modifier mon mot de passe'
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
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  )
}
