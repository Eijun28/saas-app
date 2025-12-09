# 💬 Système de Messagerie NUPLY - Documentation

## ✅ Implémentation Complète

Le système de messagerie a été entièrement implémenté selon les spécifications. Voici ce qui a été créé :

## 📁 Structure des Fichiers

### Types TypeScript
- `types/messages.ts` - Tous les types et interfaces pour les messages et conversations

### Fonctions Helper Supabase
- `lib/supabase/messages.ts` - Toutes les fonctions pour interagir avec Supabase :
  - `getConversations()` - Récupérer les conversations d'un utilisateur
  - `getMessages()` - Récupérer les messages d'une conversation
  - `sendMessage()` - Envoyer un message
  - `markAsRead()` - Marquer les messages comme lus
  - `getUnreadConversationsCount()` - Compter les conversations non lues
  - `getOrCreateConversation()` - Obtenir ou créer une conversation
  - `archiveConversation()` - Archiver une conversation
  - `uploadAttachment()` - Uploader un fichier
  - `validateFile()` - Valider un fichier avant upload

### Composants
- `components/messages/MessageBubble.tsx` - Bulle de message individuelle
- `components/messages/MessageInput.tsx` - Input pour envoyer des messages avec support fichiers
- `components/messages/MessageThread.tsx` - Thread de messages avec Realtime
- `components/messages/ConversationItem.tsx` - Item de conversation dans la liste
- `components/messages/ConversationList.tsx` - Liste des conversations avec recherche
- `components/messages/ContactButton.tsx` - Bouton pour contacter un prestataire
- `components/messages/MessageNotifications.tsx` - Badge de notifications

### Pages
- `app/messages/page.tsx` - Page principale de messagerie avec layout responsive

## 🎯 Fonctionnalités Implémentées

### ✅ Liste des Conversations
- Affichage de toutes les conversations de l'utilisateur
- Recherche par nom ou contenu de message
- Badge de messages non lus
- Timestamp relatif ("Il y a 5 min", "Hier", etc.)
- Tri par date du dernier message
- Realtime pour les mises à jour

### ✅ Thread de Messages
- Affichage des messages avec scroll infini
- Messages alignés (expéditeur à droite, destinataire à gauche)
- Support des pièces jointes (images, PDF)
- Preview des images
- Indicateurs de lecture
- Realtime pour nouveaux messages
- Marquage automatique comme lu

### ✅ Envoi de Messages
- Textarea avec auto-resize
- Shift+Enter pour nouvelle ligne, Enter pour envoyer
- Upload de fichiers (images max 5MB, PDF max 10MB)
- Preview des fichiers avant envoi
- Validation des fichiers
- Loading state pendant l'envoi

### ✅ Responsive
- Desktop : Split view (liste 30% | conversation 70%)
- Mobile : Liste plein écran → Conversation plein écran avec bouton retour

### ✅ Notifications
- Badge dans le header avec nombre de messages non lus
- Realtime pour mise à jour automatique

## 🔧 Utilisation

### Ajouter le bouton "Contacter" dans une page

```tsx
import { ContactButton } from '@/components/messages/ContactButton'

// Dans votre composant
<ContactButton
  prestataireId={prestataire.id}
  demandeType="traiteur"
  cultures={["algérien", "français"]}
  eventDate="2024-06-15"
  eventLocation="Paris"
  estimatedBudget={5000}
  guestCount={150}
/>
```

### Ajouter les notifications dans le header

```tsx
import { MessageNotifications } from '@/components/messages/MessageNotifications'

// Dans votre header/navbar
<MessageNotifications />
```

## 📊 Structure de la Base de Données

Les tables `conversations` et `messages` sont déjà créées dans Supabase via la migration `create_messagerie_tables.sql`.

**Note importante** : La table `messages` n'a pas les colonnes `sender_type`, `content_type`, et `attachments`. Le code gère cela en :
- Stockant les attachments dans le champ `content` comme JSON
- Déterminant le `sender_type` en vérifiant la conversation
- Déterminant le `content_type` en analysant le contenu

## ⚠️ Fonctions SQL Requises

Le code utilise certaines fonctions SQL qui doivent être créées dans Supabase :

1. `mark_messages_as_read(conversation_id, user_id)` - Marquer comme lu
2. `get_unread_conversations_count(user_id)` - Compter conversations non lues
3. `archive_conversation(conversation_id, user_id)` - Archiver
4. `get_or_create_conversation(...)` - Obtenir ou créer conversation

**Si ces fonctions n'existent pas**, le code gère les erreurs gracieusement et utilise des méthodes alternatives.

## 🎨 Design

- Couleurs NUPLY : Purple/Pink gradient (`#823F91` → `#9D5FA8`)
- Messages couple : gradient purple → pink
- Messages prestataire : white background + border
- Badge non lu : purple avec nombre blanc

## 🚀 Prochaines Étapes (Optionnel)

Pour améliorer le système, vous pouvez :

1. **Créer les fonctions SQL** dans Supabase pour optimiser les performances
2. **Ajouter une colonne `status`** à la table `conversations` si elle n'existe pas
3. **Créer un bucket Supabase Storage** nommé `attachments` pour les fichiers
4. **Implémenter les indicateurs en ligne/hors ligne** (nécessite une table de présence)
5. **Ajouter la recherche dans les messages**
6. **Implémenter les réactions emoji**

## 📝 Notes Techniques

- Le système utilise Supabase Realtime pour les mises à jour en direct
- Les fichiers sont uploadés dans Supabase Storage (bucket `attachments`)
- Le système gère automatiquement le marquage comme lu
- Les conversations sont filtrées par RLS (Row Level Security) dans Supabase

## 🐛 Dépannage

Si vous rencontrez des erreurs :

1. **Vérifiez que les tables existent** dans Supabase
2. **Vérifiez que RLS est activé** et que les politiques sont correctes
3. **Vérifiez que le bucket `attachments` existe** dans Supabase Storage
4. **Vérifiez les variables d'environnement** Supabase dans `.env.local`

