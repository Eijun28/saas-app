'use client';

import { ScoreBreakdown } from '@/types/matching';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles } from 'lucide-react';

interface ScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: ScoreBreakdown;
  providerName: string;
}

export default function ScoreBreakdownModal({
  isOpen,
  onClose,
  breakdown,
  providerName,
}: ScoreBreakdownModalProps) {
  const criteria = [
    {
      label: 'Match culturel',
      score: breakdown.cultural_match,
      max: 30,
    },
    {
      label: 'Budget',
      score: breakdown.budget_match,
      max: 20,
    },
    {
      label: 'Réputation',
      score: breakdown.reputation,
      max: 20,
    },
    {
      label: 'Expérience',
      score: breakdown.experience,
      max: 10,
    },
    {
      label: 'Localisation',
      score: breakdown.location_match,
      max: 10,
    },
  ];

  const getProgressColor = (percentage: number) => {
    if (percentage > 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    return 'bg-orange-500';
  };

  const finalScore = Math.round(breakdown.final_score);
  const finalPercentage = finalScore;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#823F91]" />
            Détail du score - {providerName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Détail du score de correspondance pour {providerName}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto p-6">
          {/* Score Final */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative inline-flex items-center justify-center mb-4"
            >
              {/* Cercle avec score */}
              <div
                className={cn(
                  'w-32 h-32 rounded-full flex flex-col items-center justify-center text-white shadow-lg',
                  getProgressColor(finalPercentage) === 'bg-green-500'
                    ? 'bg-gradient-to-br from-green-400 to-green-600'
                    : getProgressColor(finalPercentage) === 'bg-blue-500'
                      ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                      : 'bg-gradient-to-br from-orange-400 to-orange-600'
                )}
              >
                <span className="text-4xl font-bold">{finalScore}</span>
                <span className="text-sm opacity-90">/100</span>
              </div>
            </motion.div>

            {/* Gauge visuelle linéaire */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full bg-gray-200 rounded-full h-4 overflow-hidden"
            >
              <div
                className={cn(
                  'h-4 rounded-full transition-all duration-1000',
                  getProgressColor(finalPercentage)
                )}
                style={{ width: `${finalPercentage}%` }}
              />
            </motion.div>
            <p className="text-xs text-gray-500 mt-2">
              Score de correspondance : {finalPercentage}%
            </p>
          </div>

          {/* Séparateur */}
          <div className="border-t border-gray-200 my-6" />

          {/* Critères Objectifs */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Critères objectifs
            </h3>

            {criteria.map((criterion, index) => {
              const percentage = (criterion.score / criterion.max) * 100;
              const progressColor = getProgressColor(percentage);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.5 + index * 0.1,
                  }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {criterion.label}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {Math.round(criterion.score)}/{criterion.max}
                    </span>
                  </div>

                  {/* Progress bar */}
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

                  {/* Pourcentage */}
                  <div className="flex justify-end">
                    <span className="text-xs text-gray-600">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Sous-total */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1 }}
            className="mt-6 pt-4 border-t border-gray-200"
          >
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <span className="text-sm font-semibold text-gray-700">
                Sous-total (score algorithmique)
              </span>
              <span className="text-lg font-bold text-gray-900">
                {Math.round(breakdown.total_algo)}/90
              </span>
            </div>
          </motion.div>

          {/* Séparateur */}
          {breakdown.ai_bonus !== undefined && (
            <div className="border-t border-gray-200 my-6" />
          )}

          {/* Analyse IA */}
          {breakdown.ai_bonus !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.1 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Analyse IA
              </h3>

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
                        {Math.round(breakdown.ai_bonus)} points
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
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
