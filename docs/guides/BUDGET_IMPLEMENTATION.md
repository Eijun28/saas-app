# 📊 Système de Gestion de Budget - Documentation

## ✅ Implémentation terminée

Le système complet de gestion de budget pour les couples a été implémenté avec succès.

## 📁 Fichiers créés

### 1. Base de données (SQL)
- **`BUDGET_SCHEMA.sql`** : Script SQL complet pour créer les tables, indexes, triggers et RLS

### 2. Server Actions
- **`lib/actions/budget.ts`** : Toutes les actions serveur pour gérer le budget

### 3. Composants React
- **`components/budget/BudgetOverview.tsx`** : Vue d'ensemble avec graphique donut
- **`components/budget/BudgetForm.tsx`** : Formulaire pour définir/modifier le budget
- **`components/budget/BudgetCategories.tsx`** : Gestion des catégories de dépenses
- **`components/budget/BudgetProviders.tsx`** : Gestion des prestataires et devis

### 4. Pages
- **`app/dashboard/budget/page.tsx`** : Page principale du budget
- **`app/dashboard/page.tsx`** : Dashboard mis à jour avec données réelles

## 🚀 Installation

### Étape 1 : Créer les tables dans Supabase

1. Ouvrez votre projet Supabase
2. Allez dans l'éditeur SQL
3. Copiez et exécutez le contenu de `BUDGET_SCHEMA.sql`

### Étape 2 : Vérifier les dépendances

Le package `recharts` a été installé pour les graphiques. Si ce n'est pas le cas :

```bash
npm install recharts
```

## 📊 Structure des données

### Table `couple_budgets`
- Budget global du couple (min/max)
- Un seul budget par utilisateur (UNIQUE constraint)

### Table `budget_categories`
- Catégories de dépenses prédéfinies
- Budget prévu et budget dépensé (calculé automatiquement)
- Statut : non_defini, en_cours, valide

### Table `budget_providers`
- Prestataires avec devis
- Statut : contacte, devis_recu, valide, paye
- Le budget_depense des catégories est mis à jour automatiquement via trigger

## 🎨 Fonctionnalités

### 1. Vue d'ensemble
- Graphique donut montrant budget dépensé vs restant
- Statistiques : budget total, dépensé, restant
- Barre de progression avec pourcentage
- Alertes automatiques :
  - 🟢 Vert : < 80% utilisé
  - 🟠 Orange : 80-100% utilisé
  - 🔴 Rouge : > 100% (dépassement)

### 2. Formulaire de budget
- Définition du budget min/max
- Slider visuel pour ajuster
- Validation des montants

### 3. Catégories de dépenses
- 10 catégories prédéfinies :
  - Lieu de réception
  - Traiteur
  - Photographe/Vidéaste
  - Fleurs & Décoration
  - Tenue (robe, costume)
  - DJ/Musicien
  - Alliances
  - Faire-part
  - Cadeau invités
  - Autre
- Possibilité d'ajouter des catégories personnalisées
- Barre de progression par catégorie
- Calcul automatique du budget dépensé

### 4. Gestion des prestataires
- Ajout manuel de prestataires
- Association à une catégorie
- Gestion des devis
- Suivi des statuts
- Notes optionnelles
- Mise à jour automatique du budget dépensé

## 🔄 Calculs automatiques

### Budget total dépensé
```typescript
totalDepense = somme des prestataires avec statut "valide" ou "payé"
```

### Budget restant
```typescript
budgetRestant = budgetMax - totalDepense
```

### Pourcentage utilisé
```typescript
pourcentageUtilise = (totalDepense / budgetMax) * 100
```

### Budget dépensé par catégorie
Calculé automatiquement via trigger SQL en fonction des prestataires validés/payés de chaque catégorie.

## 🔐 Sécurité (RLS)

