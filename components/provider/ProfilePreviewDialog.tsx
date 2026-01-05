'use client'

import { useState, useEffect } from 'react'
import { Eye, X, MapPin, Euro, Briefcase, MessageCircle, Camera } from 'lucide-react'
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
  }
  cultures: Array<{ id: string; label: string }>
  zones: Array<{ id: string; label: string }>
  portfolio: Array<{ id: string; image_url: string; title?: string }>
}

export function ProfilePreviewDialog({
  userId,
  profile,
  cultures,
  zones,
  portfolio,
}: ProfilePreviewDialogProps) {
  const [open, setOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

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

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Eye className="h-4 w-4" />
        Aperçu du profil
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[85vh] p-0 gap-0 overflow-hidden rounded-xl" showCloseButton={false}>
          <DialogTitle className="sr-only">
            Aperçu du profil public - {profile.nom_entreprise}
          </DialogTitle>

          {/* HEADER FIXE - Sans débordement */}
          <div className="relative bg-gradient-to-br from-[#823F91] via-[#9D5FA8] to-[#6D3478] p-4 md:p-8 pb-4 md:pb-6">
            {/* Close button */}
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 md:top-4 md:right-4 text-white hover:bg-white/20 z-10"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>

            {/* Avatar + Nom côte à côte */}
            <div className="flex items-start gap-3 md:gap-6">
              <Avatar className="h-16 w-16 md:h-24 md:w-24 border-2 md:border-4 border-white shadow-lg flex-shrink-0">
                <AvatarImage 
                  src={avatarUrl || undefined} 
                  alt={profile.nom_entreprise}
                />
                <AvatarFallback className="text-lg md:text-2xl bg-white text-[#823F91]">
                  {getInitials(profile.nom_entreprise)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-white min-w-0 pr-8">
                <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 truncate">
                  {profile.nom_entreprise || 'Nom d\'entreprise'}
                </h1>
                <p className="text-sm md:text-lg text-white/90 mb-2 md:mb-3 truncate">
                  {profile.service_type}
                </p>

                {/* Badges infos clés */}
                <div className="flex flex-wrap gap-1 md:gap-2">
                  {profile.ville_principale && (
                    <Badge className="bg-white/20 text-white border-white/30 text-xs md:text-sm">
                      <MapPin className="h-3 w-3 mr-1" />
                      {profile.ville_principale}
                    </Badge>
                  )}

                  {getBudgetDisplay() && (
                    <Badge className="bg-white/20 text-white border-white/30 text-xs md:text-sm hidden sm:flex">
                      <Euro className="h-3 w-3 mr-1" />
                      {getBudgetDisplay()}
                    </Badge>
                  )}

                  {profile.annees_experience && (
                    <Badge className="bg-white/20 text-white border-white/30 text-xs md:text-sm">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {profile.annees_experience} ans
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <Tabs defaultValue="about" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full rounded-none border-b bg-background flex-shrink-0">
              <TabsTrigger value="about" className="flex-1 text-xs md:text-sm">
                À propos
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex-1 text-xs md:text-sm">
                Portfolio ({portfolio.length})
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex-1 text-xs md:text-sm">
                Contact
              </TabsTrigger>
            </TabsList>

            {/* CONTENT SCROLLABLE */}
            <ScrollArea className="flex-1 max-h-[calc(85vh-280px)] md:max-h-[calc(85vh-320px)]">
              <div className="p-4 md:p-8">
                {/* TAB À PROPOS */}
                <TabsContent value="about" className="mt-0 space-y-6">
                  {/* Description courte */}
                  {profile.description_courte && (
                    <div>
                      <p className="text-lg leading-relaxed">
                        {profile.description_courte}
                      </p>
                      {profile.prenom && profile.nom && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Par {profile.prenom} {profile.nom}
                        </p>
                      )}
                    </div>
                  )}

                  {profile.description_courte && <Separator />}

                  {/* Bio complète */}
                  {profile.bio && (
                    <>
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Présentation</h3>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                          {profile.bio}
                        </p>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Cultures */}
                  {cultures.length > 0 && (
                    <>
                      <div>
                        <h3 className="font-semibold text-lg mb-3">
                          🎭 Cultures maîtrisées
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {cultures.map((culture) => (
                            <Badge
                              key={culture.id}
                              variant="secondary"
                              className="text-sm py-1.5 px-4"
                            >
                              {culture.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Zones */}
                  {zones.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">
                        📍 Zones d'intervention
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {zones.map((zone) => (
                          <Badge
                            key={zone.id}
                            variant="outline"
                            className="text-sm py-1.5 px-4"
                          >
                            {zone.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!profile.description_courte &&
                    !profile.bio &&
                    cultures.length === 0 &&
                    zones.length === 0 && (
                      <Card className="p-6 md:p-12 text-center">
                        <p className="text-muted-foreground text-sm md:text-base">
                          Complétez votre profil pour le rendre plus attractif
                        </p>
                      </Card>
                    )}
                </TabsContent>

                {/* TAB PORTFOLIO */}
                <TabsContent value="portfolio" className="mt-0">
                  {portfolio.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {portfolio.map((image) => (
                        <Card
                          key={image.id}
                          className="overflow-hidden group aspect-square"
                        >
                          <img
                            src={image.image_url}
                            alt={image.title || 'Portfolio'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-6 md:p-12 text-center">
                      <div className="mb-3 md:mb-4 flex justify-center">
                        <Camera className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-base md:text-lg mb-2">
                        Aucune photo dans votre portfolio
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Ajoutez des photos de vos réalisations
                      </p>
                    </Card>
                  )}
                </TabsContent>

                {/* TAB CONTACT */}
                <TabsContent value="contact" className="mt-0">
                  <Card className="p-6 md:p-10 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 mb-4 md:mb-6">
                      <MessageCircle className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                    </div>
                    <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-3">
                      Contacter {profile.nom_entreprise}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 max-w-md mx-auto">
                      Les couples pourront vous contacter via la messagerie intégrée
                    </p>
                    <Button size="default" className="md:text-base" disabled>
                      Envoyer un message
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3 md:mt-4">
                      Disponible une fois votre profil publié
                    </p>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>

          {/* FOOTER FIXE */}
          <div className="border-t bg-background p-3 md:p-4 flex gap-2 md:gap-3 flex-shrink-0">
            <Button
              variant="outline"
              className="flex-1 text-xs md:text-sm h-9 md:h-10"
              onClick={() => setOpen(false)}
            >
              Continuer l'édition
            </Button>
            <Button className="flex-1 bg-[#823F91] hover:bg-[#6D3478] text-xs md:text-sm h-9 md:h-10" onClick={() => setOpen(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
