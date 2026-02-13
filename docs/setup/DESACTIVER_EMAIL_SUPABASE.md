# Emails de confirmation : Resend uniquement

## Architecture actuelle

L'inscription utilise **uniquement Resend** pour l'envoi des emails de confirmation.

- L'utilisateur est créé via `admin.createUser({ email_confirm: false })` pour éviter que Supabase envoie son email natif.
- Le lien de confirmation est généré via `admin.generateLink({ type: 'magiclink' })`, puis l'auto-confirmation est annulée via `updateUserById({ email_confirm: false })`.
- L'email est envoyé via **Resend** avec le template custom Nuply.

## Action requise dans le dashboard Supabase

Même si le code ne déclenche plus l'email natif, il est recommandé de **désactiver les emails de confirmation Supabase** pour éviter tout envoi accidentel :

1. Allez dans **Supabase Dashboard**
2. **Authentication** > **Email Templates**
3. Sélectionnez le template **"Confirm signup"**
4. Remplacez le contenu par :

```html
<!-- Email désactivé - Utilisation de Resend -->
<p>Ce message ne devrait pas être envoyé. Contactez support@nuply.fr si vous le recevez.</p>
```

## Vérification

Pour vérifier que tout fonctionne :

1. Créez un compte de test
2. Vous devriez recevoir **un seul email** de Resend (design Nuply avec prénom)
3. L'email ne doit **pas** être marqué comme confirmé avant le clic sur le lien
