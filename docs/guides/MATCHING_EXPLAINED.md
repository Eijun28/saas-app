# 📊 Explication du Système de Matching

## 🎯 Où nous en sommes

### ✅ Ce qui fonctionne actuellement

1. **Chatbot conversationnel**
   - Extraction des critères via conversation naturelle
   - Détection automatique des confirmations utilisateur
   - Normalisation des service_type
   - Encodage UTF-8 corrigé

2. **Matching de base**
   - Filtres durs (service_type, rôle, budget)
   - Enrichissement des données prestataires
   - Calcul de scores multi-critères
   - Sélection des top 3

3. **Base de données**
   - Contraintes FK corrigées
   - Tables bien structurées

### ⚠️ Problèmes identifiés

1. **Filtre budget trop restrictif** → Peut exclure des prestataires valides
2. **Pas de fallback** → Si aucun résultat, rien n'est proposé
3. **Scoring peut être amélioré** → Certains critères ne sont pas optimaux

---

## 🔍 Comment fonctionne le MATCHING actuellement

### ÉTAPE 1 : FILTRES DURS (Ligne 141-180 dans `app/api/matching/route.ts`)

Ces filtres **excluent** les prestataires qui ne correspondent pas :

```typescript
// 1. Rôle obligatoire
.eq('role', 'prestataire')

// 2. Service type exact (après normalisation)
.eq('service_type', normalizedServiceType)

// 3. Budget : budget_min prestataire <= budget_max couple
.lte('budget_min', search_criteria.budget_max)
```

**⚠️ PROBLÈME ACTUEL :**
- Si un prestataire a `budget_min = 1500€` et le couple a `budget_max = 1000€`, il est **exclu**
- Mais si le prestataire peut faire des prestations à 800€, il devrait être inclus !

### ÉTAPE 2 : ENRICHISSEMENT (Ligne 89-119)

Pour chaque prestataire qui passe les filtres :
- Récupération des cultures (`provider_cultures`)
- Récupération des zones (`provider_zones`)
- Comptage du portfolio
- Note et nombre d'avis

### ÉTAPE 3 : CALCUL DES SCORES (Ligne 121-139)

Chaque prestataire reçoit un score sur 100 points :

#### 📊 Détail des scores

1. **Match culturel** : /30 points
   - Compare les cultures du couple avec celles du prestataire
   - Pondéré selon l'importance (essential/important/nice_to_have)

2. **Match budget** : /20 points ⚠️ **À COMPRENDRE**
   - Voir section dédiée ci-dessous

3. **Réputation** : /20 points
   - Note moyenne (/16) + bonus nombre d'avis (/4)

4. **Expérience** : /10 points
   - 1 point par année d'expérience (max 10)

5. **Localisation** : /10 points
   - Match département = 10 points
   - Match ville = 10 points
   - Match région = 6 points
   - Sinon = 2 points

### ÉTAPE 4 : TRI ET SÉLECTION (Ligne 141-145)

- Tri par score décroissant
- Sélection des **top 3** uniquement

---

## 💰 Comment fonctionne le BUDGET

### 🔴 FILTRE BUDGET (Étape 1 - Exclusion)

**Logique actuelle :**
```typescript
// Un prestataire est EXCLU si :
budget_min_prestataire > budget_max_couple
```

**Exemple :**
- Couple : budget_max = 1000€
- Prestataire A : budget_min = 800€, budget_max = 2000€
- Prestataire B : budget_min = 1500€, budget_max = 3000€

**Résultat :**
- ✅ Prestataire A : **INCLUS** (800€ <= 1000€)
- ❌ Prestataire B : **EXCLU** (1500€ > 1000€)

**⚠️ PROBLÈME :**
Si le Prestataire B peut parfois faire des prestations à 900€, il est exclu alors qu'il pourrait correspondre !

### 🟢 SCORE BUDGET (Étape 3 - Scoring)

**Logique actuelle** (`lib/matching/scoring.ts` ligne 40-78) :

1. **Calcul des moyennes :**
   ```typescript
   coupleAvg = (budget_min + budget_max) / 2
   providerAvg = (budget_min + budget_max) / 2
   ```

2. **Score parfait (20/20) :**
   - Si `providerAvg` est dans la fourchette du couple
   - Exemple : Couple 500-1000€, Prestataire 600-900€ → Score 20

3. **Score avec pénalité :**
   - Calcul de l'écart : `diff = |coupleAvg - providerAvg|`
   - Pourcentage d'écart : `diffPercentage = diff / coupleAvg`
   - Pénalité selon flexibilité :
     - `flexible` : pénalité × 0.3
     - `somewhat_flexible` : pénalité × 0.5
     - `strict` : pénalité × 1.0
   - Score final : `20 - (diffPercentage × 100 × penalty)`

**Exemple concret :**
- Couple : 500-1000€ (moyenne = 750€)
- Prestataire : 1200-2000€ (moyenne = 1600€)
- Écart : 850€ (113% de la moyenne couple)
- Flexibilité : `somewhat_flexible` (×0.5)
- Score : `20 - (113 × 0.5) = 20 - 56.5 = -36.5` → **0 points** (min 0)

