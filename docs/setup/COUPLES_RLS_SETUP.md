# 🔐 Configuration RLS pour la table `couples`

## Problème
L'erreur "new row violates row-level security policy for table couples" apparaît lors de la création d'un compte couple, même si le compte est créé avec succès.

## Solution

### Étape 1 : Exécuter la migration SQL

Exécutez le fichier `supabase/migrations/003_create_couples_rls.sql` dans le **SQL Editor** de Supabase :

1. Allez dans votre dashboard Supabase
2. Cliquez sur **SQL Editor** dans le menu de gauche
3. Cliquez sur **New query**
4. Copiez-collez le contenu de `supabase/migrations/003_create_couples_rls.sql`
5. Cliquez sur **Run**

### Étape 2 : Vérifier les politiques

Pour vérifier que les politiques sont bien créées, exécutez cette requête :

```sql
SELECT * FROM pg_policies WHERE tablename = 'couples';
```

Vous devriez voir 3 politiques :
- `Users can view own couple` (SELECT)
- `Users can update own couple` (UPDATE)
- `Users can insert own couple` (INSERT)

### Étape 3 : Vérifier que RLS est activé

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'couples';
```

La colonne `rowsecurity` doit être `true`.

## Configuration du callback email

### Dans Supabase Dashboard

1. Allez dans **Authentication** → **URL Configuration**
2. Dans **Redirect URLs**, ajoutez :
   - `http://localhost:3000/auth/callback` (pour le développement)
   - `https://votre-domaine.com/auth/callback` (pour la production)

### Vérifier la variable d'environnement

Assurez-vous que `NEXT_PUBLIC_SITE_URL` est définie dans `.env.local` :

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Pour la production, utilisez votre URL de production.

## Test

Après avoir exécuté la migration :

1. Créez un nouveau compte couple
2. L'erreur RLS ne devrait plus apparaître
3. Vérifiez votre email et cliquez sur le lien de confirmation
4. Vous devriez être redirigé vers `/couple/dashboard`

