'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth.schema'
import { signUp } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LabelInputContainer } from '@/components/ui/label-input-container'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Sparkles, Building2 } from 'lucide-react'
import Particles from '@/components/Particles'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [earlyAdopterSlotsLeft, setEarlyAdopterSlotsLeft] = useState<number | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
    },
    mode: 'onSubmit',
  })

  const selectedRole = watch('role')

  useEffect(() => {
    async function checkSlots() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('early_adopter_program')
          .select('total_slots, used_slots')
          .single()
        
        if (error) {
          // Ne pas bloquer l'inscription si la requête échoue
          return
        }
        
        if (data) {
          const remaining = data.total_slots - data.used_slots
          setEarlyAdopterSlotsLeft(remaining > 0 ? remaining : 0)
        }
      } catch (err) {
        // Ne pas bloquer l'inscription si la requête échoue
      }
    }
    checkSlots()
  }, [])

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signUp(data.email, data.password, data.role, {
        prenom: data.prenom,
        nom: data.nom,
        nomEntreprise: data.nomEntreprise,
      })

      if (result?.error) {
        if (result.error.includes('Invalid API key') || result.error.includes('invalid') || result.error.includes('Variables d\'environnement')) {
          setError('Erreur de configuration. Veuillez contacter le support.')
        } else {
          setError(result.error)
        }
      } else {
        router.push('/onboarding')
      }
    } catch (err: any) {
      if (err.message?.includes('Variables d\'environnement') || err.message?.includes('Invalid API key') || err.message?.includes('invalid')) {
        setError('Erreur de configuration. Veuillez contacter le support.')
      } else {
        setError(err.message || 'Une erreur est survenue')
      }
    } finally {
      setIsLoading(false)
    }
  }

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
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  }

  return (
    <>
      {/* Background de particules - couvre toute la page */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
        <Particles
          particleCount={200}
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

      <div 
        className="min-h-screen flex items-center justify-center px-6 py-24 bg-background relative z-10"
      >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-white border-0 shadow-2xl shadow-purple-500/20 ring-1 ring-purple-200/50 relative overflow-hidden">
          {/* Reflets violets */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-purple-400/20 to-pink-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-purple-500/15 to-violet-300/15 rounded-full blur-3xl pointer-events-none" />
          <CardHeader className="space-y-3 pb-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center justify-center gap-2"
            >
              <Sparkles className="h-5 w-5 text-[#823F91]" />
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#823F91] to-[#B855D6] bg-clip-text text-transparent">
                Créez votre compte NUPLY
              </CardTitle>
            </motion.div>
            <CardDescription className="text-base text-neutral-600 max-w-md mx-auto">
              Rejoignez des milliers de couples qui organisent leur mariage de rêve avec sérénité. 
              <span className="block mt-1 text-sm text-neutral-500">
                Votre aventure commence ici, en quelques secondes.
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10">

            <motion.form
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Sélection du rôle */}
              <motion.div variants={itemVariants} className="space-y-3">
                <Label className="text-sm font-medium text-neutral-700 text-center block">
                  Je suis
                </Label>
                <div className="flex justify-center gap-3">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setValue('role', 'couple', { shouldValidate: false })
                    }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                      selectedRole === 'couple'
                        ? 'bg-[#823F91] text-white shadow-md shadow-purple-500/20'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    )}
                  >
                    Couple
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => {
                      setValue('role', 'prestataire', { shouldValidate: false })
                    }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                      selectedRole === 'prestataire'
                        ? 'bg-[#823F91] text-white shadow-md shadow-purple-500/20'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    )}
                  >
                    Prestataire
                  </motion.button>
                </div>
                <input type="hidden" {...register('role')} />
                {errors.role && (
                  <p className="text-sm text-red-500 mt-2 text-center">{errors.role.message}</p>
                )}
              </motion.div>

              {/* Prénom et Nom */}
              <motion.div variants={itemVariants} className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                <LabelInputContainer className="flex-1">
                  <Label htmlFor="prenom" className="text-sm font-medium text-neutral-700">
                    Prénom
                  </Label>
                  <Input
                    id="prenom"
                    placeholder="Votre prénom"
                    type="text"
                    {...register('prenom')}
                    disabled={isLoading}
                    className="h-12 rounded-xl border-neutral-200 focus-visible:ring-[#823F91]"
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
                    type="text"
                    {...register('nom')}
                    disabled={isLoading}
                    className="h-12 rounded-xl border-neutral-200 focus-visible:ring-[#823F91]"
                  />
                  {errors.nom && (
                    <p className="text-xs text-red-500 mt-1">{errors.nom.message}</p>
                  )}
                </LabelInputContainer>
              </motion.div>

              {/* Section Prestataire détaillée */}
              {selectedRole === 'prestataire' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 p-4 rounded-2xl bg-gradient-to-br from-purple-50/50 to-neutral-50 border border-purple-100"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-[#823F91]" />
                    <span className="text-sm font-semibold text-[#823F91]">Informations entreprise</span>
                  </div>
                  
                  <LabelInputContainer>
                    <Label htmlFor="nomEntreprise" className="text-sm font-medium text-neutral-700">
                      Nom de l'entreprise
                    </Label>
                    <Input
                      id="nomEntreprise"
                      placeholder="Ex: Studio Photo Lumière"
                      type="text"
                      {...register('nomEntreprise')}
                      disabled={isLoading}
                      className="h-12 rounded-xl border-neutral-200 focus-visible:ring-[#823F91]"
                    />
                    {errors.nomEntreprise && (
                      <p className="text-xs text-red-500 mt-1">{errors.nomEntreprise.message}</p>
                    )}
                  </LabelInputContainer>

                  <p className="text-xs text-neutral-500 text-center">
                    Vous pourrez compléter votre profil prestataire après l'inscription
                  </p>
                </motion.div>
              )}

              {/* Email */}
              <motion.div variants={itemVariants}>
                <LabelInputContainer>
                  <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
                    Adresse email
                  </Label>
                  <Input
                    id="email"
                    placeholder="votre@email.com"
                    type="email"
                    {...register('email')}
                    disabled={isLoading}
                    className="h-12 rounded-xl border-neutral-200 focus-visible:ring-[#823F91]"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </LabelInputContainer>
              </motion.div>

              {/* Mot de passe */}
              <motion.div variants={itemVariants}>
                <LabelInputContainer>
                  <Label htmlFor="password" className="text-sm font-medium text-neutral-700">
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    placeholder="Minimum 8 caractères"
                    type="password"
                    {...register('password')}
                    disabled={isLoading}
                    className="h-12 rounded-xl border-neutral-200 focus-visible:ring-[#823F91]"
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                  )}
                </LabelInputContainer>
              </motion.div>

              {/* Confirmation mot de passe */}
              <motion.div variants={itemVariants}>
                <LabelInputContainer>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-700">
                    Confirmer le mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    placeholder="Répétez votre mot de passe"
                    type="password"
                    {...register('confirmPassword')}
                    disabled={isLoading}
                    className="h-12 rounded-xl border-neutral-200 focus-visible:ring-[#823F91]"
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
                  )}
                </LabelInputContainer>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-xl text-center"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              {/* Afficher le badge early adopter si places disponibles */}
              {selectedRole === 'prestataire' && earlyAdopterSlotsLeft !== null && earlyAdopterSlotsLeft > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4 mb-6"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-purple-900">
                        🎁 Devenez Founding Member !
                      </p>
                      <p className="text-sm text-purple-700">
                        Plus que <strong>{earlyAdopterSlotsLeft} places</strong> pour obtenir 3 mois gratuits + badge permanent
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {selectedRole === 'prestataire' && earlyAdopterSlotsLeft === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4"
                >
                  <p className="text-sm text-gray-600 text-center">
                    Programme Early Adopter complet. Choisissez votre abonnement après inscription.
                  </p>
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="space-y-4 pt-2">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="group relative w-full h-14 rounded-xl bg-gradient-to-r from-[#823F91] via-[#9D5FA8] to-[#B855D6] font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        {selectedRole === 'prestataire' && earlyAdopterSlotsLeft !== null && earlyAdopterSlotsLeft > 0
                          ? '🚀 Récupérer mon badge Early Adopter'
                          : 'Commencer mon aventure'
                        }
                        <motion.span
                          initial={{ x: 0 }}
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          →
                        </motion.span>
                      </>
                    )}
                  </span>
                </motion.button>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center gap-2 text-xs text-neutral-500"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>
                    Vos données sont sécurisées et protégées. Inscription gratuite, sans engagement.
                  </span>
                </motion.div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="pt-6 border-t border-neutral-200"
              >
                <p className="text-center text-sm text-neutral-600">
                  Vous avez déjà un compte ?{' '}
                  <Link
                    href="/sign-in"
                    className="text-[#823F91] hover:text-[#6D3478] font-semibold transition-colors"
                  >
                    Se connecter
                  </Link>
                </p>
              </motion.div>
            </motion.form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </>
  )
}