---

## 🚀 Améliorations à faire

### 1. 🔴 PRIORITÉ HAUTE : Améliorer le filtre budget

**Problème actuel :**
Le filtre exclut les prestataires dont le `budget_min` est > `budget_max` du couple, même s'ils peuvent adapter leur prix.

**Solution proposée :**
```typescript
// Au lieu de filtrer strictement, être plus permissif :
// Inclure si :
// - budget_min <= budget_max_couple (logique actuelle)
// OU
// - budget_max existe ET budget_max >= budget_min_couple (chevauchement)
// OU
// - Pas de budget_max défini (prestataire flexible)

if (search_criteria.budget_max) {
  // Option 1 : Moins restrictif (recommandé)
  query = query.lte('budget_min', search_criteria.budget_max * 1.2); // 20% de marge
  
  // Option 2 : Vérifier le chevauchement des fourchettes
  // (nécessite une requête plus complexe avec OR)
}
```

**Impact :** Plus de résultats, le scoring s'occupera de pénaliser ceux qui sont hors budget.

### 2. 🟡 PRIORITÉ MOYENNE : Améliorer le scoring budget

**Problème actuel :**
Le scoring utilise la moyenne, ce qui peut être trompeur.

**Solution proposée :**
```typescript
// Vérifier le chevauchement réel des fourchettes
function calculateBudgetScore(
  coupleMin, coupleMax,
  providerMin, providerMax
) {
  // Cas 1 : Fourchettes se chevauchent → Score parfait
  if (providerMin <= coupleMax && providerMax >= coupleMin) {
    return 20;
  }
  
  // Cas 2 : Prestataire moins cher → Score bon (15-18)
  if (providerMax < coupleMin) {
    const discount = (coupleMin - providerMax) / coupleMin;
    return Math.max(15, 20 - discount * 10);
  }
  
  // Cas 3 : Prestataire plus cher → Score avec pénalité
  if (providerMin > coupleMax) {
    const overage = (providerMin - coupleMax) / coupleMax;
    const penalty = overage * 100 * flexibilityMultiplier;
    return Math.max(0, 20 - penalty);
  }
}
```

### 3. 🟡 PRIORITÉ MOYENNE : Fallback si aucun résultat

**Problème actuel :**
Si aucun prestataire ne passe les filtres, rien n'est retourné.

**Solution proposée :**
```typescript
if (!providers || providers.length === 0) {
  // Essayer avec des filtres moins stricts
  const relaxedQuery = supabase
    .from('profiles')
    .select('...')
    .eq('role', 'prestataire')
    .eq('service_type', normalizedServiceType);
    // Pas de filtre budget
  
  const { data: relaxedProviders } = await relaxedQuery;
  
  if (relaxedProviders && relaxedProviders.length > 0) {
    // Retourner avec un message : "Aucun prestataire dans votre budget, mais voici des options proches"
    return {
      matches: [...],
      warning: "Aucun prestataire dans votre budget exact",
      total_candidates: relaxedProviders.length
    };
  }
}
```

### 4. 🟢 PRIORITÉ BASSE : Améliorer le scoring culturel

**Problème actuel :**
Le scoring culturel est basique (match simple).

**Solution proposée :**
- Ajouter des synonymes (maghrébin = marocain + algérien + tunisien)
- Pondérer selon la proximité culturelle
- Bonus si le prestataire gère plusieurs cultures du couple

### 5. 🟢 PRIORITÉ BASSE : Ajouter un score "completude profil"

**Idée :**
- Bonus pour les prestataires avec profil complet (portfolio, bio, etc.)
- Pénalité pour les profils incomplets

---

## 📝 Résumé du flux complet

```
1. Utilisateur parle au chatbot
   ↓
2. Chatbot extrait : service_type, cultures, budget, style
   ↓
3. Normalisation service_type ("papetier" → "faire_part")
   ↓
4. FILTRES DURS (exclusion)
   - role = 'prestataire'
   - service_type exact
   - budget_min <= budget_max_couple
   ↓
5. ENRICHISSEMENT
   - Cultures, zones, portfolio, notes
   ↓
6. SCORING (/100 points)
   - Culture : /30
   - Budget : /20
   - Réputation : /20
   - Expérience : /10
   - Localisation : /10
   ↓
7. TRI ET TOP 3
   ↓
8. Retour des résultats
```

---

## 🎯 Actions immédiates recommandées

1. **Appliquer la migration** `027_fix_foreign_key_constraints.sql` dans Supabase
2. **Tester le matching** avec les logs pour voir ce qui se passe réellement
3. **Améliorer le filtre budget** (priorité haute)
4. **Ajouter un fallback** si aucun résultat (priorité moyenne)

---

## 🔧 Pour tester et déboguer

Les logs ajoutés vous permettront de voir :
- Le service_type normalisé utilisé
- Le nombre total de prestataires pour ce service
- Les critères de recherche exacts
- Les prestataires trouvés après chaque étape

Vérifiez la console serveur lors d'une recherche pour comprendre ce qui se passe.
