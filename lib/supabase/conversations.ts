
export interface Message {
  id?: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  user_id?: string | null;
  created_at?: string;
  timestamp?: Date;
}

export interface ConversationSyncResult {
  success: boolean;
  source: 'supabase' | 'localStorage' | 'empty';
  messages: Message[];
  error?: string;
}


const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 seconde
  TIMEOUT: 5000, // 5 secondes
  MAX_MESSAGES: 100, // Limite par session
  STORAGE_KEY: 'nuply_chat_history',
  SESSION_KEY: 'nuply_chat_session',
  LAST_SYNC_KEY: 'nuply_last_sync',
};

export async function saveMessage(
  message: Omit<Message, 'id' | 'created_at'>
): Promise<{ success: boolean; savedInSupabase: boolean }> {
  const messageWithTimestamp = {
    ...message,
    timestamp: new Date(),
  };
  
  try {
    const history = getLocalHistory();
    const updatedHistory = [...history, messageWithTimestamp];
    
    // Limiter nombre de messages
    const limitedHistory = updatedHistory.slice(-CONFIG.MAX_MESSAGES);
    
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    return { success: false, savedInSupabase: false };
  }

  // Messagerie/demandes supprimées : on ne persiste plus dans Supabase ici.
  // Le chatbot conserve uniquement un historique local (localStorage).
  return { success: true, savedInSupabase: false };
}


export async function getConversationHistory(
  sessionId: string
): Promise<ConversationSyncResult> {
  const localMessages = getLocalHistory();

  if (localMessages.length === 0) {
    return { success: true, source: 'empty', messages: [] };
  }

  return { success: true, source: 'localStorage', messages: localMessages };
}


export async function clearConversationHistory(
  sessionId: string
): Promise<{ success: boolean; clearedSupabase: boolean }> {
  
  try {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
  } catch (error) {
    return { success: false, clearedSupabase: false };
  }

  // On ne supprime rien côté Supabase (chatbot en localStorage only).
  return { success: true, clearedSupabase: false };
}


export async function syncLocalToSupabase(
  sessionId: string
): Promise<{ synced: number; failed: number }> {

  // Désactivé : pas de persistance Supabase pour le chatbot tant que l’archi messagerie est remise à zéro.
  void sessionId;
  return { synced: 0, failed: 0 };
}


function getLocalHistory(): Message[] {
  try {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!saved) return [];
    
    const parsed = JSON.parse(saved);
    
    // Valider format
    if (!Array.isArray(parsed)) return [];
    
    return parsed.map(msg => ({
      ...msg,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
    }));
    
  } catch (error) {
    return [];
  }
}

function updateLastSyncTime(): void {
  try {
    localStorage.setItem(CONFIG.LAST_SYNC_KEY, new Date().toISOString());
  } catch (error) {
  }
}


export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${random}${random2}`;
}

export function getOrCreateSessionId(): string {
  try {
    let sessionId = localStorage.getItem(CONFIG.SESSION_KEY);
    
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem(CONFIG.SESSION_KEY, sessionId);
    }
    
    return sessionId;
  } catch (error) {
    // Fallback : session ID temporaire (pas persisté)
    return generateSessionId();
  }
}


export async function getConversationStats(sessionId: string): Promise<{
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  lastSync: string | null;
  hasSupabaseBackup: boolean;
}> {
  const localMessages = getLocalHistory();
  const lastSync = localStorage.getItem(CONFIG.LAST_SYNC_KEY);

  // Pas de backup Supabase pour le chatbot (voir commentaire dans saveMessage).
  void sessionId;

  return {
    totalMessages: localMessages.length,
    userMessages: localMessages.filter(m => m.role === 'user').length,
    assistantMessages: localMessages.filter(m => m.role === 'assistant').length,
    lastSync,
    hasSupabaseBackup: false,
  };
}

export { CONFIG };

