'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, MessageSquare, DollarSign, ArrowRight, Search, ChevronDown } from 'lucide-react'
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
    label: "Nuply Matching",
    description: "Parler a Nora IA",
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
    description: "Gerer les depenses",
    href: "/couple/budget",
    icon: DollarSign,
  },
]

export function QuickActionsCouple() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Header - clickable on mobile to collapse */}
      <button
        onClick={() => setCollapsed(prev => !prev)}
        className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100 lg:cursor-default"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Actions rapides</h2>
            <p className="text-xs sm:text-[13px] text-gray-400 mt-0.5">Acces direct aux fonctionnalites</p>
          </div>
          <ChevronDown className={cn(
            "h-5 w-5 text-gray-400 transition-transform duration-200 lg:hidden",
            !collapsed && "rotate-180"
          )} />
        </div>
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {actions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <motion.div
                      key={action.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                    >
                      <Link
                        href={action.href}
                        className="group relative overflow-hidden bg-gray-50/80 hover:bg-[#823F91]/[0.04] rounded-xl p-4 sm:p-5 transition-all duration-200 flex flex-col h-full border border-gray-100 hover:border-[#823F91]/15"
                      >
                        <div className="inline-flex p-2.5 bg-gradient-to-br from-[#823F91] to-[#9D5FA8] rounded-xl mb-3 w-fit shadow-sm shadow-[#823F91]/10 group-hover:shadow-md group-hover:shadow-[#823F91]/20 transition-all">
                          <Icon className="text-white" size={18} />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-[15px] group-hover:text-[#823F91] transition-colors tracking-tight">
                          {action.label}
                        </h3>
                        <p className="text-xs sm:text-[13px] text-gray-400 leading-relaxed">{action.description}</p>

                        <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-gray-300 group-hover:text-[#823F91] group-hover:translate-x-0.5 transition-all duration-200" />
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
