'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  MapPin,
  User,
  Clock,
  CalendarClock,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from './CategoryBadge'
import { ProgramForm } from './ProgramForm'
import type { ProgramItem } from '@/types/wedding-day-program'
import { formatTime, getDuration, CATEGORY_COLORS } from '@/types/wedding-day-program'
import { cn } from '@/lib/utils'

interface ProgramTimelineProps {
  items:     ProgramItem[]
  onUpdated: (item: ProgramItem) => void
  onDeleted: (id: string) => void
}

export function ProgramTimeline({ items, onUpdated, onDeleted }: ProgramTimelineProps) {
  const [editingItem, setEditingItem] = useState<ProgramItem | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  async function handleDelete(item: ProgramItem) {
    if (!confirm(`Supprimer "${item.title}" du programme ?`)) return
    setDeletingId(item.id)
    try {
      const res = await fetch(`/api/wedding-day-program/${item.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onDeleted(item.id)
      toast.success('Créneau supprimé')
    } catch {
      toast.error('Impossible de supprimer ce créneau')
    } finally {
      setDeletingId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
          <CalendarClock className="h-8 w-8 text-[#823F91]/50" />
        </div>
        <p className="text-gray-500 font-medium">Aucun créneau planifié</p>
        <p className="text-sm text-gray-400 mt-1">
          Commencez à construire votre programme en ajoutant le premier créneau
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="relative">
        {/* Ligne verticale de la timeline */}
        <div className="absolute left-[88px] top-0 bottom-0 w-px bg-gray-100 hidden sm:block" />

        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {items.map((item, idx) => {
              const colors   = CATEGORY_COLORS[item.category]
              const duration = getDuration(item.start_time, item.end_time)

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="flex gap-4 items-start group"
                >
                  {/* Colonne heure */}
                  <div className="hidden sm:flex flex-col items-end w-[80px] flex-shrink-0 pt-3">
                    <span className="text-[13px] font-bold text-gray-700 tabular-nums">
                      {formatTime(item.start_time)}
                    </span>
                    {item.end_time && (
                      <span className="text-[11px] text-gray-400 tabular-nums">
                        → {formatTime(item.end_time)}
                      </span>
                    )}
                  </div>

                  {/* Pastille sur la ligne */}
                  <div className="hidden sm:flex flex-col items-center flex-shrink-0 pt-3.5">
                    <div className={cn('h-3 w-3 rounded-full ring-2 ring-white shadow-sm', colors.dot)} />
                  </div>

                  {/* Carte du créneau */}
                  <div
                    className={cn(
                      'flex-1 rounded-2xl border p-4 transition-shadow duration-150',
                      'hover:shadow-sm bg-white',
                      colors.border
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Heure mobile */}
                        <div className="flex items-center gap-2 sm:hidden mb-1.5">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-[12px] text-gray-500 tabular-nums font-medium">
                            {formatTime(item.start_time)}
                            {item.end_time && ` → ${formatTime(item.end_time)}`}
                          </span>
                        </div>

                        {/* Titre + badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-[14px] font-semibold text-gray-900 leading-tight">
                            {item.title}
                          </h3>
                          <CategoryBadge category={item.category} />
                          {duration && (
                            <span className="text-[11px] text-gray-400 font-medium">{duration}</span>
                          )}
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        {/* Métadonnées */}
                        {(item.location || item.responsible) && (
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {item.location && (
                              <div className="flex items-center gap-1 text-[12px] text-gray-400">
                                <MapPin className="h-3 w-3" />
                                <span>{item.location}</span>
                              </div>
                            )}
                            {item.responsible && (
                              <div className="flex items-center gap-1 text-[12px] text-gray-400">
                                <User className="h-3 w-3" />
                                <span>{item.responsible}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => setEditingItem(item)}
                            className="text-[13px] gap-2"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.id}
                            className="text-[13px] gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingId === item.id ? 'Suppression...' : 'Supprimer'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal édition */}
      <ProgramForm
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSaved={updated => {
          onUpdated(updated)
          setEditingItem(null)
        }}
        existing={editingItem}
      />
    </>
  )
}
