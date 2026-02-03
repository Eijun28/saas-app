'use client'

import { useState, useEffect } from 'react'
import { Eye, X, MapPin, Euro, Briefcase, MessageCircle, Camera, Sparkles, Instagram, Facebook, Globe, Linkedin, Music2, ExternalLink, Send, Calendar, FileText, Heart, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from '@/components/ui/dialog'
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
  }
  cultures: Array<{ id: string; label: string }>
  zones: Array<{ id: string; label: string }>
  portfolio: Array<{ id: string; image_url: string; title?: string; file_type?: 'image' | 'pdf' }>
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
  const [showContactForm, setShowContactForm] = useState(false)

  useEffect(() => {
    if (!open) {
      setDemandeMessage('')
      setDemandeDate('')
      setDemandeBudget('')
      setShowContactForm(false)
    }
  }, [open])

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
    profile.website_url && { icon: Globe, url: profile.website_url, label: 'Site' },
    profile.linkedin_url && { icon: Linkedin, url: profile.linkedin_url, label: 'LinkedIn' },
    profile.tiktok_url && { icon: Music2, url: profile.tiktok_url, label: 'TikTok' },
  ].filter(Boolean) as Array<{ icon: any; url: string; label: string }>

  // Preview portfolio (first 4 images)
  const portfolioPreview = portfolio.filter(p => p.file_type !== 'pdf').slice(0, 4)

  return (
    <>
      {showTriggerButton && (
        <Button
          variant="outline"
          size="default"
          onClick={() => setOpen(true)}
          className="gap-2 border-[#823F91]/20 text-[#823F91] hover:bg-[#823F91]/5"
        >
          <Eye className="h-4 w-4" />
          Apercu
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] p-0 gap-0 overflow-hidden rounded-2xl bg-white border-0 shadow-2xl"
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
              className="absolute top-3 right-3 z-20 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
            >
              <X className="h-4 w-4 text-gray-600" />
            </Button>
          </DialogClose>

          {/* Scrollable content */}
          <div className="overflow-y-auto max-h-[85vh]">
            {/* HEADER */}
            <div className="p-5 pb-4">
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
                <div className="flex-1 min-w-0 pt-0.5">
                  <h2 className="text-lg font-bold text-gray-900 truncate">
                    {profile.nom_entreprise}
                  </h2>
                  <p className="text-sm text-gray-500 mb-2">
                    {profile.service_type}
                  </p>

                  {/* Key info row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                    {profile.ville_principale && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {profile.ville_principale}
                      </span>
                    )}
                    {getBudgetDisplay() && (
                      <span className="flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        {getBudgetDisplay()}
                      </span>
                    )}
                    {profile.annees_experience && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {profile.annees_experience} ans
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            {profile.description_courte && (
              <div className="px-5 pb-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {profile.description_courte}
                </p>
                {profile.prenom && profile.nom && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    — {profile.prenom} {profile.nom}
                  </p>
                )}
              </div>
            )}

            {/* CULTURES */}
            {cultures.length > 0 && (
              <div className="px-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-3.5 w-3.5 text-[#823F91]" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cultures</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cultures.map((culture) => (
                    <Badge
                      key={culture.id}
                      variant="secondary"
                      className="text-xs py-1 px-2.5 bg-[#823F91]/8 text-[#823F91] border-0 font-normal"
                    >
                      {culture.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* ZONES */}
            {zones.length > 0 && (
              <div className="px-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Zones</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {zones.slice(0, 5).map((zone) => (
                    <Badge
                      key={zone.id}
                      variant="outline"
                      className="text-xs py-1 px-2.5 bg-gray-50 text-gray-600 border-gray-200 font-normal"
                    >
                      {zone.label}
                    </Badge>
                  ))}
                  {zones.length > 5 && (
                    <Badge variant="outline" className="text-xs py-1 px-2.5 bg-gray-50 text-gray-400 border-gray-200 font-normal">
                      +{zones.length - 5}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* PORTFOLIO PREVIEW */}
            {portfolioPreview.length > 0 && (
              <div className="px-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Portfolio ({portfolio.length})
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {portfolioPreview.map((item, i) => (
                    <div
                      key={item.id}
                      className={cn(
                        "aspect-square rounded-lg overflow-hidden bg-gray-100",
                        i === 3 && portfolio.length > 4 && "relative"
                      )}
                    >
                      <img
                        src={item.image_url}
                        alt={item.title || 'Portfolio'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {i === 3 && portfolio.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">+{portfolio.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SOCIAL LINKS */}
            {socialLinks.length > 0 && (
              <div className="px-5 pb-4">
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map((social, i) => (
                    <a
                      key={i}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs transition-colors"
                    >
                      <social.icon className="h-3.5 w-3.5" />
                      {social.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CONTACT FORM (for couple view) */}
            {isCoupleView && showContactForm && (
              <div className="px-5 pb-4 space-y-3">
                <div className="h-px bg-gray-100" />
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="message" className="text-xs font-medium text-gray-700 mb-1.5 block">
                      Votre message
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Decrivez votre projet..."
                      value={demandeMessage}
                      onChange={(e) => setDemandeMessage(e.target.value)}
                      className="min-h-[100px] text-sm resize-none border-gray-200 focus-visible:ring-[#823F91]/20 focus-visible:border-[#823F91]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="date" className="text-xs font-medium text-gray-700 mb-1.5 block">
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
                      <Label htmlFor="budget" className="text-xs font-medium text-gray-700 mb-1.5 block">
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
              </div>
            )}

            {/* Empty state */}
            {!profile.description_courte && cultures.length === 0 && zones.length === 0 && portfolio.length === 0 && (
              <div className="px-5 pb-4">
                <div className="text-center py-8 text-gray-400 text-sm">
                  {isCoupleView
                    ? 'Ce prestataire n\'a pas encore complete son profil'
                    : 'Completez votre profil pour le rendre plus attractif'}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="border-t border-gray-100 p-4 bg-gray-50/50">
            {isCoupleView ? (
              showContactForm ? (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="flex-1 text-sm h-10 text-gray-600"
                    onClick={() => setShowContactForm(false)}
                    disabled={isCreatingDemande}
                  >
                    Retour
                  </Button>
                  <Button
                    className="flex-1 h-10 bg-[#823F91] hover:bg-[#6D3478] text-white text-sm gap-2"
                    onClick={handleCreateDemande}
                    disabled={isCreatingDemande || !demandeMessage.trim()}
                  >
                    {isCreatingDemande ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Envoyer
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full h-10 bg-[#823F91] hover:bg-[#6D3478] text-white text-sm gap-2"
                  onClick={() => setShowContactForm(true)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Contacter ce prestataire
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              )
            ) : (
              <Button
                variant="ghost"
                className="w-full h-10 text-sm text-gray-600 hover:text-gray-900"
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
