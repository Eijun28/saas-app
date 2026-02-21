'use client'

import { motion } from 'framer-motion'
import { Users, CheckCircle2, XCircle, Clock, HelpCircle } from 'lucide-react'
import type { GuestStats } from '@/types/guest'

interface GuestStatsCardsProps {
  stats: GuestStats
}

const STAT_CARDS = [
  {
    key: 'total' as const,
    label: 'Total invités',
    icon: Users,
    color: 'text-[#823F91]',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
  },
  {
    key: 'confirmed' as const,
    label: 'Confirmés',
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100',
  },
  {
    key: 'pending' as const,
    label: 'En attente',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    key: 'declined' as const,
    label: 'Déclinés',
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-100',
  },
  {
    key: 'maybe' as const,
    label: 'Peut-être',
    icon: HelpCircle,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
]

export function GuestStatsCards({ stats }: GuestStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {STAT_CARDS.map((card, idx) => {
        const Icon = card.icon
        const value = stats[card.key]

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={`rounded-2xl border p-4 flex flex-col gap-2 ${card.bg} ${card.border}`}
          >
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center bg-white/80 ${card.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${card.color}`}>{value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{card.label}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
