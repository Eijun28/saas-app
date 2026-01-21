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
  };
  score: number;
  rank: number;
  breakdown: ScoreBreakdown;
  explanation: string;
}

export interface ScoreBreakdown {
  // Scores algorithmiques (base /90)
  cultural_match: number; // /30
  budget_match: number; // /20
  reputation: number; // /20
  experience: number; // /10
  location_match: number; // /10
  
  // Bonus IA (futur)
  ai_bonus?: number; // -10 à +10
  ai_reasoning?: string;
  
  // Total
  total_algo: number; // /90
  final_score: number; // /100
}

export interface MatchingResult {
  conversation_id?: string;
  search_criteria: SearchCriteria;
  matches: ProviderMatch[];
  total_candidates: number;
  created_at: string;
}
