'use client'

import { useState, useEffect } from 'react'
import { Eye, X, MapPin, Euro, Briefcase, MessageCircle, Camera, Sparkles, Instagram, Facebook, Globe, Linkedin, Music2, ExternalLink, Send, Calendar, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'

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
  isCoupleView?: boolean // Si true, affiche "Envoyer une demande" au lieu de "Continuer l'édition"
  coupleId?: string // ID du couple pour créer la demande
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
  
  // Réinitialiser le formulaire quand le dialog se ferme
  useEffect(() => {
    if (!open) {
      setDemandeMessage('')
      setDemandeDate('')
      setDemandeBudget('')
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

  // Recharger l'avatar quand le dialog s'ouvre
  useEffect(() => {
    if (open && profile.avatar_url) {
      setAvatarUrl(getUrlWithTimestamp(profile.avatar_url))
    }
  }, [open, profile.avatar_url])

  const getBudgetDisplay = () => {
    if (profile.budget_min && profile.budget_max) {
      return `${profile.budget_min.toLocaleString()}€ - ${profile.budget_max.toLocaleString()}€`
    } else if (profile.budget_min) {
      return `À partir de ${profile.budget_min.toLocaleString()}€`
    } else if (profile.budget_max) {
      return `Jusqu'à ${profile.budget_max.toLocaleString()}€`
    }
    return null
  }

  const handleCreateDemande = async () => {
    // Utiliser l'ID de l'utilisateur connecté si coupleId n'est pas fourni
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
      // Vérifier si une demande existe déjà pour ce couple/prestataire
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
          couple_id: currentCoupleId, // doit être auth.users.id (couples.user_id)
          provider_id: userId, // userId = prestataire auth.users.id
          initial_message: demandeMessage.trim(),
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        console.error('Erreur Supabase détaillée:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fullError: error,
        })
        
        // Messages d'erreur plus spécifiques
        if (error.code === '23505') {
          // Violation de contrainte unique
          toast.error('Une demande existe déjà pour ce prestataire')
        } else if (error.code === '42501') {
          // Permission refusée (RLS)
          toast.error('Vous n\'avez pas la permission d\'envoyer cette demande')
        } else if (error.message) {
          toast.error(`Erreur: ${error.message}`)
        } else {
          toast.error('Erreur lors de l\'envoi de la demande. Veuillez réessayer.')
        }
        return
      }

      // Envoyer l'email de notification au prestataire (sans bloquer le flow)
      if (data?.id) {
        try {
          const { sendNewRequestEmail } = await import('@/lib/email/notifications')
          await sendNewRequestEmail(
            userId,
            currentCoupleId,
            data.id,
            demandeMessage.trim()
          )
        } catch (emailError) {
          // Ne pas bloquer si l'email échoue
          console.error('Erreur envoi email notification:', emailError)
        }
      }

      toast.success('Demande envoyée avec succès !')
      setDemandeMessage('')
      setDemandeDate('')
      setDemandeBudget('')
      setOpen(false)
      
      // Rediriger vers la page des demandes après un court délai
      setTimeout(() => {
        router.push('/couple/demandes')
      }, 500)
    } catch (error: any) {
      console.error('Erreur création demande:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
      })
      toast.error(error?.message || 'Erreur lors de l\'envoi de la demande')
    } finally {
      setIsCreatingDemande(false)
    }
  }

  return (
    <>
      {showTriggerButton && (
        <Button
          variant="outline"
          size="default"
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Aperçu du profil
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent 
          className="max-w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[70vh] sm:max-h-[85vh] p-0 gap-0 overflow-hidden rounded-xl flex flex-col"
          showCloseButton={false}
          style={{
            animation: 'none',
          }}
        >
          <DialogTitle className="sr-only">
            Aperçu du profil public - {profile.nom_entreprise}
          </DialogTitle>

          {/* HEADER FIXE - Dégradé blanc/violet léger */}
          <div className="relative p-4 md:p-6 border-b border-gray-100 bg-gradient-to-br from-white via-purple-50/50 to-purple-100/30 flex-shrink-0">
            {/* Close button */}
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 md:top-4 md:right-4 text-gray-600 hover:bg-gray-100 z-10"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>

            {/* Avatar + Nom côte à côte */}
            <div className="flex items-start gap-3 md:gap-4">
              <Avatar className="h-14 w-14 md:h-16 md:w-16 border-2 border-[#823F91]/20 shadow-sm flex-shrink-0">
                <AvatarImage
                  src={avatarUrl || undefined}
                  alt={profile.nom_entreprise}
                />
                <AvatarFallback className="text-lg md:text-xl bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white">
                  {getInitials(profile.nom_entreprise)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 pr-8">
                <h1 className="text-lg md:text-xl font-bold mb-1 truncate text-gray-900">
                  {profile.nom_entreprise || 'Nom d\'entreprise'}
                </h1>
                <p className="text-sm text-gray-600 mb-2 truncate">
                  {profile.service_type}
                </p>

                {/* Badges infos clés */}
                <div className="flex flex-wrap gap-1">
                  {profile.is_early_adopter && (
                    <Badge className="text-xs bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white border-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Partenaire Fondateur
                    </Badge>
                  )}

                  {profile.ville_principale && (
                    <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-[#823F91]">
                      <MapPin className="h-3 w-3 mr-1" />
                      {profile.ville_principale}
                    </Badge>
                  )}

                  {getBudgetDisplay() && (
                    <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-[#823F91] hidden sm:flex">
                      <Euro className="h-3 w-3 mr-1" />
                      {getBudgetDisplay()}
                    </Badge>
                  )}

                  {profile.annees_experience && (
                    <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-[#823F91]">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {profile.annees_experience} ans
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <Tabs defaultValue={isCoupleView ? "contact" : "about"} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <TabsList className="w-full rounded-none border-b border-gray-100 bg-gradient-to-r from-purple-50/50 to-white flex-shrink-0">
              <TabsTrigger value="about" className="flex-1 text-xs md:text-sm text-gray-600 data-[state=active]:text-[#823F91] data-[state=active]:bg-white data-[state=active]:shadow-sm">
                À propos
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex-1 text-xs md:text-sm text-gray-600 data-[state=active]:text-[#823F91] data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Portfolio ({portfolio.length})
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex-1 text-xs md:text-sm text-gray-600 data-[state=active]:text-[#823F91] data-[state=active]:bg-white data-[state=active]:shadow-sm">
                {isCoupleView ? 'Envoyer une demande' : 'Contact'}
              </TabsTrigger>
            </TabsList>

            {/* CONTENT SCROLLABLE */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-b from-white to-purple-50/30">
              <div className="p-4 md:p-5">
                {/* TAB À PROPOS */}
                <TabsContent value="about" className="mt-0 space-y-6 w-full text-gray-900">
                  {/* Description courte */}
                  {profile.description_courte && (
                    <div>
                      <p className="text-lg leading-relaxed text-gray-800">
                        {profile.description_courte}
                      </p>
                      {profile.prenom && profile.nom && (
                        <p className="text-sm text-gray-500 mt-2">
                          Par {profile.prenom} {profile.nom}
                        </p>
                      )}
                    </div>
                  )}

                  {profile.description_courte && <Separator className="h-px bg-gray-200" />}

                  {/* Bio complète */}
                  {profile.bio && (
                    <>
                      <div>
                        <h3 className="font-semibold text-lg mb-3 text-gray-900">Présentation</h3>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {profile.bio}
                        </p>
                      </div>
                      <Separator className="h-px bg-gray-200" />
                    </>
                  )}

                  {/* Cultures */}
                  {cultures.length > 0 && (
                    <>
                      <div>
                        <h3 className="font-semibold text-lg mb-3 text-gray-900">
                          Cultures maîtrisées
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {cultures.map((culture) => (
                            <Badge
                              key={culture.id}
                              variant="secondary"
                              className="text-sm py-1.5 px-4 bg-purple-50 border-purple-200 text-[#823F91]"
                            >
                              {culture.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Separator className="h-px bg-gray-200" />
                    </>
                  )}

                  {/* Zones */}
                  {zones.length > 0 && (
                    <>
                      <div>
                        <h3 className="font-semibold text-lg mb-3 text-gray-900">
                          Zones d'intervention
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {zones.map((zone) => (
                            <Badge
                              key={zone.id}
                              variant="outline"
                              className="text-sm py-1.5 px-4 bg-purple-50 border-purple-200 text-[#823F91]"
                            >
                              {zone.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Separator className="h-px bg-gray-200" />
                    </>
                  )}

                  {/* Réseaux sociaux */}
                  {(profile.instagram_url || profile.facebook_url || profile.website_url ||
                    profile.linkedin_url || profile.tiktok_url) && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900">
                        Réseaux sociaux
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.instagram_url && (
                          <a
                            href={profile.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-200 text-[#823F91] hover:bg-purple-100 transition-colors text-sm"
                          >
                            <Instagram className="h-4 w-4" />
                            Instagram
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {profile.facebook_url && (
                          <a
                            href={profile.facebook_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-200 text-[#823F91] hover:bg-purple-100 transition-colors text-sm"
                          >
                            <Facebook className="h-4 w-4" />
                            Facebook
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {profile.website_url && (
                          <a
                            href={profile.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-200 text-[#823F91] hover:bg-purple-100 transition-colors text-sm"
                          >
                            <Globe className="h-4 w-4" />
                            Site web
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {profile.linkedin_url && (
                          <a
                            href={profile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-200 text-[#823F91] hover:bg-purple-100 transition-colors text-sm"
                          >
                            <Linkedin className="h-4 w-4" />
                            LinkedIn
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {profile.tiktok_url && (
                          <a
                            href={profile.tiktok_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-200 text-[#823F91] hover:bg-purple-100 transition-colors text-sm"
                          >
                            <Music2 className="h-4 w-4" />
                            TikTok
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!profile.description_courte &&
                    !profile.bio &&
                    cultures.length === 0 &&
                    zones.length === 0 && (
                      <Card className="p-6 md:p-12 text-center bg-purple-50/50 border-purple-100">
                        <p className="text-gray-600 text-sm md:text-base">
                          {isCoupleView
                            ? 'Ce prestataire n\'a pas encore complété son profil'
                            : 'Complétez votre profil pour le rendre plus attractif'}
                        </p>
                      </Card>
                    )}
                </TabsContent>

                {/* TAB PORTFOLIO */}
                <TabsContent value="portfolio" className="mt-0 w-full">
                  {portfolio && portfolio.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {portfolio.map((item) => {
                        const isPdf = item.file_type === 'pdf';

                        return (
                          <Card
                            key={item.id}
                            className="overflow-hidden group aspect-square cursor-pointer hover:shadow-lg transition-all relative border-gray-200"
                          >
                            {isPdf ? (
                              // Affichage PDF
                              <a
                                href={item.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-150 transition-colors"
                              >
                                <FileText className="h-10 w-10 text-red-500 mb-2" />
                                <span className="text-xs font-medium text-red-600 px-2 text-center truncate max-w-full">
                                  {item.title || 'Document PDF'}
                                </span>
                                <span className="text-xs text-red-400 mt-1 flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" />
                                  Ouvrir
                                </span>
                              </a>
                            ) : (
                              // Affichage Image
                              <>
                                <img
                                  src={item.image_url}
                                  alt={item.title || `Photo portfolio - ${profile.nom_entreprise}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                  onError={(e) => {
                                    console.error('Erreur chargement image portfolio:', item.image_url)
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                  }}
                                />
                                {item.title && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-xs font-medium truncate">{item.title}</p>
                                  </div>
                                )}
                              </>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="p-6 md:p-12 text-center bg-purple-50/50 border-purple-100">
                      <div className="mb-3 md:mb-4 flex justify-center">
                        <Camera className="w-12 h-12 md:w-16 md:h-16 text-gray-400" />
                      </div>
                      <h3 className="font-semibold text-base md:text-lg mb-2 text-gray-900">
                        {isCoupleView ? 'Aucune photo dans le portfolio' : 'Aucune photo dans votre portfolio'}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600">
                        {isCoupleView
                          ? 'Ce prestataire n\'a pas encore ajouté de photos à son portfolio'
                          : 'Ajoutez des photos de vos réalisations'}
                      </p>
                    </Card>
                  )}
                </TabsContent>

                {/* TAB CONTACT */}
                <TabsContent value="contact" className="mt-0 w-full">
                  {isCoupleView ? (
                    <div className="w-full">
                      <Card className="p-5 md:p-6 border border-purple-200 bg-white w-full shadow-sm">
                        <div className="space-y-4">
                          {/* Message */}
                          <div className="space-y-2">
                            <Label htmlFor="demande-message" className="text-sm font-semibold flex items-center gap-2 text-gray-900">
                              <MessageCircle className="h-4 w-4 text-[#823F91]" />
                              Message personnalisé <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              id="demande-message"
                              placeholder="Décrivez votre projet, vos besoins, vos attentes..."
                              value={demandeMessage}
                              onChange={(e) => setDemandeMessage(e.target.value)}
                              className="min-h-[120px] text-sm resize-none border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-[#823F91] focus-visible:ring-[#823F91]/20"
                            />
                          </div>

                          {/* Date et Budget */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="demande-date" className="text-sm font-semibold flex items-center gap-2 text-gray-900">
                                <Calendar className="h-4 w-4 text-[#823F91]" />
                                Date du mariage
                              </Label>
                              <Input
                                id="demande-date"
                                type="date"
                                value={demandeDate}
                                onChange={(e) => setDemandeDate(e.target.value)}
                                className="text-sm border border-gray-200 bg-white text-gray-900 focus-visible:border-[#823F91] focus-visible:ring-[#823F91]/20"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="demande-budget" className="text-sm font-semibold flex items-center gap-2 text-gray-900">
                                <Euro className="h-4 w-4 text-[#823F91]" />
                                Budget indicatif (€)
                              </Label>
                              <Input
                                id="demande-budget"
                                type="number"
                                placeholder="Ex: 2000"
                                value={demandeBudget}
                                onChange={(e) => setDemandeBudget(e.target.value)}
                                className="text-sm border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-[#823F91] focus-visible:ring-[#823F91]/20"
                                min="0"
                                step="100"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <Card className="p-4 text-center bg-purple-50/50 border-purple-100">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mb-3">
                        <MessageCircle className="h-5 w-5 text-[#823F91]" />
                      </div>
                      <h3 className="text-base font-bold mb-1 text-gray-900">
                        Contacter {profile.nom_entreprise}
                      </h3>
                      <p className="text-xs text-gray-600 mb-3">
                        Les couples pourront vous contacter via la messagerie intégrée
                      </p>
                      <Button size="sm" className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200" disabled>
                        Envoyer un message
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Disponible une fois votre profil publié
                      </p>
                    </Card>
                  )}
                </TabsContent>
              </div>
            </div>
          </Tabs>

          {/* FOOTER FIXE */}
          <div className="border-t border-gray-100 bg-gradient-to-r from-purple-50/50 to-white p-3 md:p-4 flex-shrink-0">
            {isCoupleView ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 text-xs md:text-sm h-9 md:h-10 border-2 hover:bg-gray-50"
                  onClick={() => {
                    setDemandeMessage('')
                    setDemandeDate('')
                    setDemandeBudget('')
                    setOpen(false)
                  }}
                  disabled={isCreatingDemande}
                >
                  Fermer
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white shadow-lg hover:shadow-xl transition-all gap-2 text-xs md:text-sm h-9 md:h-10"
                  onClick={handleCreateDemande}
                  disabled={isCreatingDemande || !demandeMessage.trim()}
                >
                  {isCreatingDemande ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
              <div className="flex gap-2 md:gap-3">
                <Button
                  variant="outline"
                  className="flex-1 text-xs md:text-sm h-9 md:h-10"
                  onClick={() => setOpen(false)}
                >
                  Continuer l'édition
                </Button>
                <Button className="flex-1 bg-[#E8D4ED] hover:bg-[#D4B8DC] text-[#6D3478] text-xs md:text-sm h-9 md:h-10" onClick={() => setOpen(false)}>
                  Fermer
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
