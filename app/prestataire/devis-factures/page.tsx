'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  CheckCircle,
  Euro,
  User,
  History,
  CreditCard,
  Building2,
  MapPin,
  Hash,
  Plus,
  Download,
  ExternalLink,
  Receipt,
  Settings,
  FileStack,
  Sparkles,
  ArrowRightLeft,
  Copy,
  MoreHorizontal,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatCard } from '@/components/prestataire/dashboard/StatCard'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
import { QuickDevisGenerator } from '@/components/devis/QuickDevisGenerator'
import { DevisTemplateManager } from '@/components/devis/DevisTemplateManager'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { formatCoupleName } from '@/lib/supabase/queries/couples.queries'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Facture, ProviderDevisSettings } from '@/types/billing'

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
  devis_number?: string
  pdf_url?: string
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
  factures_payees_montant: number
}

export default function DevisFacturesPage() {
  const { user } = useUser()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('devis')
  const [isLoading, setIsLoading] = useState(true)
  const [analytics, setAnalytics] = useState<Analytics>({
    devis_emis_nombre: 0,
    devis_emis_montant: 0,
    devis_acceptes_nombre: 0,
    devis_acceptes_montant: 0,
    factures_payees_montant: 0,
  })
  const [bankingInfo, setBankingInfo] = useState<BankingInfo>({})
  const [devisSettings, setDevisSettings] = useState<Partial<ProviderDevisSettings>>({})
  const [devisHistory, setDevisHistory] = useState<Devis[]>([])
  const [factures, setFactures] = useState<Facture[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isLoadingFactures, setIsLoadingFactures] = useState(true)
  const [showQuickGenerator, setShowQuickGenerator] = useState(false)

  // Charger les données
  const fetchAnalytics = async () => {
    if (!user) return

    try {
      const { data: allDevis } = await supabase
        .from('devis')
        .select('id, amount, status')
        .eq('prestataire_id', user.id)

      const { data: facturesPaid } = await supabase
        .from('factures')
        .select('amount_ttc')
        .eq('prestataire_id', user.id)
        .eq('status', 'paid')

      const devis = allDevis || []
      const devisEmisNombre = devis.length
      const devisEmisMontant = devis.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)

      const devisAcceptes = devis.filter(d => d.status === 'accepted')
      const devisAcceptesNombre = devisAcceptes.length
      const devisAcceptesMontant = devisAcceptes.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)

      const facturesPayeesMontant = (facturesPaid || []).reduce(
        (sum, f) => sum + (Number(f.amount_ttc) || 0),
        0
      )

      setAnalytics({
        devis_emis_nombre: devisEmisNombre,
        devis_emis_montant: devisEmisMontant,
        devis_acceptes_nombre: devisAcceptesNombre,
        devis_acceptes_montant: devisAcceptesMontant,
        factures_payees_montant: facturesPayeesMontant,
      })
    } catch (error) {
      console.error('Erreur chargement analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDevisHistory = async () => {
    if (!user) return

    setIsLoadingHistory(true)
    try {
      const { data: devisData } = await supabase
        .from('devis')
        .select('id, couple_id, amount, status, title, description, devis_number, pdf_url, created_at, accepted_at, rejected_at, valid_until')
        .eq('prestataire_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (devisData && devisData.length > 0) {
        const coupleIds = [...new Set(devisData.map(d => d.couple_id).filter(Boolean))]

        const { data: couplesData } = await supabase
          .from('couples')
          .select('id, partner_1_name, partner_2_name')
          .in('id', coupleIds)

        const couplesMap = new Map((couplesData || []).map(c => [c.id, c]))

        const devisWithNames: Devis[] = devisData.map(d => ({
          ...d,
          couple_name: formatCoupleName(couplesMap.get(d.couple_id)),
          amount: Number(d.amount) || 0,
        }))

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

  const fetchFactures = async () => {
    if (!user) return

    setIsLoadingFactures(true)
    try {
      const response = await fetch('/api/factures')
      if (response.ok) {
        const data = await response.json()
        setFactures(data.factures || [])
      }
    } catch (error) {
      console.error('Erreur chargement factures:', error)
    } finally {
      setIsLoadingFactures(false)
    }
  }

  const fetchBankingInfo = async () => {
    if (!user) return

    try {
      const { data } = await supabase
        .from('prestataire_banking_info')
        .select('*')
        .eq('prestataire_id', user.id)
        .maybeSingle()

      if (data) setBankingInfo(data)
    } catch (error) {
      console.error('Erreur chargement infos bancaires:', error)
    }
  }

  const fetchDevisSettings = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/devis/settings')
      if (response.ok) {
        const data = await response.json()
        setDevisSettings(data.settings || {})
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchAnalytics()
    fetchBankingInfo()
    fetchDevisSettings()
    fetchDevisHistory()
    fetchFactures()
  }, [user])

  // Real-time updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`devis-changes-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devis', filter: `prestataire_id=eq.${user.id}` },
        () => {
          fetchAnalytics()
          fetchDevisHistory()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'factures', filter: `prestataire_id=eq.${user.id}` },
        () => {
          fetchAnalytics()
          fetchFactures()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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
        const { error } = await supabase
          .from('prestataire_banking_info')
          .update(dataToSave)
          .eq('id', bankingInfo.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('prestataire_banking_info')
          .insert(dataToSave)
          .select()
          .single()
        if (error) throw error
        if (data) setBankingInfo(data)
      }

      toast.success('Informations enregistrées')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/devis/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(devisSettings),
      })

      if (!response.ok) throw new Error('Erreur')

      toast.success('Paramètres enregistrés')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConvertToFacture = async (devisId: string) => {
    try {
      const response = await fetch('/api/factures/from-devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devis_id: devisId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur')
      }

      toast.success('Facture créée')
      fetchFactures()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string, type: 'devis' | 'facture' = 'devis') => {
    type StatusConfig = { label: string; className: string }

    const devisConfig: Record<string, StatusConfig> = {
      pending: { label: 'En attente', className: 'bg-[#823F91]/10 text-[#823F91]' },
      accepted: { label: 'Accepté', className: 'bg-[#823F91]/15 text-[#6D3478] font-medium' },
      rejected: { label: 'Refusé', className: 'bg-gray-100 text-gray-500' },
      negotiating: { label: 'Négociation', className: 'bg-[#9D5FA8]/10 text-[#9D5FA8]' },
    }

    const factureConfig: Record<string, StatusConfig> = {
      draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-600' },
      sent: { label: 'Envoyée', className: 'bg-[#9D5FA8]/10 text-[#9D5FA8]' },
      paid: { label: 'Payée', className: 'bg-[#823F91]/15 text-[#6D3478] font-medium' },
      overdue: { label: 'En retard', className: 'bg-red-50 text-red-600' },
      cancelled: { label: 'Annulée', className: 'bg-gray-100 text-gray-500' },
    }

    const config = type === 'devis' ? devisConfig : factureConfig
    const statusConfig = config[status] || { label: status, className: 'bg-gray-100' }
    return <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <PageTitle
        title="Devis & Factures"
        description="Gérez vos devis, factures et informations de facturation"
      />

      {/* Bouton génération rapide */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button
          size="lg"
          className="w-full sm:w-auto gap-2 bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white shadow-lg"
          onClick={() => setShowQuickGenerator(true)}
        >
          <Sparkles className="h-5 w-5" />
          Générer un devis rapidement
        </Button>
      </motion.div>

      {/* Cartes Analytics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard
          icon={FileText}
          label="Devis émis"
          value={analytics.devis_emis_nombre}
          subtitle={formatAmount(analytics.devis_emis_montant)}
          description="Total des devis émis"
          colorClass="from-[#823F91]/10 to-[#823F91]/5 text-[#823F91]"
          delay={0.1}
        />
        <StatCard
          icon={CheckCircle}
          label="Acceptés"
          value={analytics.devis_acceptes_nombre}
          subtitle={formatAmount(analytics.devis_acceptes_montant)}
          description="Devis acceptés"
          colorClass="from-[#9D5FA8]/10 to-[#9D5FA8]/5 text-[#6D3478]"
          delay={0.2}
        />
        <StatCard
          icon={Receipt}
          label="CA Facturé"
          value={formatAmount(analytics.factures_payees_montant)}
          subtitle="Payé"
          description="Factures payées"
          colorClass="from-[#823F91]/15 to-[#823F91]/5 text-[#823F91]"
          delay={0.3}
        />
        <StatCard
          icon={Euro}
          label="Taux conversion"
          value={
            analytics.devis_emis_nombre > 0
              ? `${Math.round((analytics.devis_acceptes_nombre / analytics.devis_emis_nombre) * 100)}%`
              : '-'
          }
          subtitle="Devis → Acceptés"
          description="Taux de conversion"
          colorClass="from-[#E8C4F5]/30 to-[#E8C4F5]/10 text-[#6D3478]"
          delay={0.4}
        />
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
          {[
            { value: 'devis', icon: FileText, label: 'Devis' },
            { value: 'factures', icon: Receipt, label: 'Factures' },
            { value: 'templates', icon: FileStack, label: 'Modèles' },
            { value: 'settings', icon: Settings, label: 'Paramètres' },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-xs sm:text-sm font-medium rounded-lg py-2.5 transition-all duration-200 data-[state=active]:shadow-md"
              style={{
                backgroundColor: activeTab === tab.value ? '#823F91' : 'white',
                color: activeTab === tab.value ? '#ffffff' : '#823F91',
              }}
            >
              <tab.icon
                className="h-4 w-4 sm:mr-1.5"
                style={{ color: activeTab === tab.value ? '#ffffff' : '#823F91' }}
              />
              <span className="hidden sm:inline" style={{ color: activeTab === tab.value ? '#ffffff' : '#823F91' }}>
                {tab.label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Onglet Devis */}
        <TabsContent value="devis" className="space-y-4">
          <Card className="bg-white/70 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Historique des devis</h2>
                <Button size="sm" variant="outline" onClick={() => setShowQuickGenerator(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nouveau
                </Button>
              </div>

              {isLoadingHistory ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : devisHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Aucun devis émis</p>
                  <Button onClick={() => setShowQuickGenerator(true)}>
                    Créer mon premier devis
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {devisHistory.map(devis => (
                    <motion.div
                      key={devis.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 border rounded-lg hover:border-purple-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">
                              {devis.title || `Devis ${devis.devis_number || ''}`}
                            </span>
                            {getStatusBadge(devis.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {devis.couple_name} • {formatDate(devis.created_at)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <p className="text-lg font-bold text-purple-600">
                            {formatAmount(devis.amount)}
                          </p>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {devis.pdf_url && (
                                <DropdownMenuItem
                                  onClick={() => window.open(devis.pdf_url, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Voir le PDF
                                </DropdownMenuItem>
                              )}
                              {devis.pdf_url && (
                                <DropdownMenuItem asChild>
                                  <a href={devis.pdf_url} download>
                                    <Download className="h-4 w-4 mr-2" />
                                    Télécharger
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {devis.status === 'accepted' && (
                                <DropdownMenuItem
                                  onClick={() => handleConvertToFacture(devis.id)}
                                >
                                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                                  Convertir en facture
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Dupliquer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {devis.valid_until && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Valide jusqu&apos;au {formatDate(devis.valid_until)}
                          {new Date(devis.valid_until) < new Date() && (
                            <Badge variant="destructive" className="ml-2 text-xs py-0">
                              Expiré
                            </Badge>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Factures */}
        <TabsContent value="factures" className="space-y-4">
          <Card className="bg-white/70 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Factures</h2>
              </div>

              {isLoadingFactures ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : factures.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-muted-foreground">Aucune facture</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Les factures sont créées à partir des devis acceptés
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {factures.map(facture => (
                    <motion.div
                      key={facture.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 border rounded-lg hover:border-blue-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {facture.facture_number}
                            </span>
                            {getStatusBadge(facture.status, 'facture')}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {facture.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Émise le {formatDate(facture.issue_date)}
                            {facture.due_date && ` • Échéance ${formatDate(facture.due_date)}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              {formatAmount(facture.amount_ttc)}
                            </p>
                            {facture.tva_rate > 0 && (
                              <p className="text-xs text-muted-foreground">
                                dont TVA {formatAmount(facture.amount_tva)}
                              </p>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {facture.pdf_url && (
                                <DropdownMenuItem
                                  onClick={() => window.open(facture.pdf_url!, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Voir le PDF
                                </DropdownMenuItem>
                              )}
                              {facture.status === 'sent' && (
                                <DropdownMenuItem>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Marquer payée
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Modèles */}
        <TabsContent value="templates">
          <Card className="bg-white/70 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <DevisTemplateManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Paramètres */}
        <TabsContent value="settings" className="space-y-4">
          {/* Infos bancaires */}
          <Card className="bg-white/70 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 sm:p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1">Informations bancaires (RIB)</h2>
                <p className="text-sm text-muted-foreground">
                  Ces informations apparaîtront sur vos devis et factures
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="iban" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    IBAN *
                  </Label>
                  <Input
                    id="iban"
                    value={bankingInfo.iban || ''}
                    onChange={e => setBankingInfo({ ...bankingInfo, iban: e.target.value })}
                    placeholder="FR76 XXXX XXXX XXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bic">BIC</Label>
                  <Input
                    id="bic"
                    value={bankingInfo.bic || ''}
                    onChange={e => setBankingInfo({ ...bankingInfo, bic: e.target.value })}
                    placeholder="ABCDEFGH"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nom_banque">
                    <Building2 className="h-4 w-4 inline mr-1" />
                    Banque
                  </Label>
                  <Input
                    id="nom_banque"
                    value={bankingInfo.nom_banque || ''}
                    onChange={e => setBankingInfo({ ...bankingInfo, nom_banque: e.target.value })}
                    placeholder="Nom de la banque"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nom_titulaire">
                    <User className="h-4 w-4 inline mr-1" />
                    Titulaire
                  </Label>
                  <Input
                    id="nom_titulaire"
                    value={bankingInfo.nom_titulaire || ''}
                    onChange={e => setBankingInfo({ ...bankingInfo, nom_titulaire: e.target.value })}
                    placeholder="Nom du titulaire"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Informations fiscales</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siret">
                      <Hash className="h-4 w-4 inline mr-1" />
                      SIRET
                    </Label>
                    <Input
                      id="siret"
                      value={bankingInfo.siret || ''}
                      onChange={e => setBankingInfo({ ...bankingInfo, siret: e.target.value })}
                      placeholder="123 456 789 00012"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tva_number">N° TVA</Label>
                    <Input
                      id="tva_number"
                      value={bankingInfo.tva_number || ''}
                      onChange={e => setBankingInfo({ ...bankingInfo, tva_number: e.target.value })}
                      placeholder="FR XX XXX XXX XXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="forme_juridique">Forme juridique</Label>
                    <Input
                      id="forme_juridique"
                      value={bankingInfo.forme_juridique || ''}
                      onChange={e => setBankingInfo({ ...bankingInfo, forme_juridique: e.target.value })}
                      placeholder="SARL, EURL, Auto-entrepreneur..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code_ape">Code APE</Label>
                    <Input
                      id="code_ape"
                      value={bankingInfo.code_ape || ''}
                      onChange={e => setBankingInfo({ ...bankingInfo, code_ape: e.target.value })}
                      placeholder="XXXXX"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="adresse_siege">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Adresse du siège
                    </Label>
                    <Input
                      id="adresse_siege"
                      value={bankingInfo.adresse_siege || ''}
                      onChange={e => setBankingInfo({ ...bankingInfo, adresse_siege: e.target.value })}
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveBankingInfo} disabled={isSaving} className="rounded-full bg-[#823F91] hover:bg-[#6D3478] text-white px-6">
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Paramètres devis */}
          <Card className="bg-white/70 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 sm:p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1">Paramètres des devis</h2>
                <p className="text-sm text-muted-foreground">
                  Personnalisez les valeurs par défaut pour vos devis
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Validité par défaut (jours)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={devisSettings.default_validity_days || 30}
                    onChange={e =>
                      setDevisSettings({
                        ...devisSettings,
                        default_validity_days: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Préfixe devis</Label>
                  <Input
                    value={devisSettings.devis_prefix || 'DEV'}
                    onChange={e =>
                      setDevisSettings({ ...devisSettings, devis_prefix: e.target.value })
                    }
                    placeholder="DEV"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg">
                  <div>
                    <Label>Afficher IBAN sur les devis</Label>
                    <p className="text-xs text-muted-foreground">
                      Affiche votre IBAN sur les devis générés
                    </p>
                  </div>
                  <Switch
                    checked={devisSettings.show_iban_on_devis || false}
                    onCheckedChange={checked =>
                      setDevisSettings({ ...devisSettings, show_iban_on_devis: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg">
                  <div>
                    <Label>Assujetti à la TVA</Label>
                    <p className="text-xs text-muted-foreground">
                      Active le calcul automatique de la TVA
                    </p>
                  </div>
                  <Switch
                    checked={devisSettings.is_subject_to_tva || false}
                    onCheckedChange={checked =>
                      setDevisSettings({ ...devisSettings, is_subject_to_tva: checked })
                    }
                  />
                </div>

                {devisSettings.is_subject_to_tva && (
                  <div className="space-y-2">
                    <Label>Taux de TVA par défaut (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={devisSettings.default_tva_rate || 20}
                      onChange={e =>
                        setDevisSettings({
                          ...devisSettings,
                          default_tva_rate: parseFloat(e.target.value) || 20,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Conditions par défaut</Label>
                <Textarea
                  rows={3}
                  value={devisSettings.default_conditions || ''}
                  onChange={e =>
                    setDevisSettings({ ...devisSettings, default_conditions: e.target.value })
                  }
                  placeholder="Conditions générales de vente..."
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving} className="rounded-full bg-[#823F91] hover:bg-[#6D3478] text-white px-6">
                  {isSaving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal génération rapide */}
      <QuickDevisGenerator
        isOpen={showQuickGenerator}
        onClose={() => setShowQuickGenerator(false)}
        onSuccess={() => {
          fetchDevisHistory()
          fetchAnalytics()
        }}
      />
    </div>
  )
}
