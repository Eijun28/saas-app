# Machine Learning — Guide NUPLY

> Référence IA/ML pour le projet NUPLY. Concepts fondamentaux + application concrète par ordre de priorité.

---

## 1. Concepts fondamentaux

### 1.1 Types d'apprentissage

| Type | Principe | Cas d'usage NUPLY |
|------|----------|-------------------|
| **Supervisé** | Apprend sur données labellisées (entrée → sortie connue) | Prédire probabilité d'acceptation d'une demande |
| **Non supervisé** | Trouve des patterns cachés sans labels | Segmenter les couples par comportement |
| **Reinforcement** | Apprend par essai/erreur avec récompenses | Optimiser l'ordre des résultats matching |

### 1.2 Algorithmes clés

```
Régression linéaire    → Prédire une valeur continue (ex: budget estimé)
Classification         → Prédire une catégorie (ex: demande acceptée/rejetée)
Random Forest          → Combinaison d'arbres de décision, robuste et interprétable
Gradient Boosting      → Algorithme performant pour données tabulaires (XGBoost)
Systèmes de reco       → Collaborative filtering, content-based filtering
LLM (GPT-4)            → Compréhension langage naturel, génération de texte
RAG                    → Retrieval-Augmented Generation : LLM + données réelles injectées
```

### 1.3 RAG (Retrieval-Augmented Generation)

```
Principe :
  1. Requête utilisateur → Récupérer données pertinentes depuis la DB
  2. Injecter ces données dans le prompt du LLM
  3. Le LLM répond en s'appuyant sur des données réelles, pas des hallucinations

Sans RAG :
  User: "Quel est mon taux de conversion ?"
  IA: "Je n'ai pas accès à vos données..." ❌

Avec RAG :
  DB → { total: 24, accepted: 9, conversionRate: 37% }
  IA: "Votre taux est 37%, en dessous de la moyenne plateforme (52%).
       Votre bio est trop courte, c'est probablement la cause." ✅
```

---

## 2. État actuel NUPLY (avant ML)

### 2.1 Scoring matching — Rule-based (heuristique)

Le fichier `lib/matching/scoring.ts` implémente un scoring **déterministe** :

```
Score total (/100) =
  + calculateCulturalScore()     → /30 pts (cultures communes couple/prestataire)
  + calculateBudgetScore()       → /20 pts (chevauchement fourchettes)
  + calculateReputationScore()   → /20 pts (rating + nb avis)
  + calculateExperienceScore()   → /10 pts (années d'expérience)
  + calculateLocationScore()     → /10 pts (zones d'intervention)
  + calculateTagsScore()         → bonus /10 pts (tags style)
  + calculateSpecialtyScore()    → bonus /15 pts (spécialités)
  + calculateFairnessMultiplier()→ ×0.85-1.15 (équité exposition)
  + calculateCTRBonus()          → bonus/malus ±5 pts (taux de clics)
```

**Limite actuelle** : les poids sont définis manuellement. Ils ne s'adaptent pas selon les résultats réels (demandes acceptées/rejetées).

### 2.2 Chatbot IA — RAG implémenté

Le fichier `app/api/chatbot-advisor/route.ts` utilise désormais 3 couches de contexte injectées dans GPT-4 :

```typescript
// Couche 1 : Profil complet du prestataire
getProviderProfile(userId)
  → nom, service_type, bio, budget, zones, cultures, portfolio, tags

// Couche 2 : Stats de performance réelles (RAG)
getProviderStats(userId)
  → total demandes, taux de conversion, nb avis, note moyenne

// Couche 3 : Benchmarks marché (RAG)
calculateMarketAverage(service_type)
  → prix moyen, note moyenne, expérience moyenne sur la plateforme
```

---

## 3. Roadmap ML — Par ordre de priorité

### Phase 1 — Quick Win (fait ✅)

**RAG sur le chatbot-advisor**

- Injecte les stats réelles du prestataire dans le prompt GPT-4
- Injecte les moyennes marché par service type
- Résultat : conseils personnalisés et fondés sur des données réelles

Fichiers modifiés :
- `app/api/chatbot-advisor/route.ts`

---

### Phase 2 — Score matching adaptatif (2-4 semaines)

**Objectif** : affiner les poids du scoring selon l'historique réel des demandes.

