# Configuration Stripe pour Nuply

## Vue d'ensemble

Stripe est intégré pour gérer les abonnements des prestataires (plans Premium et Pro).

## Installation

Stripe est déjà installé dans `package.json`. Si besoin :

```bash
npm install stripe
```

## Configuration

### 1. Créer un compte Stripe

1. Aller sur https://stripe.com
2. Créer un compte (gratuit)
3. Activer le mode Test pour commencer

### 2. Obtenir les clés API

1. Dans le Dashboard Stripe, aller dans **Developers** → **API keys**
2. Copier :
   - **Secret key** (commence par `sk_test_` en mode test, `sk_live_` en production)
   - **Publishable key** (commence par `pk_test_` en mode test, `pk_live_` en production)

### 3. Créer les produits et prix dans Stripe

#### A. Créer le produit Premium

1. Aller dans **Products** → **Add product**
2. Nom : `Prestataire Premium`
3. Description : `Abonnement Premium pour prestataires`
4. Prix : `49.00 EUR` / mois (recurring)
5. Copier le **Price ID** (commence par `price_`)

#### B. Créer le produit Pro

1. Aller dans **Products** → **Add product**
2. Nom : `Prestataire Pro`
3. Description : `Abonnement Pro pour prestataires`
4. Prix : `79.00 EUR` / mois (recurring)
5. Copier le **Price ID** (commence par `price_`)

### 4. Configurer les variables d'environnement

Ajouter dans `.env.local` :

```env
# ============================================
# STRIPE (OBLIGATOIRE pour les abonnements)
# ============================================
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook
STRIPE_PRICE_ID_PREMIUM=price_votre_price_id_premium
STRIPE_PRICE_ID_PRO=price_votre_price_id_pro
```

### 5. Configurer le webhook Stripe

#### A. Créer le webhook endpoint

1. Dans Stripe Dashboard, aller dans **Developers** → **Webhooks**
2. Cliquer sur **Add endpoint**
3. URL : `https://votredomaine.com/api/stripe/webhook`
4. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copier le **Signing secret** (commence par `whsec_`)

#### B. Pour le développement local

Utiliser Stripe CLI pour tester les webhooks en local :

```bash
# Installer Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: télécharger depuis https://stripe.com/docs/stripe-cli

# Se connecter
stripe login

# Forwarder les webhooks vers localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Le secret webhook sera affiché dans le terminal (commence par `whsec_`).

### 6. Exécuter la migration SQL

Exécuter dans Supabase SQL Editor :

```sql
-- Le fichier est dans : supabase/migrations/008_create_subscriptions_table.sql
```

Ou copier-coller le contenu du fichier.

## Utilisation

### Pour les utilisateurs

1. Aller sur `/tarifs`
2. Sélectionner "Pour les prestataires"
3. Cliquer sur "Passer Premium" ou "Devenir Pro"
4. Redirection vers Stripe Checkout
5. Après paiement, redirection vers `/prestataire/dashboard?success=true`

### Pour les développeurs

#### Créer une session de checkout

```typescript
import { createCheckoutSession } from '@/lib/actions/stripe'

const result = await createCheckoutSession('premium')
if (result.success && result.url) {
  window.location.href = result.url
}
```

#### Annuler un abonnement

```typescript
import { cancelSubscription } from '@/lib/actions/stripe'

const result = await cancelSubscription()
```

## Structure de la base de données

La table `subscriptions` contient :

- `user_id` : ID de l'utilisateur
- `stripe_customer_id` : ID du customer Stripe
- `stripe_subscription_id` : ID de l'abonnement Stripe
- `stripe_price_id` : ID du prix Stripe
- `plan_type` : 'premium' ou 'pro'
- `status` : 'active', 'canceled', 'past_due', 'trialing', 'incomplete'
- `current_period_start` / `current_period_end` : Dates de période
- `cancel_at_period_end` : Si l'abonnement sera annulé à la fin de la période

## Vérification

### Tester le flux complet

1. Créer un compte prestataire
2. Aller sur `/tarifs`
3. Cliquer sur un plan payant
4. Utiliser une carte de test Stripe :
   - Numéro : `4242 4242 4242 4242`
   - Date : n'importe quelle date future
   - CVC : n'importe quel 3 chiffres
5. Vérifier que l'abonnement apparaît dans :
   - Stripe Dashboard → Customers
   - Supabase → Table `subscriptions`

### Vérifier les webhooks

1. Dans Stripe Dashboard → Webhooks
2. Vérifier que les événements sont reçus
3. Vérifier les logs dans Vercel/Next.js

## Passage en production

1. Activer le mode Live dans Stripe Dashboard
2. Obtenir les nouvelles clés API (Live)
3. Mettre à jour les variables d'environnement dans Vercel
4. Créer les produits/prix en mode Live
5. Configurer le webhook avec l'URL de production
6. Tester avec une vraie carte (petit montant)

## Support

- Documentation Stripe : https://stripe.com/docs
- API Reference : https://stripe.com/docs/api
- Webhooks Guide : https://stripe.com/docs/webhooks
