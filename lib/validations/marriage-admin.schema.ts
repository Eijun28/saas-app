import { z } from 'zod'

// Schema pour upload-document
export const uploadDocumentSchema = z.object({
  marriageFileId: z.string().uuid('ID de fichier invalide'),
  documentType: z.string().min(1, 'Type de document requis'),
})

// Schema pour create
export const createMarriageFileSchema = z.object({
  userId: z.string().uuid('ID utilisateur invalide'),
  questionnaireData: z.object({
    municipality: z.string().min(1, 'Commune requise'),
    municipalityPostalCode: z.string().min(1, 'Code postal requis'),
    weddingDate: z.string().optional(),
  }),
})

// Schema pour generate-pdf
export const generatePdfSchema = z.object({
  marriageFileId: z.string().uuid('ID de fichier invalide'),
})

