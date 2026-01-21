'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useChatbot } from '@/hooks/useChatbot';
import { getCurrentCoupleProfile } from '@/lib/supabase/queries/couples.queries';
import { saveChatbotConversation } from '@/lib/supabase/chatbot-conversations';
import { ChatMessage, SearchCriteria } from '@/types/chatbot';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

type Vue = 'landing' | 'chat' | 'validation';

export default function MatchingPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [vue, setVue] = useState<Vue>('landing');
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [coupleProfile, setCoupleProfile] = useState<any>(null);
  const [userInput, setUserInput] = useState('');
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Initialiser le hook useChatbot sans serviceType
  const { messages, extractedCriteria, isLoading, sendMessage, extractedServiceType } = useChatbot(
    undefined,
    coupleProfile
  );

  // Fonction pour charger le profil couple
  const loadCoupleProfile = async () => {
    try {
      const profile = await getCurrentCoupleProfile();
      if (profile) {
        setCoupleId(profile.id);
        setCoupleProfile({
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
    loadCoupleProfile();
  }, []);

  // Auto-scroll vers le bas à chaque nouveau message
  useEffect(() => {
    if (vue === 'chat' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, vue]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
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
    // Reset conversation si nécessaire
  };

  const handleSend = async () => {
    if (!userInput.trim() || isLoading) return;

    const message = userInput.trim();
    setUserInput('');

    const nextAction = await sendMessage(message);

    // Si l'IA indique qu'on peut valider, passer à l'étape validation
    if (nextAction === 'validate') {
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
      } else {
        toast.error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error: any) {
      console.error('Error saving conversation:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLaunchMatching = async () => {
    // Sauvegarder automatiquement avant de lancer le matching
    if (coupleId && extractedServiceType) {
      await handleSaveConversation();
    }
    
    // TODO: Implémenter le lancement du matching avec les critères extraits
    console.log('Lancer le matching avec:', extractedCriteria);
    // Rediriger vers la page de résultats ou afficher les résultats
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-purple-50">
      <AnimatePresence mode="wait">
        {vue === 'landing' && (
          <LandingView key="landing" onStart={startMatching} />
        )}
        
        {vue === 'chat' && (
          <ChatView
            key="chat"
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

function LandingView({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex-1 flex flex-col justify-center">
        {/* Header avec logo */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#823F91] to-[#9333ea]">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">NUPLY</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-4 sm:mb-6"
          >
            <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#823F91]/10 to-[#9333ea]/10">
              <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-[#823F91]" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 px-2"
          >
            Matching IA Intelligent
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2"
          >
            Notre IA conversationnelle vous aide à trouver les 3 meilleurs prestataires qui correspondent{' '}
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
              size="lg"
              className="bg-gradient-to-br from-[#823F91] to-[#9333ea] hover:from-[#9333ea] hover:to-[#823F91] text-white shadow-lg hover:shadow-xl transition-all text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto w-full sm:w-auto"
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
}: ChatViewProps) {
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
            onClick={onBack}
            className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors p-1 sm:p-2 -ml-1 sm:ml-0"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline text-sm font-medium">Retour</span>
          </button>
          
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Matching IA</h2>
          
          <button
            className="px-2 sm:px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-xs sm:text-sm font-medium text-gray-700"
            aria-label="Recherches"
          >
            <span className="hidden sm:inline">Recherches</span>
            <Search className="h-4 w-4 sm:hidden" />
          </button>
        </div>
      </header>

      {/* Zone messages scrollable */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-white"
      >
        <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4">
          {messages.map((message: ChatMessage, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'flex gap-2 sm:gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'bot' && (
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#823F91] to-[#9333ea] flex items-center justify-center mt-0.5 sm:mt-1">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
              )}
              
              <div
                className={cn(
                  'rounded-xl sm:rounded-2xl p-3 sm:p-4 max-w-[85%] sm:max-w-[80%] break-words',
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-900'
                )}
              >
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                  {message.content}
					</p>
				</div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex items-center justify-center mt-0.5 sm:mt-1">
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-600">Vous</span>
                </div>
              )}
            </motion.div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start gap-2 sm:gap-3"
            >
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#823F91] to-[#9333ea] flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <div className="flex gap-0.5 sm:gap-1">
                  <span className="text-gray-400 text-sm sm:text-base animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
                  <span className="text-gray-400 text-sm sm:text-base animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
                  <span className="text-gray-400 text-sm sm:text-base animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Footer fixe */}
      <footer className="border-t border-gray-200 bg-white p-3 sm:p-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="Parlez-moi de votre vision..."
              disabled={isLoading}
              rows={1}
              className={cn(
                'w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12',
                'focus:outline-none focus:ring-2 focus:ring-[#823F91]/20 focus:border-[#823F91]',
                'disabled:bg-gray-100 disabled:cursor-not-allowed',
                'text-sm sm:text-base resize-none overflow-hidden',
                'min-h-[44px] sm:min-h-[48px] max-h-[120px] sm:max-h-[128px]'
              )}
            />
            <button
              onClick={onSend}
              disabled={!userInput.trim() || isLoading}
              className={cn(
                'absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2',
                'p-1.5 sm:p-2 rounded-lg transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                userInput.trim() && !isLoading
                  ? 'bg-[#823F91] text-white hover:bg-[#9333ea]'
                  : 'bg-gray-200 text-gray-400'
              )}
              aria-label="Envoyer"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
			</div>
		</div>
      </footer>
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
}

function ValidationView({ criteria, serviceType, onBack, onConfirm, onGoToLanding, onSave, isSaving }: ValidationViewProps) {
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
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center mb-3 sm:mb-4 p-2 sm:p-3 rounded-full bg-green-100">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Critères extraits avec succès !
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              Voici ce que nous avons compris de vos besoins
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            {serviceType && (
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Service recherché</h4>
                <p className="text-sm sm:text-base text-gray-900">{serviceType}</p>
              </div>
            )}

            {criteria.cultures && criteria.cultures.length > 0 && (
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Cultures</h4>
                <ul className="list-disc list-inside space-y-0.5 sm:space-y-1">
                  {criteria.cultures.map((culture, idx) => (
                    <li key={idx} className="text-sm sm:text-base text-gray-900">{culture}</li>
                  ))}
                </ul>
              </div>
            )}

            {(criteria.budget_min || criteria.budget_max) && (
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Budget</h4>
                <p className="text-sm sm:text-base text-gray-900">
                  {criteria.budget_min ? `${criteria.budget_min}€` : 'Non spécifié'}
                  {criteria.budget_min && criteria.budget_max ? ' - ' : ''}
                  {criteria.budget_max ? `${criteria.budget_max}€` : ''}
                </p>
              </div>
            )}

            {criteria.wedding_style && (
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Style</h4>
                <p className="text-sm sm:text-base text-gray-900">{criteria.wedding_style}</p>
              </div>
            )}

            {criteria.specific_requirements && criteria.specific_requirements.length > 0 && (
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Besoins spécifiques</h4>
                <ul className="list-disc list-inside space-y-0.5 sm:space-y-1">
                  {criteria.specific_requirements.map((req, idx) => (
                    <li key={idx} className="text-sm sm:text-base text-gray-900">{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {criteria.vision_description && (
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Vision</h4>
                <p className="text-sm sm:text-base text-gray-900">{criteria.vision_description}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={onBack}
              variant="outline"
              size="lg"
              className="flex-1 text-sm sm:text-base"
            >
              Modifier mes critères
            </Button>
            <Button
              onClick={onConfirm}
              variant="default"
              size="lg"
              className="flex-1 bg-gradient-to-br from-[#823F91] to-[#9333ea] hover:from-[#9333ea] hover:to-[#823F91] text-white text-sm sm:text-base"
            >
              Lancer le matching
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
