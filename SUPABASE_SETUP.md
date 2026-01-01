# 🎯 Configuration Supabase - Structure Couples & Préférences

## ✅ État de la Configuration

### 1. Client Supabase ✅
- **Fichier** : `lib/supabase/client.ts`
- **Status** : ✅ Configuré avec `@supabase/ssr`
- **Utilisation** : `createClient()` pour les composants client

### 2. Types TypeScript ✅
- **Fichier** : `types/couples.types.ts`
- **Contenu** :
  - `Couple` : Données essentielles du couple
  - `CouplePreferences` : Préférences culturelles et services
  - `CoupleWithPreferences` : Type combiné
  - Types utilitaires : `CulturalPreferences`, `ServicePriorities`, `BudgetBreakdown`

### 3. Queries Supabase ✅
- **Fichier** : `lib/supabase/queries/couples.queries.ts`
- **Fonctions disponibles** :
  - `getCurrentCoupleProfile()` : Récupère couple + préférences
  - `createCoupleProfile()` : Crée un profil couple
  - `updateCoupleProfile()` : Met à jour le profil
  - `createCouplePreferences()` : Crée les préférences
  - `updateCouplePreferences()` : Met à jour les préférences
  - `checkCoupleProfileExists()` : Vérifie l'existence du profil
  - `getCouplePreferences()` : Récupère uniquement les préférences

### 4. Migration SQL ✅
- **Fichier** : `supabase/migrations/004_create_couples_and_preferences_tables.sql`
- **Contenu** :
  - Création table `couples`
  - Création table `couple_preferences`
  - Création table `timeline_events` (si n'existe pas)
  - RLS policies pour toutes les tables
  - Index et triggers

---

## 🚀 Prochaines Étapes

### ÉTAPE 1 : Variables d'environnement

Vérifiez que `.env.local` existe à la racine avec :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Remplacez les valeurs ci-dessus par vos vraies clés Supabase** (disponibles dans votre Dashboard Supabase → Settings → API)

⚠️ **Important** : Ce fichier est dans `.gitignore` et ne sera pas commité.

### ÉTAPE 2 : Exécuter la Migration SQL

1. Allez dans votre **Supabase Dashboard**
2. Cliquez sur **SQL Editor**
3. Cliquez sur **New query**
4. Copiez-collez le contenu de `supabase/migrations/004_create_couples_and_preferences_tables.sql`
5. Cliquez sur **Run**

### ÉTAPE 3 : Tester la Configuration

Créez un fichier de test temporaire ou testez dans la console :

```typescript
import { getCurrentCoupleProfile } from '@/lib/supabase/queries/couples.queries'

// Dans un composant ou une page
const profile = await getCurrentCoupleProfile()
console.log('Profil couple:', profile)
```

---

## 📊 Structure des Tables

### Table `couples`
- **ID** : UUID (même que `user_id` de Supabase Auth)
- **Champs principaux** : email, partner_1_name, partner_2_name, wedding_date, budget_min/max
- **Relation** : 1:1 avec `couple_preferences`

### Table `couple_preferences`
- **ID** : UUID généré automatiquement
- **couple_id** : FK vers `couples.id`
- **Services** : `essential_services[]` (must-have) et `optional_services[]` (nice-to-have)
- **Budget** : `budget_breakdown` (JSONB) pour répartition détaillée
- **Onboarding** : `completion_percentage`, `onboarding_step`

---

## 💻 Exemples d'Utilisation

### Récupérer le profil complet

```typescript
import { getCurrentCoupleProfile } from '@/lib/supabase/queries/couples.queries'

const couple = await getCurrentCoupleProfile()

if (couple) {
  console.log('Date mariage:', couple.wedding_date)
  console.log('Services essentiels:', couple.preferences?.essential_services)
}
```

### Créer un profil couple

```typescript
import { createCoupleProfile, createCouplePreferences } from '@/lib/supabase/queries/couples.queries'

// 1. Créer le profil de base
const couple = await createCoupleProfile({
  partner_1_name: 'Sophie',
  partner_2_name: 'Marc',
  wedding_date: '2025-06-15',
  budget_min: 15000,
  budget_max: 20000
})

// 2. Créer les préférences
await createCouplePreferences(couple.id, {
  essential_services: ['traiteur', 'photographe'],
  optional_services: ['dj', 'decoration'],
  languages: ['français', 'arabe']
})
```

### Mettre à jour les préférences

```typescript
import { updateCouplePreferences } from '@/lib/supabase/queries/couples.queries'

await updateCouplePreferences(coupleId, {
  essential_services: ['traiteur', 'photographe', 'videaste'],
  completion_percentage: 60
})
```

---

## 🔄 Migration depuis l'Ancienne Structure

Si vous avez du code qui utilise l'ancienne structure (`couple_profiles`), voici comment migrer :

### AVANT
```typescript
const { data } = await supabase
  .from('couple_profiles')
  .select('date_marriage, budget_min')
  .eq('user_id', userId)
```

### APRÈS
```typescript
const couple = await getCurrentCoupleProfile()
// couple.wedding_date (au lieu de date_marriage)
// couple.budget_min (même nom)
// couple.preferences pour les services
```

---

## 🐛 Troubleshooting

### Erreur : "relation 'couples' does not exist"
→ La migration SQL n'a pas été exécutée. Exécutez `004_create_couples_and_preferences_tables.sql` dans Supabase.

### Erreur : "permission denied for table couples"
→ Les RLS policies ne sont pas activées. Vérifiez que la migration a bien créé les policies.

### Erreur : "User not authenticated"
→ L'utilisateur n'est pas connecté. Vérifiez `supabase.auth.getUser()` avant d'appeler les queries.

---

## 📝 Notes Importantes

1. **ID du couple** : Utilise `user.id` de Supabase Auth comme `couple.id`
2. **Services** : Séparés en `essential_services` (obligatoires) et `optional_services` (optionnels)
3. **Budget** : `budget_min/max` dans `couples`, répartition détaillée dans `couple_preferences.budget_breakdown`
4. **Onboarding** : Suivi via `completion_percentage` et `onboarding_step` dans `couple_preferences`

---

*Configuration créée le 2024-12*

