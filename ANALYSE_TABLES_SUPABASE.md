# Analyse des Tables Supabase - NUPLY

## 📊 Résumé des Incohérences Détectées

### ⚠️ PROBLÈMES CRITIQUES

#### 1. **Table `conversations` - INCOHÉRENCE MAJEURE**
**Schéma réel :**
- `couple_id` → référence `couples(id)` ✅
- `provider_id` → référence `profiles(id)` ✅
- `status` ('active', 'archived')
- `unread_count_couple`, `unread_count_provider`
- `demande_id` → référence `demandes(id)`

**Code actuel utilise :**
- `prestataire_id` au lieu de `provider_id` ❌
- Pas de gestion de `status` ❌
- Pas de gestion des compteurs `unread_count_*` ❌

**Fichiers affectés :**
- `app/prestataire/messagerie/page.tsx` (ligne 43)
- `lib/supabase/messages.ts` (ligne 13, 39)
- `app/couple/messagerie/page.tsx`

**Action requise :** Remplacer `prestataire_id` par `provider_id` partout dans le code.

---

#### 2. **Table `demandes` - INCOHÉRENCE MAJEURE**
**Schéma réel :**
- `couple_id` → référence `couples(id)` ✅
- `provider_id` → référence `profiles(id)` ✅
- `service_type` TEXT NOT NULL
- `message` TEXT NOT NULL
- `wedding_date` (optionnel)
- `guest_count` (optionnel)
- `budget_indicatif` (optionnel)
- `status` : 'pending', 'viewed', 'responded', 'accepted', 'rejected'
- `viewed_at`, `responded_at`

**Code actuel utilise :**
- `prestataire_id` au lieu de `provider_id` ❌
- `date_mariage` au lieu de `wedding_date` ❌
- `budget_min`, `budget_max` au lieu de `budget_indicatif` ❌
- `location` qui n'existe pas dans le schéma ❌
- Status : 'new', 'in-progress', 'accepted', 'rejected', 'completed' (différents) ❌

**Fichiers affectés :**
- `app/prestataire/demandes-recues/page.tsx` (ligne 104)
- `app/prestataire/dashboard/page.tsx` (ligne 111)
- `app/couple/demandes/page.tsx` (ligne 214)

**Action requise :** 
- Remplacer `prestataire_id` par `provider_id`
- Remplacer `date_mariage` par `wedding_date`
- Utiliser `budget_indicatif` au lieu de `budget_min`/`budget_max`
- Supprimer les références à `location`
- Adapter les valeurs de `status`

---

#### 3. **Table `messages` - INCOHÉRENCE**
**Schéma réel :**
- `read_at` TIMESTAMPTZ (nullable)
- Pas de colonne `is_read` ❌

**Code actuel utilise :**
- `is_read` BOOLEAN qui n'existe pas ❌

**Fichiers affectés :**
- `app/prestataire/messagerie/page.tsx` (ligne 84)
- `lib/supabase/messages.ts`

**Action requise :** Utiliser `read_at IS NOT NULL` au lieu de `is_read = true`

---

## 📋 Analyse Détaillée par Table

### ✅ Tables Correctement Utilisées

#### 1. **`profiles`**
- ✅ Utilisée correctement
- Colonnes principales : `id`, `email`, `role`, `prenom`, `nom`, `nom_entreprise`, `avatar_url`, etc.
- **Note :** Colonnes de réseaux sociaux ajoutées récemment (`instagram_url`, `facebook_url`, etc.)

#### 2. **`couples`**
- ✅ Utilisée correctement
- Colonnes : `id`, `user_id`, `email`, `partner_1_name`, `partner_2_name`, `wedding_date`, etc.

#### 3. **`evenements_prestataire`**
- ✅ **MAINTENANT CORRECTE** après les corrections récentes
- Colonnes : `id`, `prestataire_id`, `titre`, `date`, `heure_debut`, `heure_fin`, `lieu`, `notes`, `type_evenement`

#### 4. **`provider_cultures`**
- ✅ Utilisée correctement
- Colonnes : `id`, `profile_id`, `culture_id`

#### 5. **`provider_zones`**
- ✅ Utilisée correctement
- Colonnes : `id`, `profile_id`, `zone_id`

#### 6. **`provider_portfolio`**
- ✅ Utilisée correctement
- Colonnes : `id`, `profile_id`, `image_url`, `image_path`, `title`, `display_order`

#### 7. **`timeline_events`**
- ✅ Utilisée correctement
- Colonnes : `id`, `couple_id`, `title`, `description`, `event_date`

#### 8. **`budget_items`**
- ✅ Utilisée correctement
- Colonnes : `id`, `couple_id`, `title`, `category`, `amount`, `notes`

#### 9. **`favoris`**
- ✅ Utilisée correctement
- Colonnes : `id`, `couple_id`, `provider_id`

#### 10. **`devis`**
- ✅ Utilisée correctement
- Colonnes : `id`, `demande_id`, `provider_id`, `couple_id`, `title`, `description`, `amount`, `status`

#### 11. **`cultures`**
- ✅ Utilisée correctement
- Colonnes : `id`, `name`, `slug`, `region`, `popular`, `icon`, `description`

#### 12. **`couple_preferences`**
- ✅ Utilisée correctement
- Colonnes : `id`, `couple_id`, `primary_culture_id`, `secondary_culture_ids`, etc.

---

### ⚠️ Tables avec Incohérences

#### 1. **`conversations`**
**Problèmes :**
- Code utilise `prestataire_id` mais schéma a `provider_id`
- Code ne gère pas `status` ('active'/'archived')
- Code ne gère pas `unread_count_couple` et `unread_count_provider`

**Impact :** Les conversations ne fonctionneront pas correctement

#### 2. **`demandes`**
**Problèmes :**
- Code utilise `prestataire_id` mais schéma a `provider_id`
- Code utilise `date_mariage` mais schéma a `wedding_date`
- Code utilise `budget_min`/`budget_max` mais schéma a `budget_indicatif`
- Code utilise `location` qui n'existe pas
- Status différents entre code et schéma

**Impact :** Les demandes ne fonctionneront pas correctement

#### 3. **`messages`**
**Problèmes :**
- Code utilise `is_read` BOOLEAN mais schéma a `read_at` TIMESTAMPTZ

**Impact :** La gestion des messages non lus ne fonctionnera pas

---

## 🔧 Actions Correctives Nécessaires

### Priorité 1 - CRITIQUE

1. **Corriger `conversations` :**
   - Remplacer `prestataire_id` par `provider_id` dans tout le code
   - Ajouter gestion de `status`
   - Utiliser `unread_count_provider` et `unread_count_couple`

2. **Corriger `demandes` :**
   - Remplacer `prestataire_id` par `provider_id`
   - Remplacer `date_mariage` par `wedding_date`
   - Utiliser `budget_indicatif` au lieu de `budget_min`/`budget_max`
   - Supprimer références à `location`
   - Adapter les valeurs de `status`

3. **Corriger `messages` :**
   - Remplacer `is_read` par vérification `read_at IS NOT NULL`

### Priorité 2 - IMPORTANT

4. **Mettre à jour les types TypeScript** pour refléter le schéma réel

5. **Mettre à jour les migrations SQL** pour correspondre au schéma réel

---

## 📝 Notes Supplémentaires

- La table `couples_archive_2026_01_05` est une table d'archive, pas utilisée dans le code actuel ✅
- Les tables `early_adopter_*` sont utilisées pour le programme early adopter ✅
- Toutes les autres tables semblent correctement utilisées ✅
