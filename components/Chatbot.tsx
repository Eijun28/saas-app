'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Trash2, Wifi, WifiOff } from 'lucide-react';
import {
  saveMessage,
  getConversationHistory,
  clearConversationHistory,
  getOrCreateSessionId,
  syncLocalToSupabase,
  getConversationStats,
  type Message,
} from '@/lib/supabase/conversations';
import { getCurrentCoupleProfile } from '@/lib/supabase/queries/couples.queries';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ChatMessage as ChatbotChatMessage } from '@/types/chatbot';


interface ChatMessage extends Message {
  timestamp: Date;
  synced?: boolean; // Indique si sauvegardé dans Supabase
}


export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'offline'>('synced');
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [coupleProfile, setCoupleProfile] = useState<any>(null);
  const isMobile = useIsMobile();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  
  useEffect(() => {
    // Générer ou récupérer session ID
    const session = getOrCreateSessionId();
    setSessionId(session);
    
    // Charger historique
    loadHistory(session);
    
    // Charger le profil couple si disponible
    loadCoupleProfile();
    
    // Détecter online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Sync périodique (toutes les 30 secondes si online)
    syncIntervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        syncInBackground(session);
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  const loadCoupleProfile = async () => {
    try {
      const profile = await getCurrentCoupleProfile();
      if (profile) {
        setCoupleProfile({
          cultures: [], // Les cultures sont stockées comme IDs dans preferences, pas directement accessibles
          wedding_date: profile.wedding_date,
          wedding_location: profile.wedding_location || null,
          budget_min: profile.budget_min,
          budget_max: profile.budget_max,
          guest_count: profile.guest_count,
        });
      }
    } catch (error) {
      // L'utilisateur n'est peut-être pas connecté ou n'est pas un couple
      console.log('Profil couple non disponible');
    }
  };
  
  
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  
  const loadHistory = async (session: string) => {
    try {
      const result = await getConversationHistory(session);
      
      if (result.success && result.messages.length > 0) {
        setMessages(result.messages as ChatMessage[]);
        
        
        // Si chargé depuis localStorage, indiquer sync pending
        if (result.source === 'localStorage') {
          setSyncStatus('pending');
        } else {
          setSyncStatus('synced');
        }
      } else {
        // Aucun historique → Message de bienvenue
        const welcomeMessage: ChatMessage = {
          session_id: session,
          role: 'assistant',
          content: "Bonjour ! 👋 Comment puis-je vous aider avec NUPLY ?",
          timestamp: new Date(),
          synced: false,
        };
        setMessages([welcomeMessage]);
      }
      
    } catch (error) {
      
      // Message d'erreur convivial
      const errorMessage: ChatMessage = {
        session_id: session,
        role: 'assistant',
        content: "Désolé, une erreur s'est produite lors du chargement de l'historique. Vous pouvez continuer la conversation normalement.",
        timestamp: new Date(),
        synced: false,
      };
      setMessages([errorMessage]);
    }
  };
  
  
  const syncInBackground = async (session: string) => {
    if (!navigator.onLine) return;
    
    try {
      const result = await syncLocalToSupabase(session);
      
      if (result.synced > 0) {
        setSyncStatus('synced');
      }
      
      if (result.failed > 0) {
        setSyncStatus('pending');
      }
      
    } catch (error) {
      setSyncStatus('offline');
    }
  };
  
  
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const messageContent = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    
    const userMessage: ChatMessage = {
      session_id: sessionId,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      synced: false,
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const saveResult = await saveMessage({
        session_id: sessionId,
        role: 'user',
        content: messageContent,
      });
      
      // Mettre à jour statut sync
      if (saveResult.savedInSupabase) {
        setSyncStatus('synced');
        // Marquer message comme synced
        setMessages(prev =>
          prev.map(msg =>
            msg.content === messageContent && msg.role === 'user'
              ? { ...msg, synced: true }
              : msg
          )
        );
      } else {
        setSyncStatus('pending');
      }
      
      // Convertir les messages au format attendu par l'API
      const apiMessages: ChatbotChatMessage[] = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'bot' : 'user',
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
      }));
      
      // Ajouter le nouveau message
      apiMessages.push({
        role: 'user',
        content: messageContent,
        timestamp: new Date().toISOString(),
      });
      
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          service_type: serviceType || 'non spécifié',
          couple_profile: coupleProfile,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // La nouvelle API retourne { message, extracted_data, next_action }
      const botResponse = data.message || data.response || "Désolé, je n'ai pas pu générer de réponse.";
      
      // Mettre à jour le service_type si extrait des données
      if (data.extracted_data?.service_type && !serviceType) {
        setServiceType(data.extracted_data.service_type);
      }
      
      const assistantMessage: ChatMessage = {
        session_id: sessionId,
        role: 'assistant',
        content: botResponse,
        timestamp: new Date(),
        synced: false,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      const assistantSaveResult = await saveMessage({
        session_id: sessionId,
        role: 'assistant',
        content: botResponse,
      });
      
      // Mettre à jour statut sync
      if (assistantSaveResult.savedInSupabase) {
        setSyncStatus('synced');
        setMessages(prev =>
          prev.map(msg =>
            msg.content === botResponse && msg.role === 'assistant'
              ? { ...msg, synced: true }
              : msg
          )
        );
      } else {
        setSyncStatus('pending');
      }
      
    } catch (error) {
      
      // Message d'erreur convivial
      const errorMessage: ChatMessage = {
        session_id: sessionId,
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Veuillez réessayer dans quelques instants.",
        timestamp: new Date(),
        synced: false,
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Indiquer offline si erreur réseau
      if (!navigator.onLine) {
        setIsOnline(false);
        setSyncStatus('offline');
      }
      
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const handleClearHistory = async () => {
    if (!confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
      return;
    }
    
    try {
      const result = await clearConversationHistory(sessionId);
      
      if (result.success) {
        // Message de bienvenue
        const welcomeMessage: ChatMessage = {
          session_id: sessionId,
          role: 'assistant',
          content: "Bonjour ! 👋 Comment puis-je vous aider avec NUPLY ?",
          timestamp: new Date(),
          synced: false,
        };
        
        setMessages([welcomeMessage]);
        setSyncStatus('synced');
        
      }
      
    } catch (error) {
      toast.error('Erreur lors de l\'effacement de l\'historique');
    }
  };
  
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  
  return (
    <>
      {/* BOUTON FLOTTANT */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="nuply-chatbot-button fixed rounded-full text-[#8B7355] shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center z-[9998]"
          style={{
            background: '#E6D5BE',
            boxShadow: '0 20px 25px -5px rgba(180, 160, 130, 0.35), 0 10px 10px -5px rgba(180, 160, 130, 0.25)',
            right: isMobile ? '16px' : '24px',
            bottom: isMobile ? 'calc(72px + env(safe-area-inset-bottom))' : '24px', // Éviter la barre de navigation mobile
            position: 'fixed',
            left: 'auto',
            top: 'auto',
            height: isMobile ? '56px' : '64px',
            width: isMobile ? '56px' : '64px',
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(180, 160, 130, 0.5), 0 10px 10px -5px rgba(180, 160, 130, 0.35)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(180, 160, 130, 0.35), 0 10px 10px -5px rgba(180, 160, 130, 0.25)'
            }
          }}
          aria-label="Ouvrir le chatbot"
        >
          <MessageCircle className={isMobile ? "h-6 w-6" : "h-7 w-7"} />
          
          {/* Badge notification si non synced */}
          {syncStatus === 'pending' && (
            <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-yellow-500 rounded-full border-2 border-white" />
          )}
        </button>
      )}
      
      {/* WIDGET CHATBOT */}
      {isOpen && (
        <>
          <div
            className={`nuply-chatbot-widget fixed bg-white shadow-2xl flex flex-col z-[9998] rounded-2xl ${
              isMobile
                ? 'left-3 right-3'
                : 'w-[380px] right-6'
            }`}
            style={isMobile ? {
              bottom: 'calc(64px + env(safe-area-inset-bottom))',
              height: 'min(540px, calc(100dvh - 100px))',
              animation: 'slideInUp 0.25s ease-out',
            } : {
              bottom: '24px',
              height: '600px',
              animation: 'slideInUp 0.3s ease-out',
            }}
          >
          
          {/* HEADER */}
          <div className={`text-white flex items-center justify-between ${isMobile ? 'p-3' : 'p-4 rounded-t-2xl'}`} style={{ background: 'linear-gradient(135deg, #823F91 0%, #c081e3 50%, #9333ea 100%)' }}>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full bg-white/20 flex items-center justify-center font-bold text-white shrink-0`}>
                N
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={`font-semibold text-white truncate ${isMobile ? 'text-sm' : ''}`} style={{ color: 'rgba(255, 255, 255, 1)' }}>NUPLY Assistant</h3>
                <div className={`flex items-center gap-1 sm:gap-2 ${isMobile ? 'text-[10px]' : 'text-xs'} text-white/80`}>
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-400 rounded-full animate-pulse shrink-0" />
                  <span className="truncate">En ligne</span>
                  
                  {/* Indicateur sync */}
                  {syncStatus === 'pending' && (
                    <span className="ml-1 sm:ml-2 flex items-center gap-0.5 sm:gap-1 shrink-0">
                      <WifiOff className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                      {!isMobile && <span>Sync en attente</span>}
                    </span>
                  )}
                  {syncStatus === 'offline' && (
                    <span className="ml-1 sm:ml-2 flex items-center gap-0.5 sm:gap-1 shrink-0">
                      <WifiOff className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                      {!isMobile && <span>Hors ligne</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Bouton effacer */}
              <button
                onClick={handleClearHistory}
                className={`text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors ${isMobile ? 'p-1.5' : 'p-2'}`}
                title="Effacer l'historique"
              >
                <Trash2 className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
              </button>
              
              {/* Bouton fermer */}
              <button
                onClick={() => setIsOpen(false)}
                className={`text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors ${isMobile ? 'p-1.5' : 'p-2'}`}
                aria-label="Fermer"
              >
                <X className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
              </button>
            </div>
          </div>
          
          {/* MESSAGES */}
          <div className={`flex-1 overflow-y-auto bg-gray-50 ${isMobile ? 'p-3 space-y-3' : 'p-4 space-y-4'}`}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`${isMobile ? 'max-w-[85%] rounded-xl px-3 py-1.5' : 'max-w-[80%] rounded-2xl px-4 py-2'} ${
                    message.role === 'user'
                      ? 'text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                  style={message.role === 'user' ? { background: 'linear-gradient(135deg, #823F91 0%, #c081e3 50%, #9333ea 100%)' } : {}}
                >
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} leading-relaxed whitespace-pre-wrap`}>
                    {message.content}
                  </p>
                  
                  <div className={`flex items-center justify-between ${isMobile ? 'mt-0.5 gap-1' : 'mt-1 gap-2'}`}>
                    <span
                      className={`${isMobile ? 'text-[10px]' : 'text-xs'} ${
                        message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    
                    {/* Indicateur sync */}
                    {message.role === 'user' && (
                      <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-white/70`}>
                        {message.synced ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Indicateur de chargement */}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`bg-white border border-gray-200 ${isMobile ? 'rounded-xl px-3 py-2' : 'rounded-2xl px-4 py-3'}`}>
                  <div className="flex gap-1">
                    <div className={`${isMobile ? 'h-1.5 w-1.5' : 'h-2 w-2'} bg-gray-400 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
                    <div className={`${isMobile ? 'h-1.5 w-1.5' : 'h-2 w-2'} bg-gray-400 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
                    <div className={`${isMobile ? 'h-1.5 w-1.5' : 'h-2 w-2'} bg-gray-400 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* INPUT */}
          <div className={`border-t border-gray-200 bg-white ${isMobile ? 'p-3' : 'p-4'} ${!isMobile && 'rounded-b-2xl'}`}>
            <div className={`flex ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                disabled={isLoading}
                className={`flex-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
                }`}
                style={{ '--tw-ring-color': '#823F91' } as React.CSSProperties}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(130, 63, 145, 0.5)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                }}
              />
              
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className={`rounded-full text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-95 transition-all ${
                  isMobile ? 'h-9 w-9' : 'h-10 w-10'
                }`}
                style={{ background: 'linear-gradient(135deg, #823F91 0%, #c081e3 50%, #9333ea 100%)' }}
                aria-label="Envoyer"
              >
                <Send className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
              </button>
            </div>
            
            {/* Indicateur offline */}
            {!isOnline && (
              <div className={`mt-2 ${isMobile ? 'text-[10px]' : 'text-xs'} text-orange-600 flex items-center gap-1`}>
                <WifiOff className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
                <span className={isMobile ? 'line-clamp-1' : ''}>Mode hors ligne - Les messages seront synchronisés plus tard</span>
              </div>
            )}
          </div>
        </div>
        </>
      )}
    </>
  );
}
