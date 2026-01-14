# 🤖 Configuration Agent IA - n8n Webhook

## 📋 Vue d'ensemble

L'agent IA conversationnel est connecté à n8n via un webhook. Ce document explique comment configurer le workflow n8n pour traiter les messages et générer des suggestions d'amélioration de profil.

## 🔧 Configuration

### 1. Variable d'environnement

Ajoutez dans votre `.env.local` :

```env
N8N_WEBHOOK_CHATBOT_URL=https://votre-instance-n8n.com/webhook/chatbot
```

> **Note** : Le chatbot passe par l'API `/api/chatbot` (variable serveur) pour des raisons de sécurité.

### 2. Workflow n8n suggéré

```
┌─────────────────┐
│ Webhook Trigger │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Extract Context │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Call OpenAI API │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Parse Response  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate Suggestion │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return Response │
└─────────────────┘
```

## 📨 Format de la requête

Le frontend envoie cette structure JSON au webhook via l'API `/api/chatbot` :

```json
{
  "message": "Comment puis-je vous aider ?",
  "sessionId": "unique-session-id"
}
```

> **Note** : Le message est automatiquement sanitisé et validé par l'API. L'historique de conversation est géré côté client et peut être récupéré depuis Supabase si nécessaire.

## 📤 Format de réponse attendu

n8n doit retourner cette structure :

```json
{
  "response": "Bonjour ! Je suis là pour vous aider avec NUPLY. Comment puis-je vous assister aujourd'hui ?"
}
```

### Champs de réponse

- **response** (string, requis) : La réponse textuelle de l'assistant

> **Note** : L'API accepte aussi `output` ou `message` comme clé alternative pour la compatibilité.

## 🎯 Exemple de workflow n8n

### Node 1: Webhook

- **Method**: POST
- **Path**: `/webhook/chatbot`
- **Response Mode**: Respond to Webhook

### Node 2: Extract Message (Code)

```javascript
const body = $input.item.json;

return {
  message: body.message,
  sessionId: body.sessionId
};
```

### Node 3: OpenAI API Call

**System Prompt**:
```
Tu es l'assistant NUPLY, une plateforme de mariage moderne.
Tu aides les utilisateurs avec leurs questions sur le mariage, les prestataires, le budget, la planification, etc.

Réponds de manière professionnelle, bienveillante et concise.
```

**User Message**: `{{$json.message}}`

### Node 4: Format Response (Code)

```javascript
const openAIResponse = $input.item.json;
const assistantMessage = openAIResponse.choices[0].message.content;

return {
  response: assistantMessage.trim()
};
```

### Node 5: Respond to Webhook

Retourner directement le JSON formaté.

## 🧪 Test du webhook

Vous pouvez tester avec curl :

```bash
curl -X POST https://votre-instance-n8n.com/webhook/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bonjour, comment puis-je vous aider ?",
    "sessionId": "test-session-123"
  }'
```

## 🔒 Sécurité

- Utilisez l'authentification n8n (API Key ou Basic Auth)
- Validez les requêtes entrantes
- Limitez le taux de requêtes (rate limiting)
- Sanitize les inputs utilisateur

## 📝 Notes

- Le webhook doit répondre en moins de 30 secondes
- En cas d'erreur, retourner un message d'erreur dans `response`
- Les suggestions sont optionnelles mais recommandées pour une meilleure UX
- L'historique de conversation permet un contexte conversationnel

## 🚀 Déploiement

1. Créez le workflow dans n8n
2. Activez le workflow
3. Copiez l'URL du webhook
4. Ajoutez-la dans `.env.local` comme `N8N_WEBHOOK_CHATBOT_URL`
5. Redémarrez l'application Next.js

