export type MessageRole = 'bot' | 'user';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
}

export type ConversationStatus = 'in_progress' | 'completed' | 'abandoned';

export interface ChatbotConversation {
  id: string;
  couple_id: string;
  service_type: string;
  messages: ChatMessage[];
  extracted_criteria: SearchCriteria | null;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
}

export interface SearchCriteria {
  // Essentiel
  service_type: string;

  // Culture
  cultures: string[];
  cultural_importance: 'essential' | 'important' | 'nice_to_have';

  // Budget
  budget_min?: number;
  budget_max?: number;
  budget_flexibility?: 'flexible' | 'somewhat_flexible' | 'strict';

  // Localisation
  wedding_date?: string;
  wedding_department?: string;
  wedding_city?: string;

  // Style & Ambiance
  wedding_style?: string;
  wedding_ambiance?: string;
  specific_requirements?: string[];

  // Tags/keywords for better matching
  tags?: string[];

  // Nombre d'invités
  guest_count?: number;

  // Besoins spécifiques (texte libre analysé par IA)
  vision_description?: string;
  must_haves?: string[];
  must_not_haves?: string[];

  // Données extraites du profil couple
  auto_filled_from_profile?: boolean;

  // Référence budget global (si disponible)
  budget_reference?: {
    global_min?: number;
    global_max?: number;
  };
}

export interface ChatbotState {
  step: 'service_selection' | 'conversation' | 'validation' | 'completed';
  selectedService: string | null;
  messages: ChatMessage[];
  extractedCriteria: Partial<SearchCriteria>;
  isLoading: boolean;
}
