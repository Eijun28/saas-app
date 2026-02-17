'use client'

import { useState, useEffect } from 'react'
import { Eye, X, MapPin, Euro, Briefcase, MessageCircle, Camera, Sparkles, Instagram, Facebook, Globe, Linkedin, Music2, ExternalLink, Send, FileText, Heart, ChevronRight, User, Play, Image, ShieldCheck, Star, Check } from 'lucide-react'
import { ReviewsList } from '@/components/reviews/ReviewsList'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { cn } from '@/lib/utils'
import { getServiceFieldGroups, hasServiceFields, type ServiceFieldConfig } from '@/lib/constants/service-fields'

interface ProfilePreviewDialogProps {
  userId: string
  profile: {
    nom_entreprise: string
    service_type: string
    avatar_url?: string
    prenom?: string
    nom?: string
    description_courte?: string
    bio?: string
    budget_min?: number
    budget_max?: number
    annees_experience?: number
    ville_principale?: string
    is_early_adopter?: boolean
    instagram_url?: string | null
    facebook_url?: string | null
    website_url?: string | null
    linkedin_url?: string | null
    tiktok_url?: string | null
    pricing_unit?: string
  }
  cultures: Array<{ id: string; label: string }>
  zones: Array<{ id: string; label: string }>
  portfolio: Array<{ id: string; image_url: string; title?: string; file_type?: 'image' | 'pdf' | 'video' }>
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTriggerButton?: boolean
  isCoupleView?: boolean
  coupleId?: string
  hasSiret?: boolean
  serviceDetails?: Record<string, unknown>
  serviceTypeValue?: string
}

// Palette
const BEIGE = '#FBF2E3'
const BEIGE_ACCENT = '#E6D8C4'
const WHITE = '#FFFFFF'