**Données disponibles :**
```sql
-- Signal d'entraînement : demandes avec statut final
SELECT
  d.couple_id,
  d.prestataire_id,
  d.status,           -- 'accepted' | 'rejected' → label binaire
  p.budget_min, p.budget_max,
  p.annees_experience,
  COUNT(r.id) as review_count,
  AVG(r.rating) as avg_rating
FROM demandes d
JOIN profiles p ON p.id = d.prestataire_id
LEFT JOIN reviews r ON r.prestataire_id = d.prestataire_id
WHERE d.status IN ('accepted', 'rejected', 'completed')
GROUP BY d.id, p.id
```

**Implémentation recommandée :**

```typescript
// lib/matching/adaptive-weights.ts

// 1. Analyser les demandes historiques
// 2. Pour chaque prestataire accepté : quels critères avaient un bon score ?
// 3. Recalibrer les poids via régression logistique simple

// Poids actuels (fixes)
const WEIGHTS = {
  cultural: 30,
  budget: 20,
  reputation: 20,
  experience: 10,
  location: 10,
};

// Poids futurs (appris)
// → Ex: si cultural_score a forte corrélation avec acceptance → augmenter son poids
```

**Stack** : Pas de ML externe nécessaire — calcul statistique en TypeScript via les données Supabase.

---

### Phase 3 — Recommandations collaboratives (1-3 mois)

**Objectif** : "Les couples similaires à vous ont choisi X".

**Principe collaborative filtering :**
```
Matrice : couple_id × prestataire_id → score_interaction
  - 1 si favoris ou demande envoyée
  - 2 si demande acceptée
  - 3 si avis positif laissé

→ Trouver des couples avec profil similaire
→ Recommander les prestataires qu'ils ont choisis
```

**Implémentation :**
```typescript
// API Route : /api/recommendations
// Query SQL : couples similaires (même budget, mêmes cultures, même région)
// → Récupérer les prestataires qu'ils ont acceptés
// → Filtrer ceux déjà vus par le couple actuel
// → Trier par fréquence de sélection
```

Disponible dès ~500 demandes avec statut final dans la DB.

---

### Phase 4 — Analyse sémantique des avis (optionnel)

**Objectif** : extraire des insights qualitatifs depuis les commentaires d'avis.

```typescript
// Utilise l'OpenAI SDK déjà installé
// Analyse du sentiment + extraction de points clés

const analysis = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{
    role: 'system',
    content: 'Analyse ces avis et extrait les points forts et axes d\'amélioration.',
  }, {
    role: 'user',
    content: reviews.map(r => r.comment).join('\n---\n'),
  }],
  response_format: { type: 'json_object' },
});
// → { strengths: [...], improvements: [...], sentiment_score: 0.85 }
```

---

## 4. Stack technique recommandée

### Option A — Full TypeScript (recommandée pour NUPLY)

```
Next.js API Routes + Supabase SQL + OpenAI SDK
→ Zéro infrastructure supplémentaire
→ Compatible Vercel
→ Idéal pour Phases 1, 2, 4
```

### Option B — Python microservice (pour Phase 3+)

```
Next.js → /api/ml-proxy → FastAPI (Python)
                           scikit-learn / LightFM
Déploiement : Railway ou Render (séparé de Vercel)
→ Nécessaire uniquement si modèles complexes (matrix factorization)
```

---

## 5. Métriques à suivre

| Métrique | Définition | Cible |
|----------|------------|-------|
| **Taux de conversion matching** | demandes acceptées / demandes envoyées | > 40% |
| **Précision matching** | couples satisfaits (avis ≥ 4) / demandes acceptées | > 75% |
| **CTR prestataires** | clics profil / apparitions résultats | > 15% |
| **Retention couple** | couples avec 2+ demandes envoyées | > 60% |

---

## 6. Fichiers clés

```
lib/matching/scoring.ts          → Algorithme de scoring actuel (rule-based)
lib/matching/market-averages.ts  → Calcul moyennes marché par service
lib/matching/adaptive-weights.ts → À créer (Phase 2)
app/api/matching/route.ts        → Endpoint matching principal
app/api/chatbot-advisor/route.ts → Chatbot prestataire avec RAG (✅ fait)
app/api/chatbot/route.ts         → Chatbot couple avec moyennes marché
```

---

*Dernière mise à jour : 2026-02-25*
