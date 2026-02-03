'use client'

import { useState, useEffect } from 'react'
import { Eye, X, MapPin, Euro, Briefcase, MessageCircle, Camera, Sparkles, Instagram, Facebook, Globe, Linkedin, Music2, ExternalLink, Send, Calendar, FileText, Heart, ChevronRight, User, Link2 } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'contact'>('about')

  useEffect(() => {
    if (!open) {
      setDemandeMessage('')
      setDemandeDate('')
      setDemandeBudget('')
      setActiveTab('about')
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
    profile.website_url && { icon: Globe, url: profile.website_url, label: 'Site web' },
    profile.linkedin_url && { icon: Linkedin, url: profile.linkedin_url, label: 'LinkedIn' },
    profile.tiktok_url && { icon: Music2, url: profile.tiktok_url, label: 'TikTok' },
  ].filter(Boolean) as Array<{ icon: any; url: string; label: string }>

  const hasSocialLinks = socialLinks.length > 0

  // Tabs config
  const tabs = [
    { id: 'about' as const, label: 'A propos', icon: User },
    { id: 'portfolio' as const, label: `Portfolio (${portfolio.length})`, icon: Camera },
    ...(isCoupleView ? [{ id: 'contact' as const, label: 'Contact', icon: Send }] : []),
  ]

  return (
    <>
      {showTriggerButton && (
        <Button
          size="default"
          onClick={() => setOpen(true)}
          className="gap-2 bg-[#823F91] hover:bg-[#6D3478] text-white shadow-md"
        >
          <Eye className="h-4 w-4" />
          Apercu du profil
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[calc(100vw-2rem)] sm:max-w-[480px] max-h-[90vh] p-0 gap-0 overflow-hidden rounded-3xl bg-white border-0 shadow-2xl flex flex-col"
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
              className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-black/5 hover:bg-black/10 backdrop-blur-sm"
            >
              <X className="h-4 w-4 text-gray-600" />
            </Button>
          </DialogClose>

          {/* HEADER */}
          <div className="p-6 pb-4 bg-gradient-to-b from-gray-50 to-white">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                  <AvatarImage src={avatarUrl || undefined} alt={profile.nom_entreprise} />
                  <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-[#823F91] to-[#a855f7] text-white">
                    {getInitials(profile.nom_entreprise)}
                  </AvatarFallback>
                </Avatar>
                {profile.is_early_adopter && (
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center ring-3 ring-white shadow-md">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate mb-0.5">
                  {profile.nom_entreprise}
                </h2>
                <p className="text-sm text-[#823F91] font-medium mb-2">
                  {profile.service_type}
                </p>

                {/* Key info inline */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
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

          {/* TABS - Pill design */}
          <div className="px-6 pb-3">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-white text-[#823F91] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden xs:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* TAB: A PROPOS */}
            {activeTab === 'about' && (
              <div className="px-6 pb-6 space-y-5">
                {/* Description */}
                {profile.description_courte && (
                  <div className="bg-gray-50 rounded-2xl p-4">
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
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Presentation</h4>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {/* Cultures */}
                {cultures.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      <Heart className="h-3.5 w-3.5 text-[#823F91]" />
                      Cultures maitrisees
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {cultures.map((culture) => (
                        <span
                          key={culture.id}
                          className="px-3 py-1.5 bg-[#823F91]/10 text-[#823F91] text-sm font-medium rounded-full"
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
                    <h4 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      <MapPin className="h-3.5 w-3.5" />
                      Zones d'intervention
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {zones.map((zone) => (
                        <span
                          key={zone.id}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-full"
                        >
                          {zone.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social links */}
                {hasSocialLinks && (
                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      <Link2 className="h-3.5 w-3.5" />
                      Reseaux sociaux
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {socialLinks.map((social, i) => (
                        <a
                          key={i}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
                        >
                          <social.icon className="h-4 w-4" />
                          {social.label}
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {!profile.description_courte && !profile.bio && cultures.length === 0 && zones.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    {isCoupleView
                      ? 'Ce prestataire n\'a pas encore complete son profil'
                      : 'Completez votre profil pour le rendre plus attractif'}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PORTFOLIO */}
            {activeTab === 'portfolio' && (
              <div className="px-6 pb-6">
                {portfolio && portfolio.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {portfolio.map((item) => {
                      const isPdf = item.file_type === 'pdf'
                      return (
                        <div
                          key={item.id}
                          className="aspect-square rounded-2xl overflow-hidden bg-gray-100 group cursor-pointer relative shadow-sm"
                        >
                          {isPdf ? (
                            <a
                              href={item.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-150 transition-colors"
                            >
                              <FileText className="h-10 w-10 text-red-500 mb-2" />
                              <span className="text-xs font-medium text-red-600 px-2 text-center truncate max-w-full">
                                {item.title || 'PDF'}
                              </span>
                            </a>
                          ) : (
                            <>
                              <img
                                src={item.image_url}
                                alt={item.title || 'Portfolio'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                              {item.title && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-white text-xs font-medium truncate">{item.title}</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Camera className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {isCoupleView
                        ? 'Aucune photo dans le portfolio'
                        : 'Ajoutez des photos a votre portfolio'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: CONTACT (couple view only) */}
            {activeTab === 'contact' && isCoupleView && (
              <div className="px-6 pb-6 space-y-4">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <Label htmlFor="message" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Votre message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Decrivez votre projet, vos besoins..."
                    value={demandeMessage}
                    onChange={(e) => setDemandeMessage(e.target.value)}
                    className="min-h-[120px] text-sm resize-none border-0 bg-white shadow-sm rounded-xl focus-visible:ring-2 focus-visible:ring-[#823F91]/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <Label htmlFor="date" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Date du mariage
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={demandeDate}
                      onChange={(e) => setDemandeDate(e.target.value)}
                      className="text-sm border-0 bg-white shadow-sm rounded-xl focus-visible:ring-2 focus-visible:ring-[#823F91]/20"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <Label htmlFor="budget" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Budget (€)
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="2000"
                      value={demandeBudget}
                      onChange={(e) => setDemandeBudget(e.target.value)}
                      className="text-sm border-0 bg-white shadow-sm rounded-xl focus-visible:ring-2 focus-visible:ring-[#823F91]/20"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="border-t border-gray-100 p-4 bg-white flex-shrink-0">
            {isCoupleView && activeTab === 'contact' ? (
              <Button
                className="w-full h-12 bg-[#823F91] hover:bg-[#6D3478] text-white text-sm font-semibold rounded-2xl gap-2 shadow-lg"
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
                className="w-full h-12 bg-[#823F91] hover:bg-[#6D3478] text-white text-sm font-semibold rounded-2xl gap-2 shadow-lg"
                onClick={() => setActiveTab('contact')}
              >
                <MessageCircle className="h-4 w-4" />
                Contacter ce prestataire
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="w-full h-12 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-2xl"
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
