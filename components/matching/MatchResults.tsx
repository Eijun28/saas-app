'use client';

import { useState } from 'react';
import { ProviderMatch, MatchingResult } from '@/types/matching';
import { motion } from 'framer-motion';
import { Sparkles, Save, AlertCircle, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ProviderMatchCard from './ProviderMatchCard';

const PAGE_SIZE = 3;

interface MatchResultsProps {
  matches: ProviderMatch[];
  allMatches?: ProviderMatch[]; // Tous les résultats pour pagination
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
  allMatches,
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
  const [sortBy, setSortBy] = useState<'score' | 'budget' | 'note'>('score');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(matches.length || PAGE_SIZE);

  // Utiliser allMatches si disponible (contient tous les résultats), sinon matches
  const baseList = (allMatches && allMatches.length > 0) ? allMatches : matches;

  const hasResults = baseList && baseList.length > 0;
  const suggestions = matchingResult?.suggestions;

  // Unique service types for filter chips
  const serviceTypes = hasResults
    ? [...new Set(baseList.map((m) => m.provider.service_type))]
    : [];

  // Sorted + filtered + paginated matches (UI-only, no API call)
  const sortedFiltered = hasResults
    ? [...baseList]
        .filter((m) => !activeFilter || m.provider.service_type === activeFilter)
        .sort((a, b) => {
          if (sortBy === 'budget') return (a.provider.budget_min || 0) - (b.provider.budget_min || 0);
          if (sortBy === 'note') return (b.provider.average_rating || 0) - (a.provider.average_rating || 0);
          return b.score - a.score;
        })
    : [];

  const displayMatches = sortedFiltered.slice(0, visibleCount);
  const hasMore = visibleCount < sortedFiltered.length;
  const remaining = sortedFiltered.length - visibleCount;

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
    <>
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
          ✨ {baseList.length} prestataire{baseList.length > 1 ? 's' : ''} {baseList.length <= 3 ? 'parfait' : 'trouvé'}{baseList.length > 1 ? 's' : ''} pour vous
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

      {/* Résumé du profil de recherche */}
      {matchingResult?.search_criteria && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mb-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Votre recherche</span>
            </div>
            <button
              onClick={onNewSearch}
              className="text-xs text-[#823F91] hover:text-[#9333ea] font-medium transition-colors"
            >
              Modifier
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {matchingResult.search_criteria.service_type && (
              <span className="px-2.5 py-1 text-xs rounded-full bg-purple-100 text-[#823F91] font-medium">
                {matchingResult.search_criteria.service_type}
              </span>
            )}
            {matchingResult.search_criteria.cultures?.map((c, i) => (
              <span key={i} className="px-2.5 py-1 text-xs rounded-full bg-blue-50 text-blue-700 font-medium">
                {c}
              </span>
            ))}
            {(matchingResult.search_criteria.budget_min || matchingResult.search_criteria.budget_max) && (
              <span className="px-2.5 py-1 text-xs rounded-full bg-green-50 text-green-700 font-medium">
                {matchingResult.search_criteria.budget_min
                  ? `${Number(matchingResult.search_criteria.budget_min).toLocaleString('fr-FR')}€`
                  : '0€'}
                {' → '}
                {matchingResult.search_criteria.budget_max
                  ? `${Number(matchingResult.search_criteria.budget_max).toLocaleString('fr-FR')}€`
                  : '∞'}
              </span>
            )}
            {matchingResult.search_criteria.wedding_city && (
              <span className="px-2.5 py-1 text-xs rounded-full bg-orange-50 text-orange-700 font-medium">
                {matchingResult.search_criteria.wedding_city}
              </span>
            )}
            {matchingResult.search_criteria.wedding_date && (
              <span className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-600 font-medium">
                {matchingResult.search_criteria.wedding_date}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Tri et filtres */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6"
      >
        {/* Sort chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Trier :</span>
          {(['score', 'budget', 'note'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              className={cn(
                'px-3 py-1 text-xs rounded-full border transition-all duration-150',
                sortBy === opt
                  ? 'bg-[#823F91] text-white border-[#823F91]'
                  : 'border-gray-300 text-gray-600 hover:border-[#823F91] hover:text-[#823F91]'
              )}
            >
              {opt === 'score' ? 'Compatibilité' : opt === 'budget' ? 'Prix' : 'Note'}
            </button>
          ))}
        </div>

        {/* Filter chips — only if multiple service types */}
        {serviceTypes.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Filtrer :</span>
            <button
              onClick={() => setActiveFilter(null)}
              className={cn(
                'px-3 py-1 text-xs rounded-full border transition-all duration-150',
                !activeFilter
                  ? 'bg-gray-700 text-white border-gray-700'
                  : 'border-gray-300 text-gray-600 hover:border-gray-500'
              )}
            >
              Tous
            </button>
            {serviceTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveFilter(activeFilter === type ? null : type)}
                className={cn(
                  'px-3 py-1 text-xs rounded-full border transition-all duration-150',
                  activeFilter === type
                    ? 'bg-gray-700 text-white border-gray-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-500'
                )}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Results Cards */}
      <div className="space-y-6 mb-8 pb-20 sm:pb-0">
        {displayMatches.map((match, index) => (
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

        {/* Bouton Voir plus */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center pt-2"
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
              className="gap-2 border-[#823F91] text-[#823F91] hover:bg-[#823F91]/5 hover:text-[#823F91]"
            >
              <ChevronDown className="w-4 h-4" />
              Voir {Math.min(remaining, PAGE_SIZE)} prestataire{Math.min(remaining, PAGE_SIZE) > 1 ? 's' : ''} de plus
              <span className="text-xs text-gray-400 ml-1">({remaining} restant{remaining > 1 ? 's' : ''})</span>
            </Button>
          </motion.div>
        )}
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

    {/* CTA sticky mobile — visible uniquement sur petit écran */}
    {onSaveSearch && (
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 sm:hidden z-40">
        <Button
          onClick={onSaveSearch}
          disabled={isSaving}
          className="w-full bg-gradient-to-br from-[#823F91] to-[#9333ea] hover:from-[#9333ea] hover:to-[#823F91] text-white shadow-lg"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder mes résultats'}
        </Button>
      </div>
    )}
    </>
  );
}
