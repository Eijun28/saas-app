'use client';

import { useState, useRef } from 'react';
import { ChatMessage, SearchCriteria } from '@/types/chatbot';

const DEFAULT_WELCOME_MESSAGE =
  'Bonjour ! 👋 Quel type de prestataire recherchez-vous aujourd\'hui ?';

export interface UseChatbotOptions {
  serviceType?: string;
  coupleProfile?: Record<string, unknown>;
  initialMessage?: string;
  assistantContext?: 'matching' | 'budget_planner';
}

export function useChatbot(
  serviceTypeOrOptions?: string | UseChatbotOptions,
  coupleProfileArg?: Record<string, unknown>
) {
  const options: UseChatbotOptions =
    typeof serviceTypeOrOptions === 'object' && serviceTypeOrOptions !== null
      ? serviceTypeOrOptions
      : { serviceType: serviceTypeOrOptions, coupleProfile: coupleProfileArg };

  const serviceType = options.serviceType;
  const coupleProfile = options.coupleProfile ?? coupleProfileArg;
  const initialMessage = options.initialMessage ?? DEFAULT_WELCOME_MESSAGE;
  const assistantContext = options.assistantContext ?? 'matching';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content: initialMessage,
      timestamp: new Date().toISOString(),
    },
  ]);
  
  // Initialiser extractedCriteria sans service_type si non fourni
  const [extractedCriteria, setExtractedCriteria] = useState<Partial<SearchCriteria>>(
    serviceType ? { service_type: serviceType } : {}
  );
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref pour stocker les messages actuels (pour éviter les problèmes de closure)
  const messagesRef = useRef<ChatMessage[]>(messages);
  
  // Synchroniser le ref avec l'état
  messagesRef.current = messages;

  const sendMessage = async (userMessage: string) => {
    // Normaliser les caractères UTF-8 du message utilisateur
    const normalizedUserMessage = userMessage.normalize('NFC').trim();
    
    // Ajouter le message utilisateur
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: normalizedUserMessage,
      timestamp: new Date().toISOString(),
    };
    
    // Construire les messages mis à jour depuis le ref (état actuel garanti)
    const updatedMessages = [...messagesRef.current, newUserMessage];
    
    // Mettre à jour l'état immédiatement
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Vérifier que les messages sont valides
      if (!updatedMessages || updatedMessages.length === 0) {
        throw new Error('Aucun message à envoyer');
      }

      // Utiliser le service_type extrait s'il existe, sinon passer celui fourni ou chaîne vide
      const currentServiceType = extractedCriteria.service_type || serviceType || '';

      // Préparer le payload
      const payload = {
        messages: updatedMessages,
        service_type: currentServiceType,
        couple_profile: coupleProfile,
        assistant_context: assistantContext,
      };

      // Appeler l'API chatbot avec les messages mis à jour
      // Encoder correctement le body en UTF-8
      const bodyString = JSON.stringify(payload);
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
        },
        body: bodyString,
      });

      if (!response.ok) {
        // Essayer de récupérer le message d'erreur de l'API
        let errorMessage = `Erreur HTTP ${response.status}`;
        let errorDetails: Record<string, unknown> | null = null;
        let userFriendlyMessage: string | null = null;
        
        try {
          const errorData = await response.json();
          errorDetails = errorData;
          
          // Prioriser le message utilisateur-friendly s'il existe
          userFriendlyMessage = errorData.message || null;
          const technicalError = errorData.error || errorData.details;
          
          if (userFriendlyMessage && typeof userFriendlyMessage === 'string' && userFriendlyMessage.trim()) {
            errorMessage = userFriendlyMessage;
          } else if (technicalError && typeof technicalError === 'string' && technicalError.trim()) {
            errorMessage = technicalError;
          } else if (typeof errorData === 'string' && errorData.trim()) {
            errorMessage = errorData;
          } else if (errorData.error && typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // Si on ne peut pas parser le JSON, utiliser le texte brut
          try {
            const errorText = await response.text();
            if (typeof errorText === 'string' && errorText.trim()) {
              errorMessage = errorText;
            }
          } catch (textError) {
            // Si même le texte échoue, garder le message par défaut
            console.warn('Impossible de récupérer le message d\'erreur:', textError);
          }
        }
        
        // S'assurer qu'on a toujours une chaîne valide
        const finalErrorMessage = typeof errorMessage === 'string' && errorMessage.trim() 
          ? errorMessage 
          : `Erreur HTTP ${response.status}: ${response.statusText || 'Erreur inconnue'}`;
        
        // Logger l'erreur complète pour le debugging
        console.error('API Chatbot Error:', {
          status: response.status,
          statusText: response.statusText,
          message: finalErrorMessage,
          userFriendlyMessage,
          details: errorDetails,
        });
        
        // Créer une erreur avec le message utilisateur-friendly si disponible
        const chatError = new Error(finalErrorMessage) as Error & { userFriendlyMessage?: string; status?: number };
        chatError.userFriendlyMessage = userFriendlyMessage || finalErrorMessage;
        chatError.status = response.status;
        throw chatError;
      }

      // S'assurer que la réponse est bien en UTF-8
      // Utiliser response.text() puis JSON.parse pour avoir plus de contrôle sur l'encodage
      const responseText = await response.text();
      
      // Parser le JSON - response.text() retourne déjà une string UTF-8
      const data = JSON.parse(responseText);

      // Valider que la réponse contient un message
      if (!data || typeof data !== 'object') {
        throw new Error('Réponse invalide du serveur');
      }

      if (!data.message || typeof data.message !== 'string') {
        console.error('Réponse API invalide (pas de message):', data);
        throw new Error('Le serveur n\'a pas retourné de message valide');
      }

      // Normaliser les caractères UTF-8 pour garantir l'affichage correct des accents
      // Utiliser NFC pour normaliser les caractères Unicode composés
      const normalizedMessage = data.message
        .normalize('NFC') // Normaliser les caractères Unicode
        .trim();

      // Ajouter la réponse du bot
      const botMessage: ChatMessage = {
        role: 'bot',
        content: normalizedMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);

      // Mettre à jour les critères extraits
      if (data.extracted_data) {
        setExtractedCriteria((prev) => ({
          ...prev,
          ...data.extracted_data,
        }));
      }

      return data.next_action;
    } catch (error: unknown) {
      console.error('Error sending message:', error)
      const err = error as Error & { userFriendlyMessage?: string; status?: number; message?: string };
      
      // Utiliser le message utilisateur-friendly si disponible, sinon construire un message approprié
      let errorContent: string;
      
      if (err.userFriendlyMessage) {
        errorContent = err.userFriendlyMessage;
      } else if (err.message) {
        if (err.message.includes('503') || err.message.includes('Service temporairement indisponible')) {
          errorContent = 'Le service est temporairement indisponible. Veuillez réessayer dans quelques instants.';
        } else if (err.message.includes('429') || err.message.includes('Trop de requêtes')) {
          errorContent = 'Trop de requêtes. Veuillez patienter quelques instants avant de réessayer.';
        } else if (err.message.includes('400') || err.message.includes('invalide')) {
          errorContent = 'Votre message semble invalide. Pouvez-vous reformuler ?';
        } else if (err.message.includes('Format de réponse invalide') || err.message.includes('parsing')) {
          errorContent = 'Je n\'ai pas pu traiter votre demande correctement. Pouvez-vous reformuler votre message ?';
        } else if (err.message.includes('HTTP')) {
          errorContent = `Une erreur technique est survenue (${err.status || 'inconnue'}). Veuillez réessayer.`;
        } else {
          errorContent = err.message.length > 100
            ? 'Une erreur est survenue. Pouvez-vous reformuler votre message ?'
            : err.message;
        }
      } else {
        errorContent = 'Une erreur est survenue. Pouvez-vous reformuler votre message ?';
      }
      
      const errorMessage: ChatMessage = {
        role: 'bot',
        content: errorContent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return 'continue';
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role: 'bot',
        content: initialMessage,
        timestamp: new Date().toISOString(),
      },
    ]);
    setExtractedCriteria(serviceType ? { service_type: serviceType } : {});
    setIsLoading(false);
    messagesRef.current = [
      {
        role: 'bot',
        content: initialMessage,
        timestamp: new Date().toISOString(),
      },
    ];
  };

  return {
    messages,
    extractedCriteria,
    isLoading,
    sendMessage,
    extractedServiceType: extractedCriteria.service_type,
    resetChat,
  };
}
