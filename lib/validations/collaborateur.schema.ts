import { z } from 'zod'

export const inviteCollaborateurSchema = z.object({
  email: z.string().email('Email invalide').max(255, 'Email trop long'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100, 'Nom trop long'),
  role: z.enum(['Témoin', 'Famille', 'Ami', 'Organisateur', 'Autre']),
  message: z.string().max(1000, 'Message trop long').optional(),
})

export type InviteCollaborateurInput = z.infer<typeof inviteCollaborateurSchema>

