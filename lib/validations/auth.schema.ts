import { z } from 'zod'

export const signUpSchema = z
  .object({
    role: z.enum(['couple', 'prestataire'], {
      required_error: 'Veuillez sélectionner un rôle',
    }),
    prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    nomEntreprise: z.string().optional(),
    email: z.string().email('Email invalide'),
    password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[0-9]/, 'Au moins un chiffre'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })
  .refine((data) => {
    if (data.role === 'prestataire') {
      return data.nomEntreprise && data.nomEntreprise.length >= 2
    }
    return true
  }, {
    message: 'Le nom de l\'entreprise est requis pour les prestataires',
    path: ['nomEntreprise'],
  })

export const signInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>

