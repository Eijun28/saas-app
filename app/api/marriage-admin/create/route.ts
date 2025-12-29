import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateDocumentChecklist } from '@/lib/marriage-admin/checklist-generator'
import type { QuestionnaireData } from '@/types/marriage-admin'

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, questionnaireData } = await req.json()

    if (!userId || !questionnaireData) {
      return NextResponse.json(
        { error: 'Missing userId or questionnaireData' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur correspond
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      )
    }

    logger.info('Création dossier', { userId })

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

      if (error) throw error
      fileData = data
      logger.info('Dossier mis à jour', { fileId: fileData.id })
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

      if (error) throw error
      fileData = data
      logger.info('Dossier créé', { fileId: fileData.id })
    }

    return NextResponse.json({
      success: true,
      data: fileData,
    })
  } catch (error: any) {
    logger.error('Erreur création dossier', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du dossier' },
      { status: 500 }
    )
  }
}

