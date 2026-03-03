# Système de Notifications Email Automatiques

Ce document décrit le système de notifications email automatiques pour Nuply.

## 📋 Vue d'ensemble

Le système envoie automatiquement des emails pour 5 événements :

1. **Nouvelle demande reçue** → Email au prestataire
2. **Demande acceptée** → Email au couple
3. **Demande refusée** → Email au couple
4. **Nouveau message non lu** → Email au destinataire (digest quotidien)
5. **Nouveau devis reçu** → Email au couple

## 📁 Structure des fichiers

- `/lib/email/templates.ts` - Template HTML réutilisable avec branding Nuply
- `/lib/email/notifications.ts` - 5 fonctions d'envoi d'emails
- `/app/api/notifications/route.ts` - Route API unifiée pour les emails transactionnels
- `/app/api/cron/email-sequences/route.ts` - Cron daily (séquences + messages non lus)

## 🔧 Configuration

Les variables d'environnement suivantes sont requises :

```env
RESEND_API_KEY=votre_clé_api_resend
RESEND_FROM_EMAIL=noreply@votre-domaine.com
NEXT_PUBLIC_SITE_URL=https://votre-site.com
CRON_SECRET=votre_secret_cron
```

## 📧 Fonctions disponibles

### 1. `sendNewRequestEmail`
**Où :** Déclenché via `POST /api/notifications` depuis `ProfilePreviewDialog`

Envoie un email au prestataire lorsqu'il reçoit une nouvelle demande.

```typescript
// Via l'API route (depuis les client components)
await fetch('/api/notifications', {
  method: 'POST',
  body: JSON.stringify({ type: 'new_request', providerId, coupleId, requestId, message })
})
```

### 2. `sendRequestAcceptedEmail`
**Où :** Déclenché via `POST /api/notifications` depuis `demandes-recues`

Envoie un email au couple lorsque sa demande est acceptée.

### 3. `sendRequestRejectedEmail`
**Où :** Déclenché via `POST /api/notifications` depuis `demandes-recues`

Envoie un email au couple lorsque sa demande est refusée.

### 4. `sendNewMessageEmail`
**Où :** Intégré dans le cron daily `/api/cron/email-sequences`

Envoie un email de notification pour les messages non lus des dernières 24h.
La logique de déduplication via `email_logs` garantit un seul email par conversation par jour.

### 5. `sendNewDevisEmail`
**Où :** À intégrer où les devis sont créés

Envoie un email au couple lorsqu'un nouveau devis est reçu.

```typescript
// Via l'API route
await fetch('/api/notifications', {
  method: 'POST',
  body: JSON.stringify({ type: 'new_devis', coupleId, providerId, devisId, amount })
})
```

## 🔄 Cron daily (Vercel Hobby — 1 cron/jour)

Un seul cron tourne quotidiennement à 09:00 (`vercel.json`) :

```
POST /api/cron/email-sequences
```

Il gère en séquence :
1. Relances profils incomplets prestataires (J+1, J+3, J+7)
2. Relances profils incomplets couples (J+1, J+3, J+7)
3. Rappel demandes en attente (prestataires)
4. Relance inactivité (14 jours)
5. Séquence profil < 70% prestataires (J+2, J+4, J+7)
6. **Messages non lus des dernières 24h** — un email par conversation/destinataire maximum

## 🎨 Design des emails

Tous les emails utilisent le même template avec :
- Gradient violet Nuply (#823F91 → #c081e3)
- Design responsive
- Boutons d'action avec liens vers l'application
- Footer avec branding Nuply

## ⚠️ Gestion des erreurs

Toutes les fonctions utilisent `try/catch` et ne bloquent **jamais** le flow principal. La route `/api/notifications` retourne toujours HTTP 200 pour ne pas bloquer le client, même en cas d'échec d'envoi.

## 📝 Notes importantes

1. **Les emails sont envoyés de manière asynchrone** et ne bloquent jamais les opérations principales
2. **Les erreurs d'envoi sont loggées** mais n'affectent pas l'expérience utilisateur
3. **Tous les emails sont en français** comme spécifié dans les requirements
4. **Les liens utilisent `NEXT_PUBLIC_SITE_URL`** pour être compatibles avec tous les environnements
5. **Déduplication via `email_logs`** — pas de doublon par type/utilisateur/période
