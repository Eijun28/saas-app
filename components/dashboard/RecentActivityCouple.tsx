'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Inbox, ChevronDown } from 'lucide-react'
import { ActivityItem } from './ActivityItem'
import { useRouter } from 'next/navigation'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Activity {
  id: string | number
  type: 'message' | 'favorite' | 'calendar' | 'contact' | 'request'
  title: string
  time: string
  icon: LucideIcon
  color: string
  href?: string
}

interface RecentActivityCoupleProps {
  activities?: Activity[]
  limit?: number
}

export function RecentActivityCouple({ activities = [], limit = 5 }: RecentActivityCoupleProps) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const displayedActivities = activities.slice(0, limit)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col"
    >
      {/* Header - clickable on mobile to collapse */}
      <button
        onClick={() => setCollapsed(prev => !prev)}
        className="w-full text-left bg-gradient-to-r from-[#FBF8F3] to-[#FAF9F6] px-5 py-4 border-b border-gray-100 lg:cursor-default"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Activite recente</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Dernieres actions sur votre compte
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activities.length > limit && (
              <span
                onClick={(e) => { e.stopPropagation(); router.push('/couple/activite') }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#823F91] hover:bg-[#6D3478] rounded-full text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Voir tout
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className={cn(
              "h-5 w-5 text-gray-400 transition-transform duration-200 lg:hidden",
              !collapsed && "rotate-180"
            )} />
          </div>
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
            className="overflow-hidden flex flex-col flex-1"
          >
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {displayedActivities.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center">
                    <Inbox className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Aucune activite recente</p>
                  <p className="text-xs text-gray-500">Vos actions apparaitront ici</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayedActivities.map((activity, index) => (
                    <ActivityItem
                      key={activity.id}
                      icon={activity.icon}
                      title={activity.title}
                      time={activity.time}
                      color={activity.color}
                      onClick={activity.href ? () => router.push(activity.href!) : undefined}
                      delay={index * 0.05}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
