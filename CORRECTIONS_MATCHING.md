# ✅ Analyse des conflits après vérification du schéma BDD

## ✅ PROBLÈMES RÉSOLUS

### 3. ✅ Table `matching_history` existe
**Statut** : ✅ RÉSOLU - La table existe dans le schéma avec toutes les colonnes nécessaires.

### 4. ✅ Champs dans `profiles` existent
**Statut** : ✅ RÉSOLU - Tous les champs existent :
- `guest_capacity_min` ✅
- `guest_capacity_max` ✅
- `languages` ✅ (ARRAY)
- `response_rate` ✅ (numeric)

### 5. ✅ Noms de colonnes corrects
**Statut** : ✅ RÉSOLU - Les tables utilisent bien `profile_id` :
- `provider_cultures.profile_id` ✅
- `provider_zones.profile_id` ✅

---

## ❌ PROBLÈMES À CORRIGER

### 1. ❌ Table `prestataire_public_profiles` n'existe pas
**Problème** : Le code essaie d'accéder à cette table pour obtenir `rating` et `total_reviews`.

**Solution** : Créer la table ou utiliser des valeurs par défaut (0).

### 2. ❌ Table `portfolio_images` n'existe pas
**Problème** : Le code utilise `portfolio_images` mais la table s'appelle `provider_portfolio` et utilise `profile_id` (pas `prestataire_id`).

**Solution** : Corriger le nom de la table et de la colonne dans le code.

### 6. ❌ Champ `onboarding_completed` n'existe pas dans `profiles`
**Problème** : Le code filtre sur `onboarding_completed` mais ce champ n'existe pas dans le schéma.

**Solution** : Retirer ce filtre ou utiliser un autre champ (peut-être `completion_score` ?).

---

## 📝 CORRECTIONS SQL REQUISES

### Option 1 : Créer la table `prestataire_public_profiles`

```sql
-- Créer la table prestataire_public_profiles pour stocker les notes et avis
CREATE TABLE IF NOT EXISTS public.prestataire_public_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE,
  rating numeric(3, 2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews integer DEFAULT 0 CHECK (total_reviews >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prestataire_public_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT prestataire_public_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_prestataire_public_profiles_profile_id ON public.prestataire_public_profiles(profile_id);

-- Activer RLS
ALTER TABLE public.prestataire_public_profiles ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Tous les utilisateurs authentifiés peuvent voir les profils publics
CREATE POLICY "Authenticated users can view prestataire public profiles"
  ON public.prestataire_public_profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

### Option 2 : Utiliser des valeurs par défaut (plus simple)

Si vous ne voulez pas créer cette table maintenant, on peut simplement utiliser des valeurs par défaut (0) dans le code.

---

## 🔧 CORRECTIONS DU CODE REQUISES

### 1. Corriger le nom de la table portfolio
**Fichier** : `app/api/matching/route.ts` ligne 92

**Avant** :
```typescript
.from('portfolio_images')
.eq('prestataire_id', provider.id);
```

**Après** :
```typescript
.from('provider_portfolio')
.eq('profile_id', provider.id);
```

### 2. Retirer ou remplacer le filtre `onboarding_completed`
**Fichier** : `app/api/matching/route.ts` ligne 48

**Option A - Retirer complètement** :
```typescript
.eq('service_type', search_criteria.service_type);
// Retirer la ligne .eq('onboarding_completed', true);
```

**Option B - Utiliser completion_score** :
```typescript
.gte('completion_score', 50); // Par exemple, au moins 50% de complétion
```

### 3. Gérer l'absence de `prestataire_public_profiles`
**Fichier** : `app/api/matching/route.ts` lignes 41-44 et 101-102

**Option A - Si vous créez la table** : Garder tel quel.

**Option B - Si vous n'utilisez pas la table** :
```typescript
// Retirer la relation dans le select
.select(`
  id,
  nom_entreprise,
  ...
  response_rate
`)
// Et utiliser des valeurs par défaut
average_rating: 0,
review_count: 0,
```
