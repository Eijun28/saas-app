# Configuration du Template d'Email de Confirmation

## Problème résolu

Le template HTML fourni avait des liens `href="#"` qui ne fonctionnaient pas. Le template a été corrigé pour utiliser les variables Supabase.

## Variables Supabase utilisées

- `{{ .ConfirmationURL }}` : URL complète de confirmation générée par Supabase
- `{{ .Email }}` : Adresse email de l'utilisateur

## Comment configurer dans Supabase

1. **Connectez-vous à votre dashboard Supabase**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Accédez aux paramètres d'authentification**
   - Menu latéral : `Authentication` > `Email Templates`
   - Ou directement : `Settings` > `Auth` > `Email Templates`

3. **Modifiez le template "Confirm signup"**
   - Cliquez sur le template "Confirm signup"
   - Remplacez le contenu HTML par le contenu du fichier `email-templates/confirmation-inscription.html`

4. **Variables disponibles dans Supabase**

   Supabase utilise la syntaxe Go templates. Les variables disponibles sont :
   - `{{ .ConfirmationURL }}` : URL de confirmation complète
   - `{{ .Token }}` : Token de confirmation (si vous voulez construire l'URL manuellement)
   - `{{ .Email }}` : Adresse email de l'utilisateur
   - `{{ .SiteURL }}` : URL de votre site (configurée dans les paramètres)

## Alternative : Variables selon la version de Supabase

Si `{{ .ConfirmationURL }}` ne fonctionne pas, essayez :

- **Ancienne syntaxe** : `{{ .ConfirmationLink }}`
- **Avec token** : Construisez l'URL manuellement :
  ```html
  <a href="{{ .SiteURL }}/auth/callback?token={{ .Token }}&type=signup">
  ```

## Configuration de l'URL de redirection

Assurez-vous que dans votre code (`lib/auth/actions.ts` ligne 75), l'URL de redirection est correcte :

```typescript
emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
```

Cette URL doit correspondre à votre route `/auth/callback` qui gère la confirmation.

## Test

1. Créez un compte de test
2. Vérifiez que l'email reçu contient le bon lien
3. Cliquez sur le bouton ou le lien pour confirmer
4. Vous devriez être redirigé vers `/auth/callback` puis vers votre dashboard

## Notes importantes

- Le template utilise des tableaux HTML pour une meilleure compatibilité avec les clients email
- Les styles inline sont nécessaires pour la compatibilité email
- Le logo SVG est inclus directement dans le template
- Le lien expire après 24 heures (configurable dans Supabase)
