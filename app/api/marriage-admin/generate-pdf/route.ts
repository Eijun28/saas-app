import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMarriageDossierPDF } from '@/lib/pdf/marriage-dossier-generator'
import { generatePdfSchema } from '@/lib/validations/marriage-admin.schema'
import { logger } from '@/lib/logger'

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

    const body = await req.json()

    // Validation avec Zod
    const validationResult = generatePdfSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      )
    }

    const { marriageFileId } = validationResult.data

    logger.info('📄 Génération PDF pour dossier:', marriageFileId)

    // 1. Récupère le dossier
    const { data: marriageFile, error: fileError } = await supabase
      .from('marriage_administrative_files')
      .select('*')
      .eq('id', marriageFileId)
      .eq('couple_id', user.id) // Vérifier que l'utilisateur est propriétaire
      .single()

    if (fileError) throw fileError

    if (!marriageFile) {
      return NextResponse.json(
        { error: 'Dossier non trouvé ou accès refusé' },
        { status: 404 }
      )
    }

    // 2. Récupère les documents uploadés
    const { data: uploadedDocs, error: docsError } = await supabase
      .from('uploaded_documents')
      .select('*')
      .eq('marriage_file_id', marriageFileId)

    if (docsError) throw docsError

    logger.info('✅ Données récupérées:', {
      dossier: marriageFile.id,
      documents: uploadedDocs?.length || 0
    })

    // 3. Génère le PDF
    const pdfBytes = await generateMarriageDossierPDF(marriageFile, uploadedDocs || [])

    logger.info('✅ PDF généré:', pdfBytes.length, 'bytes')

    // 4. Retourne le PDF
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Dossier-Mariage-${marriageFile.municipality}.pdf"`
      }
    })
  } catch (error: any) {
    logger.error('❌ Erreur génération PDF', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}

