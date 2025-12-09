'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth.schema'
import { signUp } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BottomGradient } from '@/components/ui/bottom-gradient'
import { LabelInputContainer } from '@/components/ui/label-input-container'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    mode: 'onSubmit', // Validation uniquement à la soumission
  })

  const selectedRole = watch('role')

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
        setError(result.error)
      } else {
        router.push('/onboarding')
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black"
      >
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
          Bienvenue sur NUPLY
        </h2>
        <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
          Créez votre compte et commencez à organiser votre mariage de rêve
        </p>

        <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
          {/* Sélection du rôle */}
          <div className="mb-4 space-y-2">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Je suis
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setValue('role', 'couple', { shouldValidate: false })
                }}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                  selectedRole === 'couple'
                    ? 'border-[#823F91] bg-[#E8D4EF]'
                    : 'border-gray-200 hover:border-gray-300 dark:border-neutral-700'
                )}
              >
                <div>
                  <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    Couple
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Je cherche des prestataires
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setValue('role', 'prestataire', { shouldValidate: false })
                }}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                  selectedRole === 'prestataire'
                    ? 'border-[#823F91] bg-[#E8D4EF]'
                    : 'border-gray-200 hover:border-gray-300 dark:border-neutral-700'
                )}
              >
                <div>
                  <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    Prestataire
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Je propose mes services
                  </p>
                </div>
              </button>
            </div>
            <input type="hidden" {...register('role')} />
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>

          {/* Prénom et Nom */}
          <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <LabelInputContainer>
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                placeholder="Votre prénom"
                type="text"
                {...register('prenom')}
                disabled={isLoading}
                className="dark:bg-neutral-800 dark:border-neutral-700"
              />
              {errors.prenom && (
                <p className="text-xs text-red-500">{errors.prenom.message}</p>
              )}
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                placeholder="Votre nom"
                type="text"
                {...register('nom')}
                disabled={isLoading}
                className="dark:bg-neutral-800 dark:border-neutral-700"
              />
              {errors.nom && (
                <p className="text-xs text-red-500">{errors.nom.message}</p>
              )}
            </LabelInputContainer>
          </div>

          {/* Nom entreprise (si prestataire) */}
          {selectedRole === 'prestataire' && (
            <LabelInputContainer className="mb-4">
              <Label htmlFor="nomEntreprise">Nom de l'entreprise</Label>
              <Input
                id="nomEntreprise"
                placeholder="Nom de votre entreprise"
                type="text"
                {...register('nomEntreprise')}
                disabled={isLoading}
                className="dark:bg-neutral-800 dark:border-neutral-700"
              />
              {errors.nomEntreprise && (
                <p className="text-xs text-red-500">{errors.nomEntreprise.message}</p>
              )}
            </LabelInputContainer>
          )}

          {/* Email */}
          <LabelInputContainer className="mb-4">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              placeholder="votre@email.com"
              type="email"
              {...register('email')}
              disabled={isLoading}
              className="dark:bg-neutral-800 dark:border-neutral-700"
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </LabelInputContainer>

          {/* Mot de passe */}
          <LabelInputContainer className="mb-4">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              {...register('password')}
              disabled={isLoading}
              className="dark:bg-neutral-800 dark:border-neutral-700"
            />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </LabelInputContainer>

          {/* Confirmation mot de passe */}
          <LabelInputContainer className="mb-8">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              placeholder="••••••••"
              type="password"
              {...register('confirmPassword')}
              disabled={isLoading}
              className="dark:bg-neutral-800 dark:border-neutral-700"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </LabelInputContainer>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Inscription...' : 'Créer mon compte →'}
            <BottomGradient />
          </button>

          <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            Déjà un compte ?{' '}
            <Link
              href="/sign-in"
              className="text-[#823F91] hover:text-[#6D3478] font-medium transition-colors dark:text-purple-400"
            >
              Se connecter
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}
