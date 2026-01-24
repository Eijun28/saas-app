# Guide : Appliquer la migration 028 pour corriger l'inscription prestataire

## 🔍 Étape 1 : Vérifier l'état actuel

Exécutez le script `scripts/check-migration-status.sql` dans Supabase SQL Editor pour vérifier si la migration a déjà été appliquée.

## 📝 Étape 2 : Appliquer la migration

### Option A : Via Supabase SQL Editor (Recommandé)

1. Ouvrez votre **Supabase Dashboard**
2. Allez dans **SQL Editor**
3. Ouvrez le fichier `supabase/migrations/028_fix_prestataire_signup.sql`
4. Copiez tout le contenu
5. Collez-le dans le SQL Editor
6. Cliquez sur **Run** ou appuyez sur `Ctrl+Enter`

### Option B : Via Supabase CLI (si configuré)

```bash
# Si vous avez Supabase CLI configuré localement
supabase db push

# Ou pour appliquer une migration spécifique
supabase migration up
```

## ✅ Étape 3 : Vérifier que la migration a été appliquée

Après avoir exécuté la migration, réexécutez `scripts/check-migration-status.sql` pour vérifier que tous les éléments sont en place :

- ✅ Colonne `email` existe dans `profiles`
- ✅ Index unique `idx_profiles_email_unique` existe
- ✅ Contrainte CHECK `profiles_role_check` existe
- ✅ Trigger `on_auth_user_created` existe
- ✅ Fonction `handle_new_user` contient la vérification `prestataire`

## 🐛 En cas d'erreur

Si vous obtenez une erreur lors de l'application de la migration :

1. **Erreur "column already exists"** : C'est normal, la migration utilise `IF NOT EXISTS` donc elle peut être réexécutée sans problème.

2. **Erreur de contrainte** : Vérifiez qu'il n'y a pas de couples dans la table `profiles` :
   ```sql
   SELECT COUNT(*) FROM profiles p
   INNER JOIN couples c ON p.id = c.user_id;
   ```
   Si le résultat est > 0, supprimez ces enregistrements avant de réappliquer la migration.

3. **Erreur de trigger** : Le trigger peut déjà exister avec une ancienne version. La migration le remplacera automatiquement.

## 📊 Vérification finale

Après avoir appliqué la migration, testez l'inscription d'un prestataire. Si vous obtenez encore une erreur :

1. Vérifiez les logs serveur pour voir l'erreur exacte
2. Exécutez `scripts/check-profiles-table.sql` pour un diagnostic complet
3. Partagez l'erreur exacte pour qu'on puisse la corriger
