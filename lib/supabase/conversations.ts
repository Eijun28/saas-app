
import { createClient } from '@/lib/supabase/client';


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


async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = CONFIG.MAX_RETRIES
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Exponential backoff
      const delay = CONFIG.RETRY_DELAY * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries reached');
}


async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = CONFIG.TIMEOUT
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}


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
  
  let savedInSupabase = false;
  
  // Vérifier si Supabase est configuré
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Pas de configuration Supabase, c'est normal
    return { success: true, savedInSupabase: false };
  }
  
  try {
    await withTimeout(
      withRetry(async () => {
        const supabase = createClient();
        
        const { error } = await supabase
          .from('conversations')
          .insert({
            session_id: message.session_id,
            role: message.role,
            content: message.content,
            user_id: message.user_id || null,
          });
        
        if (error) {
          // Si la table n'existe pas, c'est normal (pas une erreur)
          if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
            return; // Sortir silencieusement
          }
          throw error;
        }
      })
    );
    
    savedInSupabase = true;
    updateLastSyncTime();
    
  } catch (error) {
    // En développement, logger l'erreur
    // En production, ignorer silencieusement (le message est déjà dans localStorage)
    // Pas grave, le message est dans localStorage
  }
  
  return { success: true, savedInSupabase };
}


export async function getConversationHistory(
  sessionId: string
): Promise<ConversationSyncResult> {
  
  const localMessages = getLocalHistory();
  
  try {
    // Vérifier si les variables d'environnement sont présentes
    if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // En développement, on peut logger, en production on passe silencieusement
      return {
        success: true,
        source: 'localStorage',
        messages: localMessages,
      };
    }

    const supabaseMessages = await withTimeout(
      withRetry(async () => {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('conversations')
          .select('id, session_id, role, content, created_at')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
          .limit(CONFIG.MAX_MESSAGES);
        
        if (error) {
          // Détecter si la table n'existe pas
          if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
            return [];
          }
          throw error;
        }
        return data || [];
      })
    );
    
    // Si aucun message en Supabase, utiliser localStorage
    if (supabaseMessages.length === 0 && localMessages.length > 0) {
      return {
        success: true,
        source: 'localStorage',
        messages: localMessages,
      };
    }
    
    // Formater messages Supabase
    const formattedSupabase = supabaseMessages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.created_at),
    }));
    
    updateLastSyncTime();
    
    if (formattedSupabase.length > localMessages.length) {
      // Supabase a plus de messages → Mettre à jour localStorage
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(formattedSupabase));
      
      return {
        success: true,
        source: 'supabase',
        messages: formattedSupabase,
      };
    } else {
      // localStorage est à jour
      return {
        success: true,
        source: 'localStorage',
        messages: localMessages,
      };
    }
    
  } catch (error) {
    // En développement, logger l'erreur complète
    // En production, seulement un avertissement silencieux
    
    // Fallback sur localStorage (comportement normal, pas une erreur critique)
    return {
      success: true,
      source: 'localStorage',
      messages: localMessages,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


export async function clearConversationHistory(
  sessionId: string
): Promise<{ success: boolean; clearedSupabase: boolean }> {
  
  try {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
  } catch (error) {
    return { success: false, clearedSupabase: false };
  }
  
  let clearedSupabase = false;
  
  try {
    await withTimeout(
      withRetry(async () => {
        const supabase = createClient();
        
        const { error } = await supabase
          .from('conversations')
          .delete()
          .eq('session_id', sessionId);
        
        if (error) throw error;
      })
    );
    
    clearedSupabase = true;
    
  } catch (error) {
  }
  
  return { success: true, clearedSupabase };
}


export async function syncLocalToSupabase(
  sessionId: string
): Promise<{ synced: number; failed: number }> {
  
  const localMessages = getLocalHistory();
  
  if (localMessages.length === 0) {
    return { synced: 0, failed: 0 };
  }
  
  let synced = 0;
  let failed = 0;
  
  // Vérifier si Supabase est configuré
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { synced: 0, failed: 0 };
  }
  
  try {
    const supabase = createClient();
    
    // Récupérer messages déjà en BDD
    const { data: existingMessages, error: selectError } = await supabase
      .from('conversations')
      .select('content, role')
      .eq('session_id', sessionId);
    
    // Si la table n'existe pas, retourner silencieusement
    if (selectError) {
      if (selectError.code === 'PGRST116' || selectError.message?.includes('does not exist')) {
        return { synced: 0, failed: 0 };
      }
      throw selectError;
    }
    
    // Créer Set pour comparaison rapide
    const existingSet = new Set(
      existingMessages?.map(msg => `${msg.role}:${msg.content}`) || []
    );
    
    // Insérer seulement les nouveaux
    for (const msg of localMessages) {
      const key = `${msg.role}:${msg.content}`;
      
      if (!existingSet.has(key)) {
        try {
          const { error: insertError } = await supabase
            .from('conversations')
            .insert({
              session_id: sessionId,
              role: msg.role,
              content: msg.content,
            });
          
          if (insertError) {
            // Si erreur de table manquante, arrêter la boucle
            if (insertError.code === 'PGRST116' || insertError.message?.includes('does not exist')) {
              break;
            }
            throw insertError;
          }
          
          synced++;
        } catch (error) {
          // En développement seulement
          failed++;
        }
      }
    }
    
    if (synced > 0) {
      updateLastSyncTime();
    }
    
  } catch (error) {
    // En développement seulement
    failed = localMessages.length;
  }
  
  return { synced, failed };
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
  
  // Vérifier si backup Supabase existe
  let hasSupabaseBackup = false;
  try {
    const supabase = createClient();
    const { count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);
    
    hasSupabaseBackup = (count || 0) > 0;
  } catch (error) {
  }
  
  return {
    totalMessages: localMessages.length,
    userMessages: localMessages.filter(m => m.role === 'user').length,
    assistantMessages: localMessages.filter(m => m.role === 'assistant').length,
    lastSync,
    hasSupabaseBackup,
  };
}

export { CONFIG };

