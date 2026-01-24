# Gestion des Conversations de Matching

## Vue d'ensemble

Les conversations de matching permettent aux couples de sauvegarder leurs recherches de prestataires pour pouvoir les retrouver et les réutiliser plus tard.

## Quand sauvegarder une conversation ?

### 1. **Sauvegarde manuelle** (Recommandée)
   - **Moment** : Dans la vue **Validation** (après extraction des critères)
   - **Action** : Clic sur le bouton "Sauvegarder" dans le header
   - **Avantage** : Le couple contrôle quand sauvegarder
   - **Statut** : `completed`

### 2. **Sauvegarde automatique**
   - **Moment** : Avant de lancer le matching (dans `handleLaunchMatching`)
   - **Action** : Automatique lors du clic sur "Lancer le matching"
   - **Avantage** : Aucune perte de données
   - **Statut** : `completed`

### 3. **Sauvegarde en cours** (Futur)
   - **Moment** : Pendant la conversation
   - **Action** : Auto-sauvegarde périodique
   - **Statut** : `in_progress`
   - **Note** : Non implémenté actuellement

## Structure des données

### Table `chatbot_conversations`
```sql
- id: UUID (primary key)
- couple_id: UUID (référence vers profiles.id)
- service_type: TEXT (ex: "photographe", "traiteur")
- messages: JSONB (array de ChatMessage)
- extracted_criteria: JSONB (SearchCriteria)
- status: TEXT ('in_progress' | 'completed' | 'abandoned')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Types TypeScript
```typescript
interface ChatbotConversation {
  id: string;
  couple_id: string;
  service_type: string;
  messages: ChatMessage[];
  extracted_criteria: SearchCriteria | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}
```

## Fonctions disponibles

### 1. Sauvegarder une conversation
```typescript
import { saveChatbotConversation } from '@/lib/supabase/chatbot-conversations';

const result = await saveChatbotConversation(
  coupleId,           // ID du couple
  serviceType,        // Type de service recherché
  messages,           // Array de messages
  extractedCriteria,  // Critères extraits
  'completed'         // Statut
);

if (result.success) {
  console.log('Conversation sauvegardée:', result.conversationId);
}
```

### 2. Récupérer toutes les conversations
```typescript
import { getChatbotConversations } from '@/lib/supabase/chatbot-conversations';

const conversations = await getChatbotConversations(coupleId);
// Retourne un array de ChatbotConversation trié par date (plus récent en premier)
```

### 3. Récupérer une conversation spécifique
```typescript
import { getChatbotConversation } from '@/lib/supabase/chatbot-conversations';

const conversation = await getChatbotConversation(conversationId);
if (conversation) {
  // Utiliser la conversation
}
```

### 4. Mettre à jour une conversation
```typescript
import { updateChatbotConversation } from '@/lib/supabase/chatbot-conversations';

const result = await updateChatbotConversation(conversationId, {
  messages: newMessages,
  status: 'completed',
  extracted_criteria: newCriteria,
});
```

### 5. Supprimer une conversation
```typescript
import { deleteChatbotConversation } from '@/lib/supabase/chatbot-conversations';

const result = await deleteChatbotConversation(conversationId);
```

## Flux utilisateur actuel

### 1. Création d'une nouvelle recherche
```
Landing → Chat → Validation → Sauvegarde → Matching → Results
```

### 2. Consultation des recherches sauvegardées
```
Chat View → Clic sur "Recherches" → Modal avec liste → Sélection (à venir)
```

## Points d'amélioration futurs

### 1. Reprise d'une conversation
- [ ] Charger les messages d'une conversation sauvegardée
- [ ] Reprendre le chat à partir d'une conversation
- [ ] Modifier les critères extraits

### 2. Gestion avancée
- [ ] Supprimer une conversation depuis la modal
- [ ] Dupliquer une conversation
- [ ] Filtrer par service type
- [ ] Recherche dans les conversations

### 3. Auto-sauvegarde
- [ ] Sauvegarde automatique toutes les X minutes
- [ ] Sauvegarde lors de la fermeture de la page
- [ ] Indicateur visuel de sauvegarde en cours

## Exemple d'utilisation dans le code

### Sauvegarde manuelle (Vue Validation)
```typescript
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
      setConversationId(result.conversationId);
    }
  } catch (error) {
    toast.error('Erreur lors de la sauvegarde');
  } finally {
    setIsSaving(false);
  }
};
```

### Affichage des conversations sauvegardées
```typescript
const loadSavedConversations = async () => {
  if (!coupleId) return;
  
  setLoadingConversations(true);
  try {
    const conversations = await getChatbotConversations(coupleId);
    setSavedConversations(conversations);
  } catch (error) {
    toast.error('Erreur lors du chargement');
  } finally {
    setLoadingConversations(false);
  }
};
```

## Sécurité

- ✅ Vérification de l'authentification utilisateur
- ✅ Vérification que le couple correspond à l'utilisateur
- ✅ Accès restreint aux conversations du couple uniquement
- ✅ Validation des données avant insertion

## Notes importantes

1. **couple_id** dans `chatbot_conversations` correspond à `profiles.id` (qui est égal à `couples.user_id`)
2. Les conversations sont triées par date de création (plus récent en premier)
3. Le statut `abandoned` peut être utilisé si l'utilisateur quitte sans sauvegarder
4. Les messages sont stockés en JSONB pour flexibilité
