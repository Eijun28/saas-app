'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, X, PiggyBank } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useChatbot } from '@/hooks/useChatbot';
import { getCurrentCoupleProfile } from '@/lib/supabase/queries/couples.queries';

const BUDGET_WELCOME_MESSAGE =
  'Bonjour ! 👋 Je suis votre assistant budget mariage. Dites-moi votre budget, nombre d\'invités et vos priorités, et je vous propose une répartition réaliste.';

const QUICK_PROMPTS = [
  {
    label: 'Estimer mon budget global',
    message:
      'Peux-tu estimer un budget global réaliste pour notre mariage ?',
  },
  {
    label: 'Répartir notre budget',
    message:
      'Peux-tu proposer une répartition par postes (traiteur, salle, photo...) ?',
  },
  {
    label: 'Tarifs du marché',
    message:
      'Quels sont les tarifs moyens du marché pour les principaux prestataires ?',
  },
];

type BudgetAssistantVariant = 'full' | 'compact';

interface BudgetAssistantProps {
  variant?: BudgetAssistantVariant;
  className?: string;
}

export function BudgetAssistant({ variant = 'full', className }: BudgetAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [coupleProfile, setCoupleProfile] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, isLoading, sendMessage } = useChatbot({
    assistantContext: 'budget_planner',
    initialMessage: BUDGET_WELCOME_MESSAGE,
    coupleProfile,
  });

  useEffect(() => {
    if (!isOpen) return;
    const loadCoupleProfile = async () => {
      try {
        const profile = await getCurrentCoupleProfile();
        if (profile) {
          setCoupleProfile({
            cultures: [],
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

    loadCoupleProfile();
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userInput]);

  const handleSend = async () => {
    if (!userInput.trim() || isLoading) return;
    const message = userInput.trim();
    setUserInput('');
    await sendMessage(message);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (isLoading) return;
    await sendMessage(prompt);
  };

  return (
    <>
      <Card
        className={cn(
          'border border-[#F3EAF7] bg-white shadow-sm',
          variant === 'full'
            ? 'overflow-hidden'
            : 'bg-gradient-to-br from-white to-[#FBF5FF]',
          className
        )}
      >
        <CardContent
          className={cn(
            'flex flex-col gap-4',
            variant === 'full' ? 'p-5 sm:p-6' : 'p-4'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#F8EFFF] p-3 text-[#823F91]">
              <PiggyBank className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#823F91]">
                Assistant budget IA
              </p>
              <h3 className="text-lg font-semibold text-gray-900">
                Votre copilote budget, discret mais efficace
              </h3>
              <p className="text-sm text-gray-600">
                Conseils basés sur les tarifs moyens des prestataires Nuply.
                Définissez votre budget, priorités et répartition par postes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <Button
                key={prompt.label}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-[#EBD9F5] text-xs text-[#6D3478] hover:bg-[#F9F3FC]"
                onClick={() => {
                  setIsOpen(true);
                  handleQuickPrompt(prompt.message);
                }}
              >
                {prompt.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              className="bg-[#823F91] hover:bg-[#6D3478] text-white"
              onClick={() => setIsOpen(true)}
            >
              Ouvrir l&apos;assistant
            </Button>
            <p className="text-xs text-gray-500 sm:self-center">
              Disponible pendant l&apos;onboarding et dans votre espace budget.
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-0 sm:max-w-3xl max-h-[85vh] overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-[#823F91] to-[#9333ea] p-2">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Assistant budget mariage
                </p>
                <p className="text-xs text-gray-500">
                  Conseils personnalisés selon votre profil
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#FCFAFD] px-4 py-4 sm:px-6 sm:py-5">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white'
                        : 'bg-white text-gray-800 border border-[#F1E8F7]'
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-[#F1E8F7] bg-white px-4 py-3 text-sm text-gray-500">
                    L&apos;assistant réfléchit...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <Button
                    key={`modal-${prompt.label}`}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full bg-[#F9F3FC] text-xs text-[#6D3478] hover:bg-[#F3E4FB]"
                    onClick={() => handleQuickPrompt(prompt.message)}
                    disabled={isLoading}
                  >
                    {prompt.label}
                  </Button>
                ))}
              </div>

              <div className="flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  value={userInput}
                  onChange={(event) => setUserInput(event.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Décrivez votre budget, vos invités, vos priorités..."
                  className="min-h-[44px] resize-none rounded-2xl border-[#EBD9F5] focus-visible:ring-[#823F91]"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  className="h-11 w-11 rounded-full bg-[#823F91] hover:bg-[#6D3478] text-white"
                  onClick={handleSend}
                  disabled={!userInput.trim() || isLoading}
                >
                  <Send className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
