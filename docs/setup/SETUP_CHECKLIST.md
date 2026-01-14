# ✅ Checklist de Configuration Supabase

## 📋 État Actuel

### ✅ Fichiers Créés

- [x] `types/couples.types.ts` - Types TypeScript pour couples et préférences
- [x] `lib/supabase/queries/couples.queries.ts` - Fonctions de requêtes
- [x] `supabase/migrations/004_create_couples_and_preferences_tables.sql` - Migration SQL
- [x] `SUPABASE_SETUP.md` - Documentation complète
- [x] `lib/supabase/queries/README.md` - Documentation des queries

### ✅ Fichiers Existants (Vérifiés)

- [x] `lib/supabase/client.ts` - Client Supabase configuré avec `@supabase/ssr`
- [x] `lib/supabase/server.ts` - Client serveur configuré
- [x] `.gitignore` - Contient `.env*` pour protéger les secrets

### ⚠️ À Faire

- [ ] **Créer `.env.local`** à la racine avec :
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  ```

  ⚠️ **Remplacez par vos vraies clés depuis Supabase Dashboard → Settings → API**

- [ ] **Exécuter la migration SQL** dans Supabase Dashboard :
  1. Aller dans SQL Editor
  2. Copier le contenu de `supabase/migrations/004_create_couples_and_preferences_tables.sql`
  3. Exécuter la requête

- [ ] **Tester la connexion** :
  ```typescript
  import { getCurrentCoupleProfile } from '@/lib/supabase/queries/couples.queries'
  const profile = await getCurrentCoupleProfile()
  console.log('Profil:', profile)
  ```

---

## 🔄 Code Adapté

### ✅ Modifications Apportées

- [x] `lib/auth/actions.ts` - Adapté pour utiliser `partner_1_name` et `partner_2_name`
- [x] Création automatique des préférences lors de l'inscription couple

---

## 📊 Structure des Tables

### Table `couples`
- ✅ Créée dans la migration
- ✅ RLS activé
- ✅ Policies créées

### Table `couple_preferences`
- ✅ Créée dans la migration
- ✅ RLS activé
- ✅ Policies créées
- ✅ Relation 1:1 avec `couples`

### Table `timeline_events`
- ✅ Créée dans la migration (si n'existe pas)
- ✅ RLS activé
- ✅ Policies créées

---

## 🎯 Prochaines Étapes

1. **Créer `.env.local`** avec les variables d'environnement
2. **Exécuter la migration SQL** dans Supabase
3. **Tester** avec `getCurrentCoupleProfile()`
4. **Adapter les composants existants** pour utiliser les nouvelles queries
5. **Créer les formulaires d'onboarding** pour remplir les préférences

---

## 🐛 En Cas d'Erreur

### "relation 'couples' does not exist"
→ La migration n'a pas été exécutée. Exécutez `004_create_couples_and_preferences_tables.sql`

### "permission denied"
→ Les RLS policies ne sont pas activées. Vérifiez la migration.

### "User not authenticated"
→ L'utilisateur n'est pas connecté. Vérifiez `supabase.auth.getUser()`

---

*Checklist créée le 2024-12*

