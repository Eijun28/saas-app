'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar } from '@/components/ui/calendar-shadcn'
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

  // Convertir les événements pour le calendrier
  const calendarEvents = evenements.map(e => ({
    id: e.id,
    title: e.titre,
    event_date: e.date.toISOString().split('T')[0]
  }))

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

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setFormData({ ...formData, date })
    setIsDialogOpen(true)
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Agenda</h1>
          <p className="text-muted-foreground text-lg">
            Gérez votre disponibilité et vos événements
          </p>
        </motion.div>

        {/* Bouton Ajouter */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-[#823F91] hover:bg-[#6D3478] gap-2"
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
                className="bg-[#823F91] hover:bg-[#6D3478]"
              >
                Créer l'événement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendrier */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card className="border-border/10">
          <CardContent className="pt-6 flex justify-center">
            <Calendar
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date)
                if (date) {
                  handleDateClick(date)
                }
              }}
              events={calendarEvents}
              onDateClick={handleDateClick}
              className="rounded-lg border"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Liste des événements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="border-border/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/10 hover:bg-gray-50 transition-all cursor-pointer"
                    onClick={() => handleEditEvent(event)}
                  >
                    <div className="h-16 w-16 rounded-xl bg-[#823F91] flex flex-col items-center justify-center text-white flex-shrink-0">
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
              className="bg-[#823F91] hover:bg-[#6D3478]"
            >
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
