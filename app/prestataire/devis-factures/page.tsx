'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, CheckCircle, Euro, User, History, CreditCard, Building2, MapPin, Hash } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/prestataire/dashboard/StatCard'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { formatCoupleName } from '@/lib/supabase/queries/couples.queries'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BankingInfo {
  id?: string
  iban?: string
  bic?: string
  nom_banque?: string
  nom_titulaire?: string
  adresse_banque?: string
  siret?: string
  siren?: string
  tva_number?: string
  forme_juridique?: string
  adresse_siege?: string
  code_ape?: string
}

interface Devis {
  id: string
  couple_id: string
  amount: number
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating'
  title?: string
  description?: string
  created_at: string
  accepted_at?: string
  rejected_at?: string
  valid_until?: string
  couple_name?: string
}

interface Analytics {
  devis_emis_nombre: number
  devis_emis_montant: number
  devis_acceptes_nombre: number
  devis_acceptes_montant: number
}

export default function DevisFacturesPage() {
  const { user } = useUser()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('infos')
  const [isLoading, setIsLoading] = useState(true)
  const [analytics, setAnalytics] = useState<Analytics>({
    devis_emis_nombre: 0,
    devis_emis_montant: 0,
    devis_acceptes_nombre: 0,
    devis_acceptes_montant: 0,
  })
  const [bankingInfo, setBankingInfo] = useState<BankingInfo>({})
  const [devisHistory, setDevisHistory] = useState<Devis[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  // Fonction pour charger les analytics
  const fetchAnalytics = async () => {
    if (!user) return

    try {
      // Devis émis (tous les devis du prestataire)
      const { data: allDevis, error: devisError } = await supabase
        .from('devis')
        .select('id, amount, status')
        .eq('prestataire_id', user.id)

      if (devisError && devisError.code !== 'PGRST116') {
        console.error('Erreur chargement devis:', devisError)
      }

      const devis = allDevis || []
      const devisEmisNombre = devis.length
      const devisEmisMontant = devis.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
      
      const devisAcceptes = devis.filter(d => d.status === 'accepted')
      const devisAcceptesNombre = devisAcceptes.length
      const devisAcceptesMontant = devisAcceptes.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)

      setAnalytics({
        devis_emis_nombre: devisEmisNombre,
        devis_emis_montant: devisEmisMontant,
        devis_acceptes_nombre: devisAcceptesNombre,
        devis_acceptes_montant: devisAcceptesMontant,
      })
    } catch (error) {
      console.error('Erreur chargement analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Charger les analytics au montage et lors du changement d'utilisateur
  useEffect(() => {
    if (!user) return
    fetchAnalytics()
  }, [user])

  // Écouter les changements dans la table devis en temps réel
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`devis-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devis',
          filter: `prestataire_id=eq.${user.id}`,
        },
        () => {
          // Recharger les analytics quand un devis change
          fetchAnalytics()
          // Recharger aussi l'historique
          fetchDevisHistory()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Charger les informations bancaires
  useEffect(() => {
    if (!user) return

    const fetchBankingInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('prestataire_banking_info')
          .select('*')
          .eq('prestataire_id', user.id)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.error('Erreur chargement infos bancaires:', error)
        }

        if (data) {
          setBankingInfo(data)
        }
      } catch (error) {
        console.error('Erreur chargement infos bancaires:', error)
      }
    }

    fetchBankingInfo()
  }, [user, supabase])

  // Fonction pour charger l'historique des devis
  const fetchDevisHistory = async () => {
    if (!user) return

    setIsLoadingHistory(true)
    try {
      const { data: devisData, error: devisError } = await supabase
        .from('devis')
        .select('id, couple_id, amount, status, title, description, created_at, accepted_at, rejected_at, valid_until')
        .eq('prestataire_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (devisError && devisError.code !== 'PGRST116') {
        console.error('Erreur chargement historique devis:', devisError)
        setIsLoadingHistory(false)
        return
      }

      if (devisData && devisData.length > 0) {
        // Récupérer les noms des couples
        const coupleIds = [...new Set(devisData.map(d => d.couple_id).filter(Boolean))]
        
        const { data: couplesData } = await supabase
          .from('couples')
          .select('id, partner_1_name, partner_2_name')
          .in('id', coupleIds)

        const couplesMap = new Map(
          (couplesData || []).map(c => [c.id, c])
        )

        const devisWithNames: Devis[] = devisData.map(d => {
          const couple = couplesMap.get(d.couple_id)
          return {
            ...d,
            couple_name: formatCoupleName(couple),
            amount: Number(d.amount) || 0,
          }
        })

        setDevisHistory(devisWithNames)
      } else {
        setDevisHistory([])
      }
    } catch (error) {
      console.error('Erreur chargement historique devis:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Charger l'historique des devis au montage
  useEffect(() => {
    if (!user) return
    fetchDevisHistory()
  }, [user])

  const handleSaveBankingInfo = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const dataToSave = {
        prestataire_id: user.id,
        iban: bankingInfo.iban || null,
        bic: bankingInfo.bic || null,
        nom_banque: bankingInfo.nom_banque || null,
        nom_titulaire: bankingInfo.nom_titulaire || null,
        adresse_banque: bankingInfo.adresse_banque || null,
        siret: bankingInfo.siret || null,
        siren: bankingInfo.siren || null,
        tva_number: bankingInfo.tva_number || null,
        forme_juridique: bankingInfo.forme_juridique || null,
        adresse_siege: bankingInfo.adresse_siege || null,
        code_ape: bankingInfo.code_ape || null,
      }

      if (bankingInfo.id) {
        // Mise à jour
        const { error } = await supabase
          .from('prestataire_banking_info')
          .update(dataToSave)
          .eq('id', bankingInfo.id)

        if (error) throw error
      } else {
        // Création
        const { data, error } = await supabase
          .from('prestataire_banking_info')
          .insert(dataToSave)
          .select()
          .single()

        if (error) throw error
        if (data) setBankingInfo(data)
      }

      toast.success('Informations bancaires enregistrées avec succès')
    } catch (error: any) {
      console.error('Erreur sauvegarde infos bancaires:', error)
      toast.error('Erreur lors de la sauvegarde des informations bancaires')
    } finally {
      setIsSaving(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      accepted: { label: 'Accepté', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Refusé', className: 'bg-red-100 text-red-800' },
      negotiating: { label: 'En négociation', className: 'bg-blue-100 text-blue-800' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer mx-auto" />
          <Skeleton className="h-4 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 xs:space-y-4 sm:space-y-6">
      <PageTitle 
        title="Devis & Factures"
        description="Gérez vos devis et informations bancaires"
      />

          {/* Cartes Analytics */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 w-full">
            <StatCard
              icon={FileText}
              label="Devis émis"
              value={analytics.devis_emis_nombre}
              subtitle={`${formatAmount(analytics.devis_emis_montant)} au total`}
              description={`${analytics.devis_emis_nombre} devis émis pour un montant total de ${formatAmount(analytics.devis_emis_montant)}`}
              colorClass="from-[#9D5FA8]/20 via-[#823F91]/20 to-[#6D3478]/20 text-[#823F91]"
              delay={0.1}
            />
            <StatCard
              icon={Euro}
              label="Montant total"
              value={formatAmount(analytics.devis_emis_montant)}
              subtitle="Devis émis"
              description={`Total de tous vos devis émis`}
              colorClass="from-[#9D5FA8]/20 via-[#823F91]/20 to-[#6D3478]/20 text-[#823F91]"
              delay={0.2}
            />
            <StatCard
              icon={CheckCircle}
              label="Devis acceptés"
              value={analytics.devis_acceptes_nombre}
              subtitle={`${formatAmount(analytics.devis_acceptes_montant)} acceptés`}
              description={`${analytics.devis_acceptes_nombre} devis acceptés pour un montant de ${formatAmount(analytics.devis_acceptes_montant)}`}
              colorClass="from-[#9D5FA8]/20 via-[#823F91]/20 to-[#6D3478]/20 text-[#823F91]"
              delay={0.3}
            />
          </div>

          {/* Sélecteur de section */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 xs:space-y-4 sm:space-y-6">
            <TabsList className="grid grid-cols-2 w-full h-auto p-0.5 bg-muted/40 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <TabsTrigger 
                value="infos" 
                className="!bg-white !text-[#823F91] data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-[#823F91] data-[state=active]:!to-[#9D5FA8] data-[state=active]:!text-white data-[state=active]:shadow-sm text-xs sm:text-sm font-medium group"
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 !text-[#823F91] group-data-[state=active]:!text-white transition-colors" />
                <span className="hidden sm:inline !text-[#823F91] group-data-[state=active]:!text-white transition-colors">Infos persos</span>
                <span className="sm:hidden !text-[#823F91] group-data-[state=active]:!text-white transition-colors">Infos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="historique"
                className="!bg-white !text-[#823F91] data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-[#823F91] data-[state=active]:!to-[#9D5FA8] data-[state=active]:!text-white data-[state=active]:shadow-sm text-xs sm:text-sm font-medium group"
              >
                <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 !text-[#823F91] group-data-[state=active]:!text-white transition-colors" />
                <span className="hidden sm:inline !text-[#823F91] group-data-[state=active]:!text-white transition-colors">Historique</span>
                <span className="sm:hidden !text-[#823F91] group-data-[state=active]:!text-white transition-colors">Hist.</span>
              </TabsTrigger>
            </TabsList>

            {/* Section Infos persos */}
            <TabsContent value="infos" className="mt-3 xs:mt-4 sm:mt-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">
                  <CardContent className="p-3 xs:p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 lg:space-y-6">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                        Informations bancaires (RIB)
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Informations nécessaires à l'émission de vos factures
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      {/* IBAN */}
                      <div className="space-y-2">
                        <Label htmlFor="iban" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          IBAN *
                        </Label>
                        <Input
                          id="iban"
                          value={bankingInfo.iban || ''}
                          onChange={(e) => setBankingInfo({ ...bankingInfo, iban: e.target.value })}
                          placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                          className="bg-white"
                        />
                      </div>

                      {/* BIC */}
                      <div className="space-y-2">
                        <Label htmlFor="bic">BIC</Label>
                        <Input
                          id="bic"
                          value={bankingInfo.bic || ''}
                          onChange={(e) => setBankingInfo({ ...bankingInfo, bic: e.target.value })}
                          placeholder="ABCDEFGH"
                          className="bg-white"
                        />
                      </div>

                      {/* Nom de la banque */}
                      <div className="space-y-2">
                        <Label htmlFor="nom_banque" className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Nom de la banque
                        </Label>
                        <Input
                          id="nom_banque"
                          value={bankingInfo.nom_banque || ''}
                          onChange={(e) => setBankingInfo({ ...bankingInfo, nom_banque: e.target.value })}
                          placeholder="Nom de votre banque"
                          className="bg-white"
                        />
                      </div>

                      {/* Nom du titulaire */}
                      <div className="space-y-2">
                        <Label htmlFor="nom_titulaire" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Nom du titulaire
                        </Label>
                        <Input
                          id="nom_titulaire"
                          value={bankingInfo.nom_titulaire || ''}
                          onChange={(e) => setBankingInfo({ ...bankingInfo, nom_titulaire: e.target.value })}
                          placeholder="Nom du titulaire du compte"
                          className="bg-white"
                        />
                      </div>

                      {/* Adresse de la banque */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="adresse_banque" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Adresse de la banque
                        </Label>
                        <Input
                          id="adresse_banque"
                          value={bankingInfo.adresse_banque || ''}
                          onChange={(e) => setBankingInfo({ ...bankingInfo, adresse_banque: e.target.value })}
                          placeholder="Adresse complète de la banque"
                          className="bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                        Informations fiscales
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        {/* SIRET */}
                        <div className="space-y-2">
                          <Label htmlFor="siret" className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            SIRET
                          </Label>
                          <Input
                            id="siret"
                            value={bankingInfo.siret || ''}
                            onChange={(e) => setBankingInfo({ ...bankingInfo, siret: e.target.value })}
                            placeholder="123 456 789 00012"
                            className="bg-white"
                          />
                        </div>

                        {/* SIREN */}
                        <div className="space-y-2">
                          <Label htmlFor="siren">SIREN</Label>
                          <Input
                            id="siren"
                            value={bankingInfo.siren || ''}
                            onChange={(e) => setBankingInfo({ ...bankingInfo, siren: e.target.value })}
                            placeholder="123 456 789"
                            className="bg-white"
                          />
                        </div>

                        {/* Numéro TVA */}
                        <div className="space-y-2">
                          <Label htmlFor="tva_number">Numéro TVA</Label>
                          <Input
                            id="tva_number"
                            value={bankingInfo.tva_number || ''}
                            onChange={(e) => setBankingInfo({ ...bankingInfo, tva_number: e.target.value })}
                            placeholder="FR XX XXX XXX XXX"
                            className="bg-white"
                          />
                        </div>

                        {/* Forme juridique */}
                        <div className="space-y-2">
                          <Label htmlFor="forme_juridique">Forme juridique</Label>
                          <Input
                            id="forme_juridique"
                            value={bankingInfo.forme_juridique || ''}
                            onChange={(e) => setBankingInfo({ ...bankingInfo, forme_juridique: e.target.value })}
                            placeholder="SARL, EURL, Auto-entrepreneur..."
                            className="bg-white"
                          />
                        </div>

                        {/* Code APE */}
                        <div className="space-y-2">
                          <Label htmlFor="code_ape">Code APE/NAF</Label>
                          <Input
                            id="code_ape"
                            value={bankingInfo.code_ape || ''}
                            onChange={(e) => setBankingInfo({ ...bankingInfo, code_ape: e.target.value })}
                            placeholder="XXXXX"
                            className="bg-white"
                          />
                        </div>

                        {/* Adresse du siège */}
                        <div className="space-y-2">
                          <Label htmlFor="adresse_siege" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Adresse du siège
                          </Label>
                          <Input
                            id="adresse_siege"
                            value={bankingInfo.adresse_siege || ''}
                            onChange={(e) => setBankingInfo({ ...bankingInfo, adresse_siege: e.target.value })}
                            placeholder="Adresse complète du siège social"
                            className="bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button
                        onClick={handleSaveBankingInfo}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white"
                      >
                        {isSaving ? 'Enregistrement...' : 'Enregistrer les informations'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Section Historique */}
            <TabsContent value="historique" className="mt-3 xs:mt-4 sm:mt-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)]">
                  <CardContent className="p-3 xs:p-4 sm:p-5 lg:p-6">
                    <div className="mb-4 sm:mb-5">
                      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                        Historique des devis
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Liste de tous vos devis émis
                      </p>
                    </div>

                    {isLoadingHistory ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-24 w-full bg-gray-200" />
                        ))}
                      </div>
                    ) : devisHistory.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm sm:text-base text-muted-foreground">
                          Aucun devis émis pour le moment
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {devisHistory.map((devis) => (
                          <motion.div
                            key={devis.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 xs:p-4 sm:p-5 border border-gray-200 rounded-lg hover:border-[#823F91]/30 hover:shadow-sm transition-all"
                          >
                            <div className="flex flex-col gap-3">
                              {/* En-tête avec titre et badge */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-foreground break-words">
                                    {devis.title || `Devis pour ${devis.couple_name}`}
                                  </h3>
                                  <p className="text-xs xs:text-sm text-muted-foreground mt-1">
                                    {devis.couple_name}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  {getStatusBadge(devis.status)}
                                </div>
                              </div>
                              
                              {/* Description */}
                              {devis.description && (
                                <p className="text-xs xs:text-sm text-muted-foreground line-clamp-2 break-words">
                                  {devis.description}
                                </p>
                              )}
                              
                              {/* Footer avec dates et montant */}
                                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-4 pt-2 border-t border-gray-100">
                                  <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-4 text-xs xs:text-sm text-muted-foreground">
                                    <span>Créé le {formatDate(devis.created_at)}</span>
                                    {devis.valid_until && (
                                      <>
                                        <span className="hidden xs:inline">•</span>
                                        <span>Valide jusqu&apos;au {formatDate(devis.valid_until)}</span>
                                      </>
                                    )}
                                  </div>
                                <div className="flex-shrink-0">
                                  <p className="text-base xs:text-lg sm:text-xl font-bold text-[#823F91]">
                                    {formatAmount(devis.amount)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
    </div>
  )
}
