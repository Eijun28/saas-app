import { createClient } from '@/lib/supabase/client'

const REVIEW_PHOTOS_BUCKET = 'review-photos'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export interface UploadReviewPhotoResult {
  url: string
  path: string
}

/**
 * Upload une photo d'avis dans le bucket "review-photos" (public read).
 * Retourne l'URL publique et le path dans le bucket.
 */
export async function uploadReviewPhoto(
  file: File,
  coupleId: string,
  reviewId: string
): Promise<UploadReviewPhotoResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format non supporté. Utilisez JPG, PNG ou WebP.')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Fichier trop volumineux (max 5 Mo).')
  }

  const supabase = createClient()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const timestamp = Date.now()
  const path = `${coupleId}/${reviewId}/${timestamp}.${ext}`

  const { error } = await supabase.storage
    .from(REVIEW_PHOTOS_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage
    .from(REVIEW_PHOTOS_BUCKET)
    .getPublicUrl(path)

  return { url: data.publicUrl, path }
}

/**
 * Supprime une photo d'avis depuis son path dans le bucket.
 */
export async function deleteReviewPhoto(path: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(REVIEW_PHOTOS_BUCKET)
    .remove([path])
  if (error) throw new Error(error.message)
}
