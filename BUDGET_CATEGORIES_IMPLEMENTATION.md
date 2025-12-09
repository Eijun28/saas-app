# 📊 Système de Catégories de Dépenses - Documentation

## ✅ Implémentation terminée

Le système de répartition du budget par catégories a été implémenté avec succès.

## 📁 Fichiers créés/modifiés

### 1. Base de données (SQL)
- **`BUDGET_CATEGORIES_UPDATE.sql`** : Script SQL pour ajouter les champs `category_icon` et `order_index` à la table `budget_categories`

### 2. Types
- **`lib/types/budget.ts`** : Mis à jour avec :
  - Type `BudgetCategory` incluant `category_icon` et `order_index`
  - `DEFAULT_CATEGORIES` avec icônes pour chaque catégorie

### 3. Server Actions
- **`lib/actions/budget-categories.ts`** : Nouvelles actions :
  - `initializeDefaultCategories()` - Initialise les catégories par défaut avec icônes
  - `addCustomCategory()` - Ajoute une catégorie personnalisée

### 4. Composants UI
- **`components/ui/dialog.tsx`** : Composant Dialog pour les modales

### 5. Composants Budget
- **`components/budget/BudgetCategoriesSection.tsx`** : Nouveau composant avec :
  - Affichage des catégories avec icônes
  - Barres de progression par catégorie
  - Édition inline du budget
  - Ajout de catégories personnalisées
  - Calcul du budget alloué vs restant

### 6. Pages
- **`app/dashboard/budget/page.tsx`** : Intégration du nouveau composant

## 🚀 Installation

### Étape 1 : Mettre à jour la table dans Supabase

1. Ouvrez votre projet Supabase
2. Allez dans l'éditeur SQL
3. Copiez et exécutez le contenu de `BUDGET_CATEGORIES_UPDATE.sql`

### Étape 2 : Vérifier les dépendances

Le package `@radix-ui/react-dialog` a été installé. Si ce n'est pas le cas :

```bash
npm install @radix-ui/react-dialog
```

## 📊 Structure des données

### Table `budget_categories` (mise à jour)
- `category_icon` : Icône emoji pour la catégorie (TEXT)
- `order_index` : Ordre d'affichage (INTEGER)
- Contrainte UNIQUE sur `(user_id, category_name)`

## 🎨 Catégories prédéfinies

13 catégories avec icônes :
- 🏛️ Lieu de réception
- 🍽️ Traiteur
- 📸 Photographe/Vidéaste
- 💐 Fleurs & Décoration
- 👗 Tenue (robe, costume)
- 🎵 DJ/Musicien
- 💍 Alliances
- ✉️ Faire-part
- 🎁 Cadeau invités
- 💄 Coiffure/Maquillage
- 🚗 Transport
- 🏨 Hébergement
- 📦 Autre

## 🎯 Fonctionnalités

### 1. Affichage des catégories
- Liste avec icônes emoji
- Budget prévu et dépensé par catégorie
- Barre de progression visuelle
- Badge "Dépassé" si budget dépassé
- Calcul du budget total alloué vs restant

### 2. Édition
- Édition inline du budget prévu
- Modification rapide sans modal
- Validation des montants

### 3. Gestion
- Ajout de catégories personnalisées avec icône
- Suppression de catégories
- Tri par `order_index`

### 4. Initialisation automatique
- Les catégories par défaut sont créées automatiquement au premier chargement si un budget est défini

## 🔄 Calculs automatiques

### Budget total alloué
```typescript
totalAlloue = somme de tous les budget_prevu des catégories
```

### Budget restant
```typescript
budgetRestant = budgetMax - totalAlloue
```

### Pourcentage utilisé par catégorie
```typescript
pourcentage = (budget_depense / budget_prevu) * 100
```

## 🎨 Design

- Cards avec bordures arrondies
- Icônes emoji pour chaque catégorie
- Barres de progression colorées (rouge si dépassement)
- Badges pour les alertes
- Dialog pour ajouter des catégories

## 🔧 Utilisation

### Ajouter une catégorie personnalisée
1. Cliquez sur "Ajouter une catégorie personnalisée"
2. Entrez le nom, l'icône (emoji) et le budget prévu
3. Cliquez sur "Ajouter"

### Modifier le budget d'une catégorie
1. Cliquez sur l'icône crayon à côté de la catégorie
2. Entrez le nouveau budget
3. Cliquez sur "Enregistrer"

### Supprimer une catégorie
1. Cliquez sur l'icône poubelle
2. Confirmez la suppression

## 📝 Notes importantes

- Les catégories sont initialisées automatiquement au premier chargement si un budget est défini
- Le budget dépensé est calculé automatiquement via trigger SQL (somme des prestataires validés/payés)
- L'ordre d'affichage est géré par `order_index`
- Les catégories par défaut ont des icônes prédéfinies

## ✅ Checklist de déploiement

- [x] Script SQL créé
- [x] Types mis à jour
- [x] Server actions créées
- [x] Composant Dialog créé
- [x] Composant BudgetCategoriesSection créé
- [x] Page budget mise à jour
- [x] Initialisation automatique
- [x] Gestion des erreurs
- [x] Responsive design

---

**Système de catégories prêt à l'emploi ! 🎉**

