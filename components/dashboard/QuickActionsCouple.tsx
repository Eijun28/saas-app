'use client'

import { motion } from 'framer-motion'
import { Sparkles, Calendar, MessageSquare, DollarSign, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Action {
  label: string
  description: string
  href: string
  icon: typeof Sparkles
}

const actions: Action[] = [
  {
    label: "Parler à Nora IA",
    description: "Trouve des prestataires",
    href: "/couple/matching",
    icon: Sparkles,
  },
  {
    label: "Voir le calendrier",
    description: "Événements à venir",
    href: "/couple/timeline",
    icon: Calendar,
  },
  {
    label: "Messages",
    description: "Voir vos conversations",
    href: "/couple/messagerie",
    icon: MessageSquare,
  },
  {
    label: "Gérer le budget",
    description: "Suivi des dépenses",
    href: "/couple/budget",
    icon: DollarSign,
  },
]

export function QuickActionsCouple() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-white rounded-xl p-4 sm:p-5 lg:p-6 border-0 shadow-[0_2px_8px_rgba(130,63,145,0.08)] hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)] transition-all duration-300"
    >
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">Actions rapides</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={action.href}
                className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 rounded-xl p-4 sm:p-5 transition-all duration-300 flex flex-col h-full border-0 shadow-[0_1px_3px_rgba(130,63,145,0.08)] hover:shadow-[0_2px_6px_rgba(130,63,145,0.15)]"
              >
                <div className="inline-flex p-2.5 sm:p-3 bg-gradient-to-br from-[#823F91] to-[#9D5FA8] rounded-xl mb-3 w-fit shadow-sm shadow-[#823F91]/10 group-hover:shadow-md group-hover:shadow-[#823F91]/20 transition-all">
                  <Icon className="text-white" size={18} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base group-hover:text-[#823F91] transition-colors">
                  {action.label}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">{action.description}</p>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#823F91]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                {/* Arrow indicator */}
                <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-[#823F91] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
