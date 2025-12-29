import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadLimiter, getClientIp } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { validateUploadedFile } from '@/lib/security'

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = getClientIp(req)
  if (!uploadLimiter.check(ip)) {
    logger.warn('Rate limit dépassé pour upload', { ip })
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      { status: 429 }
    )
  }
  try {
    // Vérifier l'authentification avec le client server
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()

    const file = formData.get('file') as File
    const marriageFileId = formData.get('marriageFileId') as string
    const documentType = formData.get('documentType') as string
    const userId = formData.get('userId') as string || user.id

    if (!file || !marriageFileId || !documentType) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      )
    }

    // Valider le fichier
    const validation = validateUploadedFile(file, {
      allowImages: true,
      allowPdfs: true,
    })
    if (!validation.valid) {
      logger.warn('Fichier invalide rejeté', { 
        fileName: file.name, 
        fileType: file.type, 
        fileSize: file.size,
        userId: user.id 
      })
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    logger.info('Upload de document', { 
      fileName: file.name, 
      documentType, 
      userId: user.id 
    })

    // Vérifier que l'utilisateur peut accéder à ce dossier de mariage
    const { data: marriageFile, error: fileError } = await supabase
      .from('marriage_administrative_files')
      .select('couple_id')
      .eq('id', marriageFileId)
      .single()

    if (fileError || !marriageFile || marriageFile.couple_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Utiliser le client admin pour l'upload (bypass RLS)
    const adminClient = createAdminClient()

    // Prépare le nom du fichier
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${documentType}-${Date.now()}.${fileExt}`

    // Upload vers Storage
    const { error: uploadError } = await adminClient.storage
      .from('marriage-documents')
      .upload(fileName, file)

    if (uploadError) {
      logger.error('Erreur upload fichier', uploadError, { 
        fileName, 
        userId: user.id,
        marriageFileId 
      })
      throw uploadError
    }

    logger.info('Fichier uploadé avec succès', { fileName, userId: user.id })

    // Récupère l'URL publique
    const { data: urlData } = adminClient.storage
      .from('marriage-documents')
      .getPublicUrl(fileName)

    // Enregistre dans la DB avec le client admin
    const { data: docData, error: docError } = await adminClient
      .from('uploaded_documents')
      .insert({
        marriage_file_id: marriageFileId,
        couple_id: userId,
        document_type: documentType,
        file_url: urlData.publicUrl,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: 'uploaded',
      })
      .select()
      .single()

    if (docError) {
      logger.error('Erreur enregistrement document', docError, { 
        fileName, 
        userId: user.id,
        marriageFileId 
      })
      throw docError
    }

    logger.info('Document enregistré avec succès', { 
      documentId: docData.id, 
      userId: user.id 
    })

    // Met à jour le statut
    await adminClient
      .from('marriage_administrative_files')
      .update({ status: 'in_progress' })
      .eq('id', marriageFileId)

    return NextResponse.json({
      success: true,
      data: docData,
    })
  } catch (error: any) {
    logger.error('Erreur upload document', error, { userId: user?.id })
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du document' },
      { status: 500 }
    )
  }
}


