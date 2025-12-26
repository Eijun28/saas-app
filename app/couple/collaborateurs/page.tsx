'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { UserPlus, Users, Edit2, X, Check, Mail, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [editingCollaborateur, setEditingCollaborateur] = useState<string | null>(null)
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
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('collaborateurs')
      .select('*')
      .eq('couple_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur chargement collaborateurs:', error)
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
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'invitation')
      }

      // Succès - fermer la modal et recharger les collaborateurs
      setIsDialogOpen(false)
      setFormData({ name: '', email: '', role: 'Ami', message: '' })
      setInviteError(null)
      loadCollaborateurs()
      
      // Afficher un message de succès (vous pouvez utiliser un toast ici)
      alert(`Invitation envoyée à ${formData.email}`)
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
      alert('Erreur lors de la mise à jour')
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
      alert('Erreur lors de la suppression')
    } else {
      loadCollaborateurs()
    }
  }

  const roles = ['Témoin', 'Famille', 'Ami', 'Organisateur', 'Autre']

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#4A4A4A]">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-[#4A4A4A]">
              Gérez les personnes qui vous aident dans l'organisation
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-[#823F91] hover:bg-[#6D3478] text-white gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Inviter
          </Button>
        </motion.div>

        {/* Section "Rejoignez-nous" avec images de couples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {/* Images de couples - avatars circulaires */}
                  <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200 relative z-0">
                    <img 
                      src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=100&h=100&fit=crop" 
                      alt="Couple 1" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-blue-200 to-cyan-200 relative z-0">
                    <img 
                      src="https://images.unsplash.com/photo-1519741497674-611481863552?w=100&h=100&fit=crop" 
                      alt="Couple 2" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-green-200 to-emerald-200 relative z-0">
                    <img 
                      src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=100&h=100&fit=crop" 
                      alt="Couple 3" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-yellow-200 to-orange-200 relative z-0">
                    <img 
                      src="https://images.unsplash.com/photo-1518621012428-ef8be442a055?w=100&h=100&fit=crop" 
                      alt="Couple 4" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-indigo-200 to-purple-200 relative z-0">
                    <img 
                      src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=100&h=100&fit=crop" 
                      alt="Couple 5" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="h-12 w-12 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center relative z-10">
                    <span className="text-xs font-medium text-gray-600">+94</span>
                  </div>
                </div>
                <p className="text-[#374151] font-medium">Rejoignez-nous</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {collaborateurs.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-[#4A4A4A] mb-4">
                Vous n'avez pas encore de collaborateurs
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#823F91] hover:bg-[#6D3478] text-white gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Inviter votre premier collaborateur
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Modal d'invitation - Style Notion */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    Inviter un collaborateur
                  </DialogTitle>
                  <DialogDescription className="text-sm text-[#6B7280]">
                    Envoyez une invitation par email pour collaborer sur votre mariage
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
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
                      className="min-h-[100px] resize-none"
                      disabled={isInviting}
                    />
                    <p className="text-xs text-[#9CA3AF]">
                      Ce message sera inclus dans l'email d'invitation
                    </p>
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
                    onClick={() => {
                      setIsDialogOpen(false)
                      setFormData({ name: '', email: '', role: 'Ami', message: '' })
                      setInviteError(null)
                    }}
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
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Envoyer l'invitation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collaborateurs.map((collab) => (
              <motion.div
                key={collab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-gray-200">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg">{collab.name}</CardTitle>
                      {editingCollaborateur === collab.id ? (
                        <div className="flex gap-2">
                          <Select
                            value={collab.role}
                            onValueChange={(value) => handleUpdateRole(collab.id, value)}
                          >
                            <SelectTrigger className="w-[120px] h-8">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCollaborateur(null)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary">{collab.role}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-[#4A4A4A]">{collab.email}</p>
                    {collab.accepted_at ? (
                      <p className="text-xs text-green-600">✓ Accepté</p>
                    ) : (
                      <p className="text-xs text-yellow-600">⏳ En attente</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditingCollaborateur(collab.id)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Modifier le rôle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700"
                        onClick={() => handleRemove(collab.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Retirer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  )
}
