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
      return `${profile.budget_min.toLocaleString()} – ${profile.budget_max.toLocaleString()} €`
    } else if (profile.budget_min) {
      return `À partir de ${profile.budget_min.toLocaleString()} €`
    } else if (profile.budget_max) {
      return `Jusqu'à ${profile.budget_max.toLocaleString()} €`
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
      toast.error('Vous devez être connecté pour envoyer une demande')
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
          toast.error('Une demande est déjà en attente pour ce prestataire')
          setIsCreatingDemande(false)
          return
        } else if (existingRequest.status === 'accepted') {
          toast.error('Vous avez déjà une demande acceptée avec ce prestataire')
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
          toast.error('Une demande existe déjà pour ce prestataire')
        } else if (error.code === '42501') {
          toast.error('Vous n\'avez pas la permission d\'envoyer cette demande')
        } else {
          toast.error('Erreur lors de l\'envoi de la demande')
        }
        return
      }

      if (data?.id) {
        // Appel server-side via API route (jamais directement depuis le client)
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_request',
            providerId: userId,
            coupleId: currentCoupleId,
            requestId: data.id,
            message: demandeMessage.trim(),
          }),
        }).catch((emailError) => {
          console.error('Erreur envoi notification nouvelle demande:', emailError)
        })
      }

      toast.success('Demande envoyée avec succès !')
      setDemandeMessage('')
      setDemandeDate('')
      setDemandeBudget('')
      setOpen(false)

      setTimeout(() => {
        router.push('/couple/demandes')
      }, 500)
    } catch (error: unknown) {
      console.error('Erreur creation demande:', error)
      const msg = error instanceof Error ? error.message : 'Erreur lors de l\'envoi de la demande'
      toast.error(msg)
    } finally {
      setIsCreatingDemande(false)
    }
  }

  const socialLinks = [
    profile.instagram_url && { icon: Instagram, url: profile.instagram_url, label: 'Instagram' },
    profile.facebook_url && { icon: Facebook, url: profile.facebook_url, label: 'Facebook' },
    profile.website_url && { icon: Globe, url: profile.website_url, label: 'Site web' },
    profile.linkedin_url && { icon: Linkedin, url: profile.linkedin_url, label: 'LinkedIn' },
    profile.tiktok_url && { icon: Music2, url: profile.tiktok_url, label: 'TikTok' },
  ].filter(Boolean) as Array<{ icon: React.ElementType; url: string; label: string }>

  const hasSocialLinks = socialLinks.length > 0
  const budgetDisplay = getBudgetDisplay()

  return (
    <>
      {showTriggerButton && (
        <Button
          variant="outline"
          size="default"
          onClick={() => setOpen(true)}
          className="gap-2 px-2.5 sm:px-4"
        >
          <Eye className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Aperçu du profil</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="p-0 gap-0 border border-gray-200 shadow-xl flex flex-col overflow-hidden rounded-2xl max-h-[88vh] bg-white"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">
            Aperçu du profil — {profile.nom_entreprise}
          </DialogTitle>

          {/* HEADER */}
          <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
            <Avatar className="h-14 w-14 shrink-0 ring-1 ring-gray-200">
              <AvatarImage src={avatarUrl || undefined} alt={profile.nom_entreprise} />
              <AvatarFallback className="text-base font-semibold bg-gray-100 text-gray-600">
                {getInitials(profile.nom_entreprise)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-gray-900 truncate">
                  {profile.nom_entreprise}
                </h2>
                {hasSiret && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#823F91] bg-[#823F91]/8 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-3 w-3" />
                    Vérifié
                  </span>
                )}
                {profile.is_early_adopter && !hasSiret && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#823F91] bg-[#823F91]/8 px-2 py-0.5 rounded-full">
                    <Sparkles className="h-3 w-3" />
                    Early Adopter
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{profile.service_type}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {profile.ville_principale && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="h-3 w-3" />
                    {profile.ville_principale}
                  </span>
                )}
                {profile.annees_experience && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Briefcase className="h-3 w-3" />
                    {profile.annees_experience} ans d'expérience
                  </span>
                )}
                {budgetDisplay && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Euro className="h-3 w-3" />
                    {budgetDisplay}
                    {profile.pricing_unit && (
                      <span>{getPricingUnitLabel(profile.pricing_unit)}</span>
                    )}
                  </span>
                )}
              </div>
            </div>

            <DialogClose asChild>
              <button className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </div>

          {/* TABS */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex border-b border-gray-100 px-5">
              {[
                { id: 'about', label: 'À propos', icon: User },
                { id: 'portfolio', label: 'Portfolio', icon: Camera },
                { id: 'contact', label: 'Contact', icon: Send },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'flex items-center gap-1.5 px-1 py-3 mr-5 text-sm font-medium border-b-2 -mb-px transition-colors',
                    activeTab === id
                      ? 'border-[#823F91] text-[#823F91]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* TAB: À PROPOS */}
              {activeTab === 'about' && (
                <div className="p-5 space-y-5">
                  {/* Description courte */}
                  {profile.description_courte && (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {profile.description_courte}
                      {(profile.prenom || profile.nom) && (
                        <span className="block mt-1.5 text-sm text-gray-400">
                          — {profile.prenom} {profile.nom}
                        </span>
                      )}
                    </p>
                  )}

                  {/* Bio */}
                  {profile.bio && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Présentation</p>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                        {profile.bio}
                      </p>
                    </div>
                  )}

                  {/* Détails métier */}
                  {serviceTypeValue && hasServiceFields(serviceTypeValue) && Object.keys(serviceDetails).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Détails métier</p>
                      <div className="space-y-2">
                        {getServiceFieldGroups(serviceTypeValue).map((group, gIdx) => {
                          const filledFields = group.fields.filter(f => {
                            const val = serviceDetails[f.key]
                            if (val === undefined || val === null || val === '' || val === false) return false
                            if (Array.isArray(val) && val.length === 0) return false
                            return true
                          })
                          if (filledFields.length === 0) return null
                          return (
                            <div key={gIdx} className="space-y-2">
                              {filledFields.map(field => (
                                <ServiceDetailDisplay key={field.key} field={field} value={serviceDetails[field.key]} />
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cultures */}
                  {cultures.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Cultures maîtrisées</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cultures.map((culture) => (
                          <span
                            key={culture.id}
                            className="inline-flex items-center text-xs font-medium py-1 px-2.5 rounded-full bg-gray-100 text-gray-700"
                          >
                            {culture.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Zones */}
                  {zones.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Zones d'intervention</p>
                      <div className="flex flex-wrap gap-1.5">
                        {zones.slice(0, 8).map((zone) => (
                          <span
                            key={zone.id}
                            className="inline-flex items-center text-xs font-medium py-1 px-2.5 rounded-full bg-gray-100 text-gray-700"
                          >
                            {zone.label}
                          </span>
                        ))}
                        {zones.length > 8 && (
                          <span className="inline-flex items-center text-xs font-medium py-1 px-2.5 rounded-full bg-gray-100 text-gray-500">
                            +{zones.length - 8}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Avis */}
                  <div className="pt-1 border-t border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Avis</p>
                    <ReviewsList providerId={userId} limit={5} />
                  </div>

                  {/* Empty state */}
                  {!profile.description_courte && !profile.bio && cultures.length === 0 && zones.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm">
                      {isCoupleView
                        ? 'Ce prestataire n\'a pas encore complété son profil'
                        : 'Complétez votre profil pour le rendre plus attractif'}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PORTFOLIO */}
              {activeTab === 'portfolio' && (
                <div className="p-5">
                  {/* PDF Preview Modal */}
                  {pdfPreviewUrl && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPdfPreviewUrl(null)}>
                      <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setPdfPreviewUrl(null)}
                          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white flex items-center justify-center shadow"
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
                            {images.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                                  Photos ({images.length})
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                  {images.map((item) => (
                                    <div
                                      key={item.id}
                                      className="aspect-square rounded-lg overflow-hidden group cursor-pointer relative ring-1 ring-gray-200 hover:ring-gray-300 transition-all"
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

                            {videos.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                                  Vidéos ({videos.length})
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                  {videos.map((item) => (
                                    <button
                                      key={item.id}
                                      onClick={() => setVideoPreviewUrl(item.image_url)}
                                      className="aspect-video rounded-lg overflow-hidden group cursor-pointer relative ring-1 ring-gray-200 hover:ring-gray-300 transition-all"
                                    >
                                      <video
                                        src={item.image_url}
                                        className="w-full h-full object-cover"
                                        muted
                                        preload="metadata"
                                      />
                                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow">
                                          <Play className="h-4 w-4 ml-0.5 text-gray-700" />
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

                            {pdfs.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                                  Documents ({pdfs.length})
                                </p>
                                <div className="space-y-2">
                                  {pdfs.map((item) => (
                                    <button
                                      key={item.id}
                                      onClick={() => setPdfPreviewUrl(item.image_url)}
                                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                                    >
                                      <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 truncate">{item.title || 'Document PDF'}</p>
                                        <p className="text-xs text-gray-400">Cliquer pour visualiser</p>
                                      </div>
                                      <ExternalLink className="h-4 w-4 text-gray-400 shrink-0" />
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
                      <Camera className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">
                        {isCoupleView
                          ? 'Aucun média dans le portfolio'
                          : 'Ajoutez des photos et vidéos à votre portfolio'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: CONTACT */}
              {activeTab === 'contact' && (
                <div className="p-5 space-y-4">
                  {hasSocialLinks && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Réseaux & liens</p>
                      {socialLinks.map((social, i) => (
                        <a
                          key={i}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                        >
                          <social.icon className="h-4 w-4 text-gray-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700">{social.label}</p>
                            <p className="text-xs text-gray-400 truncate">{social.url}</p>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}

                  {isCoupleView && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="message" className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 block">
                          Votre message <span className="text-red-400">*</span>
                        </Label>
                        <Textarea
                          id="message"
                          placeholder="Décrivez votre projet, vos besoins..."
                          value={demandeMessage}
                          onChange={(e) => setDemandeMessage(e.target.value)}
                          className="min-h-[100px] text-sm resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 block">
                            Date du mariage
                          </Label>
                          <Input
                            id="date"
                            type="date"
                            value={demandeDate}
                            onChange={(e) => setDemandeDate(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="budget" className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 block">
                            Budget (€)
                          </Label>
                          <Input
                            id="budget"
                            type="number"
                            placeholder="2000"
                            value={demandeBudget}
                            onChange={(e) => setDemandeBudget(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {!hasSocialLinks && !isCoupleView && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Aucune information de contact disponible.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-5 py-3 border-t border-gray-100 shrink-0">
            {isCoupleView && activeTab === 'contact' ? (
              <Button
                className="w-full h-10 text-sm font-medium gap-2 bg-[#823F91] hover:bg-[#6D3478] text-white"
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
                className="w-full h-10 text-sm font-medium gap-2 bg-[#823F91] hover:bg-[#6D3478] text-white"
                onClick={() => setActiveTab('contact')}
              >
                <MessageCircle className="h-4 w-4" />
                Contacter ce prestataire
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="w-full h-10 text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setOpen(false)}
              >
                Fermer l'aperçu
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

  if (field.type === 'multi-select' && Array.isArray(value)) {
    const labels = value.map(v => {
      const opt = field.options?.find(o => o.value === v)
      return opt?.label || v
    })
    return (
      <div>
        <p className="text-xs text-gray-400 mb-1">{field.label}</p>
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label, i) => (
            <span key={i} className="text-xs font-medium py-0.5 px-2 rounded-full bg-gray-100 text-gray-700">
              {label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (field.type === 'single-select' && typeof value === 'string') {
    const opt = field.options?.find(o => o.value === value)
    return (
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{field.label}</p>
        <span className="text-xs font-medium text-gray-700">{opt?.label || value}</span>
      </div>
    )
  }

  if (field.type === 'number' && (typeof value === 'number' || typeof value === 'string')) {
    return (
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{field.label}</p>
        <span className="text-xs font-medium text-gray-700">
          {value}{field.suffix ? ` ${field.suffix}` : ''}
        </span>
      </div>
    )
  }

  if (field.type === 'boolean' && value === true) {
    return (
      <div className="flex items-center gap-1.5">
        <Check className="h-3.5 w-3.5 text-emerald-500" />
        <p className="text-xs font-medium text-gray-700">{field.label}</p>
      </div>
    )
  }

  return null
}
