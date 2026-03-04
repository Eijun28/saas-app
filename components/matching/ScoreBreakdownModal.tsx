'use client';

import { ScoreBreakdown } from '@/types/matching';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, Lightbulb } from 'lucide-react';

interface ScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: ScoreBreakdown;
  providerName: string;
  explanation?: string;
}

export default function ScoreBreakdownModal({
  isOpen,
  onClose,
  breakdown,
  providerName,
  explanation,
}: ScoreBreakdownModalProps) {
  const coreCriteria = [
    { label: 'Match culturel', score: breakdown.cultural_match, max: 30 },
    { label: 'Budget', score: breakdown.budget_match, max: 20 },
    { label: 'Réputation', score: breakdown.reputation, max: 20 },
    { label: 'Expérience', score: breakdown.experience, max: 10 },
    { label: 'Localisation', score: breakdown.location_match, max: 10 },
  ];

  // Bonus scores — displayed only when non-zero
  const bonusCriteria: { label: string; score: number; max: number }[] = [
    breakdown.language_match !== undefined && breakdown.language_match !== 0
      ? { label: 'Langues parlées', score: breakdown.language_match, max: 8 }
      : null,
    breakdown.dietary_match !== undefined && breakdown.dietary_match !== 0
      ? { label: 'Régimes alimentaires', score: breakdown.dietary_match, max: 10 }
      : null,
    breakdown.tags_match !== undefined && breakdown.tags_match !== 0
      ? { label: 'Style & ambiance', score: breakdown.tags_match, max: 10 }
      : null,
    breakdown.specialty_match !== undefined && breakdown.specialty_match !== 0
      ? { label: 'Spécialités requises', score: breakdown.specialty_match, max: 15 }
      : null,
    breakdown.capacity_match !== undefined && breakdown.capacity_match !== 0
      ? { label: 'Capacité d\'accueil', score: breakdown.capacity_match, max: 10 }
      : null,
    breakdown.event_types_match !== undefined && breakdown.event_types_match !== 0
      ? { label: 'Types d\'événements', score: breakdown.event_types_match, max: 8 }
      : null,
    breakdown.response_rate_bonus !== undefined && breakdown.response_rate_bonus !== 0
      ? { label: 'Taux de réponse', score: breakdown.response_rate_bonus, max: 3 }
      : null,
  ].filter(Boolean) as { label: string; score: number; max: number }[];

  const hasBonuses = bonusCriteria.length > 0;
  const hasCtrBonus =
    breakdown.ctr_bonus !== undefined && breakdown.ctr_bonus !== 0;
  const hasFairness =
    breakdown.fairness_multiplier !== undefined &&
    breakdown.fairness_multiplier !== 1;

  const getProgressColor = (percentage: number) => {
    if (percentage > 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    return 'bg-orange-500';
  };

  const getBonusColor = (score: number) => {
    if (score > 0) return 'text-green-600';
    if (score < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const finalScore = Math.round(breakdown.final_score);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#823F91]" />
            Détail du score — {providerName}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
          {/* Score Final */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative inline-flex items-center justify-center mb-4"
            >
              <div
                className={cn(
                  'w-32 h-32 rounded-full flex flex-col items-center justify-center text-white shadow-lg',
                  finalScore >= 80
                    ? 'bg-gradient-to-br from-green-400 to-green-600'
                    : finalScore >= 60
                      ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                      : 'bg-gradient-to-br from-orange-400 to-orange-600'
                )}
              >
                <span className="text-4xl font-bold">{finalScore}</span>
                <span className="text-sm opacity-90">/100</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full bg-gray-200 rounded-full h-4 overflow-hidden"
            >
              <div
                className={cn(
                  'h-4 rounded-full transition-all duration-1000',
                  getProgressColor(finalScore)
                )}
                style={{ width: `${finalScore}%` }}
              />
            </motion.div>
            <p className="text-xs text-gray-500 mt-2">
              Score de correspondance : {finalScore}%
            </p>
          </div>

          {/* Critères objectifs */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Critères objectifs
            </h3>
            <div className="space-y-4">
              {coreCriteria.map((criterion, index) => {
                const percentage = (criterion.score / criterion.max) * 100;
                const progressColor = getProgressColor(percentage);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {criterion.label}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {Math.round(criterion.score)}/{criterion.max}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{
                          duration: 0.8,
                          delay: 0.6 + index * 0.1,
                          ease: 'easeOut',
                        }}
                        className={cn('h-3 rounded-full', progressColor)}
                      />
                    </div>
                    <div className="flex justify-end">
                      <span className="text-xs text-gray-500">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Sous-total base */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.1 }}
              className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
            >
              <span className="text-sm font-semibold text-gray-700">
                Sous-total base
              </span>
              <span className="text-base font-bold text-gray-900">
                {Math.round(
                  breakdown.cultural_match +
                    breakdown.budget_match +
                    breakdown.reputation +
                    breakdown.experience +
                    breakdown.location_match
                )}
                /90 pts
              </span>
            </motion.div>
          </div>

          {/* Bonus de compatibilité */}
          {hasBonuses && (
            <div>
              <div className="border-t border-gray-200 mb-4" />
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Bonus de compatibilité
              </h3>
              <div className="space-y-2">
                {bonusCriteria.map((criterion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1.2 + index * 0.08 }}
                    className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">
                      {criterion.label}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-bold',
                        getBonusColor(criterion.score)
                      )}
                    >
                      {criterion.score > 0 ? '+' : ''}
                      {Math.round(criterion.score)} pts
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Équité algorithmique */}
          {(hasCtrBonus || hasFairness) && (
            <div>
              <div className="border-t border-gray-200 mb-4" />
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Équité algorithmique
              </h3>
              <div className="space-y-2">
                {hasCtrBonus && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1.5 }}
                    className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">
                      Engagement profil (CTR)
                    </span>
                    <span
                      className={cn(
                        'text-sm font-bold',
                        getBonusColor(breakdown.ctr_bonus!)
                      )}
                    >
                      {breakdown.ctr_bonus! > 0 ? '+' : ''}
                      {Math.round(breakdown.ctr_bonus!)} pts
                    </span>
                  </motion.div>
                )}
                {hasFairness && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1.58 }}
                    className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">
                      Équité d'exposition
                    </span>
                    <span
                      className={cn(
                        'text-sm font-bold tabular-nums',
                        breakdown.fairness_multiplier! > 1
                          ? 'text-green-600'
                          : 'text-orange-600'
                      )}
                    >
                      ×{breakdown.fairness_multiplier!.toFixed(2)}
                    </span>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Score algorithmique total */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.65 }}
            className="flex items-center justify-between bg-[#F5F0F7] rounded-lg px-4 py-3 border border-[#D4ADE0]"
          >
            <span className="text-sm font-semibold text-[#5C2B66]">
              Score algorithmique total
            </span>
            <span className="text-lg font-bold text-[#823F91]">
              {Math.round(breakdown.total_algo)} pts → {finalScore}/100
            </span>
          </motion.div>

          {/* Analyse IA (ai_bonus legacy) */}
          {breakdown.ai_bonus !== undefined && (
            <div>
              <div className="border-t border-gray-200 mb-4" />
              <div
                className={cn(
                  'rounded-lg p-4 border',
                  breakdown.ai_bonus >= 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                )}
              >
                <div className="flex items-start gap-3">
                  <Sparkles
                    className={cn(
                      'h-5 w-5 flex-shrink-0 mt-0.5',
                      breakdown.ai_bonus >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Bonus/Malus IA
                      </span>
                      <span
                        className={cn(
                          'text-lg font-bold',
                          breakdown.ai_bonus >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {breakdown.ai_bonus >= 0 ? '+' : ''}
                        {Math.round(breakdown.ai_bonus)} pts
                      </span>
                    </div>
                    {breakdown.ai_reasoning && (
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {breakdown.ai_reasoning}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Explication GPT */}
          {explanation && (
            <div>
              <div className="border-t border-gray-200 mb-4" />
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Analyse personnalisée
              </h3>
              <div className="bg-[#F5F0F7] p-4 rounded-lg border border-[#D4ADE0]">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-[#823F91] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#5C2B66] leading-relaxed">
                    {explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
