import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateDocumentChecklist } from '@/lib/marriage-admin/checklist-generator'
import type { QuestionnaireData } from '@/types/marriage-admin'
import { createMarriageFileSchema } from '@/lib/validations/marriage-admin.schema'
import { logger } from '@/lib/logger'
import { withErrorHandling } from '@/lib/errors/error-handler'
import { ApiErrors } from '@/lib/errors/api-errors'

async function createMarriageFileHandler(req: NextRequest) {
  // Vérifier l'authentification
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw ApiErrors.unauthorized()
  }

  const body = await req.json()

  // Validation avec Zod
  const validationResult = createMarriageFileSchema.safeParse(body)
  if (!validationResult.success) {
    throw ApiErrors.validation(
      validationResult.error.issues[0]?.message || 'Données invalides',
      validationResult.error.issues
    )
  }

  const { userId, questionnaireData } = validationResult.data

  // Vérifier que l'utilisateur correspond (sécurité supplémentaire)
  if (userId !== user.id) {
    throw ApiErrors.forbidden('User ID mismatch')
  }

  logger.info('📝 Création dossier pour:', userId)

  // Générer la checklist personnalisée
  const checklist = generateDocumentChecklist(questionnaireData as QuestionnaireData)

  // Utiliser le client admin pour créer le dossier (bypass RLS)
  const adminClient = createAdminClient()

  // Vérifier si un dossier existe déjà
  const { data: existingFile } = await adminClient
    .from('marriage_administrative_files')
    .select('id')
    .eq('couple_id', userId)
    .single()

  let fileData

  if (existingFile) {
    // Mettre à jour le dossier existant
    const { data, error } = await adminClient
      .from('marriage_administrative_files')
      .update({
        municipality: questionnaireData.municipality,
        municipality_postal_code: questionnaireData.municipalityPostalCode,
        wedding_date: questionnaireData.weddingDate,
        questionnaire_data: questionnaireData,
        documents_checklist: checklist,
        progress_percentage: 0,
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingFile.id)
      .select()
      .single()

    if (error) throw ApiErrors.internal('Erreur lors de la mise à jour du dossier', error)
    fileData = data
    logger.info('✅ Dossier mis à jour:', fileData.id)
  } else {
    // Créer un nouveau dossier
    const { data, error } = await adminClient
      .from('marriage_administrative_files')
      .insert({
        couple_id: userId,
        municipality: questionnaireData.municipality,
        municipality_postal_code: questionnaireData.municipalityPostalCode,
        wedding_date: questionnaireData.weddingDate,
        questionnaire_data: questionnaireData,
        documents_checklist: checklist,
        progress_percentage: 0,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw ApiErrors.internal('Erreur lors de la création du dossier', error)
    fileData = data
    logger.info('✅ Dossier créé:', fileData.id)
  }

  return NextResponse.json({
    success: true,
    data: fileData,
  })
}

export const POST = withErrorHandling(createMarriageFileHandler)

