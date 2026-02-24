import type { SearchCriteria } from './chatbot';

export interface MatchingRequest {
  couple_id: string;
  conversation_id?: string;
  search_criteria: SearchCriteria;
}

export interface ProviderMatch {
  provider_id: string;
  provider: {
    id: string;
    nom_entreprise: string;
    avatar_url?: string;
    bio?: string;
    description_courte?: string;
    service_type: string;
    budget_min?: number;
    budget_max?: number;
    ville_principale?: string;
    annees_experience?: number;
    languages?: string[];
    cultures?: string[];
    zones?: string[];
    average_rating?: number;
    review_count?: number;
    response_rate?: number;
    portfolio_count?: number;
    guest_capacity_min?: number;
    guest_capacity_max?: number;
  };
  score: number;
  rank: number;
  breakdown: ScoreBreakdown;
  explanation: string;
}

export interface ScoreBreakdown {
  // Scores algorithmiques (base /100)
  cultural_match: number; // /30
  budget_match: number; // /20
  reputation: number; // /20
  experience: number; // /10
  location_match: number; // /10
  capacity_match?: number; // /10 (si guest_count renseigné)

  // Tags match (bonus)
  tags_match?: number; // 0 a +10 points bonus

  // Specialty match (bonus pour besoins specifiques)
  specialty_match?: number; // 0 a +15 points bonus

  // Equite (pour eviter de toujours montrer les memes)
  fairness_multiplier?: number; // 0.85 a 1.15
  ctr_bonus?: number; // -3 a +5 points
  score_before_fairness?: number; // Score avant application de l'equite

  // Bonus IA (futur)
  ai_bonus?: number; // -10 a +10
  ai_reasoning?: string;

  // Total
  total_algo: number; // /90 base + tags bonus
  final_score: number; // /100
}

export interface MatchingResult {
  conversation_id?: string;
  search_criteria: SearchCriteria;
  matches: ProviderMatch[];
  all_matches?: ProviderMatch[]; // Tous les résultats pour pagination future
  total_candidates: number;
  created_at: string;
  suggestions?: {
    message: string;
    alternative_providers?: Array<{
      id: string;
      nom_entreprise: string;
      service_type: string;
      budget_min?: number;
      budget_max?: number;
    }>;
    total_providers_for_service: number;
    service_type: string;
  };
}
