# 🚀 Guide : Connecter l'inscription à Supabase

## 📋 Vue d'ensemble

Tu as déjà du code pour sauvegarder les données, mais il manque quelques étapes pour que tout fonctionne. Voici ce qu'il faut faire dans l'ordre :

---

## ✅ ÉTAPE 1 : Créer les tables dans Supabase

**Où :** Tableau de bord Supabase → SQL Editor

### 1.1 Créer la fonction helper pour `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 1.2 Créer la table `profiles`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('couple', 'prestataire')) DEFAULT NULL,
  prenom TEXT,
  nom TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_onboarding ON profiles(onboarding_completed);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.3 Créer la table `couple_profiles`

```sql
CREATE TABLE couple_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  ville_marriage TEXT,
  date_marriage DATE,
  budget_min NUMERIC(10, 2),
  budget_max NUMERIC(10, 2),
  culture TEXT,
  prestataires_recherches TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_couple_profiles_updated_at
  BEFORE UPDATE ON couple_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.4 Créer la table `prestataire_profiles`

```sql
CREATE TABLE prestataire_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  nom_entreprise TEXT,
  type_prestation TEXT,
  ville_exercice TEXT,
  tarif_min NUMERIC(10, 2),
  tarif_max NUMERIC(10, 2),
  cultures_gerees TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prestataire_type ON prestataire_profiles(type_prestation);
CREATE INDEX idx_prestataire_ville ON prestataire_profiles(ville_exercice);

CREATE TRIGGER update_prestataire_profiles_updated_at
  BEFORE UPDATE ON prestataire_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## ✅ ÉTAPE 2 : Créer un trigger pour auto-créer le profil à l'inscription

**Objectif :** Quand un utilisateur s'inscrit, créer automatiquement une ligne dans `profiles`.

### 2.1 Fonction qui crée le profil

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, prenom, nom)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'firstname',
    NEW.raw_user_meta_data->>'lastname'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.2 Trigger qui s'active après l'inscription

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## ✅ ÉTAPE 3 : Configurer les Row Level Security (RLS)

**Où :** Tableau de bord Supabase → SQL Editor

### 3.1 Activer RLS et créer les policies pour `profiles`

```sql
-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1️⃣ Supprimer toutes les anciennes policies (si elles existent)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

-- 2️⃣ Recréer les policies CORRECTEMENT

-- Lecture : L'utilisateur peut voir son profil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Mise à jour : L'utilisateur peut mettre à jour son profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Insertion : L'utilisateur peut créer son profil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3️⃣ IMPORTANT : Policy pour permettre au trigger de créer des profils
-- ⚠️ Cette policy permet au service_role (utilisé par les triggers/functions)
-- de créer des profils lors de l'inscription. Elle est nécessaire pour que
-- le trigger handle_new_user() fonctionne correctement.
-- 
-- NOTE : Si tu utilises SECURITY DEFINER dans ta fonction trigger,
-- cette policy peut être omise. Mais si tu as des problèmes de permissions,
-- ajoute cette policy (elle est sécurisée car elle vérifie le service_role).
CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR current_setting('role', true) = 'service_role'
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR current_setting('role', true) = 'service_role'
  );
```

**Note importante :** 

La dernière policy permet au trigger `handle_new_user()` de créer des profils lors de l'inscription. 

**Options pour le trigger :**

1. **Si ta fonction trigger utilise `SECURITY DEFINER`** (recommandé) :
   - La fonction bypass RLS automatiquement
   - Tu peux **OMETTRE** cette policy service_role
   - C'est plus sécurisé

2. **Si ta fonction trigger n'utilise pas `SECURITY DEFINER`** :
   - Tu dois ajouter cette policy service_role
   - Assure-toi que la vérification du role est correcte

**Vérifier ta fonction trigger :**
```sql
-- Vérifie si ta fonction utilise SECURITY DEFINER
SELECT prosrc, prosecdef 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

Si `prosecdef = true`, tu utilises `SECURITY DEFINER` et tu n'as pas besoin de la policy service_role.

### 3.2 Activer RLS sur `couple_profiles`

```sql
ALTER TABLE couple_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own couple profile"
  ON couple_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own couple profile"
  ON couple_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own couple profile"
  ON couple_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 3.3 Activer RLS sur `prestataire_profiles`

