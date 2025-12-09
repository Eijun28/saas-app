'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

    // Vérifier la taille (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { error: 'Le fichier est trop volumineux (max 5MB)' }
    }

    // Vérifier le type MIME
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { error: 'Format non supporté (JPG, PNG, WEBP uniquement)' }
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
      console.error('Upload error:', uploadError)
      return { error: uploadError.message }
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
      console.error('Update error:', updateError)
      return { error: updateError.message }
    }

    revalidatePath('/dashboard/profil')
    return { success: true, photoUrl: data.publicUrl }
  } catch (error) {
    console.error('Error in uploadProfilePhoto:', error)
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
      console.error('Error updating profile:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/profil')
    return { success: true }
  } catch (error) {
    console.error('Error in updateProfile:', error)
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
        console.error('Error updating wedding info:', error)
        return { error: error.message }
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
        console.error('Error creating wedding info:', error)
        return { error: error.message }
      }
    }

    revalidatePath('/dashboard/profil')
    return { success: true }
  } catch (error) {
    console.error('Error in updateWeddingInfo:', error)
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
      console.error('Error fetching profile:', profileError)
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
    console.error('Error in getProfileData:', error)
    return null
  }
}

