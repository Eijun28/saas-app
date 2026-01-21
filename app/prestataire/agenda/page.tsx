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
import { CalendarDashboard, type CalendarEvent } from '@/components/calendar/CalendarDashboard'

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
    loadEvenements()
  }, [user])


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
          date: values.date.toISOString().split('T')[0],
          heure_debut: values.heure_debut,
          heure_fin: values.heure_fin || null,
          lieu: values.lieu || null,
          notes: values.notes || null,
        })
        .select()
        .single()

      if (error) throw error

      // Ajouter à la liste locale
      const newEvent: Evenement = {
        id: data.id,
        titre: data.titre,
        date: new Date(data.date),
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
      const formattedEvents: Evenement[] = (data || []).map((e) => ({
        id: e.id,
        titre: e.titre,
        date: new Date(e.date),
        heure_debut: e.heure_debut,
        heure_fin: e.heure_fin || undefined,
        lieu: e.lieu || undefined,
        notes: e.notes || undefined,
        status: undefined, // Pas de colonne status dans la table
      }))

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
    date: event.date.toISOString().split('T')[0],
    time: event.heure_debut,
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
          date: values.date.toISOString().split('T')[0],
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

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return

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
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 min-w-0"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent mb-1 sm:mb-2 break-words">
            Agenda
          </h1>
          <p className="text-[#823F91]/70 text-sm sm:text-base lg:text-lg break-words">
            Gérez votre disponibilité et vos événements
          </p>
        </motion.div>
        
        {/* Bouton Ajouter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex-shrink-0"
        >
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white shadow-lg shadow-[#823F91]/30 gap-2 transition-all duration-300 w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base"
              onClick={() => {
                form.reset()
                if (selectedDate) {
                  form.setValue('date', selectedDate)
                }
              }}
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Ajouter un événement</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </DialogTrigger>
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
        </motion.div>
      </div>

      {/* Calendrier */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-4 sm:mb-6"
      >
        <CalendarDashboard
          events={calendarEvents}
          onEventCreate={handleCalendarEventCreate}
          showTime={true}
          loading={loading}
        />
      </motion.div>

      {/* Liste des événements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full"
      >
        <Card className="w-full border-[#823F91]/20 bg-background">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl font-semibold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[#823F91] flex-shrink-0" />
              <span>Événements à venir</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
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
              <div className="space-y-2 sm:space-y-3">
                {evenements.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ x: 2 }}
                    className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-[#823F91]/20 bg-background hover:bg-[#823F91]/5 transition-all cursor-pointer hover:shadow-md hover:shadow-[#823F91]/10"
                    onClick={() => handleEditEvent(event)}
                  >
                    <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex flex-col items-center justify-center text-white flex-shrink-0 shadow-md shadow-[#823F91]/20">
                      <span className="text-lg sm:text-xl md:text-2xl font-bold">
                        {event.date.getDate()}
                      </span>
                      <span className="text-[9px] sm:text-[10px] md:text-xs uppercase leading-tight">
                        {event.date.toLocaleDateString('fr-FR', { month: 'short' })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-1 break-words">
                        {event.titre}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">{event.heure_debut}</span>
                          {event.heure_fin && <span className="whitespace-nowrap"> - {event.heure_fin}</span>}
                        </span>
                        {event.lieu && (
                          <span className="flex items-center gap-1 min-w-0">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{event.lieu}</span>
                          </span>
                        )}
                      </div>
                      {event.notes && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-1 break-words">
                          {event.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                        onClick={() => handleEditEvent(event)}
                      >
                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
