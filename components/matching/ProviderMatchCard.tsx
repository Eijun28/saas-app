'use client';

import { ProviderMatch } from '@/types/matching';
import { useState } from 'react';
import { Heart, Mail, Star, MapPin, Briefcase, Euro, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import ScoreBreakdownModal from './ScoreBreakdownModal';
import { PricingDisplay } from '@/components/provider/PricingDisplay';

interface ProviderMatchCardProps {
  match: ProviderMatch;
  onContact: (providerId: string) => void;
  onViewProfile: (providerId: string) => void;
  onFavorite?: (providerId: string) => void;
  isFavorited?: boolean;
}

export default function ProviderMatchCard({
  match,
  onContact,
  onViewProfile,
  onFavorite,
  isFavorited = false,
}: ProviderMatchCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);
  const { provider, score, rank, breakdown, explanation } = match;

  const formatBudget = (min?: number, max?: number) => {
    if (min && max) {
      return `${min.toLocaleString('fr-FR')} – ${max.toLocaleString('fr-FR')} €`;
    }
    if (min) return `À partir de ${min.toLocaleString('fr-FR')} €`;
    if (max) return `Jusqu'à ${max.toLocaleString('fr-FR')} €`;
    return null;
  };

  const budgetText = formatBudget(provider.budget_min, provider.budget_max);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      {/* Main content */}
      <div className="p-5 sm:p-6">
        {/* Top row: Avatar + Info + Score + Favorite */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {provider.avatar_url ? (
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden ring-2 ring-gray-100">
                <Image
                  src={provider.avatar_url}
                  alt={provider.nom_entreprise}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#823F91]/10 flex items-center justify-center text-[#823F91] text-lg sm:text-xl font-bold">
                {provider.nom_entreprise.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                {provider.nom_entreprise}
              </h3>
              {rank <= 3 && (
                <span className="flex-shrink-0 text-xs font-semibold text-[#823F91] bg-[#823F91]/8 px-2 py-0.5 rounded-full">
                  Top {rank}
                </span>
              )}
            </div>

            <p className="text-sm text-[#823F91] font-medium mt-0.5">
              {provider.service_type}
            </p>

            {/* Meta info row */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {provider.ville_principale && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  {provider.ville_principale}
                </span>
              )}
              {provider.annees_experience && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Briefcase className="h-3 w-3 text-gray-400" />
                  {provider.annees_experience} ans
                </span>
              )}
              {provider.average_rating && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  {provider.average_rating.toFixed(1)}
                  {provider.review_count && (
                    <span className="text-gray-400">({provider.review_count})</span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Right side: Score + Favorite */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[#823F91]">
                {Math.round(score)}
              </div>
              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                /100
              </div>
            </div>
            <button
              onClick={() => {
                setFavorited(!favorited);
                onFavorite?.(provider.id);
              }}
              className="p-1.5 rounded-full hover:bg-gray-50 transition-colors"
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-colors',
                  favorited ? 'fill-red-500 text-red-500' : 'text-gray-300 hover:text-gray-400'
                )}
              />
            </button>
          </div>
        </div>

        {/* Description */}
        {(provider.description_courte || provider.bio) && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed line-clamp-2">
            {provider.description_courte || provider.bio}
          </p>
        )}

        {/* Key info chips */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {budgetText && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-full bg-gray-50 text-gray-700 border border-gray-100">
              <Euro className="h-3 w-3 text-gray-400" />
              {budgetText}
            </span>
          )}
          {provider.cultures && provider.cultures.length > 0 && (
            <>
              {provider.cultures.slice(0, 2).map((culture) => (
                <span
                  key={culture}
                  className="inline-flex items-center text-xs font-medium py-1.5 px-3 rounded-full bg-[#823F91]/6 text-[#823F91] border border-[#823F91]/10"
                >
                  {culture}
                </span>
              ))}
              {provider.cultures.length > 2 && (
                <span className="text-xs text-gray-400">
                  +{provider.cultures.length - 2}
                </span>
              )}
            </>
          )}
          {provider.languages && provider.languages.length > 0 && (
            <span className="inline-flex items-center text-xs font-medium py-1.5 px-3 rounded-full bg-gray-50 text-gray-600 border border-gray-100 capitalize">
              {provider.languages.slice(0, 2).join(', ')}
            </span>
          )}
        </div>

        {/* AI Explanation */}
        {explanation && (
          <div className="mt-4 flex items-start gap-2.5 bg-[#823F91]/4 rounded-xl px-4 py-3 border border-[#823F91]/8">
            <Sparkles className="h-4 w-4 text-[#823F91] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed">
              {explanation}
            </p>
          </div>
        )}

        {/* Score breakdown toggle */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showBreakdown ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              Détail du score
            </button>
            <button
              onClick={() => setShowBreakdownModal(true)}
              className="text-xs text-[#823F91] hover:text-[#6D3478] transition-colors font-medium"
            >
              Voir tout
            </button>
          </div>

          {showBreakdown && (
            <div className="mt-3 space-y-2.5">
              {[
                { label: 'Culture', value: breakdown.cultural_match, max: 30, color: 'bg-[#823F91]' },
                { label: 'Budget', value: breakdown.budget_match, max: 20, color: 'bg-[#823F91]/70' },
                { label: 'Réputation', value: breakdown.reputation, max: 20, color: 'bg-[#823F91]/55' },
                { label: 'Expérience', value: breakdown.experience, max: 10, color: 'bg-[#823F91]/45' },
                { label: 'Localisation', value: breakdown.location_match, max: 10, color: 'bg-[#823F91]/35' },
              ].map(({ label, value, max, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className={cn('h-1.5 rounded-full transition-all', color)}
                      style={{ width: `${(value / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600 w-10 text-right">
                    {Math.round(value)}/{max}
                  </span>
                </div>
              ))}

              {/* Bonus items */}
              {[
                breakdown.language_match !== undefined && breakdown.language_match !== 0
                  ? { label: 'Langues', score: breakdown.language_match }
                  : null,
                breakdown.dietary_match !== undefined && breakdown.dietary_match !== 0
                  ? { label: 'Régimes', score: breakdown.dietary_match }
                  : null,
                breakdown.tags_match !== undefined && breakdown.tags_match !== 0
                  ? { label: 'Style', score: breakdown.tags_match }
                  : null,
                breakdown.specialty_match !== undefined && breakdown.specialty_match !== 0
                  ? { label: 'Spécialités', score: breakdown.specialty_match }
                  : null,
                breakdown.capacity_match !== undefined && breakdown.capacity_match !== 0
                  ? { label: 'Capacité', score: breakdown.capacity_match }
                  : null,
                breakdown.event_types_match !== undefined && breakdown.event_types_match !== 0
                  ? { label: 'Événements', score: breakdown.event_types_match }
                  : null,
                breakdown.ctr_bonus !== undefined && breakdown.ctr_bonus !== 0
                  ? { label: 'Engagement', score: breakdown.ctr_bonus }
                  : null,
                breakdown.response_rate_bonus !== undefined && breakdown.response_rate_bonus !== 0
                  ? { label: 'Réactivité', score: breakdown.response_rate_bonus }
                  : null,
                breakdown.ai_bonus !== undefined && breakdown.ai_bonus !== 0
                  ? { label: 'Bonus IA', score: breakdown.ai_bonus }
                  : null,
              ]
                .filter(Boolean)
                .map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{item!.label}</span>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        item!.score > 0 ? 'text-[#823F91]' : 'text-gray-400'
                      )}
                    >
                      {item!.score > 0 ? '+' : ''}
                      {Math.round(item!.score)} pts
                    </span>
                  </div>
                ))}

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Score total</span>
                <span className="text-sm font-bold text-[#823F91]">
                  {Math.round(breakdown.final_score)}/100
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-5 sm:px-6 py-3.5 border-t border-gray-100 flex gap-2.5">
        <Button
          onClick={() => onViewProfile(provider.id)}
          variant="outline"
          className="flex-1 text-xs sm:text-sm h-9 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        >
          Voir le profil
        </Button>
        <Button
          onClick={() => onContact(provider.id)}
          className="flex-1 text-xs sm:text-sm h-9 bg-[#823F91] hover:bg-[#6D3478] text-white"
        >
          <Mail className="h-3.5 w-3.5 mr-1.5" />
          Contacter
        </Button>
      </div>

      {/* Score Breakdown Modal */}
      <ScoreBreakdownModal
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        breakdown={breakdown}
        providerName={provider.nom_entreprise}
        explanation={explanation}
      />
    </div>
  );
}
