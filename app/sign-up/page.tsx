'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth.schema'
import { z } from 'zod'
import { signUp } from '@/lib/auth/actions'
import { translateAuthError } from '@/lib/auth/error-translations'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LabelInputContainer } from '@/components/ui/label-input-container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ArrowLeft, Mail } from 'lucide-react'
import Particles from '@/components/Particles'
import { OAuthButtons } from '@/components/auth/oauth-buttons'

type Step = 'initial' | 'email' | 'names' | 'company' | 'password'

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setFormError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('initial')
  const router = useRouter()

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const particleCount = isMobile ? 50 : 200

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: 'couple',
      prenom: '',
      nom: '',
      email: '',
      password: '',
      confirmPassword: '',
      nomEntreprise: '',
      siret: '',
    },
    mode: 'onChange',
  })

  const selectedRole = watch('role')
  const password = watch('password')
  const isPrestataire = selectedRole === 'prestataire'

  const emailSteps: Step[] = isPrestataire
    ? ['email', 'names', 'company', 'password']
    : ['email', 'names', 'password']

  const currentStepIndex = emailSteps.indexOf(step)

  const handleBack = () => {
    if (step === 'email') setStep('initial')
    else if (step === 'names') setStep('email')
    else if (step === 'company') setStep('names')
    else if (step === 'password') setStep(isPrestataire ? 'company' : 'names')
  }

  const handleContinueEmail = () => {
    const email = watch('email')
    const result = z.string().min(1, "L'email est requis").email('Email invalide').safeParse(email)
    if (result.success) {
      clearErrors('email')
      setStep('names')
    } else {
      setError('email', { message: result.error.issues[0]?.message ?? 'Email invalide' })
    }
  }

  const handleContinueNames = () => {
    const prenom = watch('prenom')
    const nom = watch('nom')
    const nameSchema = z.string().min(1, 'Requis').min(2, 'Minimum 2 caractères')
    const prenomResult = nameSchema.safeParse(prenom)
    const nomResult = nameSchema.safeParse(nom)
    let valid = true
    if (!prenomResult.success) {
      setError('prenom', { message: prenomResult.error.issues[0]?.message ?? 'Prénom invalide' })
      valid = false
    } else {
      clearErrors('prenom')
    }
    if (!nomResult.success) {
      setError('nom', { message: nomResult.error.issues[0]?.message ?? 'Nom invalide' })
      valid = false
    } else {
      clearErrors('nom')
    }
    if (valid) setStep(isPrestataire ? 'company' : 'password')
  }

  const handleContinueCompany = () => {
    const nomEntreprise = watch('nomEntreprise') ?? ''
    const result = z.string().min(2, "Le nom de l'entreprise est requis (minimum 2 caractères)").safeParse(nomEntreprise)
    if (result.success) {
      clearErrors('nomEntreprise')
      setStep('password')
    } else {
      setError('nomEntreprise', { message: result.error.issues[0]?.message ?? "Nom d'entreprise invalide" })
    }
  }

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true)
    setFormError(null)

    try {
      const result = await signUp(data.email, data.password, data.role, {
        prenom: data.prenom,
        nom: data.nom,
        nomEntreprise: data.nomEntreprise,
        siret: data.siret,
      })

      if (!result) {
        setFormError('Une réponse inattendue a été reçue du serveur. Veuillez réessayer.')
        return
      }

      if ('error' in result && result.error) {
        setFormError(result.error)
      } else if ('success' in result && result.success) {
        let redirectUrl = ('redirectTo' in result && result.redirectTo) ? result.redirectTo : '/auth/confirm'
        if ('emailWarning' in result && result.emailWarning) {
          redirectUrl += `?emailWarning=${encodeURIComponent(String(result.emailWarning))}`
        }
        router.push(redirectUrl)
      } else {
        setFormError('Une réponse inattendue a été reçue du serveur. Veuillez réessayer.')
      }
    } catch (err: any) {
      setFormError(translateAuthError(err?.message))
    } finally {
      setIsLoading(false)
    }
  }

  const stepVariants = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
  }

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-4">
      <button
        type="button"
        onClick={handleBack}
        className="text-neutral-400 hover:text-neutral-600 transition-colors p-1"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-1.5">
        {emailSteps.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                i === currentStepIndex
                  ? 'bg-[#823F91] text-white shadow-sm shadow-purple-500/30'
                  : i < currentStepIndex
                  ? 'bg-[#823F91]/20 text-[#823F91]'
                  : 'bg-neutral-100 text-neutral-400'
              )}
            >
              {i + 1}
            </div>
            {i < emailSteps.length - 1 && (
              <div
                className={cn(
                  'h-px w-4 transition-colors duration-300',
                  i < currentStepIndex ? 'bg-[#823F91]/40' : 'bg-neutral-200'
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="w-6" />
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
        <Particles
          particleCount={particleCount}
          particleSpread={10}
          speed={0.24}
          particleColors={['#823F91', '#c081e3', '#823F91']}
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

      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-24 bg-background relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="w-full max-w-sm flex flex-col gap-4"
        >
          {/* Carte principale */}
          <Card className="bg-white border-0 shadow-2xl shadow-purple-500/20 ring-1 ring-purple-200/50 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-purple-400/20 to-pink-300/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-purple-500/15 to-violet-300/15 rounded-full blur-3xl pointer-events-none" />

            <CardHeader className="space-y-4 pb-4 text-center relative z-10">
              <div className="flex items-center justify-center gap-2">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#823F91] to-[#B855D6] bg-clip-text text-transparent">
                  Créer votre compte
                </CardTitle>
              </div>

              {/* Sélection du rôle */}
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValue('role', 'prestataire', { shouldValidate: false })
                    if (step !== 'initial') setStep('initial')
                  }}
                  className={cn(
                    'px-5 py-2 rounded-full text-sm font-medium transition-all duration-200',
                    selectedRole === 'prestataire'
                      ? 'bg-[#823F91] text-white shadow-md shadow-purple-500/20'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  )}
                >
                  Prestataire
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('role', 'couple', { shouldValidate: false })
                    if (step !== 'initial') setStep('initial')
                  }}
                  className={cn(
                    'px-5 py-2 rounded-full text-sm font-medium transition-all duration-200',
                    selectedRole === 'couple'
                      ? 'bg-[#823F91] text-white shadow-md shadow-purple-500/20'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  )}
                >
                  Couple
                </button>
              </div>
              <input type="hidden" {...register('role')} />
            </CardHeader>

            <CardContent className="relative z-10 pb-6">
              <form
                onSubmit={(e) => {
                  if (step !== 'password') {
                    e.preventDefault()
                    return
                  }
                  handleSubmit(onSubmit)(e)
                }}
              >
                <AnimatePresence mode="wait">
                  {/* Étape initiale : Google + email */}
                  {step === 'initial' && (
                    <motion.div
                      key="initial"
                      variants={stepVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <OAuthButtons role={selectedRole} />
                      <div className="relative my-1">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-neutral-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-3 text-neutral-400">ou</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep('email')}
                        className="w-full h-11 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Continuer avec email
                      </button>
                    </motion.div>
                  )}

                  {/* Étape 1 : Email */}
                  {step === 'email' && (
                    <motion.div
                      key="email"
                      variants={stepVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <StepIndicator />
                      <LabelInputContainer>
                        <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
                          Adresse email
                        </Label>
                        <Input
                          id="email"
                          placeholder="votre@email.com"
                          type="email"
                          autoFocus
                          {...register('email')}
                          disabled={isLoading}
                          className="h-11 rounded-xl border-neutral-200 focus-visible:ring-[#823F91] text-base"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleContinueEmail()
                            }
                          }}
                        />
                        {errors.email && (
                          <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                        )}
                      </LabelInputContainer>
                      <button
                        type="button"
                        onClick={handleContinueEmail}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-[#823F91] to-[#B855D6] text-white font-semibold text-sm shadow-md shadow-purple-500/20 hover:shadow-lg transition-all"
                      >
                        Continuer
                      </button>
                    </motion.div>
                  )}

                  {/* Étape 2 : Prénom + Nom */}
                  {step === 'names' && (
                    <motion.div
                      key="names"
                      variants={stepVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <StepIndicator />
                      <div className="flex gap-3">
                        <LabelInputContainer className="flex-1">
                          <Label htmlFor="prenom" className="text-sm font-medium text-neutral-700">
                            Prénom
                          </Label>
                          <Input
                            id="prenom"
                            placeholder="Votre prénom"
                            autoFocus
                            {...register('prenom')}
                            disabled={isLoading}
                            className="h-11 rounded-xl border-neutral-200 focus-visible:ring-[#823F91] text-base"
                          />
                          {errors.prenom && (
                            <p className="text-xs text-red-500 mt-1">{errors.prenom.message}</p>
                          )}
                        </LabelInputContainer>
                        <LabelInputContainer className="flex-1">
                          <Label htmlFor="nom" className="text-sm font-medium text-neutral-700">
                            Nom
                          </Label>
                          <Input
                            id="nom"
                            placeholder="Votre nom"
                            {...register('nom')}
                            disabled={isLoading}
                            className="h-11 rounded-xl border-neutral-200 focus-visible:ring-[#823F91] text-base"
                          />
                          {errors.nom && (
                            <p className="text-xs text-red-500 mt-1">{errors.nom.message}</p>
                          )}
                        </LabelInputContainer>
                      </div>
                      <button
                        type="button"
                        onClick={handleContinueNames}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-[#823F91] to-[#B855D6] text-white font-semibold text-sm shadow-md shadow-purple-500/20 hover:shadow-lg transition-all"
                      >
                        Continuer
                      </button>
                    </motion.div>
                  )}

                  {/* Étape 3 : Entreprise (prestataire uniquement) */}
                  {step === 'company' && (
                    <motion.div
                      key="company"
                      variants={stepVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <StepIndicator />
                      <LabelInputContainer>
                        <Label htmlFor="nomEntreprise" className="text-sm font-medium text-neutral-700">
                          Nom de l&apos;entreprise <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nomEntreprise"
                          placeholder="Ex: Studio Photo Lumière"
                          autoFocus
                          {...register('nomEntreprise')}
                          disabled={isLoading}
                          className="h-11 rounded-xl border-neutral-200 focus-visible:ring-[#823F91] text-base"
                        />
                        {errors.nomEntreprise && (
                          <p className="text-xs text-red-500 mt-1">{errors.nomEntreprise.message}</p>
                        )}
                      </LabelInputContainer>
                      <LabelInputContainer>
                        <Label htmlFor="siret" className="text-sm font-medium text-neutral-700">
                          Numéro SIRET
                        </Label>
                        <Input
                          id="siret"
                          placeholder="123 456 789 00012"
                          {...register('siret')}
                          disabled={isLoading}
                          className="h-11 rounded-xl border-neutral-200 focus-visible:ring-[#823F91] text-base"
                        />
                        {errors.siret && (
                          <p className="text-xs text-red-500 mt-1">{errors.siret.message}</p>
                        )}
                      </LabelInputContainer>
                      <button
                        type="button"
                        onClick={handleContinueCompany}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-[#823F91] to-[#B855D6] text-white font-semibold text-sm shadow-md shadow-purple-500/20 hover:shadow-lg transition-all"
                      >
                        Continuer
                      </button>
                    </motion.div>
                  )}

                  {/* Étape finale : Mot de passe */}
                  {step === 'password' && (
                    <motion.div
                      key="password"
                      variants={stepVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <StepIndicator />
                      <LabelInputContainer>
                        <Label htmlFor="password" className="text-sm font-medium text-neutral-700">
                          Mot de passe <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="password"
                          placeholder="Minimum 8 caractères"
                          type="password"
                          autoFocus
                          {...register('password')}
                          disabled={isLoading}
                          className="h-11 rounded-xl border-neutral-200 focus-visible:ring-[#823F91] text-base"
                        />
                        {errors.password && (
                          <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                        )}
                        {password && (
                          <div className="mt-2 flex gap-4">
                            <span className={cn('text-xs', password.length >= 8 ? 'text-green-600' : 'text-neutral-400')}>
                              {password.length >= 8 ? '✓' : '○'} 8 car.
                            </span>
                            <span className={cn('text-xs', /[A-Z]/.test(password) ? 'text-green-600' : 'text-neutral-400')}>
                              {/[A-Z]/.test(password) ? '✓' : '○'} Majuscule
                            </span>
                            <span className={cn('text-xs', /[0-9]/.test(password) ? 'text-green-600' : 'text-neutral-400')}>
                              {/[0-9]/.test(password) ? '✓' : '○'} Chiffre
                            </span>
                          </div>
                        )}
                      </LabelInputContainer>
                      <LabelInputContainer>
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-700">
                          Confirmer le mot de passe <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="confirmPassword"
                          placeholder="Répétez votre mot de passe"
                          type="password"
                          {...register('confirmPassword')}
                          disabled={isLoading}
                          className="h-11 rounded-xl border-neutral-200 focus-visible:ring-[#823F91] text-base"
                        />
                        {errors.confirmPassword && (
                          <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
                        )}
                      </LabelInputContainer>

                      {error && (
                        <div className="p-3 bg-rose-50/80 border border-red-200/60 rounded-xl">
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-[#823F91] via-[#9D5FA8] to-[#B855D6] font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                            />
                            Création en cours...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1">
                            Créer mon compte
                            <motion.span
                              animate={{ x: [0, 4, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              →
                            </motion.span>
                          </span>
                        )}
                      </button>

                      <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Inscription gratuite, sans engagement.</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              {/* Lien connexion */}
              <div className="mt-6 pt-4 border-t border-neutral-100">
                <p className="text-center text-sm text-neutral-600">
                  Vous avez déjà un compte ?{' '}
                  <Link
                    href="/sign-in"
                    className="text-[#823F91] hover:text-[#6D3478] font-semibold transition-colors"
                  >
                    Se connecter
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  )
}
