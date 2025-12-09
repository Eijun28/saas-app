'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfilePhoto } from '@/components/profile/ProfilePhoto'
import { PersonalInfo } from '@/components/profile/PersonalInfo'
import { WeddingInfo } from '@/components/profile/WeddingInfo'
import { Preferences } from '@/components/profile/Preferences'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getProfileData, updateProfile, updateWeddingInfo } from '@/lib/actions/profile'
import { useUser } from '@/hooks/use-user'
import { Loader2, Edit2, X, Check } from 'lucide-react'
import { motion } from 'framer-motion'

type ProfileData = {
  profile: {
    prenom: string
    nom: string
    email: string
    telephone?: string | null
    date_naissance?: string | null
    adresse?: string | null
    photo_url?: string | null
  }
  coupleProfile: {
    date_marriage?: string | null
    ville_marriage?: string | null
    nombre_invites?: number | null
    type_ceremonie?: 'religieuse' | 'civile' | 'les_deux' | null
    culture?: string | null
    description?: string | null
    couleurs_mariage?: string[]
    theme?: string | null
    notifications_email?: boolean
    prestataires_recherches?: string[]
  } | null
  budgetMax?: number | null
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({})

  const fetchProfileData = async () => {
    setLoading(true)
    const data = await getProfileData()
    if (data) {
      setProfileData(data)
      // Initialiser formData avec les données existantes
      setFormData({
        prenom: data.profile.prenom || '',
        nom: data.profile.nom || '',
        telephone: data.profile.telephone || '',
        dateNaissance: data.profile.date_naissance || null,
        adresse: data.profile.adresse || '',
        dateMarriage: data.coupleProfile?.date_marriage || null,
        villeMarriage: data.coupleProfile?.ville_marriage || '',
        nombreInvites: data.coupleProfile?.nombre_invites || null,
        typeCeremonie: data.coupleProfile?.type_ceremonie || null,
        culture: data.coupleProfile?.culture || '',
        description: data.coupleProfile?.description || '',
        couleursMariage: data.coupleProfile?.couleurs_mariage || [],
        theme: data.coupleProfile?.theme || '',
        notificationsEmail: data.coupleProfile?.notifications_email ?? true,
        prestatairesRecherches: data.coupleProfile?.prestataires_recherches || [],
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/sign-in')
        return
      }
      fetchProfileData()
    }
  }, [user, userLoading, router])

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      // Mettre à jour le profil
      const profileResult = await updateProfile({
        prenom: formData.prenom,
        nom: formData.nom,
        telephone: formData.telephone,
        dateNaissance: formData.dateNaissance,
        adresse: formData.adresse,
      })

      if (profileResult.error) {
        alert(`Erreur: ${profileResult.error}`)
        setSaving(false)
        return
      }

      // Mettre à jour les infos mariage
      const weddingResult = await updateWeddingInfo({
        dateMarriage: formData.dateMarriage,
        villeMarriage: formData.villeMarriage,
        nombreInvites: formData.nombreInvites,
        typeCeremonie: formData.typeCeremonie,
        culture: formData.culture,
        description: formData.description,
        couleursMariage: formData.couleursMariage,
        theme: formData.theme,
        notificationsEmail: formData.notificationsEmail,
        prestatairesRecherches: formData.prestatairesRecherches,
      })

      if (weddingResult.error) {
        alert(`Erreur: ${weddingResult.error}`)
        setSaving(false)
        return
      }

      // Recharger les données
      await fetchProfileData()
      setIsEditing(false)
      alert('Profil mis à jour avec succès')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Une erreur est survenue lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Restaurer les valeurs initiales
    if (profileData) {
      setFormData({
        prenom: profileData.profile.prenom || '',
        nom: profileData.profile.nom || '',
        telephone: profileData.profile.telephone || '',
        dateNaissance: profileData.profile.date_naissance || null,
        adresse: profileData.profile.adresse || '',
        dateMarriage: profileData.coupleProfile?.date_marriage || null,
        villeMarriage: profileData.coupleProfile?.ville_marriage || '',
        nombreInvites: profileData.coupleProfile?.nombre_invites || null,
        typeCeremonie: profileData.coupleProfile?.type_ceremonie || null,
        culture: profileData.coupleProfile?.culture || '',
        description: profileData.coupleProfile?.description || '',
        couleursMariage: profileData.coupleProfile?.couleurs_mariage || [],
        theme: profileData.coupleProfile?.theme || '',
        notificationsEmail: profileData.coupleProfile?.notifications_email ?? true,
        prestatairesRecherches: profileData.coupleProfile?.prestataires_recherches || [],
      })
    }
    setIsEditing(false)
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#823F91]" />
          <p className="text-[#6B7280]">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-[#6B7280] mb-4">Erreur lors du chargement des données</p>
            <button
              onClick={fetchProfileData}
              className="px-4 py-2 bg-[#823F91] text-white rounded-lg hover:bg-[#6D3478]"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  const fullName = `${profileData.profile.prenom || ''} ${profileData.profile.nom || ''}`.trim()

  return (
    <div className="p-8 space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* En-tête avec photo et nom */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b"
        >
          <ProfilePhoto
            photoUrl={profileData.profile.photo_url}
            name={fullName}
            onUpdate={fetchProfileData}
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-[#111827] mb-2">
              {fullName || 'Profil'}
            </h1>
            <p className="text-[#6B7280] mb-4">{profileData.profile.email}</p>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-[#823F91] hover:bg-[#6D3478] text-white gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Modifier le profil
              </Button>
            )}
          </div>
        </motion.div>

        {/* Sections du profil */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PersonalInfo
              prenom={formData.prenom || ''}
              nom={formData.nom || ''}
              email={profileData.profile.email}
              telephone={formData.telephone}
              dateNaissance={formData.dateNaissance}
              adresse={formData.adresse}
              isEditing={isEditing}
              onChange={handleChange}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <WeddingInfo
              dateMarriage={formData.dateMarriage}
              villeMarriage={formData.villeMarriage}
              budgetMax={profileData.budgetMax}
              nombreInvites={formData.nombreInvites}
              typeCeremonie={formData.typeCeremonie}
              culture={formData.culture}
              description={formData.description}
              isEditing={isEditing}
              onChange={handleChange}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Preferences
              prestatairesRecherches={formData.prestatairesRecherches || []}
              couleursMariage={formData.couleursMariage || []}
              theme={formData.theme}
              notificationsEmail={formData.notificationsEmail}
              isEditing={isEditing}
              onChange={handleChange}
            />
          </motion.div>
        </div>

        {/* Boutons d'action en mode édition */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 pt-6 border-t"
          >
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#823F91] hover:bg-[#6D3478] text-white gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={saving}
              variant="outline"
              className="flex-1 gap-2"
            >
              <X className="h-4 w-4" />
              Annuler
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

