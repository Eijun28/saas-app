'use client';

import { ProviderMatch } from '@/types/matching';
import { motion } from 'framer-motion';
import { Sparkles, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProviderMatchCard from './ProviderMatchCard';

interface MatchResultsProps {
  matches: ProviderMatch[];
  totalCandidates: number;
  onContactProvider: (providerId: string) => void;
  onViewProfile: (providerId: string) => void;
  onNewSearch: () => void;
  onSaveSearch?: () => void;
  isSaving?: boolean;
}

export default function MatchResults({
  matches,
  totalCandidates,
  onContactProvider,
  onViewProfile,
  onNewSearch,
  onSaveSearch,
  isSaving = false,
}: MatchResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      {/* Header Section */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-4"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-[#823F91]/10 to-[#9333ea]/10">
            <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-[#823F91] animate-pulse" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3"
        >
          ✨ 3 prestataires parfaits pour vous
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-sm sm:text-base text-gray-600"
        >
          {totalCandidates} prestataires analysés
        </motion.p>
      </div>

      {/* Top 3 Cards */}
      <div className="space-y-6 mb-8">
        {matches.map((match, index) => (
          <motion.div
            key={match.provider_id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.4 + index * 0.1,
              duration: 0.5,
              ease: 'easeOut',
            }}
          >
            <ProviderMatchCard
              match={match}
              onContact={onContactProvider}
              onViewProfile={onViewProfile}
            />
          </motion.div>
        ))}
      </div>

      {/* Footer Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
      >
        {onSaveSearch && (
          <Button
            onClick={onSaveSearch}
            variant="default"
            size="lg"
            disabled={isSaving}
            className="flex-1 sm:flex-none sm:px-8 text-sm sm:text-base"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder cette recherche'}
          </Button>
        )}
        <Button
          onClick={onNewSearch}
          variant="outline"
          size="lg"
          className="flex-1 sm:flex-none sm:px-8 text-sm sm:text-base"
        >
          Nouvelle recherche
        </Button>
      </motion.div>
    </motion.div>
  );
}
