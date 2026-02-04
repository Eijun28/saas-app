'use client'

import { useState, useEffect } from 'react'
import { Eye, X, MapPin, Euro, Briefcase, MessageCircle, Camera, Sparkles, Instagram, Facebook, Globe, Linkedin, Music2, ExternalLink, Send, Calendar, FileText, Heart, ChevronRight, User, Link2, Tag, Play, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
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
}

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
      'par_demi_journee': '/ demi-journée',
      'par_journee': '/ journée',
      'par_part': '/ part',
      'par_essayage': '/ essayage',
      'par_piece': '/ pièce',
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
          className="gap-2 bg-[#823F91] border-[#823F91] text-white hover:bg-[#6D3478] hover:border-[#6D3478] transition-colors shadow-sm"
        >
          <Eye className="h-4 w-4 text-white" />
          Apercu du profil
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] p-0 gap-0 rounded-2xl bg-white border-0 shadow-2xl flex flex-col"
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
              className="absolute top-3 right-3 z-20 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <X className="h-4 w-4 text-gray-600" />
            </Button>
          </DialogClose>

          {/* HEADER */}
          <div className="p-5 pb-4 border-b border-gray-100">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-16 w-16 ring-2 ring-gray-100">
                  <AvatarImage src={avatarUrl || undefined} alt={profile.nom_entreprise} />
                  <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-[#823F91] to-[#a855f7] text-white">
                    {getInitials(profile.nom_entreprise)}
                  </AvatarFallback>
                </Avatar>
                {profile.is_early_adopter && (
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center ring-2 ring-white">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pt-0.5 pr-8">
                <h2 className="text-lg font-bold text-gray-900 truncate">
                  {profile.nom_entreprise}
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  {profile.service_type}
                </p>

                {/* Key info badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {profile.ville_principale && (
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-0">
                      <MapPin className="h-3 w-3 mr-1" />
                      {profile.ville_principale}
                    </Badge>
                  )}
                  {profile.annees_experience && (
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-0">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {profile.annees_experience} ans
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TABS - Pills style */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-5 pt-3 pb-2">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTab('about')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                    activeTab === 'about'
                      ? "bg-[#823F91] text-white border-[#823F91] shadow-sm"
                      : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <User className={cn("h-4 w-4 inline mr-1.5 -mt-0.5", activeTab === 'about' ? "text-white" : "text-gray-900")} />
                  A propos
                </button>
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                    activeTab === 'portfolio'
                      ? "bg-[#823F91] text-white border-[#823F91] shadow-sm"
                      : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <Camera className={cn("h-4 w-4 inline mr-1.5 -mt-0.5", activeTab === 'portfolio' ? "text-white" : "text-gray-900")} />
                  Portfolio
                </button>
                {hasSocialLinks && (
                  <button
                    onClick={() => setActiveTab('links')}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                      activeTab === 'links'
                        ? "bg-[#823F91] text-white border-[#823F91] shadow-sm"
                        : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Link2 className={cn("h-4 w-4 inline mr-1.5 -mt-0.5", activeTab === 'links' ? "text-white" : "text-gray-900")} />
                    Liens
                  </button>
                )}
                {isCoupleView && (
                  <button
                    onClick={() => setActiveTab('contact')}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                      activeTab === 'contact'
                        ? "bg-[#823F91] text-white border-[#823F91] shadow-sm"
                        : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Send className={cn("h-4 w-4 inline mr-1.5 -mt-0.5", activeTab === 'contact' ? "text-white" : "text-gray-900")} />
                    Contact
                  </button>
                )}
              </div>
            </div>
            <TabsList className="hidden">
              <TabsTrigger value="about">A propos</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="links">Liens</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(85vh - 220px)' }}>
              {/* TAB: A PROPOS */}
              <TabsContent value="about" className="m-0 p-5 space-y-5 data-[state=active]:block">
                {/* Description */}
                {profile.description_courte && (
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {profile.description_courte}
                    </p>
                    {profile.prenom && profile.nom && (
                      <p className="text-xs text-gray-400 mt-2">
                        — {profile.prenom} {profile.nom}
                      </p>
                    )}
                  </div>
                )}

                {/* Bio */}
                {profile.bio && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Presentation</h4>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {/* Tarifs */}
                {getBudgetDisplay() && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <Euro className="h-3.5 w-3.5" />
                      Tarifs
                    </h4>
                    <p className="text-sm font-medium text-gray-900">
                      {getBudgetDisplay()}
                      {profile.pricing_unit && (
                        <span className="text-gray-500 font-normal ml-1">
                          {getPricingUnitLabel(profile.pricing_unit)}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Cultures */}
                {cultures.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Heart className="h-3.5 w-3.5 text-[#823F91]" />
                      Cultures maitrisees
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {cultures.map((culture) => (
                        <Badge
                          key={culture.id}
                          className="text-xs py-1.5 px-3 bg-[#823F91]/10 text-[#823F91] border-0 font-normal hover:bg-[#823F91]/15"
                        >
                          {culture.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zones */}
                {zones.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      Zones d'intervention
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {zones.map((zone) => (
                        <Badge
                          key={zone.id}
                          variant="outline"
                          className="text-xs py-1.5 px-3 bg-gray-50 text-gray-600 border-gray-200 font-normal"
                        >
                          {zone.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {!profile.description_courte && !profile.bio && cultures.length === 0 && zones.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
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
                        className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      >
                        <X className="h-4 w-4 text-gray-600" />
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
                  <div className="space-y-4">
                    {/* Separation par type */}
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
                              <div className="flex items-center gap-2 mb-3">
                                <div className="h-7 w-7 rounded-lg bg-[#823F91]/10 flex items-center justify-center">
                                  <Image className="h-4 w-4 text-[#823F91]" />
                                </div>
                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Photos ({images.length})</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {images.map((item) => (
                                  <div
                                    key={item.id}
                                    className="aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-pointer relative ring-1 ring-gray-200 hover:ring-[#823F91]/50 transition-all"
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
                              <div className="flex items-center gap-2 mb-3">
                                <div className="h-7 w-7 rounded-lg bg-pink-100 flex items-center justify-center">
                                  <Play className="h-4 w-4 text-pink-600" />
                                </div>
                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Videos ({videos.length})</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {videos.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => setVideoPreviewUrl(item.image_url)}
                                    className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-pink-50 to-pink-100 group cursor-pointer relative ring-1 ring-pink-200 hover:ring-pink-400 transition-all"
                                  >
                                    <video
                                      src={item.image_url}
                                      className="w-full h-full object-cover"
                                      muted
                                      preload="metadata"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                      <div className="h-12 w-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Play className="h-5 w-5 text-pink-600 ml-0.5" />
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
                              <div className="flex items-center gap-2 mb-3">
                                <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                                  <FileText className="h-4 w-4 text-amber-600" />
                                </div>
                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Documents ({pdfs.length})</span>
                              </div>
                              <div className="space-y-2">
                                {pdfs.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => setPdfPreviewUrl(item.image_url)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 ring-1 ring-amber-200 hover:ring-amber-400 transition-all group"
                                  >
                                    <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                      <FileText className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                      <p className="text-sm font-medium text-gray-900 truncate">{item.title || 'Document PDF'}</p>
                                      <p className="text-xs text-amber-600">Cliquez pour visualiser</p>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-amber-400 group-hover:text-amber-600 transition-colors flex-shrink-0" />
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
                    <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {isCoupleView
                        ? 'Aucun media dans le portfolio'
                        : 'Ajoutez des photos et videos a votre portfolio'}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* TAB: LIENS / RESEAUX */}
              {hasSocialLinks && (
                <TabsContent value="links" className="m-0 p-5 data-[state=active]:block">
                  <div className="space-y-3">
                    {socialLinks.map((social, i) => (
                      <a
                        key={i}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                      >
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <social.icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{social.label}</p>
                          <p className="text-xs text-gray-500 truncate">{social.url}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-[#823F91] transition-colors" />
                      </a>
                    ))}
                  </div>
                </TabsContent>
              )}

              {/* TAB: CONTACT (couple view only) */}
              {isCoupleView && (
                <TabsContent value="contact" className="m-0 p-5 data-[state=active]:block">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="message" className="text-sm font-medium text-gray-700 mb-2 block">
                        Votre message <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Decrivez votre projet, vos besoins..."
                        value={demandeMessage}
                        onChange={(e) => setDemandeMessage(e.target.value)}
                        className="min-h-[120px] text-sm resize-none border-gray-200 focus-visible:ring-[#823F91]/20 focus-visible:border-[#823F91]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="date" className="text-sm font-medium text-gray-700 mb-2 block">
                          Date du mariage
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={demandeDate}
                          onChange={(e) => setDemandeDate(e.target.value)}
                          className="text-sm border-gray-200 focus-visible:ring-[#823F91]/20 focus-visible:border-[#823F91]"
                        />
                      </div>
                      <div>
                        <Label htmlFor="budget" className="text-sm font-medium text-gray-700 mb-2 block">
                          Budget (€)
                        </Label>
                        <Input
                          id="budget"
                          type="number"
                          placeholder="2000"
                          value={demandeBudget}
                          onChange={(e) => setDemandeBudget(e.target.value)}
                          className="text-sm border-gray-200 focus-visible:ring-[#823F91]/20 focus-visible:border-[#823F91]"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>

          {/* FOOTER */}
          <div className="border-t border-gray-100 p-4 bg-gray-50/50">
            {isCoupleView && activeTab === 'contact' ? (
              <Button
                className="w-full h-11 bg-[#823F91] hover:bg-[#6D3478] text-white text-sm gap-2"
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
                className="w-full h-11 bg-[#823F91] hover:bg-[#6D3478] text-white text-sm gap-2"
                onClick={() => setActiveTab('contact')}
              >
                <MessageCircle className="h-4 w-4" />
                Contacter ce prestataire
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full h-11 text-sm border-gray-200 text-gray-600 hover:bg-gray-100"
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
