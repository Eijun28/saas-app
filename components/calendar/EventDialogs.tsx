'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { CalendarEvent } from './CalendarDashboard'

interface EventFormState {
  date: Date | null
  time: string
  title: string
  description: string
}

function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// --- Create Event Dialog ---

interface CreateEventDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  formState: EventFormState
  onFormChange: (state: EventFormState) => void
  onSubmit: () => Promise<void>
  onCancel: () => void
  showTime: boolean
}

export function CreateEventDialog({
  isOpen, onOpenChange, formState, onFormChange, onSubmit, onCancel, showTime
}: CreateEventDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="sm:max-w-[450px] max-w-[calc(100vw-1rem)] max-h-[85vh] sm:max-h-[75vh] p-4 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg">Créer un événement</DialogTitle>
        </DialogHeader>

        <motion.div
          className="space-y-3 sm:space-y-4 py-2 sm:py-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="date" className="text-sm">Date *</Label>
            <DatePicker
              value={formState.date ? normalizeDate(formState.date) : undefined}
              onChange={(date) => {
                const normalizedDate = date ? normalizeDate(date) : null
                onFormChange({ ...formState, date: normalizedDate })
              }}
              placeholder="Sélectionner une date"
              className="h-9 sm:h-10"
            />
          </div>

          {showTime && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="time" className="text-sm">Heure</Label>
              <Input
                id="time"
                type="time"
                value={formState.time}
                onChange={(e) => onFormChange({ ...formState, time: e.target.value })}
                placeholder="HH:MM"
                className="h-9 sm:h-10"
              />
            </div>
          )}

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="title" className="text-sm">Titre de l'événement *</Label>
            <Input
              id="title"
              placeholder="Ex: Essayage robe, Dégustation menu..."
              value={formState.title}
              onChange={(e) => onFormChange({ ...formState, title: e.target.value })}
              autoFocus
              className="h-9 sm:h-10"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="description" className="text-sm">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Ajoutez des détails sur cet événement..."
              value={formState.description}
              onChange={(e) => onFormChange({ ...formState, description: e.target.value })}
              className="min-h-[60px] sm:min-h-[80px] resize-none text-sm"
              rows={2}
            />
          </div>
        </motion.div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2 sm:pt-0">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto h-9 sm:h-10 text-sm"
          >
            Annuler
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-[#823F91] hover:bg-[#6D3478] text-white w-full sm:w-auto h-9 sm:h-10 text-sm"
            disabled={!formState.title || !formState.date}
          >
            Créer l'événement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Edit Event Dialog ---

interface EditEventDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  formState: EventFormState
  onFormChange: (state: EventFormState) => void
  onSubmit: () => Promise<void>
  onCancel: () => void
  onDelete: () => void
  showTime: boolean
  isDeleting: boolean
  canDelete: boolean
}

export function EditEventDialog({
  isOpen, onOpenChange, formState, onFormChange, onSubmit, onCancel, onDelete, showTime, isDeleting, canDelete
}: EditEventDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="sm:max-w-[450px] max-w-[calc(100vw-1rem)] max-h-[85vh] sm:max-h-[75vh] p-4 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg">Modifier l'événement</DialogTitle>
        </DialogHeader>

        <motion.div
          className="space-y-3 sm:space-y-4 py-2 sm:py-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="edit-date" className="text-sm">Date *</Label>
            <DatePicker
              value={formState.date ? normalizeDate(formState.date) : undefined}
              onChange={(date) => {
                const normalizedDate = date ? normalizeDate(date) : null
                onFormChange({ ...formState, date: normalizedDate })
              }}
              placeholder="Sélectionner une date"
              className="h-9 sm:h-10"
            />
          </div>

          {showTime && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="edit-time" className="text-sm">Heure</Label>
              <Input
                id="edit-time"
                type="time"
                value={formState.time}
                onChange={(e) => onFormChange({ ...formState, time: e.target.value })}
                placeholder="HH:MM"
                className="h-9 sm:h-10"
              />
            </div>
          )}

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="edit-title" className="text-sm">Titre de l'événement *</Label>
            <Input
              id="edit-title"
              placeholder="Ex: Essayage robe, Dégustation menu..."
              value={formState.title}
              onChange={(e) => onFormChange({ ...formState, title: e.target.value })}
              autoFocus
              className="h-9 sm:h-10"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="edit-description" className="text-sm">Description (optionnel)</Label>
            <Textarea
              id="edit-description"
              placeholder="Ajoutez des détails sur cet événement..."
              value={formState.description}
              onChange={(e) => onFormChange({ ...formState, description: e.target.value })}
              className="min-h-[60px] sm:min-h-[80px] resize-none text-sm"
              rows={2}
            />
          </div>
        </motion.div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2 sm:pt-0">
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isDeleting || !canDelete}
            className="w-full sm:w-auto h-9 sm:h-10 text-sm order-2 sm:order-1"
          >
            Supprimer
          </Button>
          <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 sm:flex-none h-9 sm:h-10 text-sm"
            >
              Annuler
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!formState.title || !formState.date}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white flex-1 sm:flex-none h-9 sm:h-10 text-sm"
            >
              Enregistrer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Delete Confirmation Dialog ---

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  eventTitle: string
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

export function DeleteConfirmDialog({
  isOpen, onOpenChange, eventTitle, onConfirm, isDeleting
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="sm:max-w-[380px] max-w-[calc(100vw-1rem)] p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg">Supprimer l'événement ?</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1">
            "{eventTitle}" sera définitivement supprimé. Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2 pt-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-10 text-sm"
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto h-10 text-sm"
          >
            {isDeleting ? 'Suppression...' : 'Oui, supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Day Events Dialog ---

interface DayEventsDialogProps {
  isOpen: boolean
  onClose: () => void
  events: CalendarEvent[]
  date: Date
}

export function DayEventsDialog({ isOpen, onClose, events, date }: DayEventsDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && events.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh', zIndex: 9999
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl xs:rounded-2xl shadow-2xl max-w-[calc(100vw-1rem)] sm:max-w-md w-full max-h-[60vh] sm:max-h-[70vh] overflow-hidden mx-2 xs:mx-4 relative z-[10000]"
          >
            <div className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white p-3 xs:p-4 sm:p-6">
              <h3 className="text-base xs:text-lg sm:text-xl font-bold">
                {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
              </h3>
              <p className="text-xs xs:text-sm opacity-90 mt-1">
                {events.length} événement{events.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="p-3 xs:p-4 sm:p-6 space-y-2 xs:space-y-3 overflow-y-auto max-h-[calc(85vh-140px)] xs:max-h-[calc(80vh-120px)]">
              {events.map((event, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-2.5 xs:p-3 sm:p-4 bg-gradient-to-r from-[#F5F0F7] to-pink-50 rounded-lg xs:rounded-xl border border-[#D4ADE0] hover:shadow-md transition-shadow"
                >
                  <div className="text-sm xs:text-base font-semibold text-gray-900">{event.title}</div>
                  <div className="text-xs xs:text-sm text-[#823F91] mt-0.5 xs:mt-1">
                    {format(new Date(event.date), 'HH:mm')}
                  </div>
                  {event.description && (
                    <div className="text-xs xs:text-sm text-gray-600 mt-1.5 xs:mt-2">{event.description}</div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="p-3 xs:p-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full py-2 xs:py-2.5 bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white rounded-lg font-medium hover:shadow-lg transition-shadow text-sm xs:text-base"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
