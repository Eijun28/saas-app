'use client'

import { useState, useEffect } from 'react'
import { FileText, Building2, CreditCard, MapPin, Phone, Mail, Save, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BillingInfo {
  id?: string
  nom_societe: string
  siret: string
  tva_intracommunautaire: string
  rib: string
  iban: string
  bic: string
  adresse: string
  code_postal: string
  ville: string
  pays: string
  telephone: string
  email_facturation: string
}

export default function DevisFacturesPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    nom_societe: '',
    siret: '',
    tva_intracommunautaire: '',
    rib: '',
    iban: '',
    bic: '',
    adresse: '',
    code_postal: '',
    ville: '',
    pays: 'France',
    telephone: '',
    email_facturation: '',
  })

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      setUser(user)

      // Charger les informations de facturation existantes
      const { data, error } = await supabase
        .from('prestataire_billing_info')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erreur lors du chargement:', error)
        toast.error('Erreur', {
          description: 'Impossible de charger les informations de facturation',
        })
      } else if (data) {
        setBillingInfo({
          nom_societe: data.nom_societe || '',
          siret: data.siret || '',
          tva_intracommunautaire: data.tva_intracommunautaire || '',
          rib: data.rib || '',
          iban: data.iban || '',
          bic: data.bic || '',
          adresse: data.adresse || '',
          code_postal: data.code_postal || '',
          ville: data.ville || '',
          pays: data.pays || 'France',
          telephone: data.telephone || '',
          email_facturation: data.email_facturation || '',
        })
      }

      setLoading(false)
    }

    loadData()
  }, [supabase])

  const handleInputChange = (field: keyof BillingInfo, value: string) => {
    setBillingInfo(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    if (!billingInfo.nom_societe.trim()) {
      toast.error('Erreur', {
        description: 'Le nom de la société est requis',
      })
      return false
    }

    if (!billingInfo.adresse.trim()) {
      toast.error('Erreur', {
        description: 'L\'adresse est requise',
      })
      return false
    }

    if (!billingInfo.code_postal.trim()) {
      toast.error('Erreur', {
        description: 'Le code postal est requis',
      })
      return false
    }

    if (!billingInfo.ville.trim()) {
      toast.error('Erreur', {
        description: 'La ville est requise',
      })
      return false
    }

    // Vérifier qu'au moins RIB ou IBAN est rempli
    if (!billingInfo.rib.trim() && !billingInfo.iban.trim()) {
      toast.error('Erreur', {
        description: 'Veuillez renseigner au moins le RIB ou l\'IBAN',
      })
      return false
    }

    // Validation format IBAN (basique)
    if (billingInfo.iban.trim() && billingInfo.iban.trim().length < 15) {
      toast.error('Erreur', {
        description: 'L\'IBAN doit contenir au moins 15 caractères',
      })
      return false
    }

    // Validation format SIRET (14 chiffres)
    const siretClean = billingInfo.siret.trim().replace(/\s/g, '')
    if (siretClean && !/^\d{14}$/.test(siretClean)) {
      toast.error('Erreur', {
        description: 'Le SIRET doit contenir exactement 14 chiffres',
      })
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    if (!user) {
      toast.error('Erreur', {
        description: 'Vous devez être connecté pour sauvegarder',
      })
      return
    }

    setSaving(true)

    try {
      const dataToSave = {
        user_id: user.id,
        nom_societe: billingInfo.nom_societe.trim(),
        siret: billingInfo.siret.trim() || null,
        tva_intracommunautaire: billingInfo.tva_intracommunautaire.trim() || null,
        rib: billingInfo.rib.trim() || null,
        iban: billingInfo.iban.trim() || null,
        bic: billingInfo.bic.trim() || null,
        adresse: billingInfo.adresse.trim(),
        code_postal: billingInfo.code_postal.trim(),
        ville: billingInfo.ville.trim(),
        pays: billingInfo.pays.trim() || 'France',
        telephone: billingInfo.telephone.trim() || null,
        email_facturation: billingInfo.email_facturation.trim() || null,
      }

      const { data, error } = await supabase
        .from('prestataire_billing_info')
        .upsert(dataToSave, {
          onConflict: 'user_id',
        })
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de la sauvegarde:', error)
        toast.error('Erreur', {
          description: error.message || 'Impossible de sauvegarder les informations',
        })
        setSaving(false)
        return
      }

      if (data) {
        setBillingInfo(prev => ({ ...prev, id: data.id }))
      }

      toast.success('Succès', {
        description: 'Informations de facturation enregistrées',
      })
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur', {
        description: 'Une erreur inattendue s\'est produite',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* En-tête */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="h-8 w-8 text-[#823F91]" />
          Devis et Factures
        </h1>
        <p className="text-gray-600">
          Renseignez vos informations de facturation pour générer automatiquement vos devis et factures
        </p>
      </div>

      {/* Formulaire */}
      <Tabs defaultValue="entreprise" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="entreprise">Entreprise</TabsTrigger>
          <TabsTrigger value="bancaire">Coordonnées bancaires</TabsTrigger>
          <TabsTrigger value="adresse">Adresse</TabsTrigger>
        </TabsList>

        {/* Onglet Entreprise */}
        <TabsContent value="entreprise" className="space-y-6 mt-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-5 w-5 text-[#823F91]" />
              <h2 className="text-xl font-semibold">Informations de l'entreprise</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom_societe">
                  Nom de la société <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nom_societe"
                  placeholder="Ex: Mariage & Co"
                  value={billingInfo.nom_societe}
                  onChange={(e) => handleInputChange('nom_societe', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    placeholder="12345678901234"
                    value={billingInfo.siret}
                    onChange={(e) => handleInputChange('siret', e.target.value.replace(/\D/g, ''))}
                    maxLength={14}
                  />
                  <p className="text-xs text-gray-500">14 chiffres</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tva_intracommunautaire">TVA Intracommunautaire</Label>
                  <Input
                    id="tva_intracommunautaire"
                    placeholder="FR12345678901"
                    value={billingInfo.tva_intracommunautaire}
                    onChange={(e) => handleInputChange('tva_intracommunautaire', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    value={billingInfo.telephone}
                    onChange={(e) => handleInputChange('telephone', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_facturation">Email de facturation</Label>
                  <Input
                    id="email_facturation"
                    type="email"
                    placeholder="facturation@exemple.fr"
                    value={billingInfo.email_facturation}
                    onChange={(e) => handleInputChange('email_facturation', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Optionnel, différent de votre email de connexion</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Onglet Coordonnées bancaires */}
        <TabsContent value="bancaire" className="space-y-6 mt-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-5 w-5 text-[#823F91]" />
              <h2 className="text-xl font-semibold">Coordonnées bancaires</h2>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Information importante</p>
                <p>Renseignez au moins le RIB (format français) ou l'IBAN (format européen). Les deux peuvent être remplis.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rib">RIB (Relevé d'Identité Bancaire)</Label>
                <Input
                  id="rib"
                  placeholder="12345 67890 12345678901 12"
                  value={billingInfo.rib}
                  onChange={(e) => handleInputChange('rib', e.target.value)}
                />
                <p className="text-xs text-gray-500">Format français (23 caractères)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="iban">
                  IBAN <span className="text-red-500">*</span> (si pas de RIB)
                </Label>
                <Input
                  id="iban"
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                  value={billingInfo.iban}
                  onChange={(e) => handleInputChange('iban', e.target.value.toUpperCase().replace(/\s/g, ''))}
                />
                <p className="text-xs text-gray-500">Format européen standard</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bic">BIC / SWIFT</Label>
                <Input
                  id="bic"
                  placeholder="ABCDEFGHXXX"
                  value={billingInfo.bic}
                  onChange={(e) => handleInputChange('bic', e.target.value.toUpperCase())}
                />
                <p className="text-xs text-gray-500">Code d'identification bancaire international</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Onglet Adresse */}
        <TabsContent value="adresse" className="space-y-6 mt-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="h-5 w-5 text-[#823F91]" />
              <h2 className="text-xl font-semibold">Adresse de facturation</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adresse">
                  Adresse <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="adresse"
                  placeholder="123 Rue de la République"
                  value={billingInfo.adresse}
                  onChange={(e) => handleInputChange('adresse', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code_postal">
                    Code postal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code_postal"
                    placeholder="75001"
                    value={billingInfo.code_postal}
                    onChange={(e) => handleInputChange('code_postal', e.target.value.replace(/\D/g, ''))}
                    maxLength={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ville">
                    Ville <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ville"
                    placeholder="Paris"
                    value={billingInfo.ville}
                    onChange={(e) => handleInputChange('ville', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pays">Pays</Label>
                  <Input
                    id="pays"
                    placeholder="France"
                    value={billingInfo.pays}
                    onChange={(e) => handleInputChange('pays', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#823F91] hover:bg-[#6D3478] min-w-[150px]"
        >
          {saving ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}
