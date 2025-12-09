# 🤖 Configuration Agent IA - n8n Webhook

## 📋 Vue d'ensemble

L'agent IA conversationnel est connecté à n8n via un webhook. Ce document explique comment configurer le workflow n8n pour traiter les messages et générer des suggestions d'amélioration de profil.

## 🔧 Configuration

### 1. Variable d'environnement

Ajoutez dans votre `.env.local` :

```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://votre-instance-n8n.com/webhook/agent-profil
```

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

Le frontend envoie cette structure JSON au webhook :

```json
{
  "message": "Comment améliorer ma description ?",
  "context": {
    "description": "Photographe depuis 10 ans...",
    "services_count": 2,
    "portfolio_count": 15
  },
  "conversation_history": [
    {
      "role": "user",
      "content": "Bonjour"
    },
    {
      "role": "assistant",
      "content": "Bonjour ! Comment puis-je vous aider ?"
    }
  ]
}
```

## 📤 Format de réponse attendu

n8n doit retourner cette structure :

```json
{
  "response": "Votre description actuelle est bonne, mais je recommande d'ajouter...",
  "suggestion": {
    "type": "description",
    "action": "apply",
    "data": {
      "improved_text": "Photographe professionnel spécialisé dans les mariages multiculturels..."
    }
  }
}
```

### Champs de réponse

- **response** (string, requis) : La réponse textuelle de l'assistant
- **suggestion** (object, optionnel) : Une suggestion actionnable
  - **type** : `"description"` | `"service"` | `"general"`
  - **action** : `"apply"` | `"review"`
  - **data** : Données spécifiques selon le type

## 🎯 Exemple de workflow n8n

### Node 1: Webhook

- **Method**: POST
- **Path**: `/webhook/agent-profil`
- **Response Mode**: Respond to Webhook

### Node 2: Extract Context (Code)

```javascript
const body = $input.item.json;

return {
  message: body.message,
  description: body.context.description,
  servicesCount: body.context.services_count,
  portfolioCount: body.context.portfolio_count,
  history: body.conversation_history
};
```

### Node 3: OpenAI API Call

**System Prompt**:
```
Tu es un expert en marketing pour prestataires de mariage. 
Tu aides les prestataires à optimiser leur profil pour attirer plus de clients.

Contexte du profil:
- Description actuelle: {{$json.description}}
- Nombre de services: {{$json.servicesCount}}
- Nombre de photos portfolio: {{$json.portfolioCount}}

Historique de conversation:
{{$json.history}}

Réponds de manière professionnelle et bienveillante. 
Si tu proposes une amélioration, inclut-la dans le champ "suggestion".
```

**User Message**: `{{$json.message}}`

### Node 4: Parse & Format Response (Code)

```javascript
const openAIResponse = $input.item.json;
const assistantMessage = openAIResponse.choices[0].message.content;

// Extraire une suggestion si présente dans la réponse
let suggestion = null;
if (assistantMessage.includes('SUGGESTION:')) {
  const suggestionMatch = assistantMessage.match(/SUGGESTION:(.*)/s);
  if (suggestionMatch) {
    suggestion = {
      type: "description",
      action: "apply",
      data: {
        improved_text: suggestionMatch[1].trim()
      }
    };
  }
}

return {
  response: assistantMessage.replace(/SUGGESTION:.*/s, '').trim(),
  suggestion: suggestion
};
```

### Node 5: Respond to Webhook

Retourner directement le JSON formaté.

## 🧪 Test du webhook

Vous pouvez tester avec curl :

```bash
curl -X POST https://votre-instance-n8n.com/webhook/agent-profil \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Comment améliorer ma description ?",
    "context": {
      "description": "Photographe depuis 10 ans",
      "services_count": 2,
      "portfolio_count": 15
    },
    "conversation_history": []
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
4. Ajoutez-la dans `.env.local` comme `NEXT_PUBLIC_N8N_WEBHOOK_URL`
5. Redémarrez l'application Next.js