export function ProfilePreviewDialog({
  userId,
  profile,
  cultures,
  zones,
  portfolio,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTriggerButton = true,
  isCoupleView = false,
  coupleId,
  hasSiret = false,
  serviceDetails = {},
  serviceTypeValue,
}: ProfilePreviewDialogProps) {
  const accentColor = '#823F91'
  const router = useRouter()
  const { user } = useUser()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [demandeMessage, setDemandeMessage] = useState('')
  const [demandeDate, setDemandeDate] = useState('')
  const [demandeBudget, setDemandeBudget] = useState('')
  const [isCreatingDemande, setIsCreatingDemande] = useState(false)
  const [activeTab, setActiveTab] = useState('about')
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setDemandeMessage('')
      setDemandeDate('')
      setDemandeBudget('')
      setActiveTab('about')
      setPdfPreviewUrl(null)
      setVideoPreviewUrl(null)
    }
  }, [open])

  const getPricingUnitLabel = (unit?: string) => {
    const labels: Record<string, string> = {
      'forfait': 'forfait',
      'par_personne': '/ personne',
      'par_heure': '/ heure',
      'par_demi_journee': '/ demi-journee',
      'par_journee': '/ journee',
      'par_part': '/ part',
      'par_essayage': '/ essayage',
      'par_piece': '/ piece',
      'par_km': '/ km',
      'sur_devis': 'sur devis'
    }
    return unit ? labels[unit] || '' : ''
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getUrlWithTimestamp = (url: string | null | undefined): string | null => {
    if (!url) return null
    const cleanUrl = url.split('?')[0]
    return `${cleanUrl}?t=${Date.now()}`
  }

  useEffect(() => {
    if (profile.avatar_url) {
      setAvatarUrl(getUrlWithTimestamp(profile.avatar_url))
    } else {
      setAvatarUrl(null)
    }
  }, [profile.avatar_url])

  useEffect(() => {
    if (open && profile.avatar_url) {
      setAvatarUrl(getUrlWithTimestamp(profile.avatar_url))
    }
  }, [open, profile.avatar_url])

  const getBudgetDisplay = () => {
    if (profile.budget_min && profile.budget_max) {
      return `${profile.budget_min.toLocaleString()} - ${profile.budget_max.toLocaleString()}€`
    } else if (profile.budget_min) {
      return `A partir de ${profile.budget_min.toLocaleString()}€`
    } else if (profile.budget_max) {
      return `Jusqu'a ${profile.budget_max.toLocaleString()}€`
    }
    return null
  }

  const handleCreateDemande = async () => {
    const currentCoupleId = coupleId || user?.id

    if (!currentCoupleId || !demandeMessage.trim()) {
      toast.error('Veuillez remplir le message')
      return
    }

    if (!user) {
      toast.error('Vous devez etre connecte pour envoyer une demande')
      return
    }

    setIsCreatingDemande(true)
    const supabase = createClient()

    try {
      const { data: existingRequest } = await supabase
        .from('requests')
        .select('id, status')
        .eq('couple_id', currentCoupleId)
        .eq('provider_id', userId)
        .maybeSingle()

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          toast.error('Une demande est deja en attente pour ce prestataire')
          setIsCreatingDemande(false)
          return
        } else if (existingRequest.status === 'accepted') {
          toast.error('Vous avez deja une demande acceptee avec ce prestataire')
          setIsCreatingDemande(false)
          return
        }
      }

      const { data, error } = await supabase
        .from('requests')
        .insert({
          couple_id: currentCoupleId,
          provider_id: userId,
          initial_message: demandeMessage.trim(),
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        console.error('Erreur Supabase:', error)
        if (error.code === '23505') {
          toast.error('Une demande existe deja pour ce prestataire')
        } else if (error.code === '42501') {
          toast.error('Vous n\'avez pas la permission d\'envoyer cette demande')
        } else {
          toast.error('Erreur lors de l\'envoi de la demande')
        }
        return
      }

      if (data?.id) {
        try {
          const { sendNewRequestEmail } = await import('@/lib/email/notifications')
          await sendNewRequestEmail(userId, currentCoupleId, data.id, demandeMessage.trim())
        } catch (emailError) {
          console.error('Erreur envoi email:', emailError)
        }
      }

      toast.success('Demande envoyee avec succes !')
      setDemandeMessage('')
      setDemandeDate('')
      setDemandeBudget('')
      setOpen(false)

      setTimeout(() => {
        router.push('/couple/demandes')
      }, 500)
    } catch (error: any) {
      console.error('Erreur creation demande:', error)
      toast.error(error?.message || 'Erreur lors de l\'envoi de la demande')
    } finally {
      setIsCreatingDemande(false)
    }
  }

  // Get social links
  const socialLinks = [
    profile.instagram_url && { icon: Instagram, url: profile.instagram_url, label: 'Instagram' },
    profile.facebook_url && { icon: Facebook, url: profile.facebook_url, label: 'Facebook' },
    profile.website_url && { icon: Globe, url: profile.website_url, label: 'Site web' },
    profile.linkedin_url && { icon: Linkedin, url: profile.linkedin_url, label: 'LinkedIn' },
    profile.tiktok_url && { icon: Music2, url: profile.tiktok_url, label: 'TikTok' },
  ].filter(Boolean) as Array<{ icon: any; url: string; label: string }>

  const hasSocialLinks = socialLinks.length > 0

  return (
    <>
      {showTriggerButton && (
        <Button
          variant="outline"
          size="default"
          onClick={() => setOpen(true)}
          className="gap-2 text-[#6B3FA0] transition-colors shadow-sm hover:shadow-md hover:opacity-90"
          style={{ backgroundColor: WHITE }}
        >
          <Eye className="h-4 w-4 text-[#6B3FA0]" />
          Apercu du profil
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] p-0 gap-0 rounded-2xl border-0 shadow-2xl flex flex-col overflow-y-auto"
          style={{ backgroundColor: BEIGE }}
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">
            Apercu du profil - {profile.nom_entreprise}
          </DialogTitle>

          {/* Close button */}
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full shadow-sm hover:bg-[#823F91]/5"
            >
              <X className="h-4 w-4 text-[#6B3FA0]" />
            </Button>
          </DialogClose>

          {/* HEADER */}
          <div className="relative px-5 pt-5 pb-4">
            <div className="flex items-end gap-4">
              <div className="relative flex-shrink-0">
                <Avatar className="h-20 w-20 ring-[3px] shadow-sm" style={{ '--tw-ring-color': accentColor } as React.CSSProperties}>
                  <AvatarImage src={avatarUrl || undefined} alt={profile.nom_entreprise} />
                  <AvatarFallback className="text-xl font-bold" style={{ backgroundColor: WHITE, color: accentColor }}>
                    {getInitials(profile.nom_entreprise)}
                  </AvatarFallback>
                </Avatar>
                {(hasSiret || profile.is_early_adopter) && (
                  <div
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full flex items-center justify-center ring-2"
                    style={{
                      backgroundColor: accentColor,
                      '--tw-ring-color': BEIGE
                    } as React.CSSProperties}
                  >
                    {hasSiret ? <ShieldCheck className="h-3.5 w-3.5 text-white" /> : <Sparkles className="h-3.5 w-3.5 text-white" />}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pb-1 pr-8">
                <h2 className="text-xl font-bold truncate" style={{ color: accentColor }}>
                  {profile.nom_entreprise}
                </h2>
                <p className="text-sm text-[#6B3FA0]/70 font-medium">
                  {profile.service_type}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              {hasSiret && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-[#6B3FA0] shadow-sm"
                  style={{ backgroundColor: WHITE }}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#6B3FA0]" />
                  Professionnel
                </span>
              )}
              {profile.is_early_adopter && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-[#6B3FA0] shadow-sm"
                  style={{ backgroundColor: WHITE }}
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#6B3FA0]" />
                  Early Adopter
                </span>
              )}
              {profile.ville_principale && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full text-[#6B3FA0] shadow-sm"
                  style={{ backgroundColor: WHITE }}
                >
                  <MapPin className="h-3.5 w-3.5 text-[#6B3FA0]" />
                  {profile.ville_principale}
                </span>
              )}
              {profile.annees_experience && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full text-[#6B3FA0] shadow-sm"
                  style={{ backgroundColor: WHITE }}
                >
                  <Briefcase className="h-3.5 w-3.5 text-[#6B3FA0]" />
                  {profile.annees_experience} ans
                </span>
              )}
            </div>
          </div>

          {/* TABS - Pills style */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-5 pt-2 pb-3">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTab('about')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-all",
                    activeTab === 'about'
                      ? "!text-white shadow-md -translate-y-0.5"
                      : "!text-[#6B3FA0] shadow-sm hover:shadow-md"
                  )}
                  style={{
                    backgroundColor: activeTab === 'about' ? accentColor : WHITE,
                  }}
                >
                  <User className="h-4 w-4 inline mr-1.5 -mt-0.5" style={{ color: 'inherit' }} />
                  A propos
                </button>
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-all",
                    activeTab === 'portfolio'
                      ? "!text-white shadow-md -translate-y-0.5"
                      : "!text-[#6B3FA0] shadow-sm hover:shadow-md"
                  )}
                  style={{
                    backgroundColor: activeTab === 'portfolio' ? accentColor : WHITE,
                  }}
                >
                  <Camera className="h-4 w-4 inline mr-1.5 -mt-0.5" style={{ color: 'inherit' }} />
                  Portfolio
                </button>
                <button
                  onClick={() => setActiveTab('contact')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-all",
                    activeTab === 'contact'
                      ? "!text-white shadow-md -translate-y-0.5"
                      : "!text-[#6B3FA0] shadow-sm hover:shadow-md"
                  )}
                  style={{
                    backgroundColor: activeTab === 'contact' ? accentColor : WHITE,
                  }}
                >
                  <Send className="h-4 w-4 inline mr-1.5 -mt-0.5" style={{ color: 'inherit' }} />
                  Contact
                </button>
              </div>
            </div>
            <TabsList className="hidden">
              <TabsTrigger value="about">A propos</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            {/* TAB: A PROPOS */}
            <TabsContent value="about" className="m-0 p-5 space-y-5 data-[state=active]:block">
              {/* Description */}
              {profile.description_courte && (
                <div>
                  <p className="text-sm text-[#6B3FA0] leading-relaxed">
                    {profile.description_courte}
                  </p>
                  {(profile.prenom || profile.nom) && (
                    <p className="text-sm font-semibold mt-2 text-[#6B3FA0]">
                      — {profile.prenom} {profile.nom}
                    </p>
                  )}
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <div className="pt-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: WHITE }}>
                      <User className="h-3.5 w-3.5 text-[#6B3FA0]" />
                    </div>
                    <h4 className="text-sm font-bold text-[#6B3FA0]">Presentation</h4>
                  </div>
                  <p className="text-sm text-[#6B3FA0]/80 leading-relaxed whitespace-pre-line">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Tarifs */}
              {getBudgetDisplay() && (
                <div
                  className="rounded-xl p-4 shadow-sm"
                  style={{ backgroundColor: WHITE }}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: WHITE }}>
                      <Euro className="h-3.5 w-3.5 text-[#6B3FA0]" />
                    </div>
                    <h4 className="text-sm font-bold text-[#6B3FA0]">Tarifs</h4>
                  </div>
                  <p className="text-lg font-bold text-[#6B3FA0] ml-[38px]">
                    {getBudgetDisplay()}
                    {profile.pricing_unit && (
                      <span className="text-sm font-medium ml-1 text-[#6B3FA0]">
                        {getPricingUnitLabel(profile.pricing_unit)}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Détails métier */}
              {serviceTypeValue && hasServiceFields(serviceTypeValue) && Object.keys(serviceDetails).length > 0 && (
                <div className="pt-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: WHITE }}>
                      <Briefcase className="h-3.5 w-3.5 text-[#6B3FA0]" />
                    </div>
                    <h4 className="text-sm font-bold text-[#6B3FA0]">Détails métier</h4>
                  </div>
                  <div className="ml-[38px] space-y-3">
                    {getServiceFieldGroups(serviceTypeValue).map((group, gIdx) => {
                      // Only show groups that have at least one filled field
                      const filledFields = group.fields.filter(f => {
                        const val = serviceDetails[f.key]
                        if (val === undefined || val === null || val === '' || val === false) return false
                        if (Array.isArray(val) && val.length === 0) return false
                        return true
                      })
                      if (filledFields.length === 0) return null

                      return (
                        <div key={gIdx} className="space-y-2">
                          {filledFields.map(field => {
                            const val = serviceDetails[field.key]
                            return (
                              <ServiceDetailDisplay key={field.key} field={field} value={val} />
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Cultures */}
              {cultures.length > 0 && (
                <div className="pt-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: WHITE }}>
                      <Heart className="h-3.5 w-3.5 text-[#6B3FA0]" />
                    </div>
                    <h4 className="text-sm font-bold text-[#6B3FA0]">Cultures maitrisees</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-[38px]">
                    {cultures.map((culture) => (
                      <span
                        key={culture.id}
                        className="inline-flex items-center text-xs font-semibold py-1.5 px-3.5 rounded-full text-[#6B3FA0] shadow-sm"
                        style={{ backgroundColor: WHITE }}
                      >
                        {culture.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Zones */}
              {zones.length > 0 && (
                <div className="pt-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: WHITE }}>
                      <MapPin className="h-3.5 w-3.5 text-[#6B3FA0]" />
                    </div>
                    <h4 className="text-sm font-bold text-[#6B3FA0]">Zones d'intervention</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-[38px]">
                    {zones.map((zone) => (
                      <span
                        key={zone.id}
                        className="inline-flex items-center text-xs font-medium py-1.5 px-3.5 rounded-full text-[#6B3FA0] shadow-sm"
                        style={{ backgroundColor: WHITE }}
                      >
                        {zone.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Avis */}
              <div className="pt-4" style={{ borderTop: `1px solid ${BEIGE_ACCENT}` }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center border" style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}>
                    <Star className="h-3.5 w-3.5 text-[#6B3FA0]" />
                  </div>
                  <h4 className="text-sm font-bold text-[#6B3FA0]">Avis</h4>
                </div>
                <div className="ml-[38px]">
                  <ReviewsList providerId={userId} limit={5} />
                </div>
              </div>

              {/* Empty state */}
              {!profile.description_courte && !profile.bio && cultures.length === 0 && zones.length === 0 && (
                <div className="text-center py-8 text-[#6B3FA0]/40 text-sm">
                  {isCoupleView
                    ? 'Ce prestataire n\'a pas encore complete son profil'
                    : 'Completez votre profil pour le rendre plus attractif'}
                </div>
              )}
            </TabsContent>

            {/* TAB: PORTFOLIO */}
            <TabsContent value="portfolio" className="m-0 p-5 data-[state=active]:block">
                {/* PDF Preview Modal */}
                {pdfPreviewUrl && (
                  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPdfPreviewUrl(null)}>
                    <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setPdfPreviewUrl(null)}
                        className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: WHITE }}
                      >
                        <X className="h-4 w-4 text-[#6B3FA0]" />
                      </button>
                      <iframe
                        src={`${pdfPreviewUrl}#toolbar=0`}
                        className="w-full h-full"
                        title="PDF Preview"
                      />
                    </div>
                  </div>
                )}

                {/* Video Preview Modal */}
                {videoPreviewUrl && (
                  <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setVideoPreviewUrl(null)}>
                    <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setVideoPreviewUrl(null)}
                        className="absolute -top-12 right-0 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                      <video
                        src={videoPreviewUrl}
                        controls
                        autoPlay
                        className="w-full rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {portfolio && portfolio.length > 0 ? (
                  <div className="space-y-5">
                    {(() => {
                      const images = portfolio.filter(item => {
                        const isVideo = item.file_type === 'video' || /\.(mp4|webm|mov)$/i.test(item.image_url)
                        const isPdf = item.file_type === 'pdf' || item.image_url?.toLowerCase().endsWith('.pdf')
                        return !isVideo && !isPdf
                      })
                      const videos = portfolio.filter(item =>
                        item.file_type === 'video' || /\.(mp4|webm|mov)$/i.test(item.image_url)
                      )
                      const pdfs = portfolio.filter(item =>
                        item.file_type === 'pdf' || item.image_url?.toLowerCase().endsWith('.pdf')
                      )

                      return (
                        <>
                          {/* Images */}
                          {images.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2.5 mb-3">
                                <div className="h-7 w-7 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: WHITE }}>
                                  <Image className="h-3.5 w-3.5 text-[#6B3FA0]" />
                                </div>
                                <span className="text-sm font-bold text-[#6B3FA0]">Photos ({images.length})</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {images.map((item) => (
                                  <div
                                    key={item.id}
                                    className="aspect-square rounded-xl overflow-hidden group cursor-pointer relative ring-1 transition-all hover:ring-2 hover:shadow-md"
                                    style={{
                                      backgroundColor: WHITE,
                                      '--tw-ring-color': BEIGE_ACCENT,
                                    } as React.CSSProperties}
                                    onMouseEnter={(e) => {
                                      (e.currentTarget.style as any)['--tw-ring-color'] = 'rgba(130,63,145,0.6)'
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget.style as any)['--tw-ring-color'] = BEIGE_ACCENT
                                    }}
                                  >
                                    <img
                                      src={item.image_url}
                                      alt={item.title || 'Portfolio'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                    />
                                    {item.title && (
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-[10px] font-medium truncate">{item.title}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Videos */}
                          {videos.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2.5 mb-3">
                                <div className="h-7 w-7 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: WHITE }}>
                                  <Play className="h-3.5 w-3.5 text-[#6B3FA0]" />
                                </div>
                                <span className="text-sm font-bold text-[#6B3FA0]">Videos ({videos.length})</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {videos.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => setVideoPreviewUrl(item.image_url)}
                                    className="aspect-video rounded-xl overflow-hidden group cursor-pointer relative ring-1 transition-all hover:ring-2"
                                    style={{
                                      backgroundColor: WHITE,
                                      '--tw-ring-color': BEIGE_ACCENT,
                                    } as React.CSSProperties}
                                  >
                                    <video
                                      src={item.image_url}
                                      className="w-full h-full object-cover"
                                      muted
                                      preload="metadata"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                      <div className="h-12 w-12 rounded-full shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
                                        <Play className="h-5 w-5 ml-0.5 text-[#6B3FA0]" />
                                      </div>
                                    </div>
                                    {item.title && (
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                        <p className="text-white text-xs font-medium truncate">{item.title}</p>
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* PDFs */}
                          {pdfs.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2.5 mb-3">
                                <div className="h-7 w-7 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: WHITE }}>
                                  <FileText className="h-3.5 w-3.5 text-[#6B3FA0]" />
                                </div>
                                <span className="text-sm font-bold text-[#6B3FA0]">Documents ({pdfs.length})</span>
                              </div>
                              <div className="space-y-2">
                                {pdfs.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => setPdfPreviewUrl(item.image_url)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl ring-1 transition-all group hover:shadow-md"
                                    style={{
                                      backgroundColor: WHITE,
                                      '--tw-ring-color': BEIGE_ACCENT,
                                    } as React.CSSProperties}
                                  >
                                    <div className="h-10 w-10 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: WHITE }}>
                                      <FileText className="h-5 w-5 text-[#6B3FA0]" />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                      <p className="text-sm font-semibold text-[#6B3FA0] truncate">{item.title || 'Document PDF'}</p>
                                      <p className="text-xs text-[#6B3FA0]/60">Cliquez pour visualiser</p>
                                    </div>
                                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-[#6B3FA0]/60 transition-colors" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm" style={{ backgroundColor: WHITE }}>
                      <Camera className="h-8 w-8 text-[#6B3FA0]/50" />
                    </div>
                    <p className="text-sm text-[#6B3FA0]/50">
                      {isCoupleView
                        ? 'Aucun media dans le portfolio'
                        : 'Ajoutez des photos et videos a votre portfolio'}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* TAB: LIENS / RESEAUX */}
            {/* TAB: CONTACT */}
            <TabsContent value="contact" className="m-0 p-5 data-[state=active]:block">
              <div className="space-y-4">
                {hasSocialLinks && (
                  <div className="space-y-3">
                    {socialLinks.map((social, i) => (
                      <a
                        key={i}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl transition-all group shadow-sm hover:shadow-md"
                        style={{ backgroundColor: WHITE }}
                      >
                        <div className="h-10 w-10 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: WHITE }}>
                          <social.icon className="h-5 w-5 text-[#6B3FA0]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#6B3FA0]">{social.label}</p>
                          <p className="text-xs text-[#6B3FA0]/50 truncate">{social.url}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-[#6B3FA0]/60" />
                      </a>
                    ))}
                  </div>
                )}

                {isCoupleView && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="message" className="text-sm font-semibold text-[#6B3FA0] mb-2 block">
                        Votre message <span className="text-[#6B3FA0]">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Decrivez votre projet, vos besoins..."
                        value={demandeMessage}
                        onChange={(e) => setDemandeMessage(e.target.value)}
                        className="min-h-[120px] text-sm resize-none text-gray-900 placeholder:text-[#6B3FA0]/30"
                        style={{
                          backgroundColor: WHITE,
                          borderColor: BEIGE_ACCENT,
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="date" className="text-sm font-semibold text-[#6B3FA0] mb-2 block">
                          Date du mariage
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={demandeDate}
                          onChange={(e) => setDemandeDate(e.target.value)}
                          className="text-sm text-gray-900"
                          style={{
                            backgroundColor: WHITE,
                            borderColor: BEIGE_ACCENT,
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="budget" className="text-sm font-semibold text-[#6B3FA0] mb-2 block">
                          Budget (€)
                        </Label>
                        <Input
                          id="budget"
                          type="number"
                          placeholder="2000"
                          value={demandeBudget}
                          onChange={(e) => setDemandeBudget(e.target.value)}
                          className="text-sm text-gray-900 placeholder:text-[#6B3FA0]/30"
                          style={{
                            backgroundColor: WHITE,
                            borderColor: BEIGE_ACCENT,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!hasSocialLinks && !isCoupleView && (
                  <div className="text-center py-8 text-[#6B3FA0]/40 text-sm">
                    Aucune information de contact disponible.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* FOOTER */}
          <div className="px-5 py-3">
            {isCoupleView && activeTab === 'contact' ? (
              <Button
                className="w-full h-11 text-white text-sm font-semibold gap-2 rounded-full shadow-md hover:opacity-90 transition-opacity bg-[#823F91] hover:bg-[#6D3478]"
                onClick={handleCreateDemande}
                disabled={isCreatingDemande || !demandeMessage.trim()}
              >
                {isCreatingDemande ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer la demande
                  </>
                )}
              </Button>
            ) : isCoupleView ? (
              <Button
                className="w-full h-11 text-white text-sm font-semibold gap-2 rounded-full shadow-md hover:opacity-90 transition-opacity bg-[#823F91] hover:bg-[#6D3478]"
                onClick={() => setActiveTab('contact')}
              >
                <MessageCircle className="h-4 w-4" />
                Contacter ce prestataire
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="w-full h-11 text-sm font-semibold text-[#6B3FA0] rounded-full shadow-sm hover:shadow-md hover:opacity-80 transition-opacity"
                style={{ backgroundColor: WHITE }}
                onClick={() => setOpen(false)}
              >
                Fermer l'apercu
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Helper component for displaying a single service detail field in preview
function ServiceDetailDisplay({ field, value }: { field: ServiceFieldConfig; value: unknown }) {
  if (value === undefined || value === null || value === '' || value === false) return null
  if (Array.isArray(value) && value.length === 0) return null

  const WHITE = '#FFFFFF'

  // Multi-select: show badges
  if (field.type === 'multi-select' && Array.isArray(value)) {
    const labels = value.map(v => {
      const opt = field.options?.find(o => o.value === v)
      return opt?.label || v
    })
    return (
      <div>
        <p className="text-xs font-semibold text-[#6B3FA0]/60 mb-1.5">{field.label}</p>
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label, i) => (
            <span
              key={i}
              className="inline-flex items-center text-[11px] font-medium py-1 px-2.5 rounded-full text-[#6B3FA0] shadow-sm"
              style={{ backgroundColor: WHITE }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  // Single select: show label
  if (field.type === 'single-select' && typeof value === 'string') {
    const opt = field.options?.find(o => o.value === value)
    return (
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#6B3FA0]/60">{field.label}</p>
        <span className="text-xs font-medium text-[#6B3FA0]">{opt?.label || value}</span>
      </div>
    )
  }

  // Number
  if (field.type === 'number' && (typeof value === 'number' || typeof value === 'string')) {
    return (
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#6B3FA0]/60">{field.label}</p>
        <span className="text-xs font-medium text-[#6B3FA0]">
          {value}{field.suffix ? ` ${field.suffix}` : ''}
        </span>
      </div>
    )
  }

  // Boolean (only show if true)
  if (field.type === 'boolean' && value === true) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-emerald-600" />
        </div>
        <p className="text-xs font-medium text-[#6B3FA0]">{field.label}</p>
      </div>
    )
  }

  return null
}
