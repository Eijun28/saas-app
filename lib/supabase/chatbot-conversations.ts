import { createClient } from '@/lib/supabase/client';
import type { ChatbotConversation, ChatMessage, SearchCriteria } from '@/types/chatbot';

/**
 * Sauvegarde une conversation chatbot dans la base de données Supabase
 * @param coupleId - L'ID du couple depuis la table couples (sera converti en user_id pour la table chatbot_conversations)
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
    // couple_id dans chatbot_conversations pointe vers profiles(id), qui correspond à couples.user_id
    const { data: couple } = await supabase
      .from('couples')
      .select('id, user_id')
      .eq('user_id', user.id)
      .eq('id', coupleId)
      .single();

    if (!couple) {
      return { success: false, error: 'Couple non trouvé' };
    }

    // Insérer la conversation dans Supabase
    // couple_id doit être le user_id (qui correspond à profiles.id)
    const { data, error } = await supabase
      .from('chatbot_conversations')
      .insert({
        couple_id: couple.user_id, // Utiliser user_id qui correspond à profiles.id
        service_type: serviceType,
        messages: messages as any,
        extracted_criteria: extractedCriteria as any,
        status,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting chatbot conversation:', error);
      return { success: false, error: error.message || 'Erreur lors de la sauvegarde' };
    }

    return { success: true, conversationId: data.id };
  } catch (error: any) {
    console.error('Error saving chatbot conversation:', error);
    return { success: false, error: error.message || 'Erreur lors de la sauvegarde' };
  }
}

/**
 * Récupère toutes les conversations sauvegardées d'un couple
 * @param coupleId - L'ID du couple depuis la table couples (sera converti en user_id pour la requête)
 */
export async function getChatbotConversations(
  coupleId: string
): Promise<ChatbotConversation[]> {
  try {
    const supabase = createClient();
    
    // Vérifier que l'utilisateur est authentifié
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    // Vérifier que l'utilisateur correspond au couple_id
    // couple_id dans chatbot_conversations pointe vers profiles(id), qui correspond à couples.user_id
    const { data: couple } = await supabase
      .from('couples')
      .select('id, user_id')
      .eq('user_id', user.id)
      .eq('id', coupleId)
      .single();

    if (!couple) {
      return [];
    }

    // Récupérer les conversations depuis Supabase
    // couple_id dans la table correspond à user_id (profiles.id)
    const { data, error } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('couple_id', couple.user_id) // Utiliser user_id qui correspond à profiles.id
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting chatbot conversations:', error);
      return [];
    }

    return (data || []).map(conv => ({
      id: conv.id,
      couple_id: conv.couple_id,
      service_type: conv.service_type,
      messages: conv.messages as ChatMessage[],
      extracted_criteria: conv.extracted_criteria as SearchCriteria | null,
      status: conv.status as 'in_progress' | 'completed' | 'abandoned',
      created_at: conv.created_at,
      updated_at: conv.updated_at,
    }));
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
    const supabase = createClient();
    
    // Vérifier que l'utilisateur est authentifié
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    // Récupérer la conversation depuis Supabase
    const { data, error } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Conversation non trouvée
        return null;
      }
      console.error('Error getting chatbot conversation:', error);
      return null;
    }

    // Vérifier que l'utilisateur a accès à cette conversation
    // couple_id dans chatbot_conversations pointe vers profiles(id), qui correspond à couples.user_id
    const { data: couple } = await supabase
      .from('couples')
      .select('id, user_id')
      .eq('user_id', user.id)
      .eq('user_id', data.couple_id) // couple_id correspond à user_id (profiles.id)
      .single();

    if (!couple) {
      return null;
    }

    return {
      id: data.id,
      couple_id: data.couple_id,
      service_type: data.service_type,
      messages: data.messages as ChatMessage[],
      extracted_criteria: data.extracted_criteria as SearchCriteria | null,
      status: data.status as 'in_progress' | 'completed' | 'abandoned',
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('Error getting chatbot conversation:', error);
    return null;
  }
}

/**
 * Met à jour une conversation existante
 */
export async function updateChatbotConversation(
  conversationId: string,
  updates: {
    messages?: ChatMessage[];
    extracted_criteria?: Partial<SearchCriteria>;
    status?: 'in_progress' | 'completed' | 'abandoned';
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    // Vérifier que l'utilisateur est authentifié
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    // Vérifier que l'utilisateur a accès à cette conversation
    const conversation = await getChatbotConversation(conversationId);
    if (!conversation) {
      return { success: false, error: 'Conversation non trouvée ou accès refusé' };
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (updates.messages !== undefined) {
      updateData.messages = updates.messages as any;
    }
    if (updates.extracted_criteria !== undefined) {
      updateData.extracted_criteria = updates.extracted_criteria as any;
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }

    // Mettre à jour la conversation dans Supabase
    const { error } = await supabase
      .from('chatbot_conversations')
      .update(updateData)
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating chatbot conversation:', error);
      return { success: false, error: error.message || 'Erreur lors de la mise à jour' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating chatbot conversation:', error);
    return { success: false, error: error.message || 'Erreur lors de la mise à jour' };
  }
}

/**
 * Supprime une conversation sauvegardée
 */
export async function deleteChatbotConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    // Vérifier que l'utilisateur est authentifié
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    // Vérifier que l'utilisateur a accès à cette conversation
    const conversation = await getChatbotConversation(conversationId);
    if (!conversation) {
      return { success: false, error: 'Conversation non trouvée ou accès refusé' };
    }

    // Supprimer la conversation depuis Supabase
    const { error } = await supabase
      .from('chatbot_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      console.error('Error deleting chatbot conversation:', error);
      return { success: false, error: error.message || 'Erreur lors de la suppression' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting chatbot conversation:', error);
    return { success: false, error: error.message || 'Erreur lors de la suppression' };
  }
}
