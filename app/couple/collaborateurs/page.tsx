'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import { UserPlus, Users, Edit2, X, Check, Mail, Loader2, Link2, Copy, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { PageTitle } from '@/components/couple/shared/PageTitle'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix'

export default function CollaborateursPage() {
  const { user } = useUser()
  const [collaborateurs, setCollaborateurs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [editingCollaborateur, setEditingCollaborateur] = useState<string | null>(null)
  const [channel, setChannel] = useState<'email' | 'link'>('email')
  const [invitationResult, setInvitationResult] = useState<{
    invitationUrl: string
    emailSent: boolean
    email: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedCollabId, setCopiedCollabId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Ami',
    message: '',
  })

  useEffect(() => {
    if (user) {
      loadCollaborateurs()
    }
  }, [user])

  const loadCollaborateurs = async () => {
    if (!user) return

    setLoading(true)
    setLoadError(null)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('collaborateurs')
      .select('*')
      .eq('couple_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur chargement collaborateurs:', error)
      setLoadError(error.message || 'Erreur lors du chargement des collaborateurs')
      setCollaborateurs([])
    } else {
      setCollaborateurs(data || [])
    }
    setLoading(false)
  }

  const handleInvite = async () => {
    if (!user || !formData.name || !formData.email) return

    setIsInviting(true)
    setInviteError(null)

    try {
      const response = await fetch('/api/collaborateurs/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          role: formData.role,
          message: formData.message,
          channel,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'invitation')
      }

      loadCollaborateurs()

      if (channel === 'link') {
        // Mode lien : afficher le lien dans la modal
        setInvitationResult({
          invitationUrl: data.invitation.invitationUrl,
          emailSent: false,
          email: formData.email,
        })
        toast.success('Lien d\'invitation cr\u00e9\u00e9')
      } else {
        // Mode email : fermer la modal
        setInvitationResult(null)
        setIsDialogOpen(false)
        setFormData({ name: '', email: '', role: 'Ami', message: '' })
        setInviteError(null)
        toast.success(data.invitation.emailSent
          ? `Invitation envoy\u00e9e par email \u00e0 ${formData.email}`
          : `Invitation cr\u00e9\u00e9e (email non envoy\u00e9 - copiez le lien depuis la fiche)`
        )
      }
    } catch (error: any) {
      console.error('Erreur invitation:', error)
      setInviteError(error.message || 'Erreur lors de l\'envoi de l\'invitation')
    } finally {
      setIsInviting(false)
    }
  }

  const handleUpdateRole = async (collabId: string, newRole: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('collaborateurs')
      .update({ role: newRole })
      .eq('id', collabId)

    if (error) {
      console.error('Erreur mise à jour rôle:', error)
      toast.error('Erreur lors de la mise à jour')
    } else {
      loadCollaborateurs()
      setEditingCollaborateur(null)
    }
  }

  const handleRemove = async (collabId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce collaborateur ?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('collaborateurs')
      .delete()
      .eq('id', collabId)

    if (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression')
    } else {
      loadCollaborateurs()
    }
  }

  const copyInvitationLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Lien copi\u00e9 dans le presse-papiers !')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Impossible de copier le lien')
    }
  }

  const shareWhatsApp = (url: string, name: string) => {
    const text = encodeURIComponent(
      `Salut ${name} ! Je t\u2019invite \u00e0 collaborer sur l\u2019organisation de notre mariage sur Nuply : ${url}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const copyCollabLink = async (collab: any) => {
    if (!collab.invitation_token) return
    const baseUrl = window.location.origin
    const url = `${baseUrl}/invitation/${collab.invitation_token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedCollabId(collab.id)
      toast.success(`Lien d\u2019invitation copi\u00e9 pour ${collab.name}`)
      setTimeout(() => setCopiedCollabId(null), 2000)
    } catch {
      toast.error('Impossible de copier le lien')
    }
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setFormData({ name: '', email: '', role: 'Ami', message: '' })
    setInviteError(null)
    setInvitationResult(null)
    setChannel('email')
  }

  const roles = ['T\u00e9moin', 'Famille', 'Ami', 'Organisateur', 'Autre']

  if (loading) {
    return (
      <div className="w-full space-y-5 sm:space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="w-full space-y-5 sm:space-y-6">
        <PageTitle
          title="Collaborateurs"
          description="Gérez les personnes qui vous aident dans l'organisation"
        />
        <Card className="border-red-200">
          <CardContent className="p-8 sm:p-12 text-center">
            <Users className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-red-300" />
            <p className="text-red-600 font-medium mb-2">Erreur lors du chargement</p>
            <p className="text-sm text-gray-500 mb-6">{loadError}</p>
            <Button
              onClick={loadCollaborateurs}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white gap-2"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="space-y-5 sm:space-y-6">
        <div className="flex items-start justify-between gap-4">
          <PageTitle
            title="Collaborateurs"
            description="Gérez les personnes qui vous aident dans l'organisation"
          />
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-[#823F91] hover:bg-[#6D3478] text-white gap-2 flex-shrink-0 mt-1"
          >
            <UserPlus className="h-4 w-4" />
            Inviter
          </Button>
        </div>

        {/* Section "Rejoignez-nous" avec images de couples */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {/* Images de couples - avatars circulaires */}
                  <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-[#E8C4F5] to-[#823F91]/20 relative z-0">
                    <Image
                      src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=100&h=100&fit=crop"
                      alt="Couple 1"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-[#D49FFD]/30 to-[#9D5FA8]/20 relative z-0">
                    <Image
                      src="https://images.unsplash.com/photo-1519741497674-611481863552?w=100&h=100&fit=crop"
                      alt="Couple 2"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-[#B87FC0]/20 to-[#823F91]/15 relative z-0">
                    <Image
                      src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=100&h=100&fit=crop"
                      alt="Couple 3"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-[#C084FC]/20 to-[#A855F7]/15 relative z-0">
                    <Image
                      src="https://images.unsplash.com/photo-1518621012428-ef8be442a055?w=100&h=100&fit=crop"
                      alt="Couple 4"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-[#DDA0DD]/20 to-[#6D3478]/15 relative z-0">
                    <Image
                      src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=100&h=100&fit=crop"
                      alt="Couple 5"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="h-12 w-12 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center relative z-10">
                    <span className="text-xs font-medium text-gray-600">+94</span>
                  </div>
                </div>
                <p className="text-gray-700 font-medium">Rejoignez-nous</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Modal d'invitation - toujours rendu */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setIsDialogOpen(true) }}>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    Inviter un collaborateur
                  </DialogTitle>
                  <DialogDescription className="text-sm text-[#6B7280]">
                    Envoyez une invitation par email ou générez un lien à partager directement
                  </DialogDescription>
                </DialogHeader>

                {/* Affichage du résultat : lien d'invitation généré */}
                {invitationResult ? (
                  <div className="space-y-4 py-4">
                    <div className="rounded-md bg-green-50 border border-green-200 p-4 space-y-3">
                      <p className="text-sm font-medium text-green-800">
                        Lien d&apos;invitation créé pour {invitationResult.email}
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={invitationResult.invitationUrl}
                          readOnly
                          className="text-xs bg-white"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyInvitationLink(invitationResult.invitationUrl)}
                          className="shrink-0"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareWhatsApp(invitationResult.invitationUrl, formData.name)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setInvitationResult(null)
                          setFormData({ name: '', email: '', role: 'Ami', message: '' })
                        }}
                      >
                        Nouvelle invitation
                      </Button>
                      <Button
                        onClick={closeDialog}
                        className="bg-[#823F91] hover:bg-[#6D3478] text-white"
                      >
                        Fermer
                      </Button>
                    </DialogFooter>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 py-4">
                      {/* Sélection du canal d'envoi */}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={channel === 'email' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setChannel('email')}
                          className={channel === 'email' ? 'bg-[#823F91] hover:bg-[#6D3478]' : ''}
                          disabled={isInviting}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Par email
                        </Button>
                        <Button
                          type="button"
                          variant={channel === 'link' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setChannel('link')}
                          className={channel === 'link' ? 'bg-[#823F91] hover:bg-[#6D3478]' : ''}
                          disabled={isInviting}
                        >
                          <Link2 className="h-4 w-4 mr-1" />
                          Générer un lien
                        </Button>
                      </div>

                      {channel === 'link' && (
                        <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                          <p className="text-xs text-blue-700">
                            Un lien personnalisé sera généré que vous pourrez copier et envoyer par WhatsApp, SMS ou tout autre moyen.
                          </p>
                        </div>
                      )}

                      {/* Champ Email */}
                      <div className="space-y-2">
                        <Label htmlFor="invite-email" className="text-sm font-medium">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                          <Input
                            id="invite-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                              setFormData({ ...formData, email: e.target.value })
                              setInviteError(null)
                            }}
                            placeholder="nom@example.com"
                            className="pl-10"
                            disabled={isInviting}
                          />
                        </div>
                      </div>

                      {/* Champ Nom */}
                      <div className="space-y-2">
                        <Label htmlFor="invite-name" className="text-sm font-medium">
                          Nom
                        </Label>
                        <Input
                          id="invite-name"
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value })
                            setInviteError(null)
                          }}
                          placeholder="Nom du collaborateur"
                          disabled={isInviting}
                        />
                      </div>

                      {/* Sélection du Rôle */}
                      <div className="space-y-2">
                        <Label htmlFor="invite-role" className="text-sm font-medium">
                          Rôle
                        </Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value })}
                          disabled={isInviting}
                        >
                          <SelectTrigger id="invite-role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Message personnalisé (optionnel) */}
                      <div className="space-y-2">
                        <Label htmlFor="invite-message" className="text-sm font-medium">
                          Message personnalisé <span className="text-[#9CA3AF] font-normal">(optionnel)</span>
                        </Label>
                        <Textarea
                          id="invite-message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Ajoutez un message personnalisé à votre invitation..."
                          className="min-h-[64px] resize-none"
                          disabled={isInviting}
                        />
                        {channel === 'email' && (
                          <p className="text-xs text-[#9CA3AF]">
                            Ce message sera inclus dans l&apos;email d&apos;invitation
                          </p>
                        )}
                      </div>

                      {/* Message d'erreur */}
                      {inviteError && (
                        <div className="rounded-md bg-red-50 border border-red-200 p-3">
                          <p className="text-sm text-red-600">{inviteError}</p>
                        </div>
                      )}
                    </div>

                    <DialogFooter className="flex-row justify-end gap-2 sm:gap-0">
                      <Button
                        variant="outline"
                        onClick={closeDialog}
                        disabled={isInviting}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleInvite}
                        className="bg-[#823F91] hover:bg-[#6D3478] text-white"
                        disabled={!formData.name || !formData.email || isInviting}
                      >
                        {isInviting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {channel === 'link' ? 'G\u00e9n\u00e9ration...' : 'Envoi...'}
                          </>
                        ) : (
                          <>
                            {channel === 'link' ? (
                              <>
                                <Link2 className="mr-2 h-4 w-4" />
                                Générer le lien
                              </>
                            ) : (
                              <>
                                <Mail className="mr-2 h-4 w-4" />
                                Envoyer l&apos;invitation
                              </>
                            )}
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>

        {collaborateurs.length === 0 ? (
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-8 sm:p-12 text-center">
              <Users className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 font-medium mb-1">Aucun collaborateur</p>
              <p className="text-sm text-gray-400 mb-5">
                Invitez des proches pour vous aider dans l&apos;organisation
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#823F91] hover:bg-[#6D3478] text-white gap-2 rounded-xl"
              >
                <UserPlus className="h-4 w-4" />
                Inviter votre premier collaborateur
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {collaborateurs.map((collab, index) => (
              <motion.div
                key={collab.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className="h-full hover:shadow-md transition-all duration-150 border-gray-100 hover:border-[#823F91]/15 rounded-2xl">
                  <CardContent className="p-5 space-y-4">

                    {/* Avatar + Nom + Email + Rôle */}
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#823F91]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#823F91]">
                          {collab.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate text-sm">{collab.name}</p>
                        <p className="text-xs text-gray-400 truncate">{collab.email}</p>
                      </div>
                      {editingCollaborateur === collab.id ? (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Select
                            value={collab.role}
                            onValueChange={(value) => handleUpdateRole(collab.id, value)}
                          >
                            <SelectTrigger className="w-[100px] h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => setEditingCollaborateur(null)}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">{collab.role}</Badge>
                      )}
                    </div>

                    {/* Statut + Actions icônes */}
                    <div className="flex items-center justify-between">
                      {collab.accepted_at ? (
                        <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-50 text-xs gap-1 font-medium">
                          <Check className="h-3 w-3" />
                          Accepté
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 text-xs font-medium">
                          En attente
                        </Badge>
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-[#823F91] hover:bg-[#823F91]/5"
                          onClick={() => setEditingCollaborateur(collab.id)}
                          title="Modifier le rôle"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleRemove(collab.id)}
                          title="Retirer le collaborateur"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Copier le lien — uniquement pour les invitations en attente */}
                    {!collab.accepted_at && collab.invitation_token && (
                      <div className="flex gap-2 pt-1 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8 text-[#823F91] border-[#823F91]/20 hover:bg-[#823F91]/5"
                          onClick={() => copyCollabLink(collab)}
                        >
                          {copiedCollabId === collab.id ? (
                            <><Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />Lien copié</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5 mr-1.5" />Copier le lien</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 border-[#823F91]/20 text-[#823F91] hover:bg-[#823F91]/5"
                          onClick={() => {
                            const baseUrl = window.location.origin
                            const url = `${baseUrl}/invitation/${collab.invitation_token}`
                            shareWhatsApp(url, collab.name)
                          }}
                          title="Partager via WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
