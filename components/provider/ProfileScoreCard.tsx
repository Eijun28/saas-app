'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Camera,
  FileText,
  MapPin,
  Heart,
  Sparkles,
  TrendingUp,
  Target,
  Award,
  Zap,
  ChevronDown,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { hasServiceFields, getServiceDetailsCompletion } from '@/lib/constants/service-fields'

interface ProfileData {
  avatar_url?: string | null
  nom_entreprise?: string
  description_courte?: string
  bio?: string
  budget_min?: number
  budget_max?: number
  ville_principale?: string
  annees_experience?: number
  instagram_url?: string | null
  facebook_url?: string | null
  website_url?: string | null
  service_type?: string
}

interface ProfileScoreCardProps {
  profile: ProfileData | null
  cultures: Array<{ id: string; label: string }>
  zones: Array<{ id: string; label: string }>
  portfolio: Array<{ id: string; image_url: string }>
  tags?: Array<{ id: string; name: string }>
  serviceDetails?: Record<string, unknown>
  className?: string
}

interface ScoreItem {
  id: string
  label: string
  completed: boolean
  points: number
  icon: React.ReactNode
  tip?: string
  priority: 'high' | 'medium' | 'low'
}

export function ProfileScoreCard({
  profile,
  cultures,
  zones,
  portfolio,
  tags = [],
  serviceDetails = {},
  className,
}: ProfileScoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const scoreItems = useMemo<ScoreItem[]>(() => {
    return [
      {
        id: 'avatar',
        label: 'Photo de profil',
        completed: !!profile?.avatar_url,
        points: 15,
        icon: <Camera className="h-4 w-4" />,
        tip: 'Les profils avec photo recoivent 3x plus de demandes',
        priority: 'high',
      },
      {
        id: 'nom',
        label: 'Nom d\'entreprise',
        completed: !!profile?.nom_entreprise,
        points: 10,
        icon: <FileText className="h-4 w-4" />,
        priority: 'high',
      },
      {
        id: 'description',
        label: 'Description courte',
        completed: !!profile?.description_courte && profile.description_courte.length > 20,
        points: 15,
        icon: <Sparkles className="h-4 w-4" />,
        tip: 'Une bonne description augmente le taux de clic de 40%',
        priority: 'high',
      },
      {
        id: 'budget',
        label: 'Tarifs renseignes',
        completed: !!profile?.budget_min || !!profile?.budget_max,
        points: 10,
        icon: <Target className="h-4 w-4" />,
        tip: 'Les couples filtrent souvent par budget',
        priority: 'high',
      },
      {
        id: 'ville',
        label: 'Ville principale',
        completed: !!profile?.ville_principale,
        points: 5,
        icon: <MapPin className="h-4 w-4" />,
        priority: 'medium',
      },
      {
        id: 'cultures',
        label: 'Cultures de mariage',
        completed: cultures.length > 0,
        points: 15,
        icon: <Heart className="h-4 w-4" />,
        tip: 'Essentiel pour le matching avec les couples',
        priority: 'high',
      },
      {
        id: 'zones',
        label: 'Zones d\'intervention',
        completed: zones.length > 0,
        points: 10,
        icon: <MapPin className="h-4 w-4" />,
        priority: 'medium',
      },
      {
        id: 'portfolio',
        label: 'Portfolio (3+ photos)',
        completed: portfolio.length >= 3,
        points: 15,
        icon: <Camera className="h-4 w-4" />,
        tip: 'Les portfolios riches convertissent 2x mieux',
        priority: 'high',
      },
      {
        id: 'social',
        label: 'Reseaux sociaux',
        completed: !!(profile?.instagram_url || profile?.facebook_url || profile?.website_url),
        points: 5,
        icon: <TrendingUp className="h-4 w-4" />,
        priority: 'low',
      },
      // Only show service details item if the service type has specific fields
      ...(profile?.service_type && hasServiceFields(profile.service_type) ? [{
        id: 'service_details',
        label: 'Détails métier',
        completed: (() => {
          const { filled, total } = getServiceDetailsCompletion(profile.service_type!, serviceDetails)
          return total > 0 && filled >= Math.ceil(total * 0.3) // At least 30% filled
        })(),
        points: 15,
        icon: <ClipboardList className="h-4 w-4" />,
        tip: 'Les détails métier aident les couples à mieux vous trouver',
        priority: 'medium' as const,
      }] : []),
    ]
  }, [profile, cultures, zones, portfolio, serviceDetails])

  const totalScore = useMemo(() => {
    return scoreItems.reduce((acc, item) => acc + (item.completed ? item.points : 0), 0)
  }, [scoreItems])

  const maxScore = useMemo(() => {
    return scoreItems.reduce((acc, item) => acc + item.points, 0)
  }, [scoreItems])

  const percentage = Math.round((totalScore / maxScore) * 100)

  const completedCount = scoreItems.filter(item => item.completed).length
  const totalCount = scoreItems.length

  // Get next recommended action
  const nextAction = useMemo(() => {
    return scoreItems
      .filter(item => !item.completed)
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })[0]
  }, [scoreItems])

  // Score level and color
  const { level, color } = useMemo(() => {
    if (percentage >= 90) return {
      level: 'Excellent',
      color: 'text-emerald-600',
    }
    if (percentage >= 70) return {
      level: 'Tres bien',
      color: 'text-[#823F91]',
    }
    if (percentage >= 50) return {
      level: 'Bon debut',
      color: 'text-amber-600',
    }
    return {
      level: 'A completer',
      color: 'text-red-500',
    }
  }, [percentage])

  // Incomplete items for the collapsed summary
  const incompleteItems = scoreItems.filter(item => !item.completed)

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl bg-white',
      'shadow-[0_4px_20px_-4px_rgba(130,63,145,0.12)]',
      'border border-gray-100/50',
      'transition-all duration-300',
      className
    )}>
      {/* Header - Always visible, clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 sm:p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/20 rounded-2xl"
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-[#823F91]/10 to-purple-50">
            <Award className="h-5 w-5 text-[#823F91]" />
          </div>

          {/* Title and progress */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                Completion du profil
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn('text-xs font-medium', color)}>{level}</span>
                <span className="text-lg sm:text-xl font-bold text-gray-900">{percentage}%</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#823F91] to-[#a855f7] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>

            {/* Summary when collapsed */}
            {!isExpanded && incompleteItems.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {completedCount}/{totalCount} elements • {incompleteItems.length} restant{incompleteItems.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 text-gray-400"
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Progress items */}
              <div className="space-y-1.5">
                {scoreItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      'flex items-center gap-3 py-2 px-3 rounded-lg transition-colors',
                      item.completed
                        ? 'bg-emerald-50/50'
                        : item.priority === 'high'
                        ? 'bg-amber-50/50'
                        : 'bg-gray-50/50'
                    )}
                  >
                    <div className={cn(
                      'p-1.5 rounded-full flex-shrink-0',
                      item.completed
                        ? 'bg-emerald-100 text-emerald-600'
                        : item.priority === 'high'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-gray-100 text-gray-400'
                    )}>
                      {item.completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <span className="h-3.5 w-3.5 flex items-center justify-center">
                          {item.icon}
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      'text-sm flex-1',
                      item.completed ? 'text-emerald-700' : 'text-gray-700'
                    )}>
                      {item.label}
                    </span>
                    {!item.completed && item.priority === 'high' && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded flex-shrink-0">
                        Important
                      </span>
                    )}
                    <span className={cn(
                      'text-xs font-medium flex-shrink-0',
                      item.completed ? 'text-emerald-600' : 'text-gray-400'
                    )}>
                      +{item.points}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Next action recommendation */}
              {nextAction && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-3 rounded-xl bg-gradient-to-r from-[#823F91]/5 to-purple-50 border border-[#823F91]/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-[#823F91]/10 flex-shrink-0">
                      <Zap className="h-3.5 w-3.5 text-[#823F91]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Prochaine etape :</span>{' '}
                        {nextAction.label}
                        <span className="text-[#823F91] ml-1">(+{nextAction.points} pts)</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
