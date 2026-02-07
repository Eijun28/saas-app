'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowUp, Sparkles, Search, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useChatbot } from '@/hooks/useChatbot';
import { getCurrentCoupleProfile } from '@/lib/supabase/queries/couples.queries';
import { saveChatbotConversation, getChatbotConversations } from '@/lib/supabase/chatbot-conversations';
import { ChatMessage, SearchCriteria, ChatbotConversation } from '@/types/chatbot';
import { MatchingResult } from '@/types/matching';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import MatchResults from '@/components/matching/MatchResults';

type Vue = 'landing' | 'chat' | 'validation' | 'results';

export default function MatchingPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [vue, setVue] = useState<Vue>('landing');
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [coupleProfile, setCoupleProfile] = useState<any>(null);
  const [userInput, setUserInput] = useState('');
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [matchingResults, setMatchingResults] = useState<MatchingResult | null>(null);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [savedConversations, setSavedConversations] = useState<ChatbotConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [chatKey, setChatKey] = useState(0); // Key pour forcer le remontage du composant chat
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Initialiser le hook useChatbot sans serviceType
  const { messages, extractedCriteria, isLoading, sendMessage, extractedServiceType, resetChat } = useChatbot(
    undefined,
    coupleProfile
  );

  // Ref pour vérifier si le composant est monté
  const isMountedRef = useRef(true);

  // Fonction pour charger le profil couple
  const loadCoupleProfile = async () => {
    try {
      const profile = await getCurrentCoupleProfile();
      // Vérifier que le composant est toujours monté avant de mettre à jour l'état
      if (!isMountedRef.current) return;
      
      if (profile) {
        setCoupleId(profile.id);
        const avatarUrl = (profile as any).avatar_url || null;
        // Debug: afficher l'URL de l'avatar dans la console
        if (avatarUrl) {
          console.log('✅ Avatar trouvé:', avatarUrl);
        } else {
          console.log('⚠️ Aucun avatar trouvé dans le profil');
        }
        setCoupleProfile({
          partner_1_name: profile.partner_1_name,
          partner_2_name: profile.partner_2_name,
          avatar_url: avatarUrl,
          cultures: (profile as any).cultures || [],
          wedding_date: (profile as any).wedding_date,
          wedding_location: (profile as any).wedding_city || (profile as any).wedding_region || null,
          budget_min: (profile as any).budget_min,
          budget_max: (profile as any).budget_max,
          guest_count: (profile as any).guest_count,
        });
      }
    } catch (error) {
      console.log('Profil couple non disponible');
    }
  };

  // Charger le profil couple au montage
  useEffect(() => {
    isMountedRef.current = true;
    loadCoupleProfile();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Charger les conversations sauvegardées au montage et quand coupleId change
  useEffect(() => {
    if (coupleId) {
      loadSavedConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId]);

  // Auto-scroll vers le bas à chaque nouveau message
  useEffect(() => {
    if (vue === 'chat' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, vue]);

  // Auto-resize textarea (style Claude - s'agrandit avec le contenu)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // Limite max à 200px (environ 8-9 lignes)
      const maxHeight = 200;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      
      // Scroll vers le bas si nécessaire
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [userInput]);

  // Redirection si non connecté (APRÈS tous les hooks)
	if (!userLoading && !user) {
    router.push('/sign-in');
    return null;
	}

	if (userLoading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="size-8 text-[#823F91] animate-spin" />
      </div>
    );
  }

  const startMatching = () => {
    // Incrémenter la clé pour forcer le remontage et réinitialiser les messages
    setChatKey(prev => prev + 1);
    setVue('chat');
  };

  const handleGoBack = () => {
    // Si conversation en cours, demander confirmation
    if (messages.length > 1) {
      setShowBackDialog(true);
    } else {
      setVue('landing');
    }
  };

  const confirmGoBack = () => {
    setShowBackDialog(false);
    setVue('landing');
    setUserInput('');
    // Réinitialiser complètement le chat
    resetChat();
    setMatchingResults(null);
    setMatchingError(null);
    setConversationId(null);
    // Forcer le remontage pour réinitialiser les messages
    setChatKey(prev => prev + 1);
  };

  const handleSend = async () => {
    if (!userInput.trim() || isLoading) return;

    const message = userInput.trim();
    setUserInput('');

    const nextAction = await sendMessage(message);

    // Si l'IA indique qu'on peut valider, passer à l'étape validation
    if (nextAction === 'validate') {
      // Sauvegarder automatiquement la conversation avant de passer à la validation
      if (coupleId && extractedServiceType) {
        try {
          await handleSaveConversation();
        } catch (error) {
          console.error('Erreur sauvegarde conversation:', error);
          // Ne pas bloquer le passage à la validation même si la sauvegarde échoue
        }
      }
      setVue('validation');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleModifyCriteria = () => {
    setVue('chat');
  };

  const handleSaveConversation = async () => {
    if (!coupleId || !extractedServiceType) {
      toast.error('Impossible de sauvegarder : informations manquantes');
      return;
    }

    // Vérifier que le couple existe avant de sauvegarder
    if (!coupleProfile) {
      toast.error('Profil couple non chargé. Veuillez rafraîchir la page.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveChatbotConversation(
        coupleId,
        extractedServiceType,
        messages,
        extractedCriteria,
        'completed'
      );

      if (result.success) {
        toast.success('Recherche sauvegardée avec succès !');
        // Stocker l'ID de conversation si disponible
        if (result.conversationId) {
          setConversationId(result.conversationId);
        }
      } else {
        console.error('Erreur sauvegarde conversation:', result.error);
        toast.error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error: any) {
      console.error('Error saving conversation:', error);
      toast.error(error?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const startMatchingSearch = async () => {
    setIsMatchingLoading(true);
    setMatchingError(null);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Non authentifié');
      }

      if (!coupleId) {
        throw new Error('Profil couple non trouvé');
      }

      if (!extractedCriteria || Object.keys(extractedCriteria).length === 0) {
        throw new Error('Aucun critère de recherche disponible');
      }

      const response = await fetch('/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couple_id: coupleId,
          conversation_id: conversationId || undefined,
          search_criteria: extractedCriteria,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Erreur lors du matching');
      }

      const data: MatchingResult = await response.json();
      setMatchingResults(data);
      setVue('results');
      toast.success('Matching terminé avec succès !');
    } catch (error: any) {
      console.error('Error starting matching search:', error);
      const errorMessage = error.message || 'Erreur lors du matching';
      setMatchingError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsMatchingLoading(false);
    }
  };

  const handleLaunchMatching = async () => {
    // Sauvegarder automatiquement avant de lancer le matching
    if (coupleId && extractedServiceType) {
      await handleSaveConversation();
    }
    
    // Lancer le matching
    await startMatchingSearch();
  };

  const handleNewSearch = () => {
    // Reset tous les états pour une nouvelle recherche
    setVue('landing');
    setMatchingResults(null);
    setMatchingError(null);
    setConversationId(null);
    setUserInput('');
    // Réinitialiser complètement le chat
    resetChat();
    // Forcer le remontage du composant ChatView pour réinitialiser les messages
    setChatKey(prev => prev + 1);
  };

  const loadSavedConversations = async () => {
    if (!coupleId || !isMountedRef.current) return;
    
    setLoadingConversations(true);
    try {
      const conversations = await getChatbotConversations(coupleId);
      // Vérifier que le composant est toujours monté avant de mettre à jour l'état
      if (!isMountedRef.current) return;
      setSavedConversations(conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      if (isMountedRef.current) {
        toast.error('Erreur lors du chargement des conversations');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingConversations(false);
      }
    }
  };

  const handleOpenConversations = () => {
    loadSavedConversations();
  };

  const handleSelectConversation = (conversation: ChatbotConversation) => {
    // TODO: Charger la conversation sélectionnée
    toast.info('Fonctionnalité de reprise de conversation à venir');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-purple-50">
      <AnimatePresence mode="wait">
        {vue === 'landing' && (
          <LandingView 
            key="landing" 
            onStart={startMatching}
            savedConversations={savedConversations}
            loadingConversations={loadingConversations}
            onSelectConversation={handleSelectConversation}
          />
        )}
        
        {vue === 'chat' && (
          <ChatView
            key={`chat-${chatKey}`}
            messages={messages}
            isLoading={isLoading}
            userInput={userInput}
            setUserInput={setUserInput}
            textareaRef={textareaRef}
            messagesEndRef={messagesEndRef}
            messagesContainerRef={messagesContainerRef}
            onSend={handleSend}
            onKeyPress={handleKeyPress}
            onBack={handleGoBack}
            onOpenConversations={handleOpenConversations}
            coupleProfile={coupleProfile}
            savedConversations={savedConversations}
            loadingConversations={loadingConversations}
            onSelectConversation={handleSelectConversation}
          />
        )}

        {vue === 'validation' && (
          <ValidationView
            key="validation"
            criteria={extractedCriteria}
            serviceType={extractedServiceType}
            onBack={handleModifyCriteria}
            onConfirm={handleLaunchMatching}
            onGoToLanding={handleGoBack}
            onSave={handleSaveConversation}
            isSaving={isSaving}
            isMatchingLoading={isMatchingLoading}
            matchingError={matchingError}
          />
        )}

        {vue === 'results' && matchingResults && (
          <ResultsView
            key="results"
            matchingResults={matchingResults}
            onBack={handleNewSearch}
            router={router}
          />
        )}
      </AnimatePresence>

      {/* Dialog de confirmation retour */}
      <Dialog open={showBackDialog} onOpenChange={setShowBackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abandonner cette recherche ?</DialogTitle>
            <DialogDescription>
              Si vous revenez en arrière, votre conversation en cours sera perdue. Êtes-vous sûr de vouloir continuer ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackDialog(false)}>
              Annuler
            </Button>
            <Button variant="default" onClick={confirmGoBack}>
              Abandonner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ============================================
// COMPOSANT LANDING VIEW
// ============================================

interface LandingViewProps {
  onStart: () => void;
  savedConversations: ChatbotConversation[];
  loadingConversations: boolean;
  onSelectConversation: (conversation: ChatbotConversation) => void;
}

function LandingView({ onStart, savedConversations, loadingConversations, onSelectConversation }: LandingViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex-1 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 px-2"
          >
            Nuply Matching
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2"
          >
            Notre IA conversationnelle vous aide à trouver les meilleurs prestataires qui correspondent{' '}
            <span className="font-semibold text-[#823F91]">EXACTEMENT</span> à votre vision.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            Parlez-lui naturellement de vos besoins et elle comprendra votre projet.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Button
              onClick={onStart}
              variant="default"
              size="default"
              className="bg-gradient-to-br from-[#823F91] to-[#9333ea] hover:from-[#9333ea] hover:to-[#823F91] text-white shadow-lg hover:shadow-xl transition-all text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 h-auto w-full sm:w-auto"
            >
              Commencer le matching
            </Button>
          </motion.div>
        </div>

        {/* Section Recherches sauvegardées */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-12 sm:mt-16"
        >
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
            Mes recherches sauvegardées
          </h3>
          
          {loadingConversations ? (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-6 sm:p-8 md:p-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-[#823F91] animate-spin" />
            </div>
          ) : savedConversations.length === 0 ? (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-6 sm:p-8 md:p-12 text-center">
              <div className="text-gray-400 mb-3 sm:mb-4">
                <Search className="h-10 w-10 sm:h-12 sm:w-12 mx-auto opacity-50" />
              </div>
              <p className="text-base sm:text-lg text-gray-500">
                Aucune recherche pour le moment
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Vos recherches intelligentes apparaîtront ici une fois terminées
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {savedConversations.map((conversation) => {
                const criteria = conversation.extracted_criteria;
                const budgetMin = criteria?.budget_min;
                const budgetMax = criteria?.budget_max;
                const budgetText = budgetMin || budgetMax 
                  ? `Budget : ${budgetMin || 0}€ - ${budgetMax || '∞'}€`
                  : 'Budget non spécifié';
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => onSelectConversation(conversation)}
                    className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 hover:border-[#823F91] hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                            {conversation.service_type || 'Recherche'}
                          </h4>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              conversation.status === 'completed'
                                ? 'bg-[#823F91]/15 text-[#6D3478]'
                                : conversation.status === 'in_progress'
                                  ? 'bg-[#9D5FA8]/10 text-[#9D5FA8]'
                                  : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            {conversation.status === 'completed'
                              ? 'Terminée'
                              : conversation.status === 'in_progress'
                                ? 'En cours'
                                : 'Abandonnée'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {budgetText}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(conversation.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
			</div>
    </motion.div>
  );
}

// ============================================
// COMPOSANT CHAT VIEW
// ============================================

interface ChatViewProps {
  messages: ChatMessage[];
  isLoading: boolean;
  userInput: string;
  setUserInput: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onBack: () => void;
  onOpenConversations: () => void;
  coupleProfile: any;
  savedConversations: ChatbotConversation[];
  loadingConversations: boolean;
  onSelectConversation: (conversation: ChatbotConversation) => void;
}

function ChatView({
  messages,
  isLoading,
  userInput,
  setUserInput,
  textareaRef,
  messagesEndRef,
  messagesContainerRef,
  onSend,
  onKeyPress,
  onBack,
  onOpenConversations,
  coupleProfile,
  savedConversations,
  loadingConversations,
  onSelectConversation,
}: ChatViewProps) {
  // Déterminer si on a des messages (plus que le message initial du bot)
  const hasMessages = messages.length > 1;
  
  // State pour gérer les erreurs de chargement d'image du bot
  const [botAvatarError, setBotAvatarError] = useState(false);
  // State pour gérer les erreurs de chargement d'image du couple
  const [coupleAvatarError, setCoupleAvatarError] = useState(false);
  
  // Ref pour vérifier si le composant est monté
  const isMountedRef = useRef(true);

  // Auto-resize textarea amélioré
  useEffect(() => {
    if (textareaRef.current && isMountedRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [userInput]);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (hasMessages && messagesEndRef.current && isMountedRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, hasMessages]);

  // Réinitialiser les erreurs d'avatar quand le profil change
  useEffect(() => {
    // S'assurer que le composant est monté avant de mettre à jour l'état
    if (isMountedRef.current && coupleProfile?.avatar_url !== undefined) {
      setCoupleAvatarError(false);
    }
  }, [coupleProfile?.avatar_url]);
  
  // Nettoyer le ref au démontage
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Message de bienvenue personnalisé
  const getWelcomeMessage = () => {
    if (coupleProfile?.partner_1_name && coupleProfile?.partner_2_name) {
      return `Bonjour ${coupleProfile.partner_1_name} et ${coupleProfile.partner_2_name} !`;
    }
    return 'Bonjour !';
  };

  // Initiales pour l'avatar utilisateur
  const getUserInitials = () => {
    if (coupleProfile?.partner_1_name && coupleProfile?.partner_2_name) {
      return `${coupleProfile.partner_1_name[0]}${coupleProfile.partner_2_name[0]}`.toUpperCase();
    }
    return 'VO';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-[100dvh] sm:h-screen bg-white"
    >
      {/* Header minimaliste */}
      <header className="h-14 bg-white/80 backdrop-blur-sm flex items-center px-3 sm:px-4 flex-shrink-0 z-10">
        <div className="flex items-center justify-between w-full max-w-3xl mx-auto">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100 -ml-1"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center flex-1">
            <span className="font-semibold text-gray-900 text-sm sm:text-base whitespace-nowrap">Nuply Matching</span>
          </div>

          {/* Dropdown menu pour les recherches sauvegardées */}
          <DropdownMenu onOpenChange={(open) => {
            if (open) {
              onOpenConversations();
            }
          }}>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100 text-sm font-medium"
                aria-label="Recherches sauvegardées"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
              <div className="px-2 py-1.5 text-sm font-semibold text-gray-900">
                Recherches sauvegardées
              </div>
              <DropdownMenuSeparator />
              {loadingConversations ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 text-[#823F91] animate-spin" />
                </div>
              ) : savedConversations.length === 0 ? (
                <div className="px-2 py-6 text-center">
                  <Search className="h-8 w-8 text-gray-400 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-gray-500">Aucune recherche pour le moment</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Vos recherches intelligentes apparaîtront ici une fois terminées
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  {savedConversations.map((conversation) => (
                    <DropdownMenuItem
                      key={conversation.id}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                      onClick={() => onSelectConversation(conversation)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-semibold text-gray-900">
                          {conversation.service_type || 'Recherche'}
                        </span>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            conversation.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : conversation.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {conversation.status === 'completed'
                            ? 'Terminée'
                            : conversation.status === 'in_progress'
                              ? 'En cours'
                              : 'Abandonnée'}
                        </span>
                      </div>
                      {conversation.extracted_criteria && (
                        <div className="text-xs text-gray-600 space-y-0.5">
                          {conversation.extracted_criteria.budget_min && (
                            <p>
                              Budget : {conversation.extracted_criteria.budget_min}€
                              {conversation.extracted_criteria.budget_max &&
                                ` - ${conversation.extracted_criteria.budget_max}€`}
                            </p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(conversation.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {!hasMessages ? (
        /* ÉTAT INITIAL - CENTRÉ (style Claude) */
        <div className="flex-1 flex items-start justify-center px-4 pt-12 sm:pt-16">
          <div className="w-full max-w-3xl">
            {/* Message de bienvenue avec icône à gauche */}
            <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10 px-2">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[#823F91] flex-shrink-0" />
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                {getWelcomeMessage()}
              </h1>
            </div>

            {/* Input zone centrée améliorée */}
            <div className="relative flex items-end gap-3">
              {/* Avatar utilisateur */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#823F91] text-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
                {coupleProfile?.avatar_url && !coupleAvatarError ? (
                  <img
                    src={coupleProfile.avatar_url}
                    alt="Profil couple"
                    className="w-full h-full object-cover"
                    onError={() => setCoupleAvatarError(true)}
                  />
                ) : (
                  <span className="text-sm sm:text-base font-semibold">
                    {getUserInitials()}
                  </span>
                )}
              </div>
              
              {/* Zone de texte */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={onKeyPress}
                  placeholder="Quel type de prestataire recherchez-vous ?"
                  disabled={isLoading}
                  rows={1}
                  className={cn(
                    'w-full bg-gray-50 border border-gray-200 rounded-2xl sm:rounded-3xl',
                    'p-3 sm:p-4 pr-12 sm:pr-14',
                    'shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-[#823F91]/20 focus:border-[#823F91]/30',
                    'disabled:bg-gray-100 disabled:cursor-not-allowed',
                    'resize-none overflow-hidden',
                    'min-h-[48px] sm:min-h-[56px] max-h-[200px]',
                    'text-sm sm:text-base text-gray-900 placeholder:text-gray-400',
                    'leading-relaxed'
                  )}
                  style={{ height: 'auto' }}
                />
                <button
                  onClick={onSend}
                  disabled={!userInput.trim() || isLoading}
                  className={cn(
                    'absolute right-2 sm:right-3 bottom-2 sm:bottom-3',
                    'w-9 h-9 sm:w-10 sm:h-10 rounded-full',
                    'flex items-center justify-center transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'shadow-md hover:shadow-lg active:scale-95',
                    userInput.trim() && !isLoading
                      ? 'bg-[#823F91] text-white hover:bg-[#9333ea] hover:scale-105'
                      : 'bg-gray-200 text-gray-400'
                  )}
                  aria-label="Envoyer"
                >
                  <ArrowUp size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CONVERSATION EN COURS */
        <>
          {/* Zone messages scrollable */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8"
          >
            <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
              {messages.map((message: ChatMessage, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    'flex gap-3 items-start',
                    message.role === 'user' ? 'justify-end' : ''
                  )}
                >
                  {/* Avatar bot - Image de l'assistant IA */}
                  {message.role === 'bot' && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {!botAvatarError ? (
                        <img
                          src="/images/ai-assistant-avatar-3d.png"
                          alt="Assistant IA"
                          className="w-full h-full object-cover object-center"
                          onError={() => setBotAvatarError(true)}
                        />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#823F91]" />
                      )}
                    </div>
                  )}

                  {/* Message bot - avec style amélioré */}
                  {message.role === 'bot' && (
                    <div className="flex-1 bg-gray-50 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm text-gray-900 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words border border-gray-100">
                      {(() => {
                        // Fonction pour corriger les accents mal encodés
                        let corrected = message.content;
                        // Remplacer les patterns courants de mots français mal encodés
                        const fixes: [RegExp, string][] = [
                          [/r�sume/gi, 'résume'],
                          [/r�sum�/gi, 'résumé'],
                          [/alg�rien/gi, 'algérien'],
                          [/sp�cifique/gi, 'spécifique'],
                          [/allerg�nes/gi, 'allergènes'],
                          [/r�gime/gi, 'régime'],
                          [/v�g�tarien/gi, 'végétarien'],
                          [/pr�ciser/gi, 'préciser'],
                          [/pr�f�r�/gi, 'préféré'],
                          [/d�j�/gi, 'déjà'],
                          [/tr�s/gi, 'très'],
                          [/apr�s/gi, 'après'],
                          [/m�me/gi, 'même'],
                        ];
                        fixes.forEach(([pattern, replacement]) => {
                          corrected = corrected.replace(pattern, replacement);
                        });
                        return corrected;
                      })()}
                    </div>
                  )}

                  {/* Message user - avec bulle améliorée */}
                  {message.role === 'user' && (
                    <>
                      <div className="bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 max-w-[80%] sm:max-w-[75%] shadow-md hover:shadow-lg transition-shadow duration-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#823F91] text-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md ring-2 ring-white">
                        {coupleProfile?.avatar_url && !coupleAvatarError ? (
                          <img
                            src={coupleProfile.avatar_url}
                            alt="Profil couple"
                            className="w-full h-full object-cover"
                            onError={() => setCoupleAvatarError(true)}
                          />
                        ) : (
                          <span className="text-xs sm:text-sm font-semibold">
                            {getUserInitials()}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 sm:gap-3 items-start"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {!botAvatarError ? (
                      <img
                        src="/images/ai-assistant-avatar-3d.png"
                        alt="Assistant IA"
                        className="w-full h-full object-cover object-center"
                        onError={() => setBotAvatarError(true)}
                      />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#823F91]" />
                    )}
                  </div>
                  <div className="flex gap-1 items-center h-8 sm:h-10">
                    <span
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Footer fixe avec input */}
          <div className="border-t border-gray-200 bg-white/95 backdrop-blur-sm p-4 sm:p-5 flex-shrink-0">
            <div className="max-w-3xl mx-auto relative">
              <div className="relative flex items-end gap-2 sm:gap-3">
                {/* Avatar utilisateur à gauche */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#823F91] text-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                  {coupleProfile?.avatar_url && !coupleAvatarError ? (
                    <img
                      src={coupleProfile.avatar_url}
                      alt="Profil couple"
                      className="w-full h-full object-cover"
                      onError={() => setCoupleAvatarError(true)}
                    />
                  ) : (
                    <span className="text-xs sm:text-sm font-semibold">
                      {getUserInitials()}
                    </span>
                  )}
                </div>
                
                {/* Zone de texte avec bordure arrondie */}
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={onKeyPress}
                    placeholder="Continuez la conversation..."
                    disabled={isLoading}
                    rows={1}
                    className={cn(
                      'w-full bg-gray-50 border border-gray-200 rounded-2xl sm:rounded-3xl',
                      'p-3 sm:p-4 pr-12 sm:pr-14',
                      'shadow-sm hover:shadow-md focus:shadow-lg',
                      'focus:outline-none focus:ring-2 focus:ring-[#823F91]/20 focus:border-[#823F91]/30',
                      'transition-all duration-200 resize-none overflow-hidden',
                      'min-h-[48px] sm:min-h-[56px] max-h-[200px]',
                      'text-sm sm:text-base text-gray-900 placeholder:text-gray-400',
                      'leading-relaxed disabled:bg-gray-100 disabled:cursor-not-allowed'
                    )}
                    style={{ height: 'auto' }}
                  />
                  <button
                    onClick={onSend}
                    disabled={!userInput.trim() || isLoading}
                    className={cn(
                      'absolute right-2 sm:right-3 bottom-2 sm:bottom-3',
                      'w-9 h-9 sm:w-10 sm:h-10 rounded-full',
                      'flex items-center justify-center transition-all duration-200',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'shadow-md hover:shadow-lg active:scale-95',
                      userInput.trim() && !isLoading
                        ? 'bg-[#823F91] text-white hover:bg-[#9333ea] hover:scale-105'
                        : 'bg-gray-200 text-gray-400'
                    )}
                    aria-label="Envoyer"
                  >
                    <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ============================================
// COMPOSANT VALIDATION VIEW
// ============================================

interface ValidationViewProps {
  criteria: Partial<SearchCriteria>;
  serviceType?: string;
  onBack: () => void;
  onConfirm: () => void;
  onGoToLanding: () => void;
  onSave: () => void;
  isSaving: boolean;
  isMatchingLoading: boolean;
  matchingError: string | null;
}

function CriteriaCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="h-8 w-8 rounded-lg bg-[#823F91]/8 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <h4 className="text-sm font-semibold text-gray-700">{label}</h4>
      </div>
      <div className="text-sm sm:text-base text-gray-900 pl-[42px]">
        {children}
      </div>
    </div>
  );
}

function ValidationView({
  criteria,
  serviceType,
  onBack,
  onConfirm,
  onGoToLanding,
  onSave,
  isSaving,
  isMatchingLoading,
  matchingError,
}: ValidationViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-screen"
    >
      {/* Header fixe */}
      <header className="h-14 sm:h-16 border-b border-gray-200 bg-white flex items-center px-3 sm:px-4 md:px-6 flex-shrink-0">
        <div className="flex items-center justify-between w-full max-w-3xl mx-auto">
          <button
            onClick={onGoToLanding}
            className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors p-1 sm:p-2 -ml-1 sm:ml-0"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline text-sm font-medium">Retour</span>
          </button>

          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Validation</h2>

          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-xs sm:text-sm font-medium text-gray-700 disabled:opacity-50"
            aria-label="Sauvegarder"
          >
            <Save className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>
        </div>
      </header>

      {/* Content scrollable */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-full bg-green-50 ring-1 ring-green-200">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Critères extraits avec succès
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              Voici ce que nous avons compris de vos besoins
            </p>
          </div>

          <div className="grid gap-3 sm:gap-4 mb-6 sm:mb-8">
            {serviceType && (
              <CriteriaCard
                icon={<Search className="h-4 w-4 text-[#823F91]" />}
                label="Service recherché"
              >
                <p>{serviceType}</p>
              </CriteriaCard>
            )}

            {criteria.cultures && criteria.cultures.length > 0 && (
              <CriteriaCard
                icon={<Sparkles className="h-4 w-4 text-[#823F91]" />}
                label="Cultures"
              >
                <div className="flex flex-wrap gap-2">
                  {criteria.cultures.map((culture, idx) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-[#823F91] text-sm font-medium">
                      {culture}
                    </span>
                  ))}
                </div>
              </CriteriaCard>
            )}

            {(criteria.budget_min || criteria.budget_max) && (
              <CriteriaCard
                icon={<span className="text-[#823F91] text-sm font-bold">€</span>}
                label="Budget"
              >
                <p className="text-lg font-semibold">
                  {criteria.budget_min ? `${Number(criteria.budget_min).toLocaleString('fr-FR')}€` : 'Non spécifié'}
                  {criteria.budget_min && criteria.budget_max ? ' — ' : ''}
                  {criteria.budget_max ? `${Number(criteria.budget_max).toLocaleString('fr-FR')}€` : ''}
                </p>
              </CriteriaCard>
            )}

            {criteria.wedding_style && (
              <CriteriaCard
                icon={<Sparkles className="h-4 w-4 text-[#823F91]" />}
                label="Style"
              >
                <p>{criteria.wedding_style}</p>
              </CriteriaCard>
            )}

            {criteria.specific_requirements && criteria.specific_requirements.length > 0 && (
              <CriteriaCard
                icon={<Search className="h-4 w-4 text-[#823F91]" />}
                label="Besoins spécifiques"
              >
                <ul className="space-y-1.5">
                  {criteria.specific_requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#823F91] mt-2 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CriteriaCard>
            )}

            {criteria.vision_description && (
              <CriteriaCard
                icon={<Sparkles className="h-4 w-4 text-[#823F91]" />}
                label="Vision"
              >
                <p className="text-gray-700 italic leading-relaxed">{criteria.vision_description}</p>
              </CriteriaCard>
            )}
          </div>

          {/* Message d'erreur */}
          {matchingError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-900 mb-2">{matchingError}</p>
              <Button
                onClick={onConfirm}
                variant="outline"
                size="sm"
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                Réessayer
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={onBack}
              variant="outline"
              size="lg"
              className="flex-1 text-sm sm:text-base"
              disabled={isMatchingLoading}
            >
              Modifier mes critères
            </Button>
            <Button
              onClick={onConfirm}
              variant="default"
              size="lg"
              className="flex-1 bg-gradient-to-br from-[#823F91] to-[#9333ea] hover:from-[#9333ea] hover:to-[#823F91] text-white text-sm sm:text-base"
              disabled={isMatchingLoading}
            >
              {isMatchingLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recherche en cours...
                </>
              ) : (
                'Lancer le matching'
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// COMPOSANT RESULTS VIEW
// ============================================

interface ResultsViewProps {
  matchingResults: MatchingResult;
  onBack: () => void;
  router: ReturnType<typeof useRouter>;
  onSaveSearch?: () => void;
  isSaving?: boolean;
}

function ResultsView({ matchingResults, onBack, router, onSaveSearch, isSaving }: ResultsViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-white to-purple-50"
    >
      {/* Header */}
      <header className="border-b border-gray-200 bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm font-medium">Retour</span>
          </button>
        </div>
      </header>

      {/* Results */}
      <div className="py-8">
        <MatchResults
          matches={matchingResults.matches}
          totalCandidates={matchingResults.total_candidates}
          matchingResult={matchingResults}
          onContactProvider={(id) => {
            // TODO: Ouvrir modal contact
            toast.info('Fonctionnalité de contact à venir');
          }}
          onViewProfile={(id) => {
            router.push(`/prestataire/profil-public/${id}`);
          }}
          onNewSearch={onBack}
          onSaveSearch={onSaveSearch}
          isSaving={isSaving}
        />
      </div>
    </motion.div>
  );
}
