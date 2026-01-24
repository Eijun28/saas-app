'use client'

import { motion } from 'framer-motion'
import { Sparkles, Calendar, MessageSquare, DollarSign, ArrowRight, Search } from 'lucide-react'
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
    label: "Rechercher",
    description: "Trouver des prestataires",
    href: "/couple/recherche",
    icon: Search,
  },
  {
    label: "Matching IA",
    description: "Parler à Nora IA",
    href: "/couple/matching",
    icon: Sparkles,
  },
  {
    label: "Messages",
    description: "Vos conversations",
    href: "/couple/messagerie",
    icon: MessageSquare,
  },
  {
    label: "Budget",
    description: "Gérer les dépenses",
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
      className="bg-white rounded-xl p-4 sm:p-5 border-0 shadow-[0_2px_8px_rgba(130,63,145,0.08)] hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)] transition-all duration-300"
    >
      <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Actions rapides</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
                className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 rounded-xl p-3 sm:p-4 transition-all duration-300 flex flex-col h-full border-0 shadow-[0_1px_3px_rgba(130,63,145,0.08)] hover:shadow-[0_2px_6px_rgba(130,63,145,0.15)]"
              >
                <div className="inline-flex p-2 bg-gradient-to-br from-[#823F91] to-[#9D5FA8] rounded-lg mb-2.5 w-fit shadow-sm shadow-[#823F91]/10 group-hover:shadow-md group-hover:shadow-[#823F91]/20 transition-all">
                  <Icon className="text-white" size={16} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-0.5 text-sm group-hover:text-[#823F91] transition-colors">
                  {action.label}
                </h3>
                <p className="text-xs text-gray-600">{action.description}</p>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#823F91]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                {/* Arrow indicator */}
                <ArrowRight className="absolute bottom-3 right-3 h-3.5 w-3.5 text-[#823F91] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
