'use client';

import { motion } from 'framer-motion';
import { Sparkles, Search, Target, Star, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStep {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  duration: number;
}

export default function LoadingMatching() {
  const steps: LoadingStep[] = [
    {
      icon: Brain,
      text: 'Analyse de vos cultures...',
      duration: 800,
    },
    {
      icon: Search,
      text: 'Vérification des disponibilités...',
      duration: 900,
    },
    {
      icon: Target,
      text: 'Calcul des compatibilités...',
      duration: 900,
    },
    {
      icon: Star,
      text: 'Sélection des meilleurs profils...',
      duration: 900,
    },
  ];

  const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-purple-50 p-4">
      <div className="max-w-md w-full mx-auto text-center">
        {/* Logo NUPLY animé */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-[#823F91]/10 to-[#9333ea]/10">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Sparkles className="h-12 w-12 sm:h-16 sm:w-16 text-[#823F91]" />
            </motion.div>
          </div>
        </motion.div>

        {/* Étapes */}
        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const delay = steps
              .slice(0, index)
              .reduce((acc, s) => acc + s.duration, 0);
            const progressDelay = delay + step.duration * 0.3;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: delay / 1000,
                  duration: 0.4,
                }}
                className="space-y-2"
              >
                {/* Texte et icône */}
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: delay / 1000,
                    }}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#823F91]" />
                  </motion.div>
                  <span className="text-sm sm:text-base font-medium">
                    {step.text}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="relative w-full h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{
                      delay: progressDelay / 1000,
                      duration: step.duration / 1000,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className={cn(
                      'h-full rounded-full bg-gradient-to-r from-[#823F91] via-[#9333ea] to-[#823F91]',
                      'shadow-sm relative overflow-hidden'
                    )}
                  >
                    {/* Effet shimmer */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear',
                        delay: progressDelay / 1000,
                      }}
                    />
                  </motion.div>
                </div>

                {/* Pourcentage animé */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: progressDelay / 1000,
                    duration: 0.3,
                  }}
                  className="text-xs text-gray-500 font-medium"
                >
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: progressDelay / 1000,
                      duration: 0.3,
                    }}
                  >
                    {Math.round(
                      ((delay + step.duration) / totalDuration) * 100
                    )}
                    %
                  </motion.span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Message final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: totalDuration / 1000,
            duration: 0.5,
          }}
          className="mt-8"
        >
          <p className="text-sm text-gray-500">
            Presque terminé...
          </p>
        </motion.div>
      </div>
    </div>
  );
}
