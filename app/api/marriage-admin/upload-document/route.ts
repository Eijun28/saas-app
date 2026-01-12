// app/api/marriage-admin/upload-document/route.ts
// COPIE-COLLE TOUT CE CODE

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadDocumentSchema } from '@/lib/validations/marriage-admin.schema'
import { logger } from '@/lib/logger'

// Constantes de validation des fichiers
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.docx', '.xlsx']

/**
 * Valide un fichier uploadé côté serveur
 */
function validateUploadedFile(file: File): { valid: boolean; error?: string } {
  // Validation taille
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Fichier trop volumineux (max 10MB)' }
  }

  if (file.size === 0) {
    return { valid: false, error: 'Le fichier est vide' }
  }

  // Validation type MIME
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non autorisé (PDF, JPG, PNG, WEBP uniquement)' }
  }

  // Validation extension
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Extension de fichier non autorisée' }
  }

  // Vérifier que l'extension correspond au type MIME
  const extToMime: Record<string, string[]> = {
    '.pdf': ['application/pdf'],
    '.jpg': ['image/jpeg', 'image/jpg'],
    '.jpeg': ['image/jpeg', 'image/jpg'],
    '.png': ['image/png'],
    '.webp': ['image/webp'],
  }

  const expectedMimes = extToMime[ext]
  if (!expectedMimes || !expectedMimes.includes(file.type)) {
    return { valid: false, error: 'Le type MIME ne correspond pas à l\'extension du fichier' }
  }

  return { valid: true }
}

/**
 * Nettoie le nom de fichier pour prévenir les attaques path traversal
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Remplacer caractères spéciaux
    .replace(/\.\./g, '') // Supprimer path traversal
    .replace(/^\.+/, '') // Supprimer les points au début
    .slice(0, 255) // Limiter la longueur
}

/**
 * Vérifie la signature binaire (magic number) d'un fichier
 * @param buffer - Buffer du fichier
 * @param mimeType - Type MIME déclaré
 * @returns true si la signature correspond au MIME type
 */
function verifyFileSignature(buffer: Buffer, mimeType: string): boolean {
  const signatures: Record<string, number[][]> = {
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      [0x50, 0x4B, 0x03, 0x04] // ZIP (DOCX est un ZIP)
    ],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
      [0x50, 0x4B, 0x03, 0x04] // ZIP (XLSX est un ZIP)
    ]
  }

  const expectedSignatures = signatures[mimeType]
  if (!expectedSignatures) {
    // Type non supporté pour vérification
    return true
  }

  // Vérifier si une des signatures correspond
  return expectedSignatures.some(signature => {
    return signature.every((byte, index) => buffer[index] === byte)
  })
}

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
    // SÉCURITÉ: Utiliser UNIQUEMENT user.id de la session, jamais depuis formData
    const userId = user.id

    // Validation avec Zod
    const validationResult = uploadDocumentSchema.safeParse({
      marriageFileId,
      documentType,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Fichier requis' },
        { status: 400 }
      )
    }

    // Validation complète du fichier côté serveur
    const fileValidation = validateUploadedFile(file)
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error || 'Fichier invalide' },
        { status: 400 }
      )
    }

    // ✅ VALIDATION : Vérifier la signature binaire
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const isValidSignature = verifyFileSignature(buffer, file.type)
    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Le contenu du fichier ne correspond pas à son extension' },
        { status: 400 }
      )
    }

    // ✅ Extraire la vraie dernière extension
    const parts = sanitizeFileName(file.name).split('.')
    const fileExt = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'bin'

    // ✅ Vérifier que l'extension correspond au MIME type
    const mimeToExt: Record<string, string[]> = {
      'application/pdf': ['pdf'],
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx']
    }

    const allowedExts = mimeToExt[file.type] || []
    if (!allowedExts.includes(fileExt)) {
      return NextResponse.json(
        { error: `Extension .${fileExt} ne correspond pas au type ${file.type}` },
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

    // Prépare le nom du fichier de manière sécurisée
    // SÉCURITÉ: Utiliser user.id directement et nettoyer le nom
    // Réutiliser les variables déjà déclarées plus haut (parts et fileExt)
    const safeDocumentType = sanitizeFileName(documentType)
    const fileName = `${user.id}/${safeDocumentType}-${Date.now()}.${fileExt}`

    // Upload vers Storage
    const { error: uploadError } = await adminClient.storage
      .from('marriage-documents')
      .upload(fileName, file)

    if (uploadError) {
      logger.error('❌ Upload error', uploadError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload du fichier' },
        { status: 500 }
      )
    }

    // Récupère l'URL publique
    const { data: urlData } = adminClient.storage
      .from('marriage-documents')
      .getPublicUrl(fileName)

    // Enregistre dans la DB avec le client admin
    // SÉCURITÉ: Utiliser user.id directement, pas userId qui pourrait être falsifié
    const { data: docData, error: docError } = await adminClient
      .from('uploaded_documents')
      .insert({
        marriage_file_id: marriageFileId,
        couple_id: user.id, // Utiliser directement user.id de la session
        document_type: documentType,
        file_url: urlData.publicUrl,
        original_filename: sanitizeFileName(file.name),
        file_size: file.size,
        mime_type: file.type,
        status: 'uploaded',
      })
      .select()
      .single()

    if (docError) {
      logger.error('❌ Erreur enregistrement document', docError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement du document' },
        { status: 500 }
      )
    }

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
    logger.error('❌ Erreur serveur', error)
    return NextResponse.json(
      { error: 'Une erreur s\'est produite lors du traitement de votre demande' },
      { status: 500 }
    )
  }
}

