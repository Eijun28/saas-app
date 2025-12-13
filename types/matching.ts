// /lib/matching/types.ts

export interface SearchCriteria {
  category: string;
  wedding_date?: string; // ISO format
  location: {
    city: string;
    region?: string;
  };
  budget?: number;
  guest_count?: number;
  cultures: string[];
  religions: string[];
  dietary_requirements: string[];
  style_preferences: string[];
}

export interface Provider {
  id: string;
  business_name: string;
  category: string;
  
  // Localisation
  service_locations: string[];
  max_travel_distance_km: number;
  
  // Prix
  price_min: number;
  price_avg: number;
  price_max: number;
  
  // Capacité
  guest_capacity_min: number;
  guest_capacity_max: number;
  
  // Expertise
  cultural_specialties: string[];
  languages_spoken: string[];
  ceremony_types: string[];
  service_styles: string[];
  dietary_accommodations: string[];
  
  // Disponibilité
  blocked_dates: string[];
  minimum_notice_days: number;
  
  // Réputation
  average_rating: number;
  review_count: number;
  response_rate: number;
  
  // Metadata
  portfolio_image_url?: string;
  past_cultural_work: string[];
  subscription_level: 'free' | 'basic' | 'premium' | 'enterprise';
}

export interface MatchResult {
  provider: Provider;
  score: number; // 0-100
  rank: number; // 1, 2, 3...
  explanation: string; // "Expertise franco-algérienne • Budget adapté"
  details: {
    cultural_match: number;
    budget_match: number;
    location_match: number;
    reputation: number;
  };
}