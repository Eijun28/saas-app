# Fix des Erreurs Serveur en Production

## Problèmes identifiés et corrigés

### 1. ✅ Variables d'environnement manquantes causant des crashes

**Problème** : Les fichiers `lib/supabase/client.ts`, `lib/supabase/server.ts`, et `lib/supabase/admin.ts` utilisaient `requireEnv()` qui lançait une erreur si les variables d'environnement étaient manquantes. Cela faisait planter l'application au démarrage en production.

**Solution** : 
- Modification pour vérifier gracieusement les variables d'environnement
- Retour d'un client Supabase avec des valeurs vides plutôt qu'un crash
- Les routes API vérifient maintenant la configuration avant utilisation

**Fichiers modifiés** :
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`
- `lib/supabase/middleware.ts`

### 2. ✅ Gestion d'erreur améliorée dans les routes API

**Problème** : Certaines routes API ne géraient pas correctement les erreurs, causant des erreurs serveur génériques sans détails.

**Solution** :
- Création d'un utilitaire `lib/api-error-handler.ts` pour gérer uniformément les erreurs
- Ajout de validation Supabase au début de chaque route API critique
- Messages d'erreur plus informatifs en développement, sécurisés en production

**Fichiers modifiés** :
- `app/api/marriage-admin/create/route.ts`
- `app/api/marriage-admin/generate-document/route.ts`
- `app/api/marriage-admin/upload-document/route.ts`
- `app/api/collaborateurs/invite/route.ts`
- `app/api/chatbot/route.ts`

### 3. ✅ Gestion d'erreur globale

**Problème** : Pas de capture des erreurs globales non gérées.

**Solution** :
- Création de `app/global-error.tsx` pour capturer les erreurs critiques
- Amélioration de `app/error.tsx` pour les erreurs de composants

**Fichiers créés/modifiés** :
- `app/global-error.tsx` (nouveau)
- `lib/api-error-handler.ts` (nouveau)

## Vérifications à faire en production

### 1. Variables d'environnement

Assurez-vous que toutes les variables suivantes sont configurées dans votre plateforme de déploiement (Vercel, etc.) :

```env
# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site URL (OBLIGATOIRE)
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Email (optionnel mais recommandé)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# OpenAI (optionnel)
OPENAI_API_KEY=sk-your-key

# Stripe (si vous utilisez les paiements)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PREMIUM=price_...
STRIPE_PRICE_ID_PRO=price_...

# N8N (optionnel)
N8N_WEBHOOK_CHATBOT_URL=https://your-n8n-instance.com/webhook/chatbot
```

### 2. Vérifier les logs

Après déploiement, vérifiez les logs pour :
- Messages `[CRITICAL]` indiquant des variables d'environnement manquantes
- Messages `[ERROR]` dans les routes API
- Erreurs Supabase

### 3. Tester les routes API critiques

Testez manuellement ou avec des outils comme Postman :
- `/api/marriage-admin/create` (POST)
- `/api/marriage-admin/upload-document` (POST)
- `/api/collaborateurs/invite` (POST)
- `/api/chatbot` (POST)

### 4. Monitoring recommandé

Pour une meilleure visibilité en production, considérez d'ajouter :
- **Sentry** pour le tracking d'erreurs
- **LogRocket** pour le replay de sessions
- **Vercel Analytics** pour les métriques

## Comment tester localement

1. **Simuler des variables manquantes** :
```bash
# Supprimez temporairement une variable
unset NEXT_PUBLIC_SUPABASE_URL
npm run dev
# L'application devrait démarrer mais afficher des erreurs dans les logs
```

2. **Tester une route API avec erreur** :
```bash
# Appel sans authentification
curl -X POST http://localhost:3000/api/marriage-admin/create
# Devrait retourner {"error":"Unauthorized"} avec status 401
```

## Prochaines étapes recommandées

1. ✅ **Ajouter Sentry** pour le monitoring d'erreurs en production
2. ✅ **Créer des tests E2E** pour les routes API critiques
3. ✅ **Documenter les codes d'erreur** pour faciliter le debugging
4. ✅ **Ajouter des métriques** pour suivre le taux d'erreur

## Notes importantes

- Les erreurs en production ne montrent plus les détails techniques aux utilisateurs (sécurité)
- En développement, les erreurs affichent plus de détails pour faciliter le debugging
- Toutes les routes API retournent maintenant des réponses JSON cohérentes même en cas d'erreur
