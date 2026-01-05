'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Pencil, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'

interface Evenement {
  id: string
  titre: string
  date: Date
  heure_debut: string
  heure_fin?: string
  lieu?: string
  notes?: string
}

export default function AgendaPage() {
  const { user } = useUser()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Evenement | null>(null)
  const [formData, setFormData] = useState({
    titre: '',
    date: new Date(),
    heure_debut: '',
    heure_fin: '',
    lieu: '',
    notes: ''
  })

  // TODO: Charger les événements depuis Supabase
  // Table: evenements_prestataire
  // Columns: id, prestataire_id, titre, date, heure_debut, heure_fin, lieu, notes
  useEffect(() => {
    const loadEvenements = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        // const { data, error } = await supabase
        //   .from('evenements_prestataire')
        //   .select('*')
        //   .eq('prestataire_id', user.id)
        //   .gte('date', new Date().toISOString().split('T')[0])
        //   .order('date', { ascending: true })
        
        // if (error) throw error
        // setEvenements(data?.map(e => ({ ...e, date: new Date(e.date) })) || [])
      } catch (error) {
        console.error('Erreur chargement événements:', error)
      }
    }

    loadEvenements()
  }, [user])


  const handleCreateEvent = async () => {
    if (!formData.titre || !formData.heure_debut) return

    try {
      const supabase = createClient()
      // TODO: Créer l'événement dans Supabase
      // const { data, error } = await supabase
      //   .from('evenements_prestataire')
      //   .insert({
      //     prestataire_id: user?.id,
      //     titre: formData.titre,
      //     date: formData.date.toISOString().split('T')[0],
      //     heure_debut: formData.heure_debut,
      //     heure_fin: formData.heure_fin || null,
      //     lieu: formData.lieu || null,
      //     notes: formData.notes || null,
      //   })
      //   .select()
      //   .single()

      // Pour l'instant, création locale
      const newEvent: Evenement = {
        id: Date.now().toString(),
        ...formData
      }
      setEvenements([...evenements, newEvent].sort((a, b) => 
        a.date.getTime() - b.date.getTime()
      ))
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Erreur création événement:', error)
    }
  }

  const handleEditEvent = (event: Evenement) => {
    setSelectedEvent(event)
    setFormData({
      titre: event.titre,
      date: event.date,
      heure_debut: event.heure_debut,
      heure_fin: event.heure_fin || '',
      lieu: event.lieu || '',
      notes: event.notes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateEvent = async () => {
    if (!selectedEvent || !formData.titre || !formData.heure_debut) return

    try {
      const supabase = createClient()
      // TODO: Mettre à jour l'événement dans Supabase
      // const { error } = await supabase
      //   .from('evenements_prestataire')
      //   .update({
      //     titre: formData.titre,
      //     date: formData.date.toISOString().split('T')[0],
      //     heure_debut: formData.heure_debut,
      //     heure_fin: formData.heure_fin || null,
      //     lieu: formData.lieu || null,
      //     notes: formData.notes || null,
      //   })
      //   .eq('id', selectedEvent.id)

      // Pour l'instant, mise à jour locale
      setEvenements(evenements.map(e => 
        e.id === selectedEvent.id 
          ? { ...e, ...formData }
          : e
      ).sort((a, b) => a.date.getTime() - b.date.getTime()))
      setIsEditDialogOpen(false)
      setSelectedEvent(null)
      resetForm()
    } catch (error) {
      console.error('Erreur mise à jour événement:', error)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return

    try {
      const supabase = createClient()
      // TODO: Supprimer l'événement dans Supabase
      // const { error } = await supabase
      //   .from('evenements_prestataire')
      //   .delete()
      //   .eq('id', id)

      // Pour l'instant, suppression locale
      setEvenements(evenements.filter(e => e.id !== id))
    } catch (error) {
      console.error('Erreur suppression événement:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      titre: '',
      date: new Date(),
      heure_debut: '',
      heure_fin: '',
      lieu: '',
      notes: ''
    })
  }



  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent mb-2">Agenda</h1>
          <p className="text-[#823F91]/70 text-lg">
            Gérez votre disponibilité et vos événements
          </p>
        </motion.div>
      </div>

      {/* Bouton Ajouter */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white shadow-lg shadow-[#823F91]/30 gap-2 transition-all duration-300"
              onClick={() => {
                resetForm()
                if (selectedDate) {
                  setFormData({ ...formData, date: selectedDate })
                }
              }}
            >
              <Plus className="h-4 w-4" />
              Ajouter un événement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Créer un événement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre *</Label>
                <Input
                  id="titre"
                  value={formData.titre}
                  onChange={(e) => setFormData({...formData, titre: e.target.value})}
                  placeholder="Ex: Mariage de Marie & Jean"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <DatePicker
                  value={formData.date}
                  onChange={(date) => date && setFormData({...formData, date})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="heure_debut">Heure début *</Label>
                  <Input
                    id="heure_debut"
                    type="time"
                    value={formData.heure_debut}
                    onChange={(e) => setFormData({...formData, heure_debut: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heure_fin">Heure fin</Label>
                  <Input
                    id="heure_fin"
                    type="time"
                    value={formData.heure_fin}
                    onChange={(e) => setFormData({...formData, heure_fin: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lieu">Lieu</Label>
                <Input
                  id="lieu"
                  value={formData.lieu}
                  onChange={(e) => setFormData({...formData, lieu: e.target.value})}
                  placeholder="Ex: Paris, Château de..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Informations complémentaires..."
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateEvent}
                disabled={!formData.titre || !formData.heure_debut}
                className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white shadow-lg shadow-[#823F91]/30"
              >
                Créer l'événement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des événements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="border-[#823F91]/20 bg-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent">
              <CalendarIcon className="h-5 w-5 text-[#823F91]" />
              Événements à venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {evenements.length === 0 ? (
              <EmptyState
                icon={CalendarIcon}
                title="Aucun événement à venir"
                description="Vos événements confirmés et en attente apparaîtront ici"
                action={{
                  label: "Ajouter un événement",
                  onClick: () => setIsDialogOpen(true)
                }}
              />
            ) : (
              <div className="space-y-3">
                {evenements.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-[#823F91]/20 bg-background hover:bg-[#823F91]/5 transition-all cursor-pointer hover:shadow-lg hover:shadow-[#823F91]/20"
                    onClick={() => handleEditEvent(event)}
                  >
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex flex-col items-center justify-center text-white flex-shrink-0 shadow-lg shadow-[#823F91]/30">
                      <span className="text-2xl font-bold">
                        {event.date.getDate()}
                      </span>
                      <span className="text-xs uppercase">
                        {event.date.toLocaleDateString('fr-FR', { month: 'short' })}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {event.titre}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.heure_debut}
                          {event.heure_fin && ` - ${event.heure_fin}`}
                        </span>
                        {event.lieu && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.lieu}
                          </span>
                        )}
                      </div>
                      {event.notes && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                          {event.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditEvent(event)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog Modifier */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'événement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-titre">Titre *</Label>
              <Input
                id="edit-titre"
                value={formData.titre}
                onChange={(e) => setFormData({...formData, titre: e.target.value})}
                placeholder="Ex: Mariage de Marie & Jean"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Date *</Label>
              <DatePicker
                value={formData.date}
                onChange={(date) => date && setFormData({...formData, date})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-heure_debut">Heure début *</Label>
                <Input
                  id="edit-heure_debut"
                  type="time"
                  value={formData.heure_debut}
                  onChange={(e) => setFormData({...formData, heure_debut: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-heure_fin">Heure fin</Label>
                <Input
                  id="edit-heure_fin"
                  type="time"
                  value={formData.heure_fin}
                  onChange={(e) => setFormData({...formData, heure_fin: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lieu">Lieu</Label>
              <Input
                id="edit-lieu"
                value={formData.lieu}
                onChange={(e) => setFormData({...formData, lieu: e.target.value})}
                placeholder="Ex: Paris, Château de..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Informations complémentaires..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedEvent(null)
                resetForm()
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdateEvent}
              disabled={!formData.titre || !formData.heure_debut}
              className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white shadow-lg shadow-[#823F91]/30"
            >
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
