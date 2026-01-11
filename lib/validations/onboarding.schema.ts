import { z } from 'zod'
import { SERVICE_TYPES } from '@/lib/constants/service-types'

// Extraire les valeurs pour le schéma Zod
const serviceTypeValues = SERVICE_TYPES.map(s => s.value) as [string, ...string[]]

export const prestataireTypeSchema = z.enum(serviceTypeValues)

export const roleSchema = z.enum(['couple', 'prestataire'])

export const personalInfoSchema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis'),
  nom: z.string().optional(),
})

export const emailSchema = z.object({
  email: z.string().email('Email invalide'),
})

export const coupleDataSchema = z.object({
  villeMarriage: z.string().min(1, 'La ville est requise'),
  dateMarriage: z.date().nullable(),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
  culture: z.string().optional(),
  prestatairesRecherches: z.array(prestataireTypeSchema),
})

export const prestataireDataSchema = z.object({
  nomEntreprise: z.string().min(1, 'Le nom de l\'entreprise est requis'),
  typePrestation: prestataireTypeSchema,
  villeExercice: z.string().min(1, 'La ville est requise'),
  tarifMin: z.number().min(0),
  tarifMax: z.number().min(0),
  culturesGerees: z.array(z.string()),
})

export type PrestataireType = z.infer<typeof prestataireTypeSchema>
export type Role = z.infer<typeof roleSchema>
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>
export type EmailInput = z.infer<typeof emailSchema>
export type CoupleDataInput = z.infer<typeof coupleDataSchema>
export type PrestataireDataInput = z.infer<typeof prestataireDataSchema>

