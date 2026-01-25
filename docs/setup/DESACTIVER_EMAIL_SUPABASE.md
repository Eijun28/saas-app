# Comment désactiver l'email automatique de Supabase

## Problème actuel

Actuellement, **les deux systèmes** envoient des emails :
1. **Supabase** envoie automatiquement un email (template cassé)
2. **Resend** envoie notre email personnalisé (qui fonctionne)

Résultat : L'utilisateur reçoit **2 emails** de confirmation.

## Solution : Désactiver l'email Supabase

### Option 1 : Désactiver via les paramètres Supabase (Recommandé)

1. Allez dans votre **Supabase Dashboard**
2. **Settings** > **Auth** > **Email Auth**
3. Décochez **"Enable email confirmations"**
   - ⚠️ **ATTENTION** : Cela désactive complètement la confirmation d'email
   - Vous devrez alors gérer la confirmation uniquement via Resend

### Option 2 : Modifier le template Supabase pour qu'il soit vide (Meilleure solution)

1. Allez dans **Supabase Dashboard**
2. **Authentication** > **Email Templates**
3. Sélectionnez le template **"Confirm signup"**
4. Remplacez le contenu par un template minimal qui ne sera jamais utilisé :

```html
<!-- Email désactivé - Utilisation de Resend pour emails personnalisés -->
<p>Votre compte a été créé. Vous recevrez un email de confirmation séparément.</p>
```

Mais en fait, mieux vaut laisser Supabase envoyer son email par défaut et simplement ignorer qu'il existe, car notre email Resend sera envoyé après.

### Option 3 : Utiliser un webhook Supabase (Avancé)

Créer un webhook qui intercepte l'événement `auth.user.created` et empêche l'envoi de l'email Supabase.

## Recommandation

**Pour l'instant, laissez les deux actifs** car :
- L'email Supabase peut servir de backup si Resend échoue
- Notre email Resend est celui qui sera utilisé (plus joli, avec prénom)
- Les utilisateurs recevront les deux, mais cliqueront sur celui de Resend

**Plus tard, vous pourrez désactiver Supabase** une fois que vous êtes sûr que Resend fonctionne à 100%.

## Vérification

Pour vérifier quel système envoie quoi :

1. Créez un compte de test
2. Vérifiez votre boîte email
3. Vous devriez voir :
   - 1 email de Supabase (design basique, peut-être cassé)
   - 1 email de Resend (design personnalisé avec prénom, fonctionnel)

L'utilisateur peut utiliser **n'importe lequel des deux** pour confirmer son compte, mais celui de Resend est plus professionnel.
