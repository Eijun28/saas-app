# 📧 Configuration Email Supabase

## Problème : "Error sending confirmation email"

Cette erreur apparaît lorsque Supabase ne peut pas envoyer l'email de confirmation. Voici comment résoudre le problème.

## Solutions

### Option 1 : Désactiver la confirmation d'email (Développement uniquement)

**⚠️ À utiliser uniquement en développement !**

1. Allez dans votre **Supabase Dashboard**
2. Cliquez sur **Authentication** → **Settings**
3. Dans la section **Email Auth**, désactivez **"Enable email confirmations"**
4. Sauvegardez

Les utilisateurs pourront se connecter directement sans confirmer leur email.

### Option 2 : Configurer SMTP personnalisé (Production)

Pour la production, configurez un service SMTP :

1. Allez dans **Supabase Dashboard** → **Project Settings** → **Auth**
2. Dans **SMTP Settings**, configurez :
   - **Host** : smtp.gmail.com (pour Gmail) ou votre fournisseur SMTP
   - **Port** : 587 (TLS) ou 465 (SSL)
   - **Username** : votre adresse email
   - **Password** : mot de passe d'application (pas votre mot de passe normal)
   - **Sender email** : l'adresse qui enverra les emails
   - **Sender name** : NUPLY

#### Pour Gmail :

1. Activez l'authentification à deux facteurs
2. Générez un "Mot de passe d'application" : https://myaccount.google.com/apppasswords
3. Utilisez ce mot de passe dans la configuration SMTP

### Option 3 : Utiliser un service d'email tiers

Pour une meilleure délivrabilité, utilisez :
- **SendGrid**
- **Mailgun**
- **Postmark**
- **AWS SES**

Configurez-les dans Supabase avec leurs paramètres SMTP.

## Vérification

Après configuration :

1. Testez la création d'un compte
2. Vérifiez que l'email arrive dans la boîte de réception (et les spams)
3. Vérifiez les logs Supabase : **Logs** → **Auth Logs**

## Template d'email

Vous pouvez personnaliser le template d'email dans :
**Authentication** → **Email Templates** → **Confirm signup**

## Note importante

Le code a été modifié pour **ne pas bloquer l'inscription** si l'envoi d'email échoue. L'utilisateur sera créé même si l'email n'est pas envoyé, ce qui permet de continuer le développement.

