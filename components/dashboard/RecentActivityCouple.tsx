'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Heart, Calendar, User, ArrowRight, Inbox } from 'lucide-react'
import { ActivityItem } from './ActivityItem'
import { useRouter } from 'next/navigation'
import { LucideIcon } from 'lucide-react'

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
  const displayedActivities = activities.slice(0, limit)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col"
    >
      {/* Header avec fond ivoire */}
      <div className="bg-gradient-to-r from-[#FFFDF7] to-[#FFF9EE] px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Activite recente</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Dernieres actions sur votre compte
            </p>
          </div>
          {activities.length > limit && (
            <button
              onClick={() => router.push('/couple/activite')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#823F91] hover:bg-[#6D3478] rounded-full text-white text-xs font-medium transition-colors"
            >
              Voir tout
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Contenu */}
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
  )
}
