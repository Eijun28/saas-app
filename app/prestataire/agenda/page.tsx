'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Calendar as CalendarIcon, Clock, MapPin, Pencil, Trash2, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
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
import { CalendarDashboard, type CalendarEvent } from '@/components/calendar/CalendarDashboard'
import { GoogleCalendarSync } from '@/components/calendar/GoogleCalendarSync'

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
  const [isGoogleCalendarOpen, setIsGoogleCalendarOpen] = useState(false)

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
    loadEvenements()
  }, [user])


  // Fonction pour formater la date sans problème de fuseau horaire
  const formatDateKey = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleCreateEvent = async (values: EventFormValues) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('evenements_prestataire')
        .insert({
          prestataire_id: user.id,
          titre: values.titre,
          date: formatDateKey(values.date),
          heure_debut: values.heure_debut,
          heure_fin: values.heure_fin || null,
          lieu: values.lieu || null,
          notes: values.notes || null,
        })
        .select()
        .single()

      if (error) throw error

      // Ajouter à la liste locale
      // Créer la date en utilisant les composants pour éviter les problèmes de fuseau horaire
      const [year, month, day] = data.date.split('-').map(Number)
      const eventDate = new Date(year, month - 1, day)
      
      const newEvent: Evenement = {
        id: data.id,
        titre: data.titre,
        date: eventDate,
        heure_debut: data.heure_debut,
        heure_fin: data.heure_fin || undefined,
        lieu: data.lieu || undefined,
        notes: data.notes || undefined,
        status: undefined, // Pas de colonne status dans la table
      }

      setEvenements([...evenements, newEvent].sort((a, b) => 
        a.date.getTime() - b.date.getTime()
      ))
      setIsDialogOpen(false)
      form.reset()
      toast.success('Événement créé avec succès')
    } catch (error: any) {
      console.error('Erreur création événement:', error)
      
      // Afficher le message d'erreur détaillé pour le débogage
      const errorMessage = error?.message || error?.details || 'Erreur inconnue'
      const errorCode = error?.code || 'Pas de code'
      
      console.error('Détails de l\'erreur:', {
        code: errorCode,
        message: errorMessage,
        details: error?.details,
        hint: error?.hint,
        fullError: error
      })
      
      // Si la table n'existe pas encore
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        toast.error('La table des événements n\'existe pas encore. Veuillez créer la table dans Supabase.')
        return
      }
      
      // Si problème de permissions RLS
      if (error?.code === 'PGRST301' || error?.message?.includes('permission denied') || error?.message?.includes('new row violates row-level security')) {
        toast.error('Vous n\'avez pas la permission de créer des événements. Vérifiez les politiques RLS dans Supabase.')
        return
      }
      
      // Autre erreur : afficher le message détaillé
      toast.error(`Erreur lors de la création de l'événement: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCalendarEventCreate = async (eventData: Omit<CalendarEvent, 'id'>) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('evenements_prestataire')
        .insert({
          prestataire_id: user.id,
          titre: eventData.title,
          date: eventData.date,
          heure_debut: eventData.time || '09:00',
          heure_fin: null,
          lieu: null,
          notes: eventData.description || null,
        })

      if (error) throw error

      await loadEvenements()
      toast.success('Événement créé avec succès')
    } catch (error: any) {
      console.error('Erreur création événement:', error)
      toast.error(`Erreur lors de la création: ${error?.message || 'Erreur inconnue'}`)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadEvenements = async () => {
    if (!user) return

    setLoading(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('evenements_prestataire')
        .select('*')
        .eq('prestataire_id', user.id)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('heure_debut', { ascending: true })

      // Si erreur, vérifier si c'est une vraie erreur critique
      if (error) {
        // Codes d'erreur à ignorer (cas normaux)
        const ignorableErrorCodes = ['42P01', 'PGRST116', 'PGRST301']
        const ignorableMessages = ['does not exist', 'permission denied', 'no rows returned']
        
        const isIgnorableError = ignorableErrorCodes.includes(error.code) || 
          ignorableMessages.some(msg => error.message?.toLowerCase().includes(msg.toLowerCase()))
        
        if (!isIgnorableError) {
          // Vraie erreur critique : vérifier si c'est une erreur réseau
          if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('timeout')) {
            throw error
          }
          // Sinon, ignorer silencieusement (probablement RLS ou autre cas normal)
        }
      }
      
      // Si pas de données, initialiser avec un tableau vide (pas d'erreur)
      if (!data || data.length === 0) {
        setEvenements([])
        setLoading(false)
        return
      }

      // Transformer les données de Supabase vers le format Evenement
      const formattedEvents: Evenement[] = (data || []).map((e) => {
        // Créer la date en utilisant les composants pour éviter les problèmes de fuseau horaire
        const [year, month, day] = e.date.split('-').map(Number)
        const eventDate = new Date(year, month - 1, day)
        
        return {
          id: e.id,
          titre: e.titre,
          date: eventDate,
          heure_debut: e.heure_debut,
          heure_fin: e.heure_fin || undefined,
          lieu: e.lieu || undefined,
          notes: e.notes || undefined,
          status: undefined, // Pas de colonne status dans la table
        }
      })

      setEvenements(formattedEvents)
    } catch (error: any) {
      console.error('Erreur chargement événements:', error)
      // Codes d'erreur à ignorer (cas normaux)
      const ignorableErrorCodes = ['42P01', 'PGRST116', 'PGRST301']
      const ignorableMessages = ['does not exist', 'permission denied', 'no rows returned']
      
      const isIgnorableError = ignorableErrorCodes.includes(error?.code) || 
        ignorableMessages.some(msg => error?.message?.toLowerCase().includes(msg.toLowerCase()))
      
      if (isIgnorableError) {
        setEvenements([])
        setLoading(false)
        return
      }
      
      // Vérifier si c'est une vraie erreur réseau
      const isNetworkError = error?.message?.includes('fetch') || 
        error?.message?.includes('network') || 
        error?.message?.includes('timeout')
      
      if (!isNetworkError) {
        // Probablement RLS ou autre cas normal, ignorer silencieusement
        setEvenements([])
        setLoading(false)
        return
      }
      
      // Vraie erreur critique : afficher le message
      toast.error('Erreur lors du chargement des événements')
    } finally {
      setLoading(false)
    }
  }

  // Convertir les événements au format attendu par le calendrier
  const calendarEvents = evenements.map(event => ({
    id: event.id,
    title: event.titre,
    date: formatDateKey(event.date),
    time: event.heure_debut,
    endTime: event.heure_fin || undefined,
    description: event.notes || undefined,
  }))

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
        .from('evenements_prestataire')
        .update({
          titre: values.titre,
          date: formatDateKey(values.date),
          heure_debut: values.heure_debut,
          heure_fin: values.heure_fin || null,
          lieu: values.lieu || null,
          notes: values.notes || null,
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

  const handleCalendarEventUpdate = async (event: CalendarEvent) => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('evenements_prestataire')
        .update({
          titre: event.title,
          date: event.date,
          heure_debut: event.time || '09:00',
          heure_fin: null,
          lieu: null,
          notes: event.description || null,
        })
        .eq('id', event.id)
        .eq('prestataire_id', user?.id)

      if (error) throw error

      await loadEvenements()
      toast.success('Événement modifié avec succès')
    } catch (error: any) {
      console.error('Erreur mise à jour événement:', error)
      toast.error(`Erreur lors de la modification: ${error?.message || 'Erreur inconnue'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('evenements_prestataire')
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
    <div className="h-[calc(100dvh-80px)] flex flex-col">
      <div className="flex items-start justify-between flex-shrink-0">
        <PageTitle
          title="Agenda"
          description="Gérez votre disponibilité et vos événements"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsGoogleCalendarOpen(true)}
          className="gap-2 text-xs border-gray-200 flex-shrink-0 mt-1"
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          Google Calendar
        </Button>
      </div>

      {/* Dialog Google Calendar Sync */}
      <Dialog open={isGoogleCalendarOpen} onOpenChange={setIsGoogleCalendarOpen}>
        <DialogContent className="sm:max-w-sm max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Google Calendar</DialogTitle>
          </DialogHeader>
          <GoogleCalendarSync
            role="prestataire"
            onSyncComplete={() => {
              loadEvenements()
              setIsGoogleCalendarOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Calendrier plein écran */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex-1 overflow-hidden rounded-lg border border-[#823F91]/20 bg-white shadow-lg"
      >
        <CalendarDashboard
          events={calendarEvents}
          onEventCreate={handleCalendarEventCreate}
          onEventUpdate={handleCalendarEventUpdate}
          onEventDelete={handleDeleteEvent}
          showTime={true}
          loading={loading}
          defaultView="week"
          eventColor={(event) => {
            // Couleurs selon le status pour prestataire
            if (event.status === 'confirmed') return 'bg-[#823F91]'
            if (event.status === 'pending') return 'bg-[#9D5FA8]'
            return 'bg-[#B87FC0]'
          }}
        />
      </motion.div>

      {/* Dialog de création d'événement */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[450px] max-w-[calc(100vw-2rem)]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Créer un événement</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <motion.form
                onSubmit={form.handleSubmit(handleCreateEvent)}
                className="space-y-4 py-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
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
              </motion.form>
            </Form>
          </DialogContent>
        </Dialog>

      {/* Dialog Modifier */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px] max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Modifier l'événement</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <motion.form
              onSubmit={editForm.handleSubmit(handleUpdateEvent)}
              className="space-y-4 py-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
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
            </motion.form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
