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
import { toast } from 'sonner';


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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  
  useEffect(() => {
    // Générer ou récupérer session ID
    const session = getOrCreateSessionId();
    setSessionId(session);
    
    // Charger historique
    loadHistory(session);
    
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
      
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          sessionId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const assistantMessage: ChatMessage = {
        session_id: sessionId,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        synced: false,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      const assistantSaveResult = await saveMessage({
        session_id: sessionId,
        role: 'assistant',
        content: data.response,
      });
      
      // Mettre à jour statut sync
      if (assistantSaveResult.savedInSupabase) {
        setSyncStatus('synced');
        setMessages(prev =>
          prev.map(msg =>
            msg.content === data.response && msg.role === 'assistant'
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
          className="nuply-chatbot-button fixed h-16 w-16 rounded-full text-white shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center z-[9999]"
          style={{
            background: 'linear-gradient(135deg, #823F91 0%, #c081e3 50%, #9333ea 100%)',
            boxShadow: '0 20px 25px -5px rgba(130, 63, 145, 0.4), 0 10px 10px -5px rgba(130, 63, 145, 0.3)',
            right: '24px',
            bottom: '24px',
            position: 'fixed',
            left: 'auto',
            top: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(130, 63, 145, 0.6), 0 10px 10px -5px rgba(130, 63, 145, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(130, 63, 145, 0.4), 0 10px 10px -5px rgba(130, 63, 145, 0.3)'
          }}
          aria-label="Ouvrir le chatbot"
        >
          <MessageCircle className="h-7 w-7" />
          
          {/* Badge notification si non synced */}
          {syncStatus === 'pending' && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-500 rounded-full border-2 border-white" />
          )}
        </button>
      )}
      
      {/* WIDGET CHATBOT */}
      {isOpen && (
        <div 
          className="nuply-chatbot-widget fixed w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-[9999]"
          style={{ 
            right: '24px', 
            bottom: '24px',
            left: 'auto',
            top: 'auto',
            position: 'fixed',
            animation: 'slideInUp 0.3s ease-out',
            transform: 'translateY(0)',
            opacity: 1
          }}
        >
          
          {/* HEADER */}
          <div className="text-white p-4 rounded-t-2xl flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #823F91 0%, #c081e3 50%, #9333ea 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
                N
              </div>
              <div>
                <h3 className="font-semibold text-white" style={{ color: 'rgba(255, 255, 255, 1)' }}>NUPLY Assistant</h3>
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                  <span>En ligne</span>
                  
                  {/* Indicateur sync */}
                  {syncStatus === 'pending' && (
                    <span className="ml-2 flex items-center gap-1">
                      <WifiOff className="h-3 w-3" />
                      <span>Sync en attente</span>
                    </span>
                  )}
                  {syncStatus === 'offline' && (
                    <span className="ml-2 flex items-center gap-1">
                      <WifiOff className="h-3 w-3" />
                      <span>Hors ligne</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Bouton effacer */}
              <button
                onClick={handleClearHistory}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded transition-colors"
                title="Effacer l'historique"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              
              {/* Bouton fermer */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded transition-colors"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                  style={message.role === 'user' ? { background: 'linear-gradient(135deg, #823F91 0%, #c081e3 50%, #9333ea 100%)' } : {}}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  
                  <div className="flex items-center justify-between mt-1 gap-2">
                    <span
                      className={`text-xs ${
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
                      <span className="text-xs text-white/70">
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
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* INPUT */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                className="h-10 w-10 rounded-full text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                style={{ background: 'linear-gradient(135deg, #823F91 0%, #c081e3 50%, #9333ea 100%)' }}
                aria-label="Envoyer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            
            {/* Indicateur offline */}
            {!isOnline && (
              <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                <span>Mode hors ligne - Les messages seront synchronisés plus tard</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