```sql
ALTER TABLE prestataire_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prestataire profile"
  ON prestataire_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own prestataire profile"
  ON prestataire_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prestataire profile"
  ON prestataire_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## ✅ ÉTAPE 4 : Vérifier ton flux d'inscription

Ton code actuel dans `app/onboarding/step-8/page.tsx` essaie déjà de sauvegarder. Il faut juste vérifier que :

1. **L'utilisateur est bien connecté** avant d'arriver à l'étape 8
2. **Les données du store correspondent** aux noms de colonnes de ta base

### Flow recommandé :

```
1. Page sign-up → Créer compte avec email/password
2. Redirection vers onboarding/step-1
3. Parcourir les étapes (données sauvegardées dans le store)
4. Étape 8 → Récupérer les données du store
5. Sauvegarder dans Supabase (profiles + couple_profiles OU prestataire_profiles)
6. Rediriger vers le dashboard
```

---

## ✅ ÉTAPE 5 : Créer une Server Action pour sauvegarder l'onboarding

**Option recommandée :** Créer une fonction server action dédiée pour garder le code propre.

Créer un fichier : `lib/onboarding/actions.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding(data: {
  role: 'couple' | 'prestataire'
  prenom: string
  nom: string
  // Données couple
  villeMarriage?: string
  dateMarriage?: string
  budgetMin?: number
  budgetMax?: number
  culture?: string
  prestatairesRecherches?: string[]
  // Données prestataire
  nomEntreprise?: string
  typePrestation?: string
  villeExercice?: string
  tarifMin?: number
  tarifMax?: number
  culturesGerees?: string[]
}) {
  const supabase = await createClient()
  
  // Vérifier que l'utilisateur est connecté
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Vous devez être connecté' }
  }

  // 1. Mettre à jour le profil de base
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role: data.role,
      prenom: data.prenom,
      nom: data.nom,
      onboarding_completed: true,
    })
    .eq('id', user.id)

  if (profileError) {
    return { error: `Erreur profil: ${profileError.message}` }
  }

  // 2. Créer le profil spécifique selon le rôle
  if (data.role === 'couple') {
    const { error: coupleError } = await supabase
      .from('couple_profiles')
      .upsert({
        user_id: user.id,
        ville_marriage: data.villeMarriage || null,
        date_marriage: data.dateMarriage || null,
        budget_min: data.budgetMin || null,
        budget_max: data.budgetMax || null,
        culture: data.culture || null,
        prestataires_recherches: data.prestatairesRecherches || [],
      })

    if (coupleError) {
      return { error: `Erreur couple: ${coupleError.message}` }
    }
  } else {
    const { error: prestataireError } = await supabase
      .from('prestataire_profiles')
      .upsert({
        user_id: user.id,
        nom_entreprise: data.nomEntreprise || null,
        type_prestation: data.typePrestation || null,
        ville_exercice: data.villeExercice || null,
        tarif_min: data.tarifMin || null,
        tarif_max: data.tarifMax || null,
        cultures_gerees: data.culturesGerees || [],
      })

    if (prestataireError) {
      return { error: `Erreur prestataire: ${prestataireError.message}` }
    }
  }

  revalidatePath('/', 'layout')
  return { success: true, userId: user.id }
}
```

---

## ✅ ÉTAPE 6 : Utiliser cette fonction dans ton composant

Dans `app/onboarding/step-8/page.tsx`, remplacer `handleComplete` par :

```typescript
import { completeOnboarding } from '@/lib/onboarding/actions'

const handleComplete = async () => {
  if (!role) return

  setIsLoading(true)
  setError(null)

  try {
    // Récupérer toutes les données du store
    const result = await completeOnboarding({
      role: role,
      prenom: data.prenom,
      nom: data.nom,
      // Données couple (si role === 'couple')
      ...(role === 'couple' && {
        villeMarriage: data.villeMarriage,
        dateMarriage: data.dateMarriage?.toISOString(),
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        culture: data.culture,
        prestatairesRecherches: data.prestatairesRecherches,
      }),
      // Données prestataire (si role === 'prestataire')
      ...(role === 'prestataire' && {
        nomEntreprise: data.nomEntreprise,
        typePrestation: data.typePrestation,
        villeExercice: data.villeExercice,
        tarifMin: data.tarifMin,
        tarifMax: data.tarifMax,
        culturesGerees: data.culturesGerees,
      }),
    })

    if (result?.error) {
      setError(result.error)
      return
    }

    // Réinitialiser le store
    reset()

    // Rediriger vers le dashboard
    router.push(role === 'couple' ? '/dashboard' : '/prestataire/dashboard')
  } catch (err: any) {
    setError(err.message || 'Une erreur est survenue')
  } finally {
    setIsLoading(false)
  }
}
```

---

## ✅ ÉTAPE 7 : Tester le flow complet

1. **Tester l'inscription :**
   - Aller sur `/sign-up`
   - Créer un compte avec email/password
   - Vérifier dans Supabase que la table `profiles` contient bien une ligne

2. **Tester l'onboarding :**
   - Compléter les étapes 1-7
   - Arriver à l'étape 8
   - Cliquer sur "Créer mon compte"
   - Vérifier dans Supabase :
     - `profiles.onboarding_completed = true`
     - Une ligne dans `couple_profiles` OU `prestataire_profiles`

---

## 🔧 Debugging

### Problème : "permission denied for table profiles"

**Solution :** Vérifier que les policies RLS sont bien créées (Étape 3)

### Problème : "relation does not exist"

**Solution :** Vérifier que les tables sont bien créées (Étape 1)

### Problème : Le trigger ne crée pas de profil

**Solution :** Vérifier que le trigger est bien créé (Étape 2)

### Problème : Les données ne correspondent pas

**Solution :** Vérifier que les noms des champs dans le store correspondent aux colonnes SQL :
- `villeMarriage` → `ville_marriage`
- `dateMarriage` → `date_marriage`
- `budgetMin` → `budget_min`
- etc.

---

## 📝 Checklist finale

- [ ] Tables créées dans Supabase
- [ ] Trigger créé pour auto-créer le profil
- [ ] RLS configuré sur les 3 tables
- [ ] Server action créée (`completeOnboarding`)
- [ ] Composant step-8 utilise la server action
- [ ] Testé le flow d'inscription complet
- [ ] Vérifié les données dans Supabase

---

## 🎯 Prochaines étapes (optionnel)

1. Ajouter des validations côté serveur
2. Ajouter des messages d'erreur plus explicites
3. Ajouter un loading state pendant la sauvegarde
4. Gérer les erreurs réseau
5. Ajouter des logs pour le debugging

---

**C'est tout !** 🎉 Si tu bloques sur une étape, dis-moi laquelle et je t'aide !
