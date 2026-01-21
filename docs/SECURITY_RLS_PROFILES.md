# Sécurité RLS - Table Profiles

## 🔒 Politiques de sécurité actuelles

### Politiques RLS sur `profiles`

1. **SELECT - Voir son propre profil** : `auth.uid() = id`
   - Permet à chaque utilisateur de voir son propre profil complet (y compris email)

2. **SELECT - Voir les profils prestataires** : `auth.uid() IS NOT NULL AND role = 'prestataire'`
   - Permet à tous les utilisateurs authentifiés de voir les profils prestataires
   - ⚠️ **ATTENTION** : Cette politique expose l'email des prestataires

3. **INSERT** : `auth.uid() = id`
   - Les utilisateurs ne peuvent créer que leur propre profil
   - ✅ Sécurisé

4. **UPDATE** : `auth.uid() = id`
   - Les utilisateurs ne peuvent modifier que leur propre profil
   - ✅ Sécurisé

## ⚠️ Risques de sécurité identifiés

### 1. Exposition de l'email
- **Problème** : La politique SELECT permet à tous les utilisateurs authentifiés de voir l'email des prestataires
- **Impact** : Données personnelles sensibles exposées
- **Solution** : Utiliser la vue `profiles_public` qui masque l'email

### 2. Données sensibles dans profiles
- L'email est une donnée sensible qui ne devrait pas être visible par tous
- Les autres données (nom, prénom, entreprise) sont acceptables pour le matching

## ✅ Recommandations de sécurité

### Option 1 : Utiliser la vue `profiles_public` (Recommandé)

Dans votre code d'application, pour le matching et l'affichage public :

```typescript
// ❌ Ne pas faire (expose l'email)
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'prestataire')

// ✅ Faire (masque l'email)
const { data } = await supabase
  .from('profiles_public')
  .select('*')
```

### Option 2 : Filtrer l'email côté application

```typescript
const { data } = await supabase
  .from('profiles')
  .select('id, prenom, nom, nom_entreprise, avatar_url, ...') // Exclure email
  .eq('role', 'prestataire')
```

### Option 3 : Créer une fonction sécurisée (Sécurité maximale)

```sql
CREATE OR REPLACE FUNCTION get_prestataire_profiles_public()
RETURNS TABLE (
  id uuid,
  prenom text,
  nom text,
  nom_entreprise text,
  -- ... autres colonnes sans email
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.prenom,
    p.nom,
    p.nom_entreprise,
    -- ... autres colonnes
  FROM profiles p
  WHERE p.role = 'prestataire';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔍 Vérification de sécurité

Pour vérifier que les politiques sont correctes :

```sql
-- Voir toutes les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Tester l'accès (remplacer USER_ID par un ID de test)
SELECT id, email, prenom, nom FROM profiles WHERE id = 'USER_ID';
```

## 📝 Checklist de sécurité

- [x] RLS activé sur `profiles`
- [x] Politiques INSERT/UPDATE restrictives (auth.uid() = id)
- [x] Vue `profiles_public` créée pour masquer l'email
- [ ] Code d'application utilise `profiles_public` pour le matching
- [ ] Tests de sécurité effectués
- [ ] Documentation à jour

## 🚨 Actions immédiates recommandées

1. **Mettre à jour le code de matching** pour utiliser `profiles_public` au lieu de `profiles`
2. **Vérifier les autres endpoints** qui exposent des profils
3. **Tester** que l'email n'est pas accessible par les autres utilisateurs
