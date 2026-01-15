# Architecture Messagerie & Demandes - Schéma Complet

## 📋 Vue d'ensemble

Ce document décrit l'architecture complète du système de **demandes** et **messagerie** dans Nuply, après migration vers la nouvelle structure `requests` → `conversations` → `messages`.

---

## 🗄️ Tables Supabase

### 1. `requests` (Demandes)

**Rôle** : Stocke les demandes initiales d'un couple vers un prestataire.

**Schéma** :
```sql
CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL,              -- auth.users.id du couple
  provider_id uuid NOT NULL,            -- auth.users.id du prestataire
  status request_status NOT NULL DEFAULT 'pending',
  initial_message text NOT NULL,        -- Message initial de la demande
  created_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,              -- Si annulée par le couple
  responded_at timestamptz               -- Si acceptée/refusée par le prestataire
);

-- Contrainte : 1 seule demande par binôme (couple_id, provider_id)
CREATE UNIQUE INDEX requests_unique_binome 
  ON public.requests (couple_id, provider_id);
```

**Statuts possibles** (`request_status` enum) :
- `pending` : En attente de réponse du prestataire
- `accepted` : Acceptée par le prestataire → **déclenche création conversation**
- `rejected` : Refusée par le prestataire
- `cancelled` : Annulée par le couple (uniquement si `pending`)

**Règles métier** :
- ✅ Un couple peut créer une demande (`status='pending'`)
- ✅ Un couple peut annuler sa demande (uniquement si `pending`)
- ✅ Un prestataire peut accepter/refuser (`pending` → `accepted`/`rejected`)
- ❌ **Aucun message ne peut être échangé tant que `status != 'accepted'`**

---

### 2. `conversations` (Conversations)

**Rôle** : Représente un canal de messagerie activé entre un couple et un prestataire.

