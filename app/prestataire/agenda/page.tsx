'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Pencil, Trash2, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface Evenement {
  id: string
  titre: string
  date: Date
  heure_debut: string
  heure_fin?: string
  lieu?: string
  notes?: string
  status?: string
}

// Schéma de validation Zod
const eventFormSchema = z.object({
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(100, 'Le titre est trop long'),
  date: z.date(),
  heure_debut: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
  heure_fin: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)').optional().or(z.literal('')),
  lieu: z.string().max(200, 'Le lieu est trop long').optional(),
  notes: z.string().max(1000, 'Les notes sont trop longues').optional(),
}).refine((data) => {
  if (data.heure_fin && data.heure_fin !== '') {
    return data.heure_fin > data.heure_debut
  }
  return true
}, {
  message: 'L\'heure de fin doit être après l\'heure de début',
  path: ['heure_fin'],
})

type EventFormValues = z.infer<typeof eventFormSchema>

export default function AgendaPage() {
  const { user } = useUser()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Evenement | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      titre: '',
      date: new Date(),
      heure_debut: '',
      heure_fin: '',
      lieu: '',
      notes: '',
    },
  })

  const editForm = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      titre: '',
      date: new Date(),
      heure_debut: '',
      heure_fin: '',
      lieu: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (!user) return

    const loadEvenements = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('prestataire_id', user.id)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .order('time', { ascending: true })

        if (error) throw error

        // Transformer les données de Supabase vers le format Evenement
        const formattedEvents: Evenement[] = (data || []).map((e) => ({
          id: e.id,
          titre: e.title,
          date: new Date(e.date),
          heure_debut: e.time || '',
          heure_fin: undefined, // Pas de heure_fin dans le schéma
          lieu: e.notes || undefined, // Utiliser notes comme lieu temporairement
          notes: e.notes,
          status: e.status,
        }))

        setEvenements(formattedEvents)
      } catch (error) {
        console.error('Erreur chargement événements:', error)
        toast.error('Erreur lors du chargement des événements')
      } finally {
        setLoading(false)
      }
    }

    loadEvenements()
  }, [user])


  const handleCreateEvent = async (values: EventFormValues) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          prestataire_id: user.id,
          title: values.titre,
          date: values.date.toISOString().split('T')[0],
          time: values.heure_debut,
          status: 'pending',
          notes: values.notes || values.lieu || null,
        })
        .select()
        .single()

      if (error) throw error

      // Ajouter à la liste locale
      const newEvent: Evenement = {
        id: data.id,
        titre: data.title,
        date: new Date(data.date),
        heure_debut: data.time,
        lieu: data.notes || undefined,
        notes: data.notes || undefined,
        status: data.status,
      }

      setEvenements([...evenements, newEvent].sort((a, b) => 
        a.date.getTime() - b.date.getTime()
      ))
      setIsDialogOpen(false)
      form.reset()
      toast.success('Événement créé avec succès')
    } catch (error) {
      console.error('Erreur création événement:', error)
      toast.error('Erreur lors de la création de l\'événement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditEvent = (event: Evenement) => {
    setSelectedEvent(event)
    editForm.reset({
      titre: event.titre,
      date: event.date,
      heure_debut: event.heure_debut,
      heure_fin: event.heure_fin || '',
      lieu: event.lieu || '',
      notes: event.notes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateEvent = async (values: EventFormValues) => {
    if (!selectedEvent) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('events')
        .update({
          title: values.titre,
          date: values.date.toISOString().split('T')[0],
          time: values.heure_debut,
          notes: values.notes || values.lieu || null,
        })
        .eq('id', selectedEvent.id)
        .eq('prestataire_id', user?.id)

      if (error) throw error

      // Mettre à jour la liste locale
      setEvenements(evenements.map(e => 
        e.id === selectedEvent.id 
          ? { 
              ...e, 
              titre: values.titre,
              date: values.date,
              heure_debut: values.heure_debut,
              heure_fin: values.heure_fin,
              lieu: values.lieu,
              notes: values.notes,
            }
          : e
      ).sort((a, b) => a.date.getTime() - b.date.getTime()))
      
      setIsEditDialogOpen(false)
      setSelectedEvent(null)
      editForm.reset()
      toast.success('Événement modifié avec succès')
    } catch (error) {
      console.error('Erreur mise à jour événement:', error)
      toast.error('Erreur lors de la modification de l\'événement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('prestataire_id', user?.id)

      if (error) throw error

      // Supprimer de la liste locale
      setEvenements(evenements.filter(e => e.id !== id))
      toast.success('Événement supprimé avec succès')
    } catch (error) {
      console.error('Erreur suppression événement:', error)
      toast.error('Erreur lors de la suppression de l\'événement')
    }
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
                form.reset()
                if (selectedDate) {
                  form.setValue('date', selectedDate)
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateEvent)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="titre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Mariage de Marie & Jean"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={(date) => date && field.onChange(date)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="heure_debut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heure début *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="heure_fin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heure fin</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="lieu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lieu</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Paris, Château de..."
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informations complémentaires..."
                          className="resize-none"
                          rows={3}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      form.reset()
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white shadow-lg shadow-[#823F91]/30"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      'Créer l\'événement'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
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
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-[#823F91]/20">
                    <Skeleton className="h-16 w-16 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : evenements.length === 0 ? (
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
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateEvent)} className="space-y-4 py-4">
              <FormField
                control={editForm.control}
                name="titre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Mariage de Marie & Jean"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={(date) => date && field.onChange(date)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="heure_debut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heure début *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="heure_fin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heure fin</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="lieu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Paris, Château de..."
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informations complémentaires..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setSelectedEvent(null)
                    editForm.reset()
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white shadow-lg shadow-[#823F91]/30"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer les modifications'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
