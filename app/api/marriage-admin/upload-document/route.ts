// app/api/marriage-admin/upload-document/route.ts
// COPIE-COLLE TOUT CE CODE

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
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

    console.log('📤 Upload:', file?.name, documentType)

    if (!file || !marriageFileId || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

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
      console.error('❌ Upload error:', uploadError)
      throw uploadError
    }

    console.log('✅ Fichier uploadé:', fileName)

    // Récupère l'URL publique
    const { data: urlData } = adminClient.storage
      .from('marriage-documents')
      .getPublicUrl(fileName)

    console.log('🔗 URL:', urlData.publicUrl)

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

    if (docError) throw docError

    console.log('✅ Document enregistré:', docData.id)

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
    console.error('❌ Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

