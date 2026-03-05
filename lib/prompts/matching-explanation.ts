/**
 * Prompt template for generating AI-powered matching explanations.
 *
 * Used by the matching route to generate personalised, human-readable
 * explanations for why a provider matches a couple's criteria.
 * Called via GPT-4o-mini for the top 3 matching results.
 */

export const PROMPT_VERSION = '1.0.0';

export interface MatchingExplanationSystemPromptResult {
  role: 'system';
  content: string;
}

/**
 * Returns the system message for the matching explanation generation call.
 */
export function getMatchingExplanationSystemPrompt(): MatchingExplanationSystemPromptResult {
  return {
    role: 'system',
    content: `Tu es un conseiller mariage expert et chaleureux. Pour chaque prestataire, génère une explication de match personnalisée (2 phrases max, en français) qui explique CONCRÈTEMENT pourquoi ce prestataire correspond à ce couple. Sois précis et humain, mentionne des éléments spécifiques (culture, budget, événements). Réponds uniquement en JSON : {"explanations": ["explication1", "explication2", "explication3"]}`,
  };
}

export interface ProviderExplanationContext {
  name: string;
  city: string;
  score: number;
  culturalMatch: number;
  budgetMatch: number;
  rating: number;
  reviewCount: number;
  experience: number;
  locationMatch: number;
  eventTypesMatch?: number;
  dietaryMatch?: number;
  languageMatch?: number;
}

export interface CriteriaContext {
  serviceType: string;
  cultures?: string[];
  culturalImportance?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  weddingCity?: string;
  eventTypes?: string[];
  dietaryRequirements?: string[];
  visionDescription?: string;
}

/**
 * Builds the user message content for the matching explanation call.
 */
export function buildMatchingExplanationUserMessage(
  providers: ProviderExplanationContext[],
  criteria: CriteriaContext
): string {
  const criteriaLines = [
    `Service : ${criteria.serviceType}`,
    criteria.cultures?.length ? `Cultures : ${criteria.cultures.join(', ')} (importance : ${criteria.culturalImportance})` : '',
    (criteria.budgetMin || criteria.budgetMax) ? `Budget : ${criteria.budgetMin ?? ''}€ – ${criteria.budgetMax ?? ''}€` : '',
    criteria.weddingCity ? `Lieu : ${criteria.weddingCity}` : '',
    criteria.eventTypes?.length ? `Événements : ${criteria.eventTypes.join(', ')}` : '',
    criteria.dietaryRequirements?.length ? `Alimentation requise : ${criteria.dietaryRequirements.join(', ')}` : '',
    criteria.visionDescription ? `Vision du couple : ${criteria.visionDescription}` : '',
  ].filter(Boolean).join('\n');

  const providersContext = providers.map((p, i) => {
    return [
      `Prestataire ${i + 1} : ${p.name}${p.city ? ` (${p.city})` : ''}`,
      `- Score global : ${p.score}/100`,
      `- Match culturel : ${p.culturalMatch}/30`,
      `- Budget : ${p.budgetMatch}/20`,
      `- Réputation : ${p.rating}/5 (${p.reviewCount} avis)`,
      `- Expérience : ${p.experience} an${p.experience > 1 ? 's' : ''}`,
      `- Localisation : ${p.locationMatch}/10`,
      p.eventTypesMatch !== undefined ? `- Couverture événements : ${p.eventTypesMatch}/8` : '',
      p.dietaryMatch !== undefined ? `- Alimentaire : ${p.dietaryMatch > 0 ? '✓ couvert' : '✗ non couvert'}` : '',
      p.languageMatch !== undefined ? `- Langues : ${p.languageMatch > 0 ? '✓ couvertes' : ''}` : '',
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  return `Critères du couple :\n${criteriaLines}\n\n${providersContext}`;
}
