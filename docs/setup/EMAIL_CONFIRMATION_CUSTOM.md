# Configuration Email de Confirmation Personnalisé

## Solution implémentée

Une fonction personnalisée a été créée pour envoyer les emails de confirmation avec un design personnalisé et le prénom de l'utilisateur.

## Fichiers modifiés

1. **`lib/email/confirmation.ts`** : Nouvelle fonction `sendConfirmationEmail()` qui :
   - Génère un lien de confirmation via l'API admin Supabase
   - Envoie un email personnalisé avec Resend
   - Inclut le prénom de l'utilisateur dynamiquement

2. **`lib/auth/actions.ts`** : Modifié pour appeler `sendConfirmationEmail()` après la création de l'utilisateur

## Configuration requise

### 1. Variables d'environnement

Assurez-vous d'avoir configuré :
```env
RESEND_API_KEY=votre_clé_resend
RESEND_FROM_EMAIL=noreply@nuply.fr
NEXT_PUBLIC_SITE_URL=https://nuply.fr
```

### 2. Désactiver l'email automatique de Supabase (Recommandé)

Pour éviter d'envoyer deux emails (un de Supabase et un personnalisé), désactivez l'email automatique de Supabase :

1. Allez dans votre dashboard Supabase
2. **Settings** > **Auth** > **Email Templates**
3. Pour le template "Confirm signup", vous pouvez :
   - **Option A** : Laisser le template par défaut mais désactiver l'envoi automatique
   - **Option B** : Modifier le template pour qu'il soit minimal (juste un lien)

**Pour désactiver complètement l'envoi automatique :**
- **Settings** > **Auth** > **Email Auth**
- Décochez "Enable email confirmations" (mais cela désactivera aussi la confirmation d'email, donc ne faites pas ça)

**Meilleure approche :**
- Laissez Supabase envoyer son email par défaut
- Notre fonction personnalisée enverra aussi un email avec le design personnalisé
- L'utilisateur recevra les deux emails, mais celui avec Resend sera plus joli

### 3. Alternative : Utiliser uniquement l'email personnalisé

Si vous voulez utiliser UNIQUEMENT l'email personnalisé :

1. Dans Supabase Dashboard > **Settings** > **Auth** > **Email Templates**
2. Modifiez le template "Confirm signup" pour qu'il soit minimal :
```html
<p>Cliquez sur ce lien pour confirmer : {{ .ConfirmationURL }}</p>
```

3. Ou mieux : Créez un webhook Supabase qui intercepte l'événement `auth.user.created` et envoie notre email personnalisé à la place.

## Test

1. Créez un compte de test
2. Vérifiez que vous recevez l'email personnalisé avec :
   - Le prénom correct dans "Bonjour [Prénom]"
   - Le bouton "Confirmer mon e-mail" fonctionnel
   - Le lien alternatif fonctionnel
3. Cliquez sur le bouton ou le lien pour confirmer
4. Vous devriez être redirigé vers `/auth/callback` puis vers votre dashboard

## Dépannage

### Le lien ne fonctionne pas
- Vérifiez que `NEXT_PUBLIC_SITE_URL` est correctement configuré
- Vérifiez les logs pour voir si `generateLink` a fonctionné
- Le lien généré devrait pointer vers `/auth/callback?token=...`

### L'email n'est pas envoyé
- Vérifiez que `RESEND_API_KEY` est configuré
- Vérifiez les logs pour voir l'erreur exacte
- L'erreur ne bloque pas l'inscription (non bloquant)

### Le prénom n'apparaît pas
- Vérifiez que `profileData.prenom` est bien passé à la fonction
- Vérifiez les logs pour voir les valeurs

## Notes importantes

- L'envoi d'email personnalisé est **non bloquant** : si l'email échoue, l'inscription continue
- L'utilisateur recevra peut-être deux emails (un de Supabase et un personnalisé) si vous n'avez pas désactivé l'email automatique
- Le lien de confirmation expire après 24 heures (configurable dans Supabase)
