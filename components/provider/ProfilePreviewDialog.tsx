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
        <DialogContent className="max-w-[90vw] md:max-w-md max-h-[80vh] p-0 gap-0 overflow-hidden rounded-xl flex flex-col" showCloseButton={false}>
          <DialogTitle className="sr-only">
            Aperçu du profil public - {profile.nom_entreprise}
          </DialogTitle>

          {/* HEADER FIXE - Sans background */}
          <div className="relative p-4 md:p-6 pb-4 border-b border-[#6D3478] flex-shrink-0">
            {/* Close button */}
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 md:top-4 md:right-4 text-muted-foreground hover:bg-muted z-10"
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
                <AvatarFallback className="text-lg md:text-xl bg-gradient-to-br from-[#823F91]/10 to-[#9D5FA8]/10 text-[#823F91]">
                  {getInitials(profile.nom_entreprise)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 pr-8">
                <h1 className="text-lg md:text-xl font-bold mb-1 truncate text-foreground">
                  {profile.nom_entreprise || 'Nom d\'entreprise'}
                </h1>
                <p className="text-sm text-muted-foreground mb-2 truncate">
                  {profile.service_type}
                </p>

                {/* Badges infos clés */}
                <div className="flex flex-wrap gap-1">
                  {profile.ville_principale && (
                    <Badge variant="outline" className="text-xs bg-[#823F91]/5 border-[#823F91]/20 text-[#823F91]">
                      <MapPin className="h-3 w-3 mr-1" />
                      {profile.ville_principale}
                    </Badge>
                  )}

                  {getBudgetDisplay() && (
                    <Badge variant="outline" className="text-xs bg-[#823F91]/5 border-[#823F91]/20 text-[#823F91] hidden sm:flex">
                      <Euro className="h-3 w-3 mr-1" />
                      {getBudgetDisplay()}
                    </Badge>
                  )}

                  {profile.annees_experience && (
                    <Badge variant="outline" className="text-xs bg-[#823F91]/5 border-[#823F91]/20 text-[#823F91]">
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
            <TabsList className="w-full rounded-none border-b border-[#6D3478] bg-background flex-shrink-0">
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
            <ScrollArea className="flex-1 overflow-auto">
              <div className="p-4 md:p-5">
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

                  {profile.description_courte && <Separator className="bg-[#6D3478]" />}

                  {/* Bio complète */}
                  {profile.bio && (
                    <>
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Présentation</h3>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                          {profile.bio}
                        </p>
                      </div>
                      <Separator className="bg-[#6D3478]" />
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
                              className="text-sm py-1.5 px-4 bg-gradient-to-r from-[#9D5FA8]/20 via-[#823F91]/15 to-[#9D5FA8]/20 border-[#823F91]/30 text-[#823F91]"
                            >
                              {culture.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Separator className="bg-[#6D3478]" />
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
                            className="text-sm py-1.5 px-4 bg-gradient-to-r from-[#9D5FA8]/20 via-[#823F91]/15 to-[#9D5FA8]/20 border-[#823F91]/30 text-[#823F91]"
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
                    <div className="grid grid-cols-2 gap-3">
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
                  <Card className="p-4 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#9D5FA8]/10 mb-3">
                      <MessageCircle className="h-5 w-5 text-[#9D5FA8]" />
                    </div>
                    <h3 className="text-base font-bold mb-1">
                      Contacter {profile.nom_entreprise}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Les couples pourront vous contacter via la messagerie intégrée
                    </p>
                    <Button size="sm" className="text-xs bg-[#9D5FA8] hover:bg-[#823F91]" disabled>
                      Envoyer un message
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Disponible une fois votre profil publié
                    </p>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>

          {/* FOOTER FIXE */}
          <div className="border-t border-[#6D3478] bg-background p-3 md:p-4 flex gap-2 md:gap-3 flex-shrink-0">
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
        </DialogContent>
      </Dialog>
    </>
  )
}
