'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useChatbot } from '@/hooks/useChatbot';
import { getCurrentCoupleProfile } from '@/lib/supabase/queries/couples.queries';
import { ChatMessage } from '@/types/chatbot';
import { X, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'conversation' | 'validation';

export function ChatbotModal({ isOpen, onClose }: ChatbotModalProps) {
  const [step, setStep] = useState<Step>('conversation');
  const [userInput, setUserInput] = useState('');
  const [coupleProfile, setCoupleProfile] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialiser le hook useChatbot sans serviceType (sera extrait par l'IA)
  const { messages, extractedCriteria, isLoading, sendMessage, extractedServiceType } = useChatbot(
    undefined,
    coupleProfile
  );

  // Charger le profil couple au montage
  useEffect(() => {
    if (isOpen) {
      loadCoupleProfile();
    }
  }, [isOpen]);

  // Reset states quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setStep('conversation');
      setUserInput('');
    }
  }, [isOpen]);

  // Auto-scroll vers le bas à chaque nouveau message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userInput]);

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
      console.log('Profil couple non disponible');
    }
  };

  const handleSend = async () => {
    if (!userInput.trim() || isLoading) return;

    const message = userInput.trim();
    setUserInput('');

    const nextAction = await sendMessage(message);

    // Si l'IA indique qu'on peut valider, passer à l'étape validation
    if (nextAction === 'validate') {
      setStep('validation');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLaunchMatching = () => {
    // TODO: Implémenter le lancement du matching avec les critères extraits
    console.log('Lancer le matching avec:', extractedCriteria);
    onClose();
  };

  const handleModifyCriteria = () => {
    setStep('conversation');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'p-0 flex flex-col',
          'h-screen sm:h-auto',
          'sm:max-w-4xl sm:max-h-[90vh]',
          'rounded-none sm:rounded-xl'
        )}
        showCloseButton={false}
      >
        {/* Header fixe */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#823F91] to-[#9333ea]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Matching IA</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {step === 'conversation' && (
            <div className="space-y-4">
              {messages.map((message: ChatMessage, index: number) => (
                <div
                  key={index}
                  className={cn(
                    'flex gap-2',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl p-4',
                      message.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-900'
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start gap-2">
                  <div className="bg-gray-100 rounded-2xl p-4">
                    <div className="flex gap-1">
                      <span className="text-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
                      <span className="text-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
                      <span className="text-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {step === 'validation' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center mb-4 p-3 rounded-full bg-green-100">
                  <Sparkles className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Critères extraits avec succès !
                </h3>
                <p className="text-sm text-gray-600">
                  Voici ce que nous avons compris de vos besoins
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                {extractedServiceType && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Service recherché</h4>
                    <p className="text-sm text-gray-900">{extractedServiceType}</p>
                  </div>
                )}

                {extractedCriteria.cultures && extractedCriteria.cultures.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Cultures</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {extractedCriteria.cultures.map((culture, idx) => (
                        <li key={idx} className="text-sm text-gray-900">{culture}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(extractedCriteria.budget_min || extractedCriteria.budget_max) && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Budget</h4>
                    <p className="text-sm text-gray-900">
                      {extractedCriteria.budget_min ? `${extractedCriteria.budget_min}€` : 'Non spécifié'}
                      {extractedCriteria.budget_min && extractedCriteria.budget_max ? ' - ' : ''}
                      {extractedCriteria.budget_max ? `${extractedCriteria.budget_max}€` : ''}
                    </p>
                  </div>
                )}

                {extractedCriteria.wedding_style && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Style</h4>
                    <p className="text-sm text-gray-900">{extractedCriteria.wedding_style}</p>
                  </div>
                )}

                {extractedCriteria.specific_requirements && extractedCriteria.specific_requirements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Besoins spécifiques</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {extractedCriteria.specific_requirements.map((need, idx) => (
                        <li key={idx} className="text-sm text-gray-900">{need}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {extractedCriteria.wedding_date && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Date du mariage</h4>
                    <p className="text-sm text-gray-900">{extractedCriteria.wedding_date}</p>
                  </div>
                )}

                {extractedCriteria.wedding_city && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Lieu</h4>
                    <p className="text-sm text-gray-900">{extractedCriteria.wedding_city}</p>
                  </div>
                )}

                {extractedCriteria.guest_count && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Nombre d'invités</h4>
                    <p className="text-sm text-gray-900">{extractedCriteria.guest_count}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleModifyCriteria}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Modifier mes critères
                </Button>
                <Button
                  onClick={handleLaunchMatching}
                  variant="default"
                  size="lg"
                  className="flex-1 bg-gradient-to-br from-[#823F91] to-[#9333ea] hover:from-[#9333ea] hover:to-[#823F91] text-white"
                >
                  Lancer le matching
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer fixe - Textarea + Bouton Envoyer (seulement en mode conversation) */}
        {step === 'conversation' && (
          <div className="flex gap-2 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Parlez-moi de votre vision..."
              disabled={isLoading}
              rows={1}
              className={cn(
                'flex-1 border border-gray-300 rounded-xl px-4 py-2',
                'focus:outline-none focus:ring-2 focus:ring-[#823F91]/20 focus:border-[#823F91]',
                'disabled:bg-gray-100 disabled:cursor-not-allowed',
                'text-sm resize-none overflow-hidden',
                'min-h-[44px] max-h-[120px]'
              )}
            />
            <Button
              onClick={handleSend}
              disabled={!userInput.trim() || isLoading}
              size="default"
              className="bg-gradient-to-br from-[#823F91] to-[#9333ea] hover:from-[#9333ea] hover:to-[#823F91] text-white flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
