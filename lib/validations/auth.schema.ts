import { z } from 'zod'

export const signUpSchema = z
  .object({
    role: z.enum(['couple', 'prestataire'], {
      message: 'Veuillez sélectionner un rôle',
    }),
    prenom: z.string().min(1, 'Le prénom est requis').min(2, 'Le prénom doit contenir au moins 2 caractères'),
    nom: z.string().min(1, 'Le nom est requis').min(2, 'Le nom doit contenir au moins 2 caractères'),
    nomEntreprise: z.string().optional(),
    siret: z.string().optional(),
    email: z.string().min(1, 'L\'email est requis').email('Email invalide'),
    password: z
      .string()
      .min(1, 'Le mot de passe est requis')
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    confirmPassword: z.string().min(1, 'La confirmation du mot de passe est requise'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })
  .refine((data) => {
    if (data.role === 'prestataire') {
      return data.nomEntreprise && data.nomEntreprise.trim().length >= 2
    }
    return true
  }, {
    message: 'Le nom de l\'entreprise est requis pour les prestataires (minimum 2 caractères)',
    path: ['nomEntreprise'],
  })
  .refine((data) => {
    if (!data.siret) return true
    const digits = data.siret.replace(/\D/g, '')
    return digits.length === 14
  }, {
    message: 'Le SIRET doit contenir 14 chiffres',
    path: ['siret'],
  })

export const signInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
