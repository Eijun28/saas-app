'use client'

import { useState, useEffect } from 'react'
import { Eye, X, MapPin, Euro, Briefcase, MessageCircle, Camera, Sparkles, Instagram, Facebook, Globe, Linkedin, Music2, ExternalLink, Send, FileText, Heart, ChevronRight, User, Play, Image, ShieldCheck } from 'lucide-react'
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
  brandColor?: string
  hasSiret?: boolean
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
}: ProfilePreviewDialogProps) {
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
          className="gap-2 text-black transition-colors shadow-sm border hover:opacity-90"
          style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}
        >
          <Eye className="h-4 w-4 text-black" />
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
              className="absolute top-3 right-3 z-20 h-8 w-8 rounded-full border hover:opacity-80"
              style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}
            >
              <X className="h-4 w-4 text-black" />
            </Button>
          </DialogClose>

          {/* HEADER */}
          <div className="relative px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${BEIGE_ACCENT}` }}>
            <div className="flex items-end gap-4">
              <div className="relative flex-shrink-0">
                <Avatar className="h-20 w-20 ring-[3px] shadow-sm" style={{ '--tw-ring-color': BEIGE_ACCENT } as React.CSSProperties}>
                  <AvatarImage src={avatarUrl || undefined} alt={profile.nom_entreprise} />
                  <AvatarFallback className="text-xl font-bold text-black" style={{ backgroundColor: WHITE }}>
                    {getInitials(profile.nom_entreprise)}
                  </AvatarFallback>
                </Avatar>
                {(hasSiret || profile.is_early_adopter) && (
                  <div
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full flex items-center justify-center ring-2"
                    style={{
                      backgroundColor: WHITE,
                      '--tw-ring-color': BEIGE
                    } as React.CSSProperties}
                  >
                    {hasSiret ? <ShieldCheck className="h-3.5 w-3.5 text-black" /> : <Sparkles className="h-3.5 w-3.5 text-black" />}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pb-1 pr-8">
                <h2 className="text-xl font-bold text-black truncate">
                  {profile.nom_entreprise}
                </h2>
                <p className="text-sm text-black/70 font-medium">
                  {profile.service_type}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              {hasSiret && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-black border"
                  style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-black" />
                  Professionnel
                </span>
              )}
              {profile.is_early_adopter && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-black border"
                  style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}
                >
                  <Sparkles className="h-3.5 w-3.5 text-black" />
                  Early Adopter
                </span>
              )}
              {profile.ville_principale && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full text-black border"
                  style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}
                >
                  <MapPin className="h-3.5 w-3.5 text-black" />
                  {profile.ville_principale}
                </span>
              )}
              {profile.annees_experience && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full text-black border"
                  style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}
                >
                  <Briefcase className="h-3.5 w-3.5 text-black" />
                  {profile.annees_experience} ans
                </span>
              )}
            </div>
          </div>

          {/* TABS - Pills style */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-5 pt-2 pb-3" style={{ borderBottom: `1px solid ${BEIGE_ACCENT}` }}>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTab('about')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                    activeTab === 'about'
                      ? "text-black shadow-sm -translate-y-0.5"
                      : "text-black hover:shadow-sm"
                  )}
                  style={{
                    backgroundColor: WHITE,
                    borderColor: activeTab === 'about' ? '#000000' : BEIGE_ACCENT,
                  }}
                >
                  <User className={cn("h-4 w-4 inline mr-1.5 -mt-0.5", "text-black")} />
                  A propos
                </button>
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                    activeTab === 'portfolio'
                      ? "text-black shadow-sm -translate-y-0.5"
                      : "text-black hover:shadow-sm"
                  )}
                  style={{
                    backgroundColor: WHITE,
                    borderColor: activeTab === 'portfolio' ? '#000000' : BEIGE_ACCENT,
                  }}
                >
                  <Camera className={cn("h-4 w-4 inline mr-1.5 -mt-0.5", "text-black")} />
                  Portfolio
                </button>
                <button
                  onClick={() => setActiveTab('contact')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                    activeTab === 'contact'
                      ? "text-black shadow-sm -translate-y-0.5"
                      : "text-black hover:shadow-sm"
                  )}
                  style={{
                    backgroundColor: WHITE,
                    borderColor: activeTab === 'contact' ? '#000000' : BEIGE_ACCENT,
                  }}
                >
                  <Send className={cn("h-4 w-4 inline mr-1.5 -mt-0.5", "text-black")} />
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
                  <p className="text-sm text-black leading-relaxed">
                    {profile.description_courte}
                  </p>
                  {(profile.prenom || profile.nom) && (
                    <p className="text-sm font-semibold mt-2 text-black">
                      — {profile.prenom} {profile.nom}
                    </p>
                  )}
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <div className="pt-4" style={{ borderTop: `1px solid ${BEIGE_ACCENT}` }}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center border" style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}>
                      <User className="h-3.5 w-3.5 text-black" />
                    </div>
                    <h4 className="text-sm font-bold text-black">Presentation</h4>
                  </div>
                  <p className="text-sm text-black/80 leading-relaxed whitespace-pre-line">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Tarifs */}
              {getBudgetDisplay() && (
                <div
                  className="rounded-xl p-4 border"
                  style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center border" style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}>
                      <Euro className="h-3.5 w-3.5 text-black" />
                    </div>
                    <h4 className="text-sm font-bold text-black">Tarifs</h4>
                  </div>
                  <p className="text-lg font-bold text-black ml-[38px]">
                    {getBudgetDisplay()}
                    {profile.pricing_unit && (
                      <span className="text-sm font-medium ml-1 text-black">
                        {getPricingUnitLabel(profile.pricing_unit)}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Cultures */}
              {cultures.length > 0 && (
                <div className="pt-4" style={{ borderTop: `1px solid ${BEIGE_ACCENT}` }}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center border" style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}>
                      <Heart className="h-3.5 w-3.5 text-black" />
                    </div>
                    <h4 className="text-sm font-bold text-black">Cultures maitrisees</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-[38px]">
                    {cultures.map((culture) => (
                      <span
                        key={culture.id}
                        className="inline-flex items-center text-xs font-semibold py-1.5 px-3.5 rounded-full text-black border"
                        style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}
                      >
                        {culture.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Zones */}
              {zones.length > 0 && (
                <div className="pt-4" style={{ borderTop: `1px solid ${BEIGE_ACCENT}` }}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center border" style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}>
                      <MapPin className="h-3.5 w-3.5 text-black" />
                    </div>
                    <h4 className="text-sm font-bold text-black">Zones d'intervention</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-[38px]">
                    {zones.map((zone) => (
                      <span
                        key={zone.id}
                        className="inline-flex items-center text-xs font-medium py-1.5 px-3.5 rounded-full text-black border"
                        style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}
                      >
                        {zone.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!profile.description_courte && !profile.bio && cultures.length === 0 && zones.length === 0 && (
                <div className="text-center py-8 text-black/40 text-sm">
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
                        className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full flex items-center justify-center border"
                        style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}
                      >
                        <X className="h-4 w-4 text-black" />
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
                                <div className="h-7 w-7 rounded-full flex items-center justify-center border" style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}>
                                  <Image className="h-3.5 w-3.5 text-black" />
                                </div>
                                <span className="text-sm font-bold text-black">Photos ({images.length})</span>
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
                                      (e.currentTarget.style as any)['--tw-ring-color'] = 'rgba(0,0,0,0.6)'
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
                                <div className="h-7 w-7 rounded-full flex items-center justify-center border" style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}>
                                  <Play className="h-3.5 w-3.5 text-black" />
                                </div>
                                <span className="text-sm font-bold text-black">Videos ({videos.length})</span>
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
                                        <Play className="h-5 w-5 ml-0.5 text-black" />
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
                                <div className="h-7 w-7 rounded-full flex items-center justify-center border" style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}>
                                  <FileText className="h-3.5 w-3.5 text-black" />
                                </div>
                                <span className="text-sm font-bold text-black">Documents ({pdfs.length})</span>
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
                                    <div className="h-10 w-10 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0 border" style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}>
                                      <FileText className="h-5 w-5 text-black" />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                      <p className="text-sm font-semibold text-black truncate">{item.title || 'Document PDF'}</p>
                                      <p className="text-xs text-black/60">Cliquez pour visualiser</p>
                                    </div>
                                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-black/60 transition-colors" />
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
                    <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border" style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}>
                      <Camera className="h-8 w-8 text-black/50" />
                    </div>
                    <p className="text-sm text-black/50">
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
                        className="flex items-center gap-3 p-3 rounded-xl transition-all group border hover:shadow-md"
                        style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}
                      >
                        <div className="h-10 w-10 rounded-full flex items-center justify-center shadow-sm border" style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}>
                          <social.icon className="h-5 w-5 text-black" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-black">{social.label}</p>
                          <p className="text-xs text-black/50 truncate">{social.url}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-black/60" />
                      </a>
                    ))}
                  </div>
                )}

                {isCoupleView && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="message" className="text-sm font-semibold text-black mb-2 block">
                        Votre message <span className="text-black">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Decrivez votre projet, vos besoins..."
                        value={demandeMessage}
                        onChange={(e) => setDemandeMessage(e.target.value)}
                        className="min-h-[120px] text-sm resize-none text-black placeholder:text-black/30"
                        style={{
                          backgroundColor: WHITE,
                          borderColor: BEIGE_ACCENT,
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="date" className="text-sm font-semibold text-black mb-2 block">
                          Date du mariage
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={demandeDate}
                          onChange={(e) => setDemandeDate(e.target.value)}
                          className="text-sm text-black"
                          style={{
                            backgroundColor: WHITE,
                            borderColor: BEIGE_ACCENT,
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="budget" className="text-sm font-semibold text-black mb-2 block">
                          Budget (€)
                        </Label>
                        <Input
                          id="budget"
                          type="number"
                          placeholder="2000"
                          value={demandeBudget}
                          onChange={(e) => setDemandeBudget(e.target.value)}
                          className="text-sm text-black placeholder:text-black/30"
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
                  <div className="text-center py-8 text-black/40 text-sm">
                    Aucune information de contact disponible.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* FOOTER */}
          <div className="p-4" style={{ borderTop: `1px solid ${BEIGE_ACCENT}`, backgroundColor: BEIGE }}>
            {isCoupleView && activeTab === 'contact' ? (
              <Button
                className="w-full h-11 text-black text-sm font-semibold gap-2 border hover:opacity-90 transition-opacity"
                style={{ backgroundColor: WHITE, borderColor: '#000000' }}
                onClick={handleCreateDemande}
                disabled={isCreatingDemande || !demandeMessage.trim()}
              >
                {isCreatingDemande ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
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
                className="w-full h-11 text-black text-sm font-semibold gap-2 border hover:opacity-90 transition-opacity"
                style={{ backgroundColor: WHITE, borderColor: '#000000' }}
                onClick={() => setActiveTab('contact')}
              >
                <MessageCircle className="h-4 w-4" />
                Contacter ce prestataire
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full h-11 text-sm font-semibold text-black hover:opacity-80 transition-opacity"
                style={{ backgroundColor: WHITE, borderColor: BEIGE_ACCENT }}
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
