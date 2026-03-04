'use client'

import { motion } from 'framer-motion'
import { Check, X, MessageSquare, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { TagPills } from './RequestTags'
import type { Demande } from '@/lib/types/prestataire'
import type { RequestTag } from './RequestTags'

interface KanbanDemande extends Demande {
  tags?: RequestTag[]
}

interface KanbanColumn {
  id: string
  label: string
  color: string
  bg: string
  border: string
  demandes: KanbanDemande[]
}

interface KanbanViewProps {
  nouvelles:  KanbanDemande[]
  en_cours:   KanbanDemande[]
  terminees:  KanbanDemande[]
  tagsMap:    Map<string, RequestTag[]>
  conversationIdsMap: Map<string, string>
  onAccept:   (id: string) => void
  onReject:   (id: string) => void
  onCardClick:(demande: Demande) => void
}

function KanbanCard({
  demande,
  tags,
  conversationId,
  onAccept,
  onReject,
  onCardClick,
}: {
  demande: KanbanDemande
  tags: RequestTag[]
  conversationId?: string
  onAccept?: (id: string) => void
  onReject?: (id: string) => void
  onCardClick: (d: Demande) => void
}) {
  const router = useRouter()

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onCardClick(demande)}
    >
      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-2">
          <TagPills tags={tags} />
        </div>
      )}

      {/* Nom couple */}
      <p className="text-[13px] font-semibold text-gray-900 mb-1 truncate">
        {demande.couple_nom}
      </p>

      {/* Date mariage */}
      {demande.date_evenement && (
        <p className="text-[11px] text-gray-400 mb-2">
          Mariage : {formatDate(demande.date_evenement)}
        </p>
      )}

      {/* Message tronqué */}
      {demande.message && (
        <p className="text-[12px] text-gray-500 line-clamp-2 mb-2 leading-relaxed">
          {demande.message}
        </p>
      )}

      {/* Date demande */}
      <p className="text-[10px] text-gray-300 mb-2">{formatDate(demande.created_at)}</p>

      {/* Actions */}
      {demande.statut === 'nouvelle' && onAccept && onReject && (
        <div
          className="flex gap-1.5 mt-2 pt-2 border-t border-gray-50"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <Button
            size="sm"
            onClick={() => onAccept(demande.id)}
            className="flex-1 h-7 text-[11px] bg-[#823F91] hover:bg-[#6D3478] rounded-lg"
          >
            <Check className="h-3 w-3 mr-1" />
            Accepter
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject(demande.id)}
            className="flex-1 h-7 text-[11px] rounded-lg"
          >
            <X className="h-3 w-3 mr-1" />
            Refuser
          </Button>
        </div>
      )}

      {conversationId && (
        <div
          className="mt-2 pt-2 border-t border-gray-50"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <button
            onClick={() => router.push(`/prestataire/messagerie/${conversationId}`)}
            className="w-full flex items-center justify-center gap-1 text-[11px] font-medium text-[#823F91] hover:text-[#6D3478] transition-colors"
          >
            <MessageSquare className="h-3 w-3" />
            Messagerie
            <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

export function KanbanView({
  nouvelles, en_cours, terminees,
  tagsMap, conversationIdsMap,
  onAccept, onReject, onCardClick,
}: KanbanViewProps) {
  const columns: KanbanColumn[] = [
    {
      id: 'nouvelles',
      label: 'Nouvelles',
      color: 'text-[#823F91]',
      bg: 'bg-[#E8D4EF]/40',
      border: 'border-[#823F91]/20',
      demandes: nouvelles,
    },
    {
      id: 'en_cours',
      label: 'En cours',
      color: 'text-blue-600',
      bg: 'bg-blue-50/60',
      border: 'border-blue-200/50',
      demandes: en_cours,
    },
    {
      id: 'terminees',
      label: 'Terminées',
      color: 'text-gray-500',
      bg: 'bg-gray-50/60',
      border: 'border-gray-200/50',
      demandes: terminees,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map(col => (
        <div key={col.id} className={cn('rounded-2xl border p-3', col.bg, col.border)}>
          {/* En-tête colonne */}
          <div className="flex items-center justify-between mb-3">
            <h3 className={cn('text-[12px] font-bold uppercase tracking-wider', col.color)}>
              {col.label}
            </h3>
            <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/80', col.color)}>
              {col.demandes.length}
            </span>
          </div>

          {/* Cartes */}
          <div className="space-y-2 min-h-[80px]">
            {col.demandes.length === 0 ? (
              <p className="text-[11px] text-gray-300 text-center py-6">Aucune demande</p>
            ) : (
              col.demandes.map(demande => (
                <KanbanCard
                  key={demande.id}
                  demande={demande}
                  tags={tagsMap.get(demande.id) ?? []}
                  conversationId={conversationIdsMap.get(demande.id)}
                  onAccept={col.id === 'nouvelles' ? onAccept : undefined}
                  onReject={col.id === 'nouvelles' ? onReject : undefined}
                  onCardClick={onCardClick}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
