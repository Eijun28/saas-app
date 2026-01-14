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
# STRIPE (OBLIGATOIRE pour les abonnements prestataires)
# ============================================
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID_PREMIUM=price_your_premium_price_id
STRIPE_PRICE_ID_PRO=price_your_pro_price_id

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

