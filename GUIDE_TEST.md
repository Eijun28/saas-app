# 🧪 Guide de Test - Nouvelles Fonctionnalités

## 📋 Prérequis

1. **Variables d'environnement** : Vérifier que `.env.local` contient :
   ```env
   OPENAI_API_KEY=sk-...
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

2. **Base de données** : S'assurer que la table `prestataire_profiles` existe avec des données de test

## 🚀 Démarrer l'application

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

---

## ✅ Tests à effectuer

### 1. Page "Trouver Prestataires"

**URL** : `http://localhost:3000/trouver-prestataires`

#### Test 1.1 : Affichage initial
- [ ] La page s'affiche correctement
- [ ] Le message d'accueil de l'IA apparaît
- [ ] Les couleurs sont cohérentes (violet #823F91)
- [ ] La police Inter est utilisée partout

#### Test 1.2 : Interface de chat
- [ ] Le textarea s'agrandit automatiquement
- [ ] Le bouton "Envoyer" est désactivé si le champ est vide
- [ ] Les messages utilisateur s'affichent à droite (violet)
- [ ] Les messages assistant s'affichent à gauche (violet clair)
- [ ] Les timestamps s'affichent correctement

---

### 2. Tests de l'API `/api/chat/match`

#### Test 2.1 : Intention "greeting"
**Message** : `"Bonjour"` ou `"Salut"`

**Résultat attendu** :
- Message d'accueil avec exemples
- `conversation_stage: 'greeting'`
- Pas de prestataires retournés

**Commande de test** :
```bash
curl -X POST http://localhost:3000/api/chat/match \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Bonjour"}
    ]
  }'
```

#### Test 2.2 : Intention "new_search"
**Message** : `"Je cherche un photographe"` ou `"Besoin d'un traiteur"`

**Résultat attendu** :
- Confirmation de la catégorie
- Questions pour collecter les infos manquantes
- `conversation_stage: 'collecting_info'`

**Commande de test** :
```bash
curl -X POST http://localhost:3000/api/chat/match \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Je cherche un photographe pour mon mariage"}
    ]
  }'
```

#### Test 2.3 : Intention "provide_info" - Recherche complète
**Messages** :
1. `"Je cherche un photographe"`
2. `"Notre mariage est le 15 juin 2025 à Paris, budget 4000€, on est franco-algérien"`

**Résultat attendu** :
- Extraction des critères (date, lieu, budget, cultures)
- Recherche dans Supabase
- Calcul des scores de compatibilité
- Retour des top 5 prestataires
- Message personnalisé avec le top match

**Commande de test** :
```bash
curl -X POST http://localhost:3000/api/chat/match \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Je cherche un photographe"},
      {"role": "assistant", "content": "Super ! Pourriez-vous me donner plus de détails ?"},
      {"role": "user", "content": "Notre mariage est le 15 juin 2025 à Paris, budget 4000€, on est franco-algérien"}
    ]
  }'
```

#### Test 2.4 : Intention "question"
**Message** : `"Comment ça marche ?"` ou `"Qu'est-ce que vous pouvez faire ?"`

**Résultat attendu** :
- Réponse claire et utile
- Pas de prestataires retournés

#### Test 2.5 : Intention "refine"
**Messages** :
1. Recherche complète (voir Test 2.3)
2. `"Peux-tu chercher avec un budget plus élevé ?"` ou `"Je préfère un style moderne"`

**Résultat attendu** :
- Nouvelle recherche avec critères modifiés
- Nouveaux résultats affichés

---

### 3. Tests du Moteur de Compatibilité

#### Test 3.1 : Calcul de compatibilité
**Fichier** : `lib/compatibility/engine.ts`

**Test unitaire** (à créer dans un fichier de test) :
```typescript
import { CompatibilityEngine } from '@/lib/compatibility/engine';

const engine = new CompatibilityEngine();
const couple = {
  wedding_date: new Date('2025-06-15'),
  budget_breakdown: { photography: 4000 },
  guest_count: 150,
  location: { city: 'Paris', region: 'Île-de-France', coordinates: [0, 0] },
  cultural_background: ['french', 'algerian'],
  languages: ['french'],
  religions: ['muslim'],
  style_preferences: ['modern'],
  dietary_needs: ['halal'],
  category_priorities: { photography: 8 },
  flexibility_options: { date: false, budget: true, location: false },
};

const provider = {
  id: '1',
  business_name: 'Photo Test',
  category: 'photography',
  service_locations: ['Paris'],
  price_range: { min: 3000, max: 5000 },
  guest_capacity: { min: 100, max: 200 },
  cultural_specialties: ['algerian', 'french'],
  languages: ['french', 'arabic'],
  dietary_options: ['halal'],
  style_tags: ['modern'],
  average_rating: 4.8,
};

const result = engine.calculateOverallCompatibility(couple, provider, 'photography');

console.log('Score global:', result.overall); // Devrait être >= 70
console.log('Raison:', result.reason);
console.log('Breakdown:', result.breakdown);
```

**Vérifications** :
- [ ] Score global entre 0 et 100
- [ ] Breakdown contient tous les critères
- [ ] Raison générée est pertinente

---

### 4. Tests des Composants UI

#### Test 4.1 : ProviderResults
**Scénario** : Afficher des prestataires avec scores

**Données de test** :
```json
[
  {
    "id": "1",
    "business_name": "Photographe Test",
    "category": "photography",
    "service_locations": ["Paris"],
    "average_rating": 4.8,
    "review_count": 25,
    "compatibility_rating": 92,
    "selection_reasoning": "Excellent match : budget adapté, spécialisé dans votre culture",
    "cultural_specialties": ["algerian", "french"],
    "price_range": { "min": 3500, "max": 4500 },
    "portfolio_image_url": null
  }
]
```

**Vérifications** :
- [ ] Le badge "Notre coup de cœur" apparaît pour le premier
- [ ] Le score de compatibilité s'affiche correctement
- [ ] Les tags culturels sont visibles
- [ ] Le bouton "Voir le profil complet" fonctionne
- [ ] Le bouton favori change d'état au clic

#### Test 4.2 : ChatInterface - États de chargement
**Scénario** : Tester les différents messages de chargement

**Vérifications** :
- [ ] "Un instant..." s'affiche par défaut
- [ ] "Recherche en cours..." s'affiche quand `conversation_stage === 'searching'`
- [ ] Le spinner tourne correctement

---

### 5. Tests d'Intégration End-to-End

#### Test 5.1 : Parcours complet
1. Aller sur `/trouver-prestataires`
2. Envoyer : `"Bonjour"`
3. Envoyer : `"Je cherche un traiteur halal"`
4. Répondre aux questions : `"Mariage le 20 juillet à Lyon, 200 invités, budget 5000€"`
5. Vérifier que les prestataires s'affichent
6. Cliquer sur "Voir le profil complet" d'un prestataire

**Résultat attendu** :
- Conversation fluide
- Extraction correcte des critères
- Prestataires pertinents affichés
- Scores de compatibilité calculés

#### Test 5.2 : Gestion des erreurs
**Scénario** : Tester les cas d'erreur

1. **Erreur API** : Désactiver temporairement OpenAI
   - Vérifier qu'un message d'erreur s'affiche
   - Vérifier que l'interface reste utilisable

2. **Aucun résultat** : Chercher un prestataire inexistant
   - Message proposant d'élargir les critères

3. **Message invalide** : Envoyer un message vide
   - Le bouton doit être désactivé

---

### 6. Tests de Performance

#### Test 6.1 : Temps de réponse
**Métriques à vérifier** :
- Temps de réponse API < 5 secondes
- Affichage des messages < 100ms
- Scroll fluide dans la zone de chat

#### Test 6.2 : Optimisations
- [ ] Les messages sont sanitisés (pas de XSS)
- [ ] Les requêtes Supabase sont limitées (max 20 résultats)
- [ ] Le scoring est optimisé (top 5 seulement)

---

### 7. Tests de Sécurité

#### Test 7.1 : Sanitisation
**Message de test** : `"<script>alert('XSS')</script>Bonjour"`

**Vérification** :
- Le script ne s'exécute pas
- Le texte est échappé dans l'interface

#### Test 7.2 : Validation des entrées
**Tests** :
- Message trop long (> 1000 caractères) → Rejeté
- Messages vides → Rejetés
- Types de données invalides → Erreur 400

---

## 🐛 Dépannage

### Problème : L'API retourne une erreur 500
**Solutions** :
1. Vérifier que `OPENAI_API_KEY` est défini
2. Vérifier que Supabase est accessible
3. Consulter les logs serveur : `npm run dev` dans le terminal

### Problème : Aucun prestataire trouvé
**Solutions** :
1. Vérifier que la table `prestataire_profiles` contient des données
2. Vérifier que les catégories correspondent (photography, venue, etc.)
3. Élargir les critères de recherche (budget, localisation)

### Problème : Les couleurs ne sont pas cohérentes
**Solutions** :
1. Vérifier que `globals.css` est importé dans `layout.tsx`
2. Vider le cache du navigateur (Ctrl+Shift+R)
3. Vérifier que Tailwind CSS est bien configuré

---

## 📊 Checklist de Validation

Avant de considérer les tests comme réussis :

- [ ] Toutes les intentions sont détectées correctement
- [ ] L'extraction des critères fonctionne pour tous les cas
- [ ] Les prestataires sont retournés avec des scores pertinents
- [ ] L'interface est responsive (mobile/tablet/desktop)
- [ ] Les couleurs sont cohérentes partout
- [ ] La police Inter est utilisée partout
- [ ] Aucune erreur dans la console navigateur
- [ ] Aucune erreur dans les logs serveur
- [ ] Les performances sont acceptables (< 5s pour une recherche)

---

## 🔗 URLs de Test

- Page principale : `http://localhost:3000/trouver-prestataires`
- API directe : `http://localhost:3000/api/chat/match`
- Documentation API : Voir le code dans `app/api/chat/match/route.ts`

---

## 💡 Conseils

1. **Utiliser la console navigateur** : F12 → Console pour voir les erreurs
2. **Utiliser Network tab** : Voir les requêtes API et leurs réponses
3. **Tester avec différents navigateurs** : Chrome, Firefox, Safari
4. **Tester sur mobile** : Utiliser les DevTools de Chrome (responsive mode)

