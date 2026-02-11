# Audit Complet du Schema Supabase - NUPLY

> Audit realise le 2026-02-11 sur la base du schema SQL actuel et du code source.

---

## RESUME EXECUTIF

| Categorie | Nombre |
|-----------|--------|
| Tables analysees | 33 |
| Bugs critiques (bloquants) | 5 |
| Incoherences de FK (risque d'erreur runtime) | 6 |
| Problemes de design (non bloquant) | 8 |
| Tables OK | ~20 |

**Verdict global : le schema presente des incoherences de foreign keys entre tables qui peuvent provoquer des erreurs en production.** Les tables individuelles sont bien structurees, mais les references croisees entre elles sont inconsistantes (mix `auth.users(id)` vs `profiles(id)` vs `couples(id)`).

---

## 1. BUGS CRITIQUES

### 1.1 `reviews.couple_id` reference `profiles(id)` au lieu de `couples(id)`

**Table :** `reviews`
**Probleme :** La FK `reviews_couple_id_fkey` pointe vers `profiles(id)`. Or, dans le schema, les couples sont dans la table `couples` et le `couple_id` devrait logiquement pointer vers `couples(id)`.

```sql
-- Actuel (incorrect)
CONSTRAINT reviews_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.profiles(id)

-- Attendu
CONSTRAINT reviews_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id)
```

**Impact :** Si le code insere un `couple_id` provenant de `couples.id`, l'insert echouera car la FK verifie `profiles(id)`. Le code actuel utilise `user.id` (auth.users.id) ce qui fonctionne car `profiles.id = auth.users.id`, mais c'est semantiquement faux - on ne peut pas lier un avis a un couple specifique, seulement a un user.

**Correction :** Modifier la FK pour pointer vers `couples(id)` ou `couples(user_id)` selon le modele voulu.

---

### 1.2 Inconsistance des references `prestataire_id` entre tables

**Probleme :** Certaines tables referencent le prestataire via `profiles(id)`, d'autres via `auth.users(id)`. Puisque `profiles.id = auth.users.id`, ca fonctionne en pratique, mais c'est un risque de confusion et une violation de la coherence relationnelle.

| Table | Colonne | Reference FK | Devrait etre |
|-------|---------|-------------|--------------|
| `devis` | `prestataire_id` | `profiles(id)` | OK |
| `devis_templates` | `prestataire_id` | `auth.users(id)` | `profiles(id)` |
| `provider_devis_settings` | `prestataire_id` | `auth.users(id)` | `profiles(id)` |
| `provider_referrals` | `provider_id` | `auth.users(id)` | `profiles(id)` |
| `factures` | `prestataire_id` | **AUCUNE FK** | `profiles(id)` |
| `evenements_prestataire` | `prestataire_id` | `profiles(id)` | OK |
| `billing_consent_requests` | `prestataire_id` | `profiles(id)` | OK |

**Impact :** `factures.prestataire_id` n'a aucune contrainte FK - n'importe quel UUID peut etre insere, cassant l'integrite referentielle. `devis_templates` et `provider_devis_settings` pointent vers `auth.users(id)` alors que toutes les autres tables prestataire pointent vers `profiles(id)`.

**Correction :**
- Ajouter `FOREIGN KEY (prestataire_id) REFERENCES profiles(id)` sur `factures`
- Migrer `devis_templates.prestataire_id` et `provider_devis_settings.prestataire_id` vers `profiles(id)` pour la coherence

---

### 1.3 `devis.demande_id` - FK manquante dans le schema

**Table :** `devis`
**Probleme :** La colonne `demande_id` existe mais il n'y a **aucune FK declaree** dans le schema fourni. Le code l'utilise pour lier un devis a une request (`requests.id`), mais rien ne garantit l'integrite.

```sql
-- Manquant
CONSTRAINT devis_demande_id_fkey FOREIGN KEY (demande_id) REFERENCES public.requests(id)
```

**Impact :** Un devis peut etre cree avec un `demande_id` qui ne correspond a aucune request existante.

---

### 1.4 `conversations.couple_id` et `conversations.provider_id` - FK manquantes

**Table :** `conversations`
**Probleme :** Les colonnes `couple_id` et `provider_id` n'ont aucune FK declaree dans le schema. D'apres les migrations, elles devraient reference soit `auth.users(id)` soit `couples(id)`/`profiles(id)`.

**Impact :** Aucune contrainte d'integrite sur les participants d'une conversation.

---

### 1.5 `database.types.ts` completement desynchronise du schema reel

**Fichier :** `types/database.types.ts`
**Probleme :** Le fichier TypeScript definit des tables qui n'existent plus (`couple_profiles`, `prestataire_profiles`) et ne definit pas les tables qui existent (`couples`, `requests`, `conversations`, `messages`, `devis`, `factures`, etc.).

Le type `Couple` dans ce fichier a des colonnes fantomes :
- `date_mariage` (le schema a `wedding_date`)
- `lieu_marriage` (n'existe pas)
- `prenom`, `nom` (n'existent pas dans `couples`, seulement dans `profiles`)

Le type `profiles` dans `Database.public.Tables` definit `role: 'couple' | 'prestataire'` mais le schema a `CHECK (role IS NULL OR role = 'prestataire')` - un couple n'a jamais `role = 'couple'` dans `profiles`.

**Impact :** Les types TS ne protegent pas le code des erreurs de colonnes. Le code compile mais plante au runtime.

---

## 2. INCOHERENCES DE DESIGN (NON BLOQUANTS MAIS A CORRIGER)

### 2.1 `requests.couple_id` reference `couples(user_id)` et non `couples(id)`

```sql
CONSTRAINT requests_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(user_id)
```

C'est inhabituel. Partout ailleurs, `couple_id` pointe vers `couples(id)`. Ici, il pointe vers `couples(user_id)` qui est le `auth.users.id`. Cela signifie que `requests.couple_id` contient un `auth.users.id` et non un `couples.id`.

**Tables qui utilisent `couple_id -> couples(id)` :** `budget_items`, `chatbot_conversations`, `couple_billing_info`, `couple_preferences`, `devis`, `factures`, `favoris`, `matching_history`, `timeline_events`, `billing_consent_requests`

**Table qui utilise `couple_id -> couples(user_id)` :** `requests`

**Impact :** Quand on joint `requests` avec `devis` sur `couple_id`, les valeurs ne correspondent pas (l'un est `auth.users.id`, l'autre est `couples.id`). Ca peut provoquer des jointures vides.

---

### 2.2 `favoris.prestataire_id` - nommage inconsistant

Le schema utilise `prestataire_id` qui pointe vers `profiles(id)`, mais la table `conversations` utilise `provider_id` pour le meme concept. Le nommage devrait etre uniforme.

Tables utilisant `prestataire_id` : `devis`, `factures`, `evenements_prestataire`, `prestataire_banking_info`, `billing_consent_requests`, `favoris`, `devis_templates`, `provider_devis_settings`

Tables utilisant `provider_id` : `conversations`, `requests`, `provider_pricing`, `provider_referrals`

---

### 2.3 `couples` n'a pas de `created_at`

La table `couples` n'a pas de colonne `created_at` contrairement a toutes les autres tables. Seul `updated_at` est present.

---

### 2.4 Contrainte UNIQUE manquante sur `favoris`

La table `favoris` n'a pas de contrainte `UNIQUE(couple_id, prestataire_id)`. Un couple peut ajouter le meme prestataire en favori plusieurs fois.

---

### 2.5 Contrainte UNIQUE manquante sur `provider_cultures` et `provider_zones`

- `provider_cultures` : pas de `UNIQUE(profile_id, culture_id)` - un provider peut avoir la meme culture deux fois
- `provider_zones` : pas de `UNIQUE(profile_id, zone_id)` - un provider peut avoir la meme zone deux fois
- `provider_tags` : pas de `UNIQUE(profile_id, tag_id)` - meme probleme

---

### 2.6 `profiles.role` ne peut jamais etre `'couple'`

```sql
CHECK (role IS NULL OR role = 'prestataire')
```

Cela signifie qu'un profil est soit `NULL` (couple) soit `'prestataire'`. Le type TypeScript definit `role: 'couple' | 'prestataire'` ce qui est faux.

---

### 2.7 `cultures.id` est de type `text` et non `uuid`

La table `cultures` utilise `id text` au lieu de `uuid`. C'est un choix de design (probablement des slugs comme `'marocaine'`, `'indienne'`), mais ca casse la convention du reste du schema. `couple_preferences.primary_culture_id` et `provider_cultures.culture_id` sont aussi en `text` pour correspondre.

---

### 2.8 `chatbot_conversations` utilise `uuid_generate_v4()` vs `gen_random_uuid()`

La plupart des tables utilisent `gen_random_uuid()` pour les IDs, mais `chatbot_conversations` et `matching_history` utilisent `uuid_generate_v4()`. Les deux fonctionnent mais c'est inconsistant et `uuid_generate_v4()` necessite l'extension `uuid-ossp`.

---

## 3. TABLES OK (AUCUN PROBLEME DETECTE)

Les tables suivantes sont correctement definies avec des FK valides, des CHECK constraints coherentes et un nommage correct :

- `profiles` - structure solide, CHECK sur `siret`, `description_courte`, `role`
- `couples` - bien structure (manque juste `created_at`)
- `couple_preferences` - bonnes contraintes CHECK sur `completion_percentage` et `onboarding_step`
- `couple_billing_info` - FK et UNIQUE corrects
- `budget_items` - simple et correct
- `timeline_events` - simple et correct
- `messages` - FK et CHECK sur `content` corrects
- `tags` - UNIQUE sur `label` et `slug`
- `provider_portfolio` - CHECK sur `file_type` correct
- `provider_pricing` - bonnes valeurs CHECK sur `pricing_unit`
- `prestataire_banking_info` - FK UNIQUE correct
- `prestataire_public_profiles` - CHECK sur `rating` [0-5] et `total_reviews >= 0`
- `email_logs` - bonne liste de CHECK sur `email_type`
- `vendor_invitations` - bon modele avec `status`, `channel`, expiration
- `early_adopter_program` - table de configuration singleton
- `early_adopter_notifications` - simple et correct
- `referral_usages` - UNIQUE sur `referred_user_id` (un user ne peut etre refere qu'une fois)
- `evenements_prestataire` - correct avec CHECK sur `type_evenement`

---

## 4. MATRICE DE REFERENCE DES IDS

Pour visualiser les inconsistances, voici a quoi chaque `couple_id` et `prestataire_id`/`provider_id` fait reference :

### couple_id

| Table | Reference | Type d'ID |
|-------|-----------|-----------|
| `budget_items` | `couples(id)` | UUID couple |
| `chatbot_conversations` | `couples(id)` | UUID couple |
| `couple_billing_info` | `couples(id)` | UUID couple |
| `couple_preferences` | `couples(id)` | UUID couple |
| `billing_consent_requests` | `couples(id)` | UUID couple |
| `devis` | `couples(id)` | UUID couple |
| `factures` | `couples(id)` | UUID couple |
| `favoris` | `couples(id)` | UUID couple |
| `matching_history` | `couples(id)` | UUID couple |
| `timeline_events` | `couples(id)` | UUID couple |
| **`requests`** | **`couples(user_id)`** | **UUID auth.users** |
| **`reviews`** | **`profiles(id)`** | **UUID auth.users** |
| `conversations` | pas de FK | inconnu |

### prestataire_id / provider_id

| Table | Colonne | Reference |
|-------|---------|-----------|
| `devis` | `prestataire_id` | `profiles(id)` |
| `factures` | `prestataire_id` | **AUCUNE FK** |
| `evenements_prestataire` | `prestataire_id` | `profiles(id)` |
| `prestataire_banking_info` | `prestataire_id` | `profiles(id)` |
| `billing_consent_requests` | `prestataire_id` | `profiles(id)` |
| `favoris` | `prestataire_id` | `profiles(id)` |
| `devis_templates` | `prestataire_id` | `auth.users(id)` |
| `provider_devis_settings` | `prestataire_id` | `auth.users(id)` |
| `provider_referrals` | `provider_id` | `auth.users(id)` |
| `requests` | `provider_id` | `auth.users(id)` |
| `reviews` | `provider_id` | `profiles(id)` |
| `conversations` | `provider_id` | pas de FK |

---

## 5. PLAN DE CORRECTION RECOMMANDE

### Priorite 1 - Critique (risques d'erreurs runtime)

1. **Ajouter FK manquantes :**
   - `factures.prestataire_id -> profiles(id)`
   - `devis.demande_id -> requests(id)`
   - `conversations.couple_id` et `conversations.provider_id` (definir les references)

2. **Corriger `reviews.couple_id` :** decider si c'est `couples(id)` ou `profiles(id)` et aligner le code

3. **Uniformiser `requests.couple_id` :** actuellement `couples(user_id)` alors que partout c'est `couples(id)` - source de bugs lors de jointures

4. **Regenerer `database.types.ts` :** utiliser `supabase gen types typescript` pour regenerer les types a partir du schema reel

### Priorite 2 - Important (integrite des donnees)

5. **Ajouter contraintes UNIQUE :**
   - `favoris(couple_id, prestataire_id)`
   - `provider_cultures(profile_id, culture_id)`
   - `provider_zones(profile_id, zone_id)`
   - `provider_tags(profile_id, tag_id)`

6. **Uniformiser les FK prestataire :** migrer `devis_templates` et `provider_devis_settings` de `auth.users(id)` vers `profiles(id)`

7. **Ajouter `created_at` a la table `couples`**

### Priorite 3 - Nettoyage

8. **Uniformiser le nommage** : choisir `prestataire_id` OU `provider_id` et s'y tenir partout
9. **Uniformiser `gen_random_uuid()` vs `uuid_generate_v4()`**
10. **Corriger le type `profiles.role`** dans les types TS (`null | 'prestataire'` et non `'couple' | 'prestataire'`)
