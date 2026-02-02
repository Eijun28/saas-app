'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Zap,
  TrendingUp,
  Shield,
  Star,
  Camera,
  Heart,
  MapPin,
  Euro,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
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

interface ProfilePowerCardProps {
  profile: ProfileData | null
  cultures: Array<{ id: string; label: string }>
  zones: Array<{ id: string; label: string }>
  portfolio: Array<{ id: string; image_url: string }>
  className?: string
}

interface PowerFactor {
  id: string
  label: string
  description: string
  score: number // 0-100
  maxScore: number
  icon: React.ReactNode
  status: 'excellent' | 'good' | 'warning' | 'critical'
  tip?: string
}

export function ProfilePowerCard({
  profile,
  cultures,
  zones,
  portfolio,
  className,
}: ProfilePowerCardProps) {
  // Calculer les facteurs de puissance bases sur l'algorithme de matching
  const powerFactors = useMemo<PowerFactor[]>(() => {
    const factors: PowerFactor[] = []

    // 1. CULTURES (30 pts dans l'algo)
    const cultureScore = cultures.length > 0 ? Math.min(100, cultures.length * 25) : 0
    factors.push({
      id: 'cultures',
      label: 'Match culturel',
      description: `${cultures.length} culture${cultures.length > 1 ? 's' : ''} selectionnee${cultures.length > 1 ? 's' : ''}`,
      score: cultureScore,
      maxScore: 30,
      icon: <Heart className="h-4 w-4" />,
      status: cultureScore >= 75 ? 'excellent' : cultureScore >= 50 ? 'good' : cultureScore > 0 ? 'warning' : 'critical',
      tip: cultures.length === 0
        ? 'Selectionnez vos cultures pour apparaitre dans les recherches des couples'
        : cultures.length < 3
        ? 'Ajoutez plus de cultures pour elargir votre audience'
        : undefined,
    })

    // 2. BUDGET (20 pts dans l'algo)
    const hasBudget = !!(profile?.budget_min || profile?.budget_max)
    const budgetScore = hasBudget ? 100 : 0
    factors.push({
      id: 'budget',
      label: 'Tarifs',
      description: hasBudget
        ? `${profile?.budget_min?.toLocaleString() || '?'}€ - ${profile?.budget_max?.toLocaleString() || '?'}€`
        : 'Non renseigne',
      score: budgetScore,
      maxScore: 20,
      icon: <Euro className="h-4 w-4" />,
      status: hasBudget ? 'excellent' : 'critical',
      tip: !hasBudget ? 'Les couples filtrent souvent par budget - renseignez vos tarifs !' : undefined,
    })

    // 3. REPUTATION (20 pts - simule car pas encore d'avis)
    // Pour l'instant, on base sur la completude du profil
    const hasFullProfile = !!(profile?.bio && profile?.description_courte)
    const reputationScore = hasFullProfile ? 70 : profile?.description_courte ? 40 : 0
    factors.push({
      id: 'reputation',
      label: 'Credibilite',
      description: hasFullProfile ? 'Profil complet' : 'Profil a completer',
      score: reputationScore,
      maxScore: 20,
      icon: <Shield className="h-4 w-4" />,
      status: reputationScore >= 70 ? 'excellent' : reputationScore >= 40 ? 'good' : 'warning',
      tip: !hasFullProfile ? 'Une description complete rassure les couples' : undefined,
    })

    // 4. EXPERIENCE (10 pts)
    const exp = profile?.annees_experience || 0
    const expScore = exp >= 10 ? 100 : exp >= 5 ? 80 : exp >= 2 ? 50 : exp > 0 ? 30 : 0
    factors.push({
      id: 'experience',
      label: 'Experience',
      description: exp > 0 ? `${exp} an${exp > 1 ? 's' : ''} d'experience` : 'Non renseignee',
      score: expScore,
      maxScore: 10,
      icon: <Clock className="h-4 w-4" />,
      status: expScore >= 80 ? 'excellent' : expScore >= 50 ? 'good' : expScore > 0 ? 'warning' : 'critical',
      tip: exp === 0 ? 'Indiquez votre experience pour gagner en credibilite' : undefined,
    })

    // 5. ZONES (10 pts)
    const zoneScore = zones.length > 0 ? Math.min(100, zones.length * 15) : 0
    factors.push({
      id: 'zones',
      label: 'Couverture',
      description: zones.length > 0 ? `${zones.length} zone${zones.length > 1 ? 's' : ''}` : 'Aucune zone',
      score: zoneScore,
      maxScore: 10,
      icon: <MapPin className="h-4 w-4" />,
      status: zoneScore >= 75 ? 'excellent' : zoneScore >= 50 ? 'good' : zoneScore > 0 ? 'warning' : 'critical',
      tip: zones.length === 0 ? 'Sans zones, vous n\'apparaitrez pas dans les recherches geographiques' : undefined,
    })

    // 6. PORTFOLIO (bonus +10)
    const portfolioScore = portfolio.length >= 5 ? 100 : portfolio.length >= 3 ? 70 : portfolio.length > 0 ? 40 : 0
    factors.push({
      id: 'portfolio',
      label: 'Portfolio',
      description: portfolio.length > 0 ? `${portfolio.length} photo${portfolio.length > 1 ? 's' : ''}` : 'Vide',
      score: portfolioScore,
      maxScore: 10,
      icon: <Camera className="h-4 w-4" />,
      status: portfolioScore >= 70 ? 'excellent' : portfolioScore >= 40 ? 'good' : portfolioScore > 0 ? 'warning' : 'critical',
      tip: portfolio.length < 3 ? 'Un portfolio riche augmente le taux de contact de 60%' : undefined,
    })

    return factors
  }, [profile, cultures, zones, portfolio])

  // Score global pondere selon l'algorithme de matching
  const globalScore = useMemo(() => {
    const weights = {
      cultures: 0.30,
      budget: 0.20,
      reputation: 0.20,
      experience: 0.10,
      zones: 0.10,
      portfolio: 0.10,
    }

    let total = 0
    powerFactors.forEach(factor => {
      const weight = weights[factor.id as keyof typeof weights] || 0
      total += (factor.score / 100) * weight * 100
    })

    return Math.round(total)
  }, [powerFactors])

  // Niveau et couleur
  const { level, color, bgGradient } = useMemo(() => {
    if (globalScore >= 80) return {
      level: 'Excellent',
      color: 'text-emerald-600',
      bgGradient: 'from-emerald-500 to-emerald-600'
    }
    if (globalScore >= 60) return {
      level: 'Tres bien',
      color: 'text-blue-600',
      bgGradient: 'from-blue-500 to-blue-600'
    }
    if (globalScore >= 40) return {
      level: 'A ameliorer',
      color: 'text-amber-600',
      bgGradient: 'from-amber-500 to-amber-600'
    }
    return {
      level: 'Faible',
      color: 'text-red-500',
      bgGradient: 'from-red-500 to-red-600'
    }
  }, [globalScore])

  // Trouver les points faibles
  const weakPoints = powerFactors.filter(f => f.status === 'critical' || f.status === 'warning')
  const strongPoints = powerFactors.filter(f => f.status === 'excellent')

  const statusColors = {
    excellent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    good: 'bg-blue-100 text-blue-700 border-blue-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    critical: 'bg-red-100 text-red-700 border-red-200',
  }

  const statusIcons = {
    excellent: <CheckCircle2 className="h-3.5 w-3.5" />,
    good: <CheckCircle2 className="h-3.5 w-3.5" />,
    warning: <AlertTriangle className="h-3.5 w-3.5" />,
    critical: <AlertTriangle className="h-3.5 w-3.5" />,
  }

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl bg-white',
      'shadow-[0_4px_20px_-4px_rgba(130,63,145,0.12)]',
      'border border-gray-100/50',
      className
    )}>
      {/* Header avec score global */}
      <div className={cn(
        'relative p-6 bg-gradient-to-r',
        bgGradient,
        'text-white'
      )}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5" />
              <h3 className="font-semibold">Puissance de votre profil</h3>
            </div>
            <p className="text-sm text-white/80">
              Base sur l'algorithme de matching
            </p>
          </div>

          <div className="text-right">
            <motion.div
              className="text-4xl font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              {globalScore}
            </motion.div>
            <div className="text-sm text-white/80">/ 100</div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${globalScore}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Facteurs de puissance */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Facteurs de matching
          </h4>

          <div className="grid gap-2">
            {powerFactors.map((factor, index) => (
              <motion.div
                key={factor.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className={cn(
                  'p-2 rounded-lg border',
                  statusColors[factor.status]
                )}>
                  {factor.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 text-sm">
                      {factor.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-xs', statusColors[factor.status].split(' ')[1])}>
                        {statusIcons[factor.status]}
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        {Math.round(factor.score * factor.maxScore / 100)}/{factor.maxScore} pts
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{factor.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Conseil prioritaire */}
        {weakPoints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Sparkles className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  Conseil pour booster votre visibilite
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {weakPoints[0].tip || `Ameliorez votre ${weakPoints[0].label.toLowerCase()} pour gagner jusqu'a ${weakPoints[0].maxScore} points de matching`}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Resume */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <span className="text-gray-500">
              {strongPoints.length} point{strongPoints.length > 1 ? 's' : ''} fort{strongPoints.length > 1 ? 's' : ''}
            </span>
          </div>
          <span className={cn('font-medium', color)}>
            Niveau: {level}
          </span>
        </div>
      </div>
    </div>
  )
}
