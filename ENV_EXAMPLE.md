# Variables d'environnement requises

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
# ============================================
# SUPABASE
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ============================================
# EMAIL (RESEND)
# ============================================
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@votredomaine.com

# ============================================
# APPLICATION
# ============================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ============================================
# OPENAI (optionnel)
# ============================================
OPENAI_API_KEY=sk-your-openai-api-key-here

# ============================================
# N8N (optionnel)
# ============================================
N8N_WEBHOOK_CHATBOT_URL=https://your-n8n-instance.com/webhook/chatbot
```

## Installation de Resend

Pour activer l'envoi d'emails, installez Resend :

```bash
npm install resend
```

Puis obtenez votre clé API sur https://resend.com/api-keys

