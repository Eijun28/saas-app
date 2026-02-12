'use client';

import { ProviderMatch, MatchingResult } from '@/types/matching';
import { motion } from 'framer-motion';
import { Sparkles, Save, AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProviderMatchCard from './ProviderMatchCard';

interface MatchResultsProps {
  matches: ProviderMatch[];
  totalCandidates: number;
  matchingResult?: MatchingResult; // Résultat complet pour suggestions
  onContactProvider: (providerId: string) => void;
  onViewProfile: (providerId: string) => void;
  onFavorite?: (providerId: string) => void;
  favoritedIds?: Set<string>;
  onNewSearch: () => void;
  onSaveSearch?: () => void;
  isSaving?: boolean;
}

export default function MatchResults({
  matches,
  totalCandidates,
  matchingResult,
  onContactProvider,
  onViewProfile,
  onFavorite,
  favoritedIds = new Set(),
  onNewSearch,
  onSaveSearch,
  isSaving = false,
}: MatchResultsProps) {
  const hasResults = matches && matches.length > 0;
  const suggestions = matchingResult?.suggestions;

  // Cas sans résultats
  if (!hasResults) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto px-4 py-8"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-4"
          >
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-orange-100">
              <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-orange-600" />
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3"
          >
            Aucun résultat trouvé
          </motion.h2>

          {suggestions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="bg-gray-50 rounded-xl p-6 mb-6 max-w-2xl mx-auto"
            >
              <p className="text-sm sm:text-base text-gray-700 mb-4">
                {suggestions.message}
              </p>

              {suggestions.alternative_providers && suggestions.alternative_providers.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    Prestataires disponibles pour ce service :
                  </p>
                  <div className="space-y-2">
                    {suggestions.alternative_providers.map((provider) => (
                      <div
                        key={provider.id}
                        className="bg-white rounded-lg p-3 border border-gray-200"
                      >
                        <p className="font-medium text-gray-900">{provider.nom_entreprise}</p>
                        {provider.budget_min && provider.budget_max && (
                          <p className="text-sm text-gray-600">
                            Budget : {provider.budget_min}€ - {provider.budget_max}€
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={onNewSearch}
            variant="default"
            size="lg"
            className="bg-gradient-to-br from-[#823F91] to-[#9333ea] hover:from-[#9333ea] hover:to-[#823F91] text-white"
          >
            <Search className="w-4 h-4 mr-2" />
            Nouvelle recherche
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Cas avec résultats
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
          ✨ {matches.length} prestataire{matches.length > 1 ? 's' : ''} parfait{matches.length > 1 ? 's' : ''} pour vous
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-sm sm:text-base text-gray-600"
        >
          {totalCandidates} prestataire{totalCandidates > 1 ? 's' : ''} analysé{totalCandidates > 1 ? 's' : ''}
        </motion.p>
      </div>

      {/* Results Cards */}
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
              onFavorite={onFavorite}
              isFavorited={favoritedIds.has(match.provider_id)}
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
