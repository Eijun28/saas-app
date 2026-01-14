# 🧪 Guide de Test - Programme Early Adopter

## 📋 Checklist de Test

### Étape 1 : Vérification de la base de données
- [ ] Vérifier que la table `early_adopter_program` existe avec 50 slots
- [ ] Vérifier que `used_slots` est à 0 (ou le nombre actuel)
- [ ] Vérifier que les colonnes sont bien ajoutées à `profiles`

### Étape 2 : Test de la page d'inscription
1. Aller sur `/sign-up`
2. Sélectionner "Prestataire"
3. **Vérifier** :
   - [ ] Le badge "🎁 Devenez Founding Member !" s'affiche
   - [ ] Le nombre de places restantes est affiché correctement
   - [ ] Le bouton affiche "🚀 Récupérer mon badge Early Adopter"
4. Si toutes les places sont prises :
   - [ ] Le message "Programme Early Adopter complet" s'affiche
   - [ ] Le bouton affiche "S'inscrire"

### Étape 3 : Test de l'inscription
1. Remplir le formulaire d'inscription (prestataire)
2. Cliquer sur "Récupérer mon badge Early Adopter"
3. **Vérifier dans Supabase** :
   - [ ] Le profil est créé avec `is_early_adopter: true`
   - [ ] `early_adopter_enrolled_at` est rempli
   - [ ] `early_adopter_trial_end_date` est à +90 jours
   - [ ] `subscription_tier: 'early_adopter'`
   - [ ] `used_slots` dans `early_adopter_program` a été incrémenté
   - [ ] Une notification de type 'welcome' est créée dans `early_adopter_notifications`

### Étape 4 : Test du dashboard
1. Se connecter avec le compte prestataire créé
2. Aller sur `/prestataire/dashboard`
3. **Vérifier** :
   - [ ] Le banner de bienvenue s'affiche en haut
   - [ ] Le badge "Early Adopter • Xj restants" s'affiche sous le titre
   - [ ] Le nombre de jours restants est correct
   - [ ] Le banner peut être fermé (bouton X)

### Étape 5 : Test des 50 premiers utilisateurs
1. Créer plusieurs comptes prestataires (jusqu'à 50)
2. **Vérifier** :
   - [ ] Les 50 premiers obtiennent le badge
   - [ ] Le 51ème ne l'obtient pas
   - [ ] Le compteur `used_slots` atteint 50
   - [ ] La page d'inscription affiche "0 places" après le 50ème

## 🔍 Vérifications SQL

### Vérifier le programme
```sql
SELECT * FROM early_adopter_program;
```

### Vérifier les early adopters
```sql
SELECT 
  id, 
  email, 
  is_early_adopter, 
  early_adopter_enrolled_at,
  early_adopter_trial_end_date,
  subscription_tier
FROM profiles 
WHERE is_early_adopter = true
ORDER BY early_adopter_enrolled_at ASC;
```

### Vérifier les notifications
```sql
SELECT * FROM early_adopter_notifications 
WHERE notification_type = 'welcome'
ORDER BY sent_at DESC;
```

### Compter les places utilisées
```sql
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE is_early_adopter = true) as total_early_adopters,
  (SELECT used_slots FROM early_adopter_program LIMIT 1) as used_slots_in_program;
```

## 🐛 Problèmes courants

### Le badge ne s'affiche pas sur la page d'inscription
- Vérifier que `early_adopter_program` contient une ligne
- Vérifier les permissions RLS sur `early_adopter_program`

### L'inscription ne donne pas le badge
- Vérifier les logs du serveur
- Vérifier que le client admin est utilisé dans `signUp()`
- Vérifier que l'utilisateur est bien créé avant la mise à jour

### Le dashboard n'affiche pas le badge
- Vérifier que les données sont bien chargées dans le `useEffect`
- Vérifier la console du navigateur pour les erreurs
- Vérifier que `is_early_adopter` est bien `true` dans la base

### Le compteur ne s'incrémente pas
- Vérifier que la requête UPDATE fonctionne
- Vérifier les permissions RLS
- Vérifier que `programData.id` existe

## ✅ Tests de régression

Après chaque modification, vérifier :
- [ ] L'inscription couple fonctionne toujours
- [ ] L'inscription prestataire sans badge fonctionne après 50 utilisateurs
- [ ] Le dashboard prestataire fonctionne pour les non-early-adopters
- [ ] Aucune erreur dans la console
