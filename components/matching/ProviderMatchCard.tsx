'use client';

import { ProviderMatch } from '@/types/matching';
import { useState } from 'react';
import { Heart, Mail, Star, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import ScoreBreakdownModal from './ScoreBreakdownModal';

interface ProviderMatchCardProps {
  match: ProviderMatch;
  onContact: (providerId: string) => void;
  onViewProfile: (providerId: string) => void;
}

export default function ProviderMatchCard({
  match,
  onContact,
  onViewProfile,
}: ProviderMatchCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const { provider, score, rank, breakdown, explanation } = match;

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800';
      case 2:
        return 'bg-gray-100 text-gray-800';
      case 3:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 90) {
      return 'bg-gradient-to-br from-green-400 to-green-600';
    } else if (score >= 80) {
      return 'bg-gradient-to-br from-blue-400 to-blue-600';
    } else {
      return 'bg-gradient-to-br from-gray-400 to-gray-600';
    }
  };

  const getStarCount = (score: number) => {
    if (score > 90) return 5;
    if (score > 80) return 4;
    if (score > 70) return 3;
    if (score > 60) return 2;
    return 1;
  };

  const starCount = getStarCount(score);

  return (
    <div className="border rounded-xl shadow-lg hover:shadow-xl transition-all bg-white">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b">
        {/* Badge rank */}
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0',
            getRankBadge(rank)
          )}
        >
          #{rank}
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0">
          {provider.avatar_url ? (
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
              <Image
                src={provider.avatar_url}
                alt={provider.nom_entreprise}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#823F91] to-[#9333ea] flex items-center justify-center text-white text-xl font-bold">
              {provider.nom_entreprise.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Infos principales */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-xl text-gray-900 truncate">
            {provider.nom_entreprise}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{provider.service_type}</span>
            {provider.ville_principale && (
              <>
                <span>•</span>
                <span>{provider.ville_principale}</span>
              </>
            )}
          </div>
        </div>

        {/* Score badge */}
        <div className="ml-auto text-right flex-shrink-0">
          <div
            className={cn(
              'w-20 h-20 rounded-full flex flex-col items-center justify-center text-white shadow-lg',
              getScoreColor(score)
            )}
          >
            <span className="text-2xl font-bold">{Math.round(score)}</span>
            <span className="text-xs">/100</span>
          </div>
          {/* Étoiles selon score */}
          <div className="flex items-center justify-center gap-0.5 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-3 w-3',
                  i < starCount
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Description courte */}
        {(provider.description_courte || provider.bio) && (
          <p className="text-gray-700 line-clamp-2">
            {provider.description_courte || provider.bio}
          </p>
        )}

        {/* Infos clés */}
        <div className="grid grid-cols-2 gap-4">
          {/* Budget */}
          {(provider.budget_min || provider.budget_max) && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Budget</p>
              <p className="text-sm font-medium text-gray-900">
                {provider.budget_min ? `${provider.budget_min}€` : ''}
                {provider.budget_min && provider.budget_max ? ' - ' : ''}
                {provider.budget_max ? `${provider.budget_max}€` : ''}
              </p>
            </div>
          )}

          {/* Expérience */}
          {provider.annees_experience && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Expérience</p>
              <p className="text-sm font-medium text-gray-900">
                {provider.annees_experience} ans
              </p>
            </div>
          )}

          {/* Note */}
          {provider.average_rating && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Note</p>
              <p className="text-sm font-medium text-gray-900">
                {provider.average_rating.toFixed(1)}/5
                {provider.review_count && (
                  <span className="text-gray-500 ml-1">
                    ({provider.review_count} avis)
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Cultures */}
          {provider.cultures && provider.cultures.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Cultures</p>
              <p className="text-sm font-medium text-gray-900">
                {provider.cultures.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Explication IA */}
        {explanation && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-purple-900 leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>
        )}

        {/* Breakdown score collapsible */}
        <div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {showBreakdown ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span>Masquer le détail du score</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span>Voir le détail du score</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowBreakdownModal(true)}
              className="text-xs text-[#823F91] hover:text-[#9333ea] transition-colors font-medium"
            >
              Voir le détail complet →
            </button>
          </div>

          {showBreakdown && (
            <div className="mt-3 bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Culture</span>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round(breakdown.cultural_match)}/30
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#823F91] h-2 rounded-full"
                  style={{ width: `${(breakdown.cultural_match / 30) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Budget</span>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round(breakdown.budget_match)}/20
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#9333ea] h-2 rounded-full"
                  style={{ width: `${(breakdown.budget_match / 20) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Réputation</span>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round(breakdown.reputation)}/20
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(breakdown.reputation / 20) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Expérience</span>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round(breakdown.experience)}/10
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(breakdown.experience / 10) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Localisation</span>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round(breakdown.location_match)}/10
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${(breakdown.location_match / 10) * 100}%` }}
                />
              </div>

              {breakdown.ai_bonus !== undefined && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Bonus IA</span>
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        breakdown.ai_bonus >= 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {breakdown.ai_bonus >= 0 ? '+' : ''}
                      {Math.round(breakdown.ai_bonus)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={cn(
                        'h-2 rounded-full',
                        breakdown.ai_bonus >= 0 ? 'bg-purple-500' : 'bg-red-400'
                      )}
                      style={{
                        width: `${Math.min(Math.abs(breakdown.ai_bonus) * 10, 100)}%`,
                      }}
                    />
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">
                    Score total
                  </span>
                  <span className="text-lg font-bold text-[#823F91]">
                    {Math.round(breakdown.final_score)}/100
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t flex gap-3">
        <Button
          onClick={() => onViewProfile(provider.id)}
          variant="outline"
          className="flex-1"
        >
          Voir le profil
        </Button>
        <Button
          onClick={() => onContact(provider.id)}
          variant="default"
          className="flex-1 bg-gradient-to-r from-[#823F91] to-[#9333ea] hover:from-[#9333ea] hover:to-[#823F91] text-white"
        >
          <Mail className="h-4 w-4 mr-2" />
          Contacter
        </Button>
        <Button variant="ghost" size="icon" className="flex-shrink-0">
          <Heart className="h-4 w-4" />
        </Button>
      </div>

      {/* Score Breakdown Modal */}
      <ScoreBreakdownModal
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        breakdown={breakdown}
        providerName={provider.nom_entreprise}
      />
    </div>
  );
}
