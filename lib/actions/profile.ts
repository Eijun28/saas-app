'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateUploadedFile } from '@/lib/security'
import { logger } from '@/lib/logger'

/**
 * Upload une photo de profil vers Supabase Storage
 */
export async function uploadProfilePhoto(formData: FormData) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié' }
    }

    const file = formData.get('photo') as File
    if (!file) {
      return { error: 'Aucun fichier fourni' }
    }

    // Valider le fichier
    const validation = validateUploadedFile(file, {
      allowImages: true,
      allowPdfs: false,
    })
    
    if (!validation.valid) {
      logger.warn('Fichier photo invalide rejeté', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        userId: user.id,
      })
      return { error: validation.error }
    }

    // Générer un nom unique
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}.${fileExt}`
    const filePath = `profile-photos/${fileName}`

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      logger.error('Erreur upload photo de profil', uploadError, { userId: user.id })
      
      // Message d'erreur plus explicite pour le bucket manquant
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
        return { 
          error: 'Le bucket "profile-photos" n\'existe pas dans Supabase Storage. Veuillez le créer dans votre dashboard Supabase : Storage → New bucket → Nom: "profile-photos" → Public bucket: activé' 
        }
      }
      
      return { error: 'Erreur lors de l\'upload de la photo' }
    }

    // Récupérer l'URL publique
    const { data } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    // Mettre à jour le profil
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ photo_url: data.publicUrl })
      .eq('id', user.id)

    if (updateError) {
      logger.error('Erreur mise à jour photo de profil', updateError, { userId: user.id })
      return { error: 'Erreur lors de la mise à jour du profil' }
    }

    revalidatePath('/couple/profil')
    return { success: true, photoUrl: data.publicUrl }
  } catch (error) {
    logger.error('Erreur uploadProfilePhoto', error)
    return { error: 'Erreur lors de l\'upload de la photo' }
  }
}

/**
 * Met à jour les informations personnelles du profil
 */
export async function updateProfile(profileData: {
  prenom?: string
  nom?: string
  telephone?: string
  dateNaissance?: string | null
  adresse?: string
}) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié' }
    }

    const updateData: any = {}
    
    if (profileData.prenom !== undefined) {
      updateData.prenom = profileData.prenom.trim() || null
    }
    if (profileData.nom !== undefined) {
      updateData.nom = profileData.nom.trim() || null
    }
    if (profileData.telephone !== undefined) {
      updateData.telephone = profileData.telephone.trim() || null
    }
    if (profileData.dateNaissance !== undefined) {
      updateData.date_naissance = profileData.dateNaissance || null
    }
    if (profileData.adresse !== undefined) {
      updateData.adresse = profileData.adresse.trim() || null
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (error) {
      logger.error('Erreur mise à jour profil', error, { userId: user.id })
      return { error: 'Erreur lors de la mise à jour du profil' }
    }

    revalidatePath('/couple/profil')
    return { success: true }
  } catch (error) {
    logger.error('Erreur updateProfile', error)
    return { error: 'Erreur lors de la mise à jour du profil' }
  }
}

/**
 * Met à jour les informations du mariage
 */
export async function updateWeddingInfo(weddingData: {
  dateMarriage?: string | null
  villeMarriage?: string
  nombreInvites?: number | null
  typeCeremonie?: 'religieuse' | 'civile' | 'les_deux' | null
  culture?: string
  description?: string
  couleursMariage?: string[]
  theme?: string
  notificationsEmail?: boolean
  prestatairesRecherches?: string[]
}) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié' }
    }

    const updateData: any = {}
    
    if (weddingData.dateMarriage !== undefined) {
      updateData.date_marriage = weddingData.dateMarriage || null
    }
    if (weddingData.villeMarriage !== undefined) {
      updateData.ville_marriage = weddingData.villeMarriage.trim() || null
    }
    if (weddingData.nombreInvites !== undefined) {
      updateData.nombre_invites = weddingData.nombreInvites || null
    }
    if (weddingData.typeCeremonie !== undefined) {
      updateData.type_ceremonie = weddingData.typeCeremonie || null
    }
    if (weddingData.culture !== undefined) {
      updateData.culture = weddingData.culture.trim() || null
    }
    if (weddingData.description !== undefined) {
      updateData.description = weddingData.description.trim() || null
    }
    if (weddingData.couleursMariage !== undefined) {
      updateData.couleurs_mariage = weddingData.couleursMariage || []
    }
    if (weddingData.theme !== undefined) {
      updateData.theme = weddingData.theme.trim() || null
    }
    if (weddingData.notificationsEmail !== undefined) {
      updateData.notifications_email = weddingData.notificationsEmail
    }
    if (weddingData.prestatairesRecherches !== undefined) {
      updateData.prestataires_recherches = weddingData.prestatairesRecherches
    }

    // Vérifier si le profil couple existe
    const { data: existing } = await supabase
      .from('couple_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Mise à jour
      const { error } = await supabase
        .from('couple_profiles')
        .update(updateData)
        .eq('user_id', user.id)

      if (error) {
        logger.error('Erreur mise à jour infos mariage', error, { userId: user.id })
        return { error: 'Erreur lors de la mise à jour des informations' }
      }
    } else {
      // Création
      const { error } = await supabase
        .from('couple_profiles')
        .insert({
          user_id: user.id,
          ...updateData,
        })

      if (error) {
        logger.error('Erreur création infos mariage', error, { userId: user.id })
        return { error: 'Erreur lors de la création des informations' }
      }
    }

    revalidatePath('/couple/profil')
    return { success: true }
  } catch (error) {
    logger.error('Erreur updateWeddingInfo', error)
    return { error: 'Erreur lors de la mise à jour des informations du mariage' }
  }
}

/**
 * Récupère toutes les données du profil
 */
export async function getProfileData() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return null
    }

    // Récupérer le profil de base
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      logger.error('Erreur récupération profil', profileError, { userId: user.id })
      return null
    }

    // Récupérer le profil couple
    const { data: coupleProfile, error: coupleError } = await supabase
      .from('couple_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Récupérer le budget
    const { data: budget } = await supabase
      .from('couple_budgets')
      .select('budget_max')
      .eq('user_id', user.id)
      .single()

    return {
      profile: {
        ...profile,
        email: user.email,
      },
      coupleProfile: coupleProfile || null,
      budgetMax: budget?.budget_max || null,
    }
  } catch (error) {
    logger.error('Erreur getProfileData', error)
    return null
  }
}