Toutes les tables ont Row Level Security activé :
- Les utilisateurs ne peuvent accéder qu'à leurs propres données
- Policies pour SELECT, INSERT, UPDATE, DELETE
- Vérification via `auth.uid() = user_id`

## 🎯 Utilisation

### Accès à la page budget
1. Connectez-vous en tant que couple
2. Allez sur `/dashboard/budget`
3. Ou cliquez sur la card "Budget" du dashboard principal

### Définir un budget
1. Sur la page budget, remplissez le formulaire "Définir votre budget"
2. Entrez le budget minimum et maximum
3. Cliquez sur "Enregistrer le budget"

### Gérer les catégories
1. Les catégories prédéfinies sont initialisées automatiquement
2. Cliquez sur "Modifier" pour définir le budget prévu d'une catégorie
3. Le budget dépensé est calculé automatiquement

### Ajouter un prestataire
1. Cliquez sur "Ajouter" dans la section Prestataires
2. Remplissez le formulaire :
   - Nom du prestataire
   - Catégorie
   - Devis
   - Statut
   - Notes (optionnel)
3. Cliquez sur "Ajouter"

### Changer le statut d'un prestataire
1. Dans la liste des prestataires, utilisez les boutons de statut
2. Les statuts disponibles :
   - Contacté
   - Devis reçu
   - Validé (compte dans le budget dépensé)
   - Payé (compte dans le budget dépensé)

## 📱 Responsive

Tous les composants sont responsive et s'adaptent aux écrans mobiles, tablettes et desktop.

## 🎨 Design

Le design suit la charte graphique NUPLY :
- Couleur principale : Violet (#8B5CF6)
- Fond : Blanc
- Texte : Gris foncé (#111827)
- Alertes : Vert/Orange/Rouge selon le pourcentage d'utilisation

## 🔧 Maintenance

### Mettre à jour le budget dépensé manuellement
Le trigger SQL met à jour automatiquement le budget_depense. Si besoin de forcer une mise à jour :

```sql
-- Mettre à jour toutes les catégories d'un utilisateur
UPDATE budget_categories bc
SET budget_depense = (
  SELECT COALESCE(SUM(devis), 0)
  FROM budget_providers bp
  WHERE bp.user_id = bc.user_id
    AND bp.category = bc.category_name
    AND bp.statut IN ('valide', 'paye')
)
WHERE bc.user_id = 'USER_ID';
```

## 🐛 Dépannage

### Les données ne s'affichent pas
1. Vérifiez que les tables existent dans Supabase
2. Vérifiez que les policies RLS sont correctement configurées
3. Vérifiez que l'utilisateur est bien connecté

### Le budget dépensé ne se met pas à jour
1. Vérifiez que le trigger `trigger_update_category_budget` existe
2. Vérifiez que les prestataires ont le statut "valide" ou "payé"
3. Vérifiez que la catégorie du prestataire correspond à une catégorie existante

### Erreur lors de l'ajout d'un prestataire
1. Vérifiez que tous les champs sont remplis
2. Vérifiez que le devis est un nombre positif
3. Vérifiez que la catégorie existe (elle sera créée automatiquement si elle n'existe pas)

## 📝 Notes importantes

- Le budget dépensé est calculé uniquement à partir des prestataires avec statut "valide" ou "payé"
- Les catégories sont initialisées automatiquement lors de la première visite si aucune n'existe
- Le trigger SQL met à jour automatiquement le budget_depense lors de chaque modification de prestataire
- Le dashboard principal affiche les données du budget en temps réel

## ✅ Checklist de déploiement

- [x] Tables SQL créées
- [x] RLS configuré
- [x] Triggers créés
- [x] Server actions implémentées
- [x] Composants React créés
- [x] Page budget créée
- [x] Dashboard mis à jour
- [x] Graphique donut fonctionnel
- [x] Calculs automatiques
- [x] Responsive design
- [x] Gestion des erreurs

---

**Système prêt à l'emploi ! 🎉**