**Schéma** :
```sql
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES public.requests(id) ON DELETE CASCADE,
  couple_id uuid NOT NULL,              -- auth.users.id du couple
  provider_id uuid NOT NULL,             -- auth.users.id du prestataire
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Règles métier** :
- ✅ **Créée automatiquement** via trigger SQL quand `requests.status` passe à `accepted`
- ✅ Relation **1:1** avec une `request` acceptée (`request_id` UNIQUE)
- ✅ **Pas de création manuelle** (RLS bloque les INSERT directs)
- ✅ Supprimée automatiquement si la `request` est supprimée (CASCADE)

**Workflow** :
```
Request (pending) → Prestataire accepte → Trigger SQL → Conversation créée → Chat activé
```

---

### 3. `messages` (Messages)

**Rôle** : Messages échangés dans une conversation.

**Schéma** :
```sql
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,               -- auth.users.id (couple OU prestataire)
  content text NOT NULL CHECK (char_length(content) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Règles métier** :
- ✅ Seuls les participants de la conversation peuvent envoyer/lire
- ✅ `sender_id` peut être `couple_id` OU `provider_id` de la conversation
- ✅ Realtime activé (Supabase Realtime) pour mise à jour instantanée

**Index** :
```sql
CREATE INDEX messages_conversation_created_idx
  ON public.messages (conversation_id, created_at ASC);
```

---

## 🔒 Sécurité (RLS)

### `requests`

**SELECT** : Les 2 parties peuvent voir leurs demandes
```sql
auth.uid() = couple_id OR auth.uid() = provider_id
```

**INSERT** : Seul le couple peut créer (status='pending' obligatoire)
```sql
auth.uid() = couple_id AND status = 'pending'
```

**UPDATE** :
- Prestataire : peut accepter/refuser (`pending` → `accepted`/`rejected`)
- Couple : peut annuler (`pending` → `cancelled`)

### `conversations`

**SELECT** : Les 2 parties peuvent voir leurs conversations
```sql
auth.uid() = couple_id OR auth.uid() = provider_id
```

**INSERT** : **BLOQUÉ** (création uniquement via trigger SQL)

### `messages`

**SELECT** : Seuls les participants peuvent lire
```sql
EXISTS (
  SELECT 1 FROM conversations c
  WHERE c.id = messages.conversation_id
    AND auth.uid() IN (c.couple_id, c.provider_id)
)
```

**INSERT** : Seuls les participants peuvent envoyer
```sql
sender_id = auth.uid()
AND EXISTS (
  SELECT 1 FROM conversations c
  WHERE c.id = messages.conversation_id
    AND auth.uid() IN (c.couple_id, c.provider_id)
)
```

---

## 🔄 Flux de données

### 1. Création d'une demande

```
Couple → INSERT requests {
  couple_id: auth.uid(),
  provider_id: prestataire.id,
  status: 'pending',
  initial_message: "Bonjour..."
}
```

**Contrainte** : Si une demande existe déjà pour ce binôme → erreur unique violation.

---

### 2. Acceptation d'une demande

```
Prestataire → UPDATE requests SET status='accepted' WHERE id=...
```

**Trigger SQL** (`handle_request_status_change`) :
```sql
IF new.status = 'accepted' THEN
  INSERT INTO conversations (request_id, couple_id, provider_id)
  VALUES (new.id, new.couple_id, new.provider_id)
  ON CONFLICT (request_id) DO NOTHING;
END IF;
```

**Résultat** : Une `conversation` est créée automatiquement.

---

### 3. Envoi d'un message

```
Utilisateur → INSERT messages {
  conversation_id: conversation.id,
  sender_id: auth.uid(),
  content: "Message texte..."
}
```

**Vérifications** :
- La conversation existe
- `auth.uid()` est bien `couple_id` OU `provider_id` de la conversation
- `sender_id = auth.uid()` (on ne peut pas envoyer au nom de quelqu'un d'autre)

**Realtime** : Les 2 parties reçoivent le message instantanément via Supabase Realtime.

---

## 📁 Structure Next.js

### Pages

```
app/
├── couple/
│   ├── demandes/
│   │   └── page.tsx              # Liste des requests (SSR)
│   └── messagerie/
│       ├── page.tsx              # Liste des conversations (SSR)
│       └── [conversationId]/
│           └── page.tsx          # Chat détaillé (SSR + Realtime)
│
└── prestataire/
    ├── demandes-recues/
    │   └── page.tsx              # Liste des requests reçues (Client)
    └── messagerie/
        ├── page.tsx              # Liste des conversations (SSR)
        └── [conversationId]/
            └── page.tsx          # Chat détaillé (SSR + Realtime)
```

### Composants

```
components/messaging/
├── ConversationList.tsx          # Liste des conversations (Client)
├── ConversationHeader.tsx        # Header avec infos autre partie
├── MessageList.tsx               # Liste messages + Realtime subscription
└── MessageInput.tsx              # Input pour envoyer messages
```

### Fonctions helper

```
lib/supabase/messaging.ts
├── getConversationsClient()      # Récupère conversations (Client)
├── getConversationsServer()       # Récupère conversations (Server)
├── getMessagesClient()           # Récupère messages (Client)
├── getMessagesServer()           # Récupère messages (Server)
└── sendMessage()                 # Envoie un message
```

---

## 🔧 Configuration requise

### 1. Activer Realtime sur `messages`

Dans Supabase SQL Editor :
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

### 2. Migrations à exécuter

1. **018_messaging_v2_requests_conversations_messages.sql** : Crée les tables + RLS + trigger
2. **019_drop_old_demandes_table.sql** : Supprime l'ancienne table `demandes` (après migration données)

---

## 🗑️ Ancienne table `demandes` (à supprimer)

**État** : ❌ **Dépréciée** - Migration vers `requests` effectuée

**Ancien schéma** :
- `couple_id` référençait `couples.id` (pas `auth.users.id`)
- `prestataire_id` référençait `profiles.id`
- Statuts différents : `'new'`, `'viewed'`, `'responded'`, `'accepted'`, `'rejected'`

**Migration** : Voir `scripts/migrate-demandes-to-requests.sql`

---

## ✅ Checklist de vérification

- [x] Tables créées (`requests`, `conversations`, `messages`)
- [x] RLS activé sur toutes les tables
- [x] Trigger SQL pour création automatique de conversation
- [x] Realtime activé sur `messages`
- [x] Pages Next.js créées (liste + détail)
- [x] Composants React créés
- [x] Fonctions helper Supabase créées
- [x] Anciennes références à `demandes` supprimées du code
- [ ] Migration données `demandes` → `requests` (si données existantes)
- [ ] Suppression table `demandes` (après migration)

---

## 🚀 Prochaines étapes

1. **Tester le flux complet** :
   - Créer une demande (couple)
   - Accepter (prestataire)
   - Vérifier création conversation automatique
   - Envoyer des messages et vérifier realtime

2. **Migrer les données existantes** (si nécessaire) :
   - Exécuter `scripts/migrate-demandes-to-requests.sql`
   - Vérifier les données migrées

3. **Supprimer l'ancienne table** :
   - Exécuter `supabase/migrations/019_drop_old_demandes_table.sql`

---

## 📝 Notes importantes

- **IDs** : `couple_id` et `provider_id` sont toujours des `auth.users.id` (UUID)
- **Unicité** : 1 seule demande par binôme (couple, prestataire)
- **Chat** : Activé uniquement si `request.status = 'accepted'`
- **Realtime** : Nécessite activation dans Supabase (`ALTER PUBLICATION`)
