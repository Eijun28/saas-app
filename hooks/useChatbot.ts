'use client';

import { useState, useRef } from 'react';
import { ChatMessage, SearchCriteria } from '@/types/chatbot';

export function useChatbot(serviceType?: string, coupleProfile?: any) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content: 'Bonjour ! 👋 Quel type de prestataire recherchez-vous aujourd\'hui ?',
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
    // Ajouter le message utilisateur
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
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
      };

      // Appeler l'API chatbot avec les messages mis à jour
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Essayer de récupérer le message d'erreur de l'API
        let errorMessage = `Erreur HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Si on ne peut pas parser le JSON, utiliser le texte brut
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        console.error('API Chatbot Error:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
        });
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Ajouter la réponse du bot
      const botMessage: ChatMessage = {
        role: 'bot',
        content: data.message,
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
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Message d'erreur plus informatif
      let errorContent = 'Désolé, une erreur est survenue. ';
      if (error.message) {
        if (error.message.includes('503') || error.message.includes('Service temporairement indisponible')) {
          errorContent += 'Le service est temporairement indisponible. Veuillez réessayer dans quelques instants.';
        } else if (error.message.includes('429') || error.message.includes('Trop de requêtes')) {
          errorContent += 'Trop de requêtes. Veuillez patienter quelques instants avant de réessayer.';
        } else if (error.message.includes('400') || error.message.includes('invalide')) {
          errorContent += 'Votre message semble invalide. Pouvez-vous reformuler ?';
        } else {
          errorContent += error.message.includes('HTTP') 
            ? `Erreur ${error.message}. Veuillez réessayer.`
            : 'Pouvez-vous répéter votre message ?';
        }
      } else {
        errorContent += 'Pouvez-vous répéter ?';
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

  return {
    messages,
    extractedCriteria,
    isLoading,
    sendMessage,
    extractedServiceType: extractedCriteria.service_type,
  };
}
