# 📧 Configuration des Alertes Email Resend pour Nuply

Ce guide vous explique comment configurer les alertes email automatiques pour les demandes, messages et autres événements importants de la plateforme.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration de base Resend](#configuration-de-base-resend)
3. [Création des fonctions d'alerte](#création-des-fonctions-dalerte)
4. [Intégration avec les événements](#intégration-avec-les-événements)
5. [Templates d'emails](#templates-demails)
6. [Tests et vérification](#tests-et-vérification)

---

## ✅ Prérequis

- Compte Resend configuré (voir `docs/setup/SETUP_RESEND.md`)
- Variables d'environnement Resend configurées dans `.env.local`
- Accès à la base de données Supabase pour créer les triggers

---

## 🔧 Configuration de base Resend

### Variables d'environnement requises

Assurez-vous d'avoir ces variables dans votre `.env.local` :

```env
# Resend Configuration
RESEND_API_KEY=re_VOTRE_CLE_API_ICI
RESEND_FROM_EMAIL=onboarding@resend.dev  # ou votre domaine vérifié
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # ou votre URL de production
```

---

## 📝 Création des fonctions d'alerte

### 1. Créer le fichier de fonctions d'alertes

Créez `lib/email/alerts.ts` avec les fonctions suivantes :

```typescript
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * Envoie une alerte lorsqu'un prestataire reçoit une nouvelle demande
 */
export async function sendNewRequestAlertToProvider(
  providerId: string,
  providerEmail: string,
  coupleName: string,
  requestMessage: string,
  requestId: string
) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée - alerte non envoyée')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const resend = new Resend(resendApiKey)

    const subject = `🎉 Nouvelle demande reçue de ${coupleName}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #823F91 0%, #c081e3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nouvelle demande ! 🎉</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Bonjour,</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Vous avez reçu une nouvelle demande de <strong>${coupleName}</strong> !
            </p>

            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #823F91;">Message :</p>
              <p style="margin: 0; color: #666; font-style: italic;">"${requestMessage}"</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/prestataire/demandes-recues" 
                 style="display: inline-block; padding: 14px 28px; background-color: #823F91; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Voir la demande
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Répondez rapidement pour augmenter vos chances d'être sélectionné !<br><br>
              L'équipe Nuply 💜
            </p>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: fromEmail,
      to: providerEmail,
      subject,
      html,
    })

    logger.info('✅ Alerte nouvelle demande envoyée au prestataire', { providerId, requestId })
    return { success: true }
  } catch (error: any) {
    logger.error('Erreur envoi alerte demande prestataire:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Envoie une alerte lorsqu'un couple reçoit une réponse à sa demande
 */
export async function sendRequestResponseAlertToCouple(
  coupleEmail: string,
  coupleName: string,
  providerName: string,
  status: 'accepted' | 'rejected',
  requestId: string
) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée - alerte non envoyée')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const resend = new Resend(resendApiKey)

    const isAccepted = status === 'accepted'
    const subject = isAccepted 
      ? `✅ ${providerName} a accepté votre demande !`
      : `❌ ${providerName} a décliné votre demande`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${isAccepted ? '#10b981' : '#ef4444'} 0%, ${isAccepted ? '#34d399' : '#f87171'} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">
              ${isAccepted ? 'Demande acceptée ! ✅' : 'Demande déclinée'}
            </h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Bonjour ${coupleName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${providerName}</strong> a ${isAccepted ? 'accepté' : 'décliné'} votre demande.
            </p>

            ${isAccepted ? `
              <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #065f46; font-weight: 600;">🎉 Excellente nouvelle !</p>
                <p style="margin: 10px 0 0 0; color: #047857;">
                  Vous pouvez maintenant contacter ${providerName} via la messagerie pour discuter des détails de votre projet.
                </p>
              </div>
            ` : `
              <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <p style="margin: 0; color: #991b1b;">
                  Ne vous découragez pas ! Il y a beaucoup d'autres prestataires qui pourraient correspondre à votre projet.
                </p>
              </div>
            `}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/couple/demandes" 
                 style="display: inline-block; padding: 14px 28px; background-color: #823F91; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Voir mes demandes
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              L'équipe Nuply 💜
            </p>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: fromEmail,
      to: coupleEmail,
      subject,
      html,
    })

    logger.info('✅ Alerte réponse demande envoyée au couple', { coupleEmail, status, requestId })
    return { success: true }
  } catch (error: any) {
    logger.error('Erreur envoi alerte réponse couple:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Envoie une alerte lorsqu'un nouveau message est reçu
 */
export async function sendNewMessageAlert(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
) {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY non configurée - alerte non envoyée')
    return { success: false, error: 'RESEND_API_KEY non configurée' }
  }

  try {
    const resend = new Resend(resendApiKey)

    const subject = `💬 Nouveau message de ${senderName}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #823F91 0%, #c081e3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nouveau message 💬</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Bonjour ${recipientName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Vous avez reçu un nouveau message de <strong>${senderName}</strong>.
            </p>

            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #823F91;">
              <p style="margin: 0; color: #666; font-style: italic;">"${messagePreview}"</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/couple/messagerie/${conversationId}" 
                 style="display: inline-block; padding: 14px 28px; background-color: #823F91; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Répondre
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              L'équipe Nuply 💜
            </p>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject,
      html,
    })

    logger.info('✅ Alerte nouveau message envoyée', { recipientEmail, conversationId })
    return { success: true }
  } catch (error: any) {
    logger.error('Erreur envoi alerte message:', error)
    return { success: false, error: error.message }
  }
}
```

---

## 🔗 Intégration avec les événements

### Option 1 : Via les API Routes Next.js

Créez des routes API qui seront appelées lors des événements :

**`app/api/notifications/new-request/route.ts`** :
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { sendNewRequestAlertToProvider } from '@/lib/email/alerts'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { requestId, providerId } = await request.json()
    
    const adminClient = createAdminClient()
    
    // Récupérer les infos du prestataire
    const { data: provider } = await adminClient.auth.admin.getUserById(providerId)
    const { data: profile } = await adminClient
      .from('profiles')
      .select('nom_entreprise')
      .eq('id', providerId)
      .single()
    
    // Récupérer les infos de la demande
    const { data: requestData } = await adminClient
      .from('requests')
      .select('couple_id, initial_message')
      .eq('id', requestId)
      .single()
    
    // Récupérer le nom du couple
    const { data: couple } = await adminClient
      .from('couples')
      .select('partner_1_name, partner_2_name')
      .eq('user_id', requestData.couple_id)
      .single()
    
    const coupleName = couple?.partner_1_name && couple?.partner_2_name
      ? `${couple.partner_1_name} & ${couple.partner_2_name}`
      : couple?.partner_1_name || couple?.partner_2_name || 'un couple'
    
    // Envoyer l'email
    await sendNewRequestAlertToProvider(
      providerId,
      provider.user.email!,
      coupleName,
      requestData.initial_message,
      requestId
    )
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erreur notification:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Option 2 : Via les triggers Supabase (Recommandé)

Créez une fonction PostgreSQL qui sera appelée automatiquement :

**Migration SQL** (`supabase/migrations/XXX_add_email_notifications.sql`) :

```sql
-- Fonction pour envoyer une notification email lors d'une nouvelle demande
CREATE OR REPLACE FUNCTION notify_new_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Appeler l'API Next.js pour envoyer l'email
  PERFORM net.http_post(
    url := current_setting('app.api_url', true) || '/api/notifications/new-request',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.api_key', true)
    ),
    body := jsonb_build_object(
      'requestId', NEW.id,
      'providerId', NEW.provider_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur la table requests
CREATE TRIGGER on_new_request
  AFTER INSERT ON requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_new_request();

-- Fonction pour notifier les changements de statut
CREATE OR REPLACE FUNCTION notify_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut change vers accepted ou rejected
  IF NEW.status != OLD.status AND (NEW.status = 'accepted' OR NEW.status = 'rejected') THEN
    PERFORM net.http_post(
      url := current_setting('app.api_url', true) || '/api/notifications/request-status',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.api_key', true)
      ),
      body := jsonb_build_object(
        'requestId', NEW.id,
        'coupleId', NEW.couple_id,
        'status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur les changements de statut
CREATE TRIGGER on_request_status_change
  AFTER UPDATE ON requests
  FOR EACH ROW
  WHEN (NEW.status != OLD.status)
  EXECUTE FUNCTION notify_request_status_change();
```

---

## 📧 Templates d'emails

Les templates sont déjà inclus dans les fonctions ci-dessus. Vous pouvez les personnaliser selon vos besoins :

- **Couleurs** : Utilisez `#823F91` (violet Nuply) comme couleur principale
- **Structure** : Header avec gradient, contenu blanc, bouton CTA, footer
- **Responsive** : Les templates sont déjà responsives avec `max-width: 600px`

---

## 🧪 Tests et vérification

### Tester manuellement

1. **Test nouvelle demande** :
   ```bash
   curl -X POST http://localhost:3000/api/notifications/new-request \
     -H "Content-Type: application/json" \
     -d '{"requestId": "xxx", "providerId": "yyy"}'
   ```

2. **Vérifier les logs** :
   - Console Next.js : Vérifiez les logs `logger.info`
   - Dashboard Resend : Vérifiez que l'email apparaît dans "Emails"

3. **Vérifier la réception** :
   - Vérifiez votre boîte mail (et les spams)

### Monitoring

- **Dashboard Resend** : Surveillez le taux de délivrabilité
- **Logs** : Surveillez les erreurs dans les logs de l'application
- **Métriques** : Ajoutez des métriques pour suivre le nombre d'emails envoyés

---

## 🔒 Sécurité

- **API Key** : Ne jamais exposer `RESEND_API_KEY` côté client
- **Validation** : Valider les données avant d'envoyer les emails
- **Rate Limiting** : Implémenter un rate limiting pour éviter le spam
- **Unsubscribe** : Ajouter des liens de désinscription si nécessaire

---

## 📚 Ressources

- [Documentation Resend](https://resend.com/docs)
- [API Reference](https://resend.com/docs/api-reference/emails/send-email)
- [Supabase Triggers](https://supabase.com/docs/guides/database/triggers)

---

## ✅ Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Fonctions d'alerte créées dans `lib/email/alerts.ts`
- [ ] Routes API créées ou triggers Supabase configurés
- [ ] Templates d'emails testés
- [ ] Emails de test envoyés et vérifiés
- [ ] Monitoring configuré
- [ ] Documentation mise à jour

---

**Note** : Pour la production, assurez-vous d'avoir vérifié votre domaine dans Resend et d'utiliser un email personnalisé (ex: `noreply@nuply.fr`) au lieu de `onboarding@resend.dev`.
