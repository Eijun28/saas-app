import { createClient } from '@/lib/supabase/client';
import type { ChatbotConversation, ChatMessage, SearchCriteria } from '@/types/chatbot';

/**
 * Sauvegarde une conversation chatbot dans la base de données
 */
export async function saveChatbotConversation(
  coupleId: string,
  serviceType: string,
  messages: ChatMessage[],
  extractedCriteria: Partial<SearchCriteria>,
  status: 'in_progress' | 'completed' | 'abandoned' = 'completed'
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    const supabase = createClient();
    
    // Vérifier que l'utilisateur est authentifié
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    // Vérifier que l'utilisateur correspond au couple_id
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', coupleId)
      .single();

    if (!couple) {
      return { success: false, error: 'Couple non trouvé' };
    }

    // Pour l'instant, sauvegarder dans localStorage en attendant la table dédiée
    // TODO: Créer une table chatbot_conversations dans Supabase
    const conversationData: Omit<ChatbotConversation, 'id' | 'created_at' | 'updated_at'> = {
      couple_id: coupleId,
      service_type: serviceType,
      messages,
      extracted_criteria: extractedCriteria as SearchCriteria | null,
      status,
    };

    // Sauvegarder dans localStorage avec une clé unique
    const conversationId = `chatbot_${coupleId}_${Date.now()}`;
    const savedConversations = getSavedConversations();
    
    savedConversations.push({
      ...conversationData,
      id: conversationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    localStorage.setItem('nuply_chatbot_conversations', JSON.stringify(savedConversations));

    return { success: true, conversationId };
  } catch (error: any) {
    console.error('Error saving chatbot conversation:', error);
    return { success: false, error: error.message || 'Erreur lors de la sauvegarde' };
  }
}

/**
 * Récupère toutes les conversations sauvegardées d'un couple
 */
export async function getChatbotConversations(
  coupleId: string
): Promise<ChatbotConversation[]> {
  try {
    const savedConversations = getSavedConversations();
    return savedConversations.filter(conv => conv.couple_id === coupleId);
  } catch (error) {
    console.error('Error getting chatbot conversations:', error);
    return [];
  }
}

/**
 * Récupère une conversation spécifique
 */
export async function getChatbotConversation(
  conversationId: string
): Promise<ChatbotConversation | null> {
  try {
    const savedConversations = getSavedConversations();
    return savedConversations.find(conv => conv.id === conversationId) || null;
  } catch (error) {
    console.error('Error getting chatbot conversation:', error);
    return null;
  }
}

/**
 * Supprime une conversation sauvegardée
 */
export async function deleteChatbotConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const savedConversations = getSavedConversations();
    const filtered = savedConversations.filter(conv => conv.id !== conversationId);
    localStorage.setItem('nuply_chatbot_conversations', JSON.stringify(filtered));
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting chatbot conversation:', error);
    return { success: false, error: error.message || 'Erreur lors de la suppression' };
  }
}

/**
 * Fonction helper pour récupérer les conversations depuis localStorage
 */
function getSavedConversations(): ChatbotConversation[] {
  try {
    const saved = localStorage.getItem('nuply_chatbot_conversations');
    if (!saved) return [];
    return JSON.parse(saved) as ChatbotConversation[];
  } catch (error) {
    console.error('Error parsing saved conversations:', error);
    return [];
  }
}
