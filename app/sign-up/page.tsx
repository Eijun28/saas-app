'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth.schema'
import { signUp } from '@/lib/auth/actions'
import { translateAuthError } from '@/lib/auth/error-translations'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LabelInputContainer } from '@/components/ui/label-input-container'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Sparkles, Building2, Gift } from 'lucide-react'
import Particles from '@/components/Particles'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [earlyAdopterSlotsLeft, setEarlyAdopterSlotsLeft] = useState<number | null>(null)
  const [referralCode, setReferralCode] = useState('')
  const [referralValid, setReferralValid] = useState<boolean | null>(null)
  const [referralChecking, setReferralChecking] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
    trigger,
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: 'prestataire',
      prenom: '',
      nom: '',
      email: '',
      password: '',
      confirmPassword: '',
      nomEntreprise: '',
      siret: '',
    },
    mode: 'onChange', // Validation en temps réel
  })
  
  const password = watch('password')
  const selectedRole = watch('role')
  const prenom = watch('prenom')
  const nom = watch('nom')
  const email = watch('email')
  const confirmPassword = watch('confirmPassword')
  const nomEntreprise = watch('nomEntreprise')
  const siret = watch('siret')
  
  // Vérifier si le formulaire est valide : pas d'erreurs ET tous les champs requis remplis
  const hasRequiredFields = 
    prenom?.trim() && 
    nom?.trim() && 
    email?.trim() && 
    password?.trim() && 
    confirmPassword?.trim() &&
    (selectedRole === 'couple' || (selectedRole === 'prestataire' && nomEntreprise?.trim()))
  
  const isFormValid = Object.keys(errors).length === 0 && hasRequiredFields

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

  // Vérifier le code de parrainage
  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValid(null)
      return
    }
    setReferralChecking(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('provider_referrals')
        .select('referral_code')
        .eq('referral_code', code.trim().toUpperCase())
        .maybeSingle()
      setReferralValid(!!data)
    } catch {
      setReferralValid(null)
    } finally {
      setReferralChecking(false)
    }
  }

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true)
    setError(null)

    try {
      let result
      try {
        result = await signUp(data.email, data.password, data.role, {
          prenom: data.prenom,
          nom: data.nom,
          nomEntreprise: data.nomEntreprise,
          siret: data.siret,
          referralCode: referralCode.trim().toUpperCase() || undefined,
        })
      } catch (signUpError: any) {
        throw signUpError
      }

      // Vérifier si result est null ou undefined (réponse inattendue)
      if (!result) {
        setError('Une réponse inattendue a été reçue du serveur. Veuillez réessayer.')
        return
      }

      if (result && 'error' in result && result.error) {
        // Le serveur traduit déjà les erreurs, pas besoin de re-traduire
        setError(result.error)
      } else if (result && 'success' in result && result.success) {
        // Redirection vers la page spécifiée ou confirmation par défaut
        let redirectUrl = ('redirectTo' in result && result.redirectTo) ? result.redirectTo : '/auth/confirm'
        if ('emailWarning' in result && result.emailWarning) {
          redirectUrl += `?emailWarning=${encodeURIComponent(String(result.emailWarning))}`
        }
        router.push(redirectUrl)
      } else {
        // Cas où result existe mais n'a ni error ni success
        setError('Une réponse inattendue a été reçue du serveur. Veuillez réessayer.')
      }
    } catch (err: any) {
      setError(translateAuthError(err?.message))
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
        className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-24 bg-background relative z-10"
      >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="w-full max-w-full sm:max-w-2xl"
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
            <CardDescription className="text-sm sm:text-base text-neutral-600 max-w-md mx-auto px-2">
              Rejoignez des milliers de couples qui organisent leur mariage de rêve avec sérénité. 
              <span className="block mt-1 text-xs sm:text-sm text-neutral-500">
                Votre aventure commence ici, en quelques secondes.
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10">
            {selectedRole === 'prestataire' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-6 rounded-2xl border-2 border-[#823F91]/30 bg-gradient-to-r from-[#823F91]/10 via-purple-50 to-pink-50/80 px-4 py-4 text-sm text-purple-900 shadow-md relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#823F91]/10 to-transparent rounded-bl-full" />
                <div className="flex items-start gap-3 relative z-10">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#823F91] to-[#B855D6] text-white shadow-md shadow-purple-500/25 shrink-0">
                    <Gift className="h-5 w-5" />
                  </span>
                  <div className="space-y-1.5">
                    <p className="font-bold text-[#823F91] text-base leading-tight">
                      250€ a gagner pour les pros du mariage !
                    </p>
                    <p className="text-xs text-purple-700 leading-relaxed">
                      Inscrivez-vous et <strong>completez votre profil</strong> pour participer au tirage au sort. C'est simple, rapide et gratuit.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.form
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 sm:space-y-6"
            >
              {/* Sélection du rôle */}
              <motion.div variants={itemVariants} className="space-y-3">
                <Label className="text-sm font-medium text-neutral-700 text-center block">
                  Je suis
                </Label>
                <div className="flex justify-center gap-2 sm:gap-3">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setValue('role', 'prestataire', { shouldValidate: false })
                    }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "px-5 sm:px-6 py-3 sm:py-2.5 rounded-full text-sm font-medium transition-all duration-200 min-h-[44px] min-w-[120px]",
                      selectedRole === 'prestataire'
                        ? 'bg-[#823F91] text-white shadow-md shadow-purple-500/20'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    )}
                  >
                    Prestataire
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => {
                      setValue('role', 'couple', { shouldValidate: false })
                    }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "px-5 sm:px-6 py-3 sm:py-2.5 rounded-full text-sm font-medium transition-all duration-200 min-h-[44px] min-w-[100px]",
                      selectedRole === 'couple'
                        ? 'bg-[#823F91] text-white shadow-md shadow-purple-500/20'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    )}
                  >
                    Couple
                  </motion.button>
                </div>
                {selectedRole === 'prestataire' && (
                  <div className="flex justify-center">
                    <span className="inline-flex items-center rounded-full border border-[#823F91]/25 bg-purple-50/80 px-3 py-1 text-xs font-semibold text-[#823F91] shadow-sm">
                      Gratuit pour tous jusqu’au 30 Juin
                    </span>
                  </div>
                )}
                <input type="hidden" {...register('role')} />
                {errors.role && (
                  <p className="text-sm text-red-500 mt-2 text-center">{errors.role.message}</p>
                )}
              </motion.div>

              {/* Prénom et Nom */}
              <motion.div variants={itemVariants} className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <LabelInputContainer className="flex-1">
                  <Label htmlFor="prenom" className="text-sm font-medium text-neutral-700">
                    Prénom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="prenom"
                    placeholder="Votre prénom"
                    type="text"
                    required
                    {...register('prenom')}
                    disabled={isLoading}
                    className="h-12 sm:h-12 rounded-xl border-neutral-200 focus-visible:ring-[#823F91] text-base"
                  />
                  {errors.prenom && (
                    <p className="text-xs text-red-500 mt-1">{errors.prenom.message}</p>
                  )}
                </LabelInputContainer>

                <LabelInputContainer className="flex-1">
                  <Label htmlFor="nom" className="text-sm font-medium text-neutral-700">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nom"
                    placeholder="Votre nom"
                    type="text"
                    required
                    {...register('nom')}
                    disabled={isLoading}
                    className="h-12 sm:h-12 rounded-xl border-neutral-200 focus-visible:ring-[#823F91] text-base"
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
                      Nom de l'entreprise <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nomEntreprise"
                      placeholder="Ex: Studio Photo Lumière"
                      type="text"
                      required
                      {...register('nomEntreprise')}
                      disabled={isLoading}
                      className="h-12 sm:h-12 rounded-xl border-neutral-200 focus-visible:ring-[#823F91] text-base"
                    />
                    {errors.nomEntreprise && (
                      <p className="text-xs text-red-500 mt-1">{errors.nomEntreprise.message}</p>
                    )}
                  </LabelInputContainer>

                  <LabelInputContainer>
                    <Label htmlFor="siret" className="text-sm font-medium text-neutral-700">
                      Numéro de SIRET <span className="text-xs text-neutral-400">(requis pour le concours)</span>
                    </Label>
                    <Input
                      id="siret"
                      placeholder="123 456 789 00012"
                      type="text"
                      {...register('siret')}
                      disabled={isLoading}
                      className="h-12 sm:h-12 rounded-xl border-neutral-200 focus-visible:ring-[#823F91] text-base"
                    />
                    {errors.siret && (
                      <p className="text-xs text-red-500 mt-1">{errors.siret.message}</p>
                    )}
                    {siret && !errors.siret && (
                      <p className="text-xs text-neutral-500 mt-1">
                        Format attendu : 14 chiffres. Ce champ active l&apos;éligibilité au concours.
                      </p>
                    )}
                  </LabelInputContainer>

                  <p className="text-xs text-neutral-500 text-center">
                    Vous pourrez compléter votre profil prestataire après l'inscription
                  </p>
                </motion.div>
              )}

              {/* Code de parrainage (optionnel, visible pour tous les rôles) */}
              {selectedRole === 'prestataire' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-purple-50/30 to-neutral-50 border border-purple-100/50"
                >
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-[#823F91]" />
                    <span className="text-sm font-medium text-[#823F91]">Code de parrainage</span>
                    <span className="text-xs text-neutral-400">(optionnel)</span>
                  </div>
                  <LabelInputContainer>
                    <Input
                      id="referralCode"
                      placeholder="Ex: NUPLY-XXXXX"
                      type="text"
                      value={referralCode}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase()
                        setReferralCode(value)
                        setReferralValid(null)
                      }}
                      onBlur={() => {
                        if (referralCode.trim()) {
                          validateReferralCode(referralCode)
                        }
                      }}
                      disabled={isLoading}
                      className={cn(
                        "h-12 sm:h-12 rounded-xl border-neutral-200 focus-visible:ring-[#823F91] text-base font-mono tracking-wider",
                        referralValid === true && 'border-green-300 bg-green-50/50',
                        referralValid === false && 'border-red-300 bg-red-50/50'
                      )}
                    />
                    {referralChecking && (
                      <p className="text-xs text-neutral-500 mt-1">Vérification du code...</p>
                    )}
                    {referralValid === true && (
                      <p className="text-xs text-green-600 mt-1">Code de parrainage valide</p>
                    )}
                    {referralValid === false && (
                      <p className="text-xs text-red-500 mt-1">Code de parrainage invalide</p>
                    )}
                  </LabelInputContainer>
                </motion.div>
              )}

              {/* Email */}
              <motion.div variants={itemVariants}>
                <LabelInputContainer>
                  <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
                    Adresse email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    placeholder="votre@email.com"
                    type="email"
                    required
                    {...register('email')}
                    disabled={isLoading}
                    className="h-12 sm:h-12 rounded-xl border-neutral-200 focus-visible:ring-[#823F91] text-base"
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
                    Mot de passe <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    placeholder="Minimum 8 caractères"
                    type="password"
                    required
                    {...register('password')}
                    disabled={isLoading}
                    className="h-12 sm:h-12 rounded-xl border-neutral-200 focus-visible:ring-[#823F91] text-base"
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                  )}
                  {/* Aide pour les prérequis du mot de passe */}
                  {password && (
                    <div className="mt-2 space-y-1 hidden sm:block">
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
                </LabelInputContainer>
              </motion.div>

              {/* Confirmation mot de passe */}
              <motion.div variants={itemVariants}>
                <LabelInputContainer>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-700">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    placeholder="Répétez votre mot de passe"
                    type="password"
                    required
                    {...register('confirmPassword')}
                    disabled={isLoading}
                    className="h-12 sm:h-12 rounded-xl border-neutral-200 focus-visible:ring-[#823F91] text-base"
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
                  className="p-4 bg-rose-50/80 border border-red-200/60 rounded-xl text-center"
                >
                  <p className="text-sm text-red-600 font-medium">{error}</p>
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
                  disabled={isLoading || !isFormValid}
                  whileHover={{ scale: isLoading || !isFormValid ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading || !isFormValid ? 1 : 0.98 }}
                  className="group relative w-full h-14 rounded-xl bg-gradient-to-r from-[#823F91] via-[#9D5FA8] to-[#B855D6] font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/25 disabled:opacity-50 disabled:cursor-not-allowed"
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
                
                <p className="text-xs text-neutral-400 text-center">
                  Les champs marqués d'un <span className="text-red-500">*</span> sont obligatoires
                </p>
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
