'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  Sparkles,
  TrendingUp,
  Camera,
  FileText,
  MapPin,
  Heart,
  Tag,
  Zap,
  Award,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

interface ProfileScoreCardProps {
  profile: ProfileData | null
  cultures: Array<{ id: string; label: string }>
  zones: Array<{ id: string; label: string }>
  portfolio: Array<{ id: string; image_url: string }>
  tags?: Array<{ id: string; name: string }>
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
  className,
}: ProfileScoreCardProps) {
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
        id: 'bio',
        label: 'Biographie complete',
        completed: !!profile?.bio && profile.bio.length > 100,
        points: 10,
        icon: <FileText className="h-4 w-4" />,
        priority: 'medium',
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
    ]
  }, [profile, cultures, zones, portfolio])

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
  const { level, color, bgColor, message } = useMemo(() => {
    if (percentage >= 90) return {
      level: 'Excellent',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500',
      message: 'Votre profil est optimal pour attirer les couples !'
    }
    if (percentage >= 70) return {
      level: 'Tres bien',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      message: 'Encore quelques details pour un profil parfait'
    }
    if (percentage >= 50) return {
      level: 'Bon debut',
      color: 'text-amber-600',
      bgColor: 'bg-amber-500',
      message: 'Completez votre profil pour plus de visibilite'
    }
    return {
      level: 'A completer',
      color: 'text-red-500',
      bgColor: 'bg-red-500',
      message: 'Un profil complet recoit 5x plus de demandes'
    }
  }, [percentage])

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl bg-white',
      'shadow-[0_4px_20px_-4px_rgba(130,63,145,0.12)]',
      'border border-gray-100/50',
      className
    )}>
      {/* Gradient background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#823F91]/10 to-transparent rounded-bl-full" />

      <div className="relative p-6">
        {/* Header with score */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-5 w-5 text-[#823F91]" />
              <h3 className="font-semibold text-gray-900">Score de votre profil</h3>
            </div>
            <p className="text-sm text-gray-500">{message}</p>
          </div>

          {/* Circular score */}
          <div className="relative">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="8"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${percentage * 2.51} 251`}
                initial={{ strokeDasharray: '0 251' }}
                animate={{ strokeDasharray: `${percentage * 2.51} 251` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#823F91" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-2xl font-bold text-gray-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {percentage}%
              </motion.span>
              <span className={cn('text-xs font-medium', color)}>{level}</span>
            </div>
          </div>
        </div>

        {/* Progress items */}
        <div className="space-y-2 mb-6">
          {scoreItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
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
                'p-1.5 rounded-full',
                item.completed
                  ? 'bg-emerald-100 text-emerald-600'
                  : item.priority === 'high'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-gray-100 text-gray-400'
              )}>
                {item.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  item.icon
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm font-medium',
                    item.completed ? 'text-emerald-700' : 'text-gray-700'
                  )}>
                    {item.label}
                  </span>
                  {!item.completed && item.priority === 'high' && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
                      Important
                    </span>
                  )}
                </div>
                {!item.completed && item.tip && (
                  <p className="text-xs text-gray-500 truncate">{item.tip}</p>
                )}
              </div>
              <span className={cn(
                'text-xs font-medium',
                item.completed ? 'text-emerald-600' : 'text-gray-400'
              )}>
                +{item.points} pts
              </span>
            </motion.div>
          ))}
        </div>

        {/* Next action recommendation */}
        {nextAction && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-xl bg-gradient-to-r from-[#823F91]/5 to-purple-50 border border-[#823F91]/10"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#823F91]/10">
                <Zap className="h-4 w-4 text-[#823F91]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Prochaine etape recommandee
                </p>
                <p className="text-sm text-gray-600">
                  {nextAction.label} <span className="text-[#823F91]">(+{nextAction.points} points)</span>
                </p>
                {nextAction.tip && (
                  <p className="text-xs text-gray-500 mt-1">{nextAction.tip}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats footer */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {completedCount}/{totalCount} elements completes
          </span>
          <span className="text-[#823F91] font-medium">
            {totalScore}/{maxScore} points
          </span>
        </div>
      </div>
    </div>
  )
}
