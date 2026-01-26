# Système de Notifications Email Automatiques

Ce document décrit le système de notifications email automatiques pour Nuply.

## 📋 Vue d'ensemble

Le système envoie automatiquement des emails pour 5 événements :

1. **Nouvelle demande reçue** → Email au prestataire
2. **Demande acceptée** → Email au couple
3. **Demande refusée** → Email au couple
4. **Nouveau message non lu (après 5min)** → Email au destinataire
5. **Nouveau devis reçu** → Email au couple

## 📁 Structure des fichiers

- `/lib/email/templates.ts` - Template HTML réutilisable avec branding Nuply
- `/lib/email/notifications.ts` - 5 fonctions d'envoi d'emails
- `/app/api/messages/check-unread/route.ts` - Route API pour vérifier les messages non lus

## 🔧 Configuration

Les variables d'environnement suivantes sont requises :

```env
RESEND_API_KEY=votre_clé_api_resend
RESEND_FROM_EMAIL=noreply@votre-domaine.com
NEXT_PUBLIC_SITE_URL=https://votre-site.com
```

## 📧 Fonctions disponibles

### 1. `sendNewRequestEmail`
**Où :** Déjà intégré dans `components/provider/ProfilePreviewDialog.tsx`

Envoie un email au prestataire lorsqu'il reçoit une nouvelle demande.

```typescript
import { sendNewRequestEmail } from '@/lib/email/notifications'

await sendNewRequestEmail(
  providerId,
  coupleId,
  requestId,
  requestMessage // optionnel
)
```

### 2. `sendRequestAcceptedEmail`
**Où :** Déjà intégré dans `app/prestataire/demandes-recues/page.tsx`

Envoie un email au couple lorsque sa demande est acceptée.

```typescript
import { sendRequestAcceptedEmail } from '@/lib/email/notifications'

await sendRequestAcceptedEmail(
  coupleId,
  providerId,
  requestId
)
```

### 3. `sendRequestRejectedEmail`
**Où :** Déjà intégré dans `app/prestataire/demandes-recues/page.tsx`

Envoie un email au couple lorsque sa demande est refusée.

```typescript
import { sendRequestRejectedEmail } from '@/lib/email/notifications'

await sendRequestRejectedEmail(
  coupleId,
  providerId,
  requestId
)
```

### 4. `sendNewMessageEmail`
**Où :** Route API `/app/api/messages/check-unread/route.ts`

Envoie un email au destinataire si un message n'est pas lu après 5 minutes.

**Utilisation :**
- Appeler la route API périodiquement (cron job) : `POST /api/messages/check-unread`
- Ou intégrer dans votre système de vérification périodique

```typescript
// Exemple d'appel depuis un cron job ou webhook
fetch('/api/messages/check-unread', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
```

**Note :** Pour un système plus robuste, configurez un cron job (Vercel Cron, Supabase Edge Functions, etc.) qui appelle cette route toutes les 5 minutes.

### 5. `sendNewDevisEmail`
**Où :** À intégrer où les devis sont créés

Envoie un email au couple lorsqu'un nouveau devis est reçu.

**Exemple d'intégration :**

```typescript
import { sendNewDevisEmail } from '@/lib/email/notifications'

// Après l'insertion d'un devis dans la table devis
const { data: newDevis, error } = await supabase
  .from('devis')
  .insert({
    demande_id,
    prestataire_id,
    couple_id,
    amount,
    description,
    // ... autres champs
  })
  .select()
  .single()

if (!error && newDevis) {
  // Envoyer l'email (sans bloquer le flow)
  try {
    await sendNewDevisEmail(
      couple_id,
      prestataire_id,
      newDevis.id,
      amount
    )
  } catch (emailError) {
    console.error('Erreur envoi email devis:', emailError)
    // Ne pas bloquer si l'email échoue
  }
}
```

## 🎨 Design des emails

Tous les emails utilisent le même template avec :
- Gradient violet Nuply (#823F91 → #c081e3)
- Design responsive
- Boutons d'action avec liens vers l'application
- Footer avec branding Nuply

## ⚠️ Gestion des erreurs

Toutes les fonctions utilisent `try/catch` et ne bloquent **jamais** le flow principal :

```typescript
try {
  await sendNewRequestEmail(...)
} catch (emailError) {
  // Log l'erreur mais ne bloque pas l'opération
  console.error('Erreur envoi email:', emailError)
}
```

## 🔄 Cron Job pour messages non lus

Pour vérifier automatiquement les messages non lus après 5 minutes, configurez un cron job :

### Vercel Cron
Créez `vercel.json` :

```json
{
  "crons": [{
    "path": "/api/messages/check-unread",
    "schedule": "*/5 * * * *"
  }]
}
```

### Supabase Edge Functions
Créez une Edge Function qui appelle votre route API toutes les 5 minutes.

## 📝 Notes importantes

1. **Les emails sont envoyés de manière asynchrone** et ne bloquent jamais les opérations principales
2. **Les erreurs d'envoi sont loggées** mais n'affectent pas l'expérience utilisateur
3. **Tous les emails sont en français** comme spécifié dans les requirements
4. **Les liens utilisent `NEXT_PUBLIC_SITE_URL`** pour être compatibles avec tous les environnements

## 🚀 Prochaines étapes

1. Intégrer `sendNewDevisEmail` où les devis sont créés dans votre application
2. Configurer un cron job pour vérifier les messages non lus toutes les 5 minutes
3. Tester tous les scénarios d'envoi d'emails
4. Monitorer les logs pour détecter les erreurs d'envoi
