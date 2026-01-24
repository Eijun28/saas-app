'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Heart, Calendar, User, ArrowRight } from 'lucide-react'
import { ActivityItem } from './ActivityItem'
import { useRouter } from 'next/navigation'

interface Activity {
  id: number
  type: 'message' | 'favorite' | 'calendar' | 'contact'
  title: string
  time: string
  icon: typeof MessageSquare
  color: string
  href?: string
}

interface RecentActivityCoupleProps {
  activities?: Activity[]
  limit?: number
}

const defaultActivities: Activity[] = [
  { 
    id: 1, 
    type: "message", 
    title: "Nouveau message de Traiteur Delice", 
    time: "Il y a 2 heures",
    icon: MessageSquare,
    color: "text-[#823F91]",
    href: "/couple/messagerie"
  },
  { 
    id: 2, 
    type: "favorite", 
    title: "Photographe ajouté aux favoris", 
    time: "Il y a 5 heures",
    icon: Heart,
    color: "text-pink-600",
    href: "/couple/recherche"
  },
  { 
    id: 3, 
    type: "calendar", 
    title: "RDV confirmé avec le fleuriste", 
    time: "Hier",
    icon: Calendar,
    color: "text-[#823F91]",
    href: "/couple/timeline"
  },
  { 
    id: 4, 
    type: "contact", 
    title: "Nouveau prestataire contacté", 
    time: "Il y a 2 jours",
    icon: User,
    color: "text-[#823F91]",
    href: "/couple/messagerie"
  },
]

export function RecentActivityCouple({ activities = defaultActivities, limit = 5 }: RecentActivityCoupleProps) {
  const router = useRouter()
  const displayedActivities = activities.slice(0, limit)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white rounded-xl p-4 sm:p-5 lg:p-6 border-0 shadow-[0_2px_8px_rgba(130,63,145,0.08)] hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Activité récente</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {activities.length} {activities.length > 1 ? 'activités' : 'activité'}
          </p>
        </div>
        {activities.length > limit && (
          <button
            onClick={() => router.push('/couple/activite')}
            className="text-xs sm:text-sm font-semibold text-[#823F91] hover:text-[#6D3478] transition-colors flex items-center gap-1"
          >
            Voir tout
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayedActivities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Aucune activité récente</p>
        ) : (
          displayedActivities.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              icon={activity.icon}
              title={activity.title}
              time={activity.time}
              color={activity.color}
              onClick={activity.href ? () => router.push(activity.href!) : undefined}
              delay={index * 0.05}
            />
          ))
        )}
      </div>
    </motion.div>
  )
}
