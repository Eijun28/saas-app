'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Loader2, Edit2, X, Check, User, Mail, Phone, MapPin, Wallet, Globe, FileText, Calendar as CalendarIcon } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'

export default function CoupleProfilPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [coupleProfile, setCoupleProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    email: '',
    telephone: '',
    ville_marriage: '',
    date_marriage: null as Date | null,
    budget_min: '',
    budget_max: '',
    culture: '',
    prestataires_recherches: [] as string[],
  })

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/sign-in')
      return
    }
    if (user) {
      loadProfile()
    }
  }, [user, userLoading, router])

  const loadProfile = async () => {
    if (!user) return
    
    setLoading(true)
    const supabase = createClient()
    
    try {
      // Charger le profil de base
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erreur chargement profil:', profileError)
      }

      // Charger le profil couple
      const { data: coupleData, error: coupleError } = await supabase
        .from('couple_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (coupleError) {
        // PGRST116 = no rows returned (normal si le profil n'existe pas encore)
        if (coupleError.code !== 'PGRST116') {
          console.error('Erreur chargement profil couple:', coupleError)
          // Si la table n'existe pas, on continue quand même (elle sera créée à la sauvegarde)
          if (coupleError.message.includes('does not exist') || coupleError.message.includes('schema cache')) {
            console.warn('La table couple_profiles n\'existe pas encore. Elle sera créée lors de la première sauvegarde.')
          }
        }
      }

      setProfile(profileData)
      setCoupleProfile(coupleData)
      
      setFormData({
        email: user.email || '',
        telephone: profileData?.telephone || '',
        ville_marriage: coupleData?.ville_marriage || '',
        date_marriage: coupleData?.date_marriage ? new Date(coupleData.date_marriage) : null,
        budget_min: coupleData?.budget_min?.toString() || '',
        budget_max: coupleData?.budget_max?.toString() || '',
        culture: coupleData?.culture || '',
        prestataires_recherches: coupleData?.prestataires_recherches || [],
      })
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    
    setSaving(true)
    const supabase = createClient()
    
    try {
      // Mettre à jour le téléphone dans profiles
      if (formData.telephone !== (profile?.telephone || '')) {
        const { error: phoneError } = await supabase
          .from('profiles')
          .update({ telephone: formData.telephone.trim() || null })
          .eq('id', user.id)
        
        if (phoneError) {
          // Si l'erreur indique que la colonne n'existe pas, on continue quand même
          if (phoneError.message.includes('column') && phoneError.message.includes('does not exist')) {
            console.warn('La colonne telephone n\'existe pas encore dans la table profiles.')
          } else {
            console.error('Erreur mise à jour téléphone:', phoneError)
            // Ne pas bloquer si c'est juste le téléphone
          }
        }
      }

      // Préparer les données du profil couple
      const coupleUpdate: any = {
        user_id: user.id,
        ville_marriage: formData.ville_marriage.trim() || null,
        date_marriage: formData.date_marriage ? formData.date_marriage.toISOString().split('T')[0] : null,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        culture: formData.culture.trim() || null,
        prestataires_recherches: formData.prestataires_recherches.length > 0 ? formData.prestataires_recherches : null,
      }

      // Utiliser upsert pour créer ou mettre à jour le profil couple
      const { data: upsertedData, error: coupleError } = await supabase
        .from('couple_profiles')
        .upsert(coupleUpdate, {
          onConflict: 'user_id',
        })
        .select()
        .single()

      if (coupleError) {
        console.error('Erreur détaillée couple_profiles:', {
          message: coupleError.message,
          details: coupleError.details,
          hint: coupleError.hint,
          code: coupleError.code,
        })
        
        // Si la table n'existe pas, donner des instructions claires
        if (coupleError.message.includes('does not exist') || coupleError.message.includes('schema cache')) {
          throw new Error(
            'La table couple_profiles n\'existe pas dans votre base de données Supabase. ' +
            'Veuillez exécuter le script SQL SIGNUP_SQL.sql dans votre projet Supabase pour créer les tables nécessaires.'
          )
        }
        
        throw new Error(`Erreur lors de la sauvegarde: ${coupleError.message}`)
      }

      // Recharger les données
      await loadProfile()
      setIsEditing(false)
      
      // Afficher un message de succès
      const successMessage = document.createElement('div')
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      successMessage.textContent = 'Profil mis à jour avec succès ✓'
      document.body.appendChild(successMessage)
      setTimeout(() => {
        successMessage.remove()
      }, 3000)
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert(`Erreur lors de la sauvegarde: ${error.message || 'Une erreur est survenue'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile && coupleProfile) {
      setFormData({
        email: user?.email || '',
        telephone: profile.telephone || '',
        ville_marriage: coupleProfile.ville_marriage || '',
        date_marriage: coupleProfile.date_marriage ? new Date(coupleProfile.date_marriage) : null,
        budget_min: coupleProfile.budget_min?.toString() || '',
        budget_max: coupleProfile.budget_max?.toString() || '',
        culture: coupleProfile.culture || '',
        prestataires_recherches: coupleProfile.prestataires_recherches || [],
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#6B7280]">Erreur lors du chargement des données</p>
        </div>
      </div>
    )
  }

  const fullName = `${profile.prenom || ''} ${profile.nom || ''}`.trim()

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-semibold text-[#0D0D0D] mb-2">
              Mon profil
            </h1>
            <p className="text-[#4A4A4A]">
              Gérez vos informations personnelles et de mariage
            </p>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Modifier
            </Button>
          )}
        </motion.div>

        {/* Informations personnelles */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#823F91]" />
              <CardTitle>Informations personnelles</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <p className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg">
                  {profile.prenom || 'Non renseigné'}
                </p>
                <p className="text-xs text-[#9CA3AF]">(non modifiable)</p>
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <p className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg">
                  {profile.nom || 'Non renseigné'}
                </p>
                <p className="text-xs text-[#9CA3AF]">(non modifiable)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="h-4 w-4 inline mr-2" />
                Email
              </Label>
              <p className="text-[#6B7280] py-2 px-3 bg-[#F9FAFB] rounded-lg">
                {formData.email}
                <span className="ml-2 text-xs text-[#9CA3AF]">(non modifiable)</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">
                <Phone className="h-4 w-4 inline mr-2" />
                Numéro de téléphone
              </Label>
              {isEditing ? (
                <Input
                  id="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                  className="cursor-text"
                />
              ) : (
                <div 
                  onClick={() => setIsEditing(true)}
                  className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg cursor-pointer hover:bg-[#E8D4EF] transition-colors"
                >
                  {formData.telephone || 'Non renseigné - Cliquez pour modifier'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informations de mariage */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#823F91]" />
              <CardTitle>Informations de mariage</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ville_marriage">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Ville du mariage
                </Label>
                {isEditing ? (
                  <Input
                    id="ville_marriage"
                    value={formData.ville_marriage}
                    onChange={(e) => setFormData({ ...formData, ville_marriage: e.target.value })}
                    placeholder="Paris"
                  />
                ) : (
                  <div 
                    onClick={() => setIsEditing(true)}
                    className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg cursor-pointer hover:bg-[#E8D4EF] transition-colors"
                  >
                    {formData.ville_marriage || 'Non renseigné - Cliquez pour modifier'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_marriage">
                  <CalendarIcon className="h-4 w-4 inline mr-2" />
                  Date du mariage
                </Label>
                {isEditing ? (
                  <DatePicker
                    value={formData.date_marriage}
                    onChange={(date) => setFormData({ ...formData, date_marriage: date || null })}
                    placeholder="Sélectionner une date"
                  />
                ) : (
                  <div 
                    onClick={() => setIsEditing(true)}
                    className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg cursor-pointer hover:bg-[#E8D4EF] transition-colors"
                  >
                    {formData.date_marriage 
                      ? new Date(formData.date_marriage).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Non renseigné - Cliquez pour modifier'}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget_min">
                  <Wallet className="h-4 w-4 inline mr-2" />
                  Budget minimum (€)
                </Label>
                {isEditing ? (
                  <Input
                    id="budget_min"
                    type="number"
                    value={formData.budget_min}
                    onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                    placeholder="5000"
                  />
                ) : (
                  <div 
                    onClick={() => setIsEditing(true)}
                    className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg cursor-pointer hover:bg-[#E8D4EF] transition-colors"
                  >
                    {formData.budget_min ? `${parseFloat(formData.budget_min).toLocaleString('fr-FR')} €` : 'Non renseigné - Cliquez pour modifier'}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_max">
                  <Wallet className="h-4 w-4 inline mr-2" />
                  Budget maximum (€)
                </Label>
                {isEditing ? (
                  <Input
                    id="budget_max"
                    type="number"
                    value={formData.budget_max}
                    onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                    placeholder="50000"
                  />
                ) : (
                  <div 
                    onClick={() => setIsEditing(true)}
                    className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg cursor-pointer hover:bg-[#E8D4EF] transition-colors"
                  >
                    {formData.budget_max ? `${parseFloat(formData.budget_max).toLocaleString('fr-FR')} €` : 'Non renseigné - Cliquez pour modifier'}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="culture">
                <Globe className="h-4 w-4 inline mr-2" />
                Origine / Culture
              </Label>
              {isEditing ? (
                <Input
                  id="culture"
                  value={formData.culture}
                  onChange={(e) => setFormData({ ...formData, culture: e.target.value })}
                  placeholder="Français, Marocain, etc."
                />
              ) : (
                <div 
                  onClick={() => setIsEditing(true)}
                  className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg cursor-pointer hover:bg-[#E8D4EF] transition-colors"
                >
                  {formData.culture || 'Non renseigné - Cliquez pour modifier'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                <FileText className="h-4 w-4 inline mr-2" />
                Besoins / Prestataires recherchés
              </Label>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Ajouter un besoin (ex: Photographe)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        setFormData({
                          ...formData,
                          prestataires_recherches: [...formData.prestataires_recherches, e.currentTarget.value.trim()],
                        })
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {formData.prestataires_recherches.map((need, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#E8D4EF] text-[#823F91] rounded-full text-sm flex items-center gap-2"
                      >
                        {need}
                        <button
                          onClick={() => {
                            setFormData({
                              ...formData,
                              prestataires_recherches: formData.prestataires_recherches.filter((_, i) => i !== index),
                            })
                          }}
                          className="hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.prestataires_recherches.length > 0 ? (
                    formData.prestataires_recherches.map((need, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#E8D4EF] text-[#823F91] rounded-full text-sm"
                      >
                        {need}
                      </span>
                    ))
                  ) : (
                    <div 
                      onClick={() => setIsEditing(true)}
                      className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg cursor-pointer hover:bg-[#E8D4EF] transition-colors"
                    >
                      Aucun besoin renseigné - Cliquez pour modifier
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Boutons d'action */}
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

