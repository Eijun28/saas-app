# DIAGNOSTIC PROBLÈME PERSISTANCE

## CAUSE RACINE IDENTIFIÉE

Le problème de persistance des données de profil provient de plusieurs facteurs combinés :

### 1. Race Condition entre délais de sauvegarde et rechargement
- **Fichier**: `app/prestataire/profil-public/page.tsx` ligne 78-89
- **Problème**: `reloadData()` attend seulement 100ms avant de recharger depuis Supabase
- **Fichier**: `components/provider/BusinessNameEditor.tsx` ligne 102-104
- **Problème**: Les composants éditeurs appellent `onSave()` après 500ms
- **Impact**: Le rechargement peut se produire AVANT que la transaction DB soit commitée, causant un reload avec les anciennes valeurs

### 2. React Reconciliation - Props non détectées comme changées
- **Fichier**: `app/prestataire/profil-public/page.tsx` ligne 148-170
- **Problème**: Même si un nouvel objet profil est créé avec `_timestamp`, les composants enfants peuvent ne pas détecter le changement si les valeurs primitives sont identiques
- **Impact**: Les composants éditeurs gardent leurs anciennes valeurs locales même après reload

### 3. Guards dans useEffect empêchant les mises à jour
- **Fichier**: `components/provider/BusinessNameEditor.tsx` ligne 23-39
- **Problème**: Les `useEffect` ont des guards (`isEditingRef.current || isSaving`) qui empêchent la mise à jour si l'utilisateur vient de sauvegarder
- **Impact**: Après sauvegarde, si `isEditingRef.current` est encore `true`, les nouvelles props ne sont pas appliquées

### 4. Keys des composants basées sur refreshKey mais props inchangées
- **Fichier**: `app/prestataire/profil-public/page.tsx` ligne 359, 365, 372
- **Problème**: Les keys utilisent `refreshKey` mais si les props (`currentName`, `currentDescription`, etc.) ont la même valeur, React peut optimiser et ne pas re-render
- **Impact**: Les composants ne se mettent pas à jour visuellement même si les données DB sont correctes

## FICHIERS IMPACTÉS

1. **File**: `app/prestataire/profil-public/page.tsx`
   - Ligne 78-89: `reloadData()` délai trop court (100ms)
   - Ligne 148-170: Création objet profil avec `_timestamp` mais peut ne pas forcer re-render enfants
   - Ligne 359, 365, 372: Keys avec `refreshKey` mais props peuvent être identiques

2. **File**: `app/couple/profil/page.tsx`
   - Ligne 529-533: Même problème de délai (100ms) avant `loadProfile()`

3. **File**: `components/provider/BusinessNameEditor.tsx`
   - Ligne 23-39: Guards dans useEffect peuvent bloquer mise à jour
   - Ligne 102-104: Délai de 500ms avant `onSave()` peut créer race condition

4. **File**: `components/provider/ProfessionalInfoEditor.tsx`
   - Ligne 35-76: Même problème de guards dans useEffect
   - Ligne 166-168: Délai de 500ms avant `onSave()`

5. **File**: `components/provider/ProfileDescriptionEditor.tsx`
   - Ligne 31-47: Guards dans useEffect
   - Ligne 120-122: Délai de 500ms avant `onSave()`

## SOLUTION PROPOSÉE

### 1. Synchroniser les délais
- Augmenter le délai dans `reloadData()` à 600ms pour être sûr que la transaction DB est commitée
- OU mieux : Utiliser un système de callback avec confirmation de sauvegarde

### 2. Forcer le re-render des composants enfants
- Utiliser une clé unique basée sur `refreshKey` + timestamp + hash des valeurs
- OU : Passer une prop `forceUpdate` qui change à chaque reload

### 3. Améliorer les guards dans useEffect
- Réinitialiser `isEditingRef.current` immédiatement après sauvegarde réussie
- Ajouter un délai plus court avant de permettre les mises à jour depuis props

### 4. Utiliser une approche optimiste avec rollback
- Mettre à jour l'état local immédiatement
- Recharger depuis DB après sauvegarde
- Si les valeurs diffèrent, forcer mise à jour

## FICHIERS À MODIFIER

- [x] `app/prestataire/profil-public/page.tsx` - Augmenter délai reloadData, améliorer keys
- [x] `app/couple/profil/page.tsx` - Augmenter délai loadProfile
- [x] `components/provider/BusinessNameEditor.tsx` - Améliorer guards, réinitialiser isEditingRef
- [x] `components/provider/ProfessionalInfoEditor.tsx` - Même chose
- [x] `components/provider/ProfileDescriptionEditor.tsx` - Même chose
