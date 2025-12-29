# 👤 Page de Profil - Documentation

## ✅ Implémentation terminée

La page de profil complète et éditable a été implémentée avec succès.

## 📁 Fichiers créés

### 1. Base de données (SQL)
- **`PROFILE_SCHEMA.sql`** : Script SQL pour modifier les tables profiles et couple_profiles

### 2. Server Actions
- **`lib/actions/profile.ts`** : Toutes les actions serveur pour gérer le profil

### 3. Composants UI
- **`components/ui/avatar.tsx`** : Composant Avatar pour la photo de profil
- **`components/ui/switch.tsx`** : Composant Switch pour les toggles

### 4. Composants de Profil
- **`components/profile/ProfilePhoto.tsx`** : Upload et affichage de la photo
- **`components/profile/PersonalInfo.tsx`** : Informations personnelles
- **`components/profile/WeddingInfo.tsx`** : Informations du mariage
- **`components/profile/Preferences.tsx`** : Préférences et paramètres

### 5. Pages
- **`app/dashboard/profil/page.tsx`** : Page principale du profil avec mode édition

## 🚀 Installation

### Étape 1 : Modifier les tables dans Supabase

1. Ouvrez votre projet Supabase
2. Allez dans l'éditeur SQL
3. Copiez et exécutez le contenu de `PROFILE_SCHEMA.sql`

### Étape 2 : Créer le bucket Storage

1. Dans Supabase, allez dans **Storage**
2. Cliquez sur **New bucket**
3. Nom : `profile-photos`
4. Public bucket : **Activé**
5. File size limit : `5242880` (5MB)
6. Allowed MIME types : `image/jpeg,image/png,image/webp`
7. Créez le bucket

### Étape 3 : Configurer les policies Storage

Dans l'éditeur SQL de Supabase, exécutez :

```sql
-- Policy pour permettre l'upload de photos
CREATE POLICY "Users can upload own profile photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour permettre la lecture des photos
CREATE POLICY "Profile photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Policy pour permettre la mise à jour des photos
CREATE POLICY "Users can update own profile photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour permettre la suppression des photos
CREATE POLICY "Users can delete own profile photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 📊 Structure des données

### Table `profiles` (modifiée)
- `telephone` : Téléphone (TEXT)
- `date_naissance` : Date de naissance (DATE)
- `adresse` : Adresse complète (TEXT)
- `photo_url` : URL de la photo de profil (TEXT)

### Table `couple_profiles` (modifiée)
- `nombre_invites` : Nombre d'invités (INTEGER)
- `type_ceremonie` : Type de cérémonie (TEXT: 'religieuse', 'civile', 'les_deux')
- `description` : Description personnalisée (TEXT)
- `couleurs_mariage` : Couleurs du mariage (TEXT[])
- `theme` : Thème du mariage (TEXT)
- `notifications_email` : Notifications par email (BOOLEAN)

## 🎨 Fonctionnalités

### 1. Photo de profil
- Upload d'image (JPG, PNG, WEBP)
- Taille max : 5MB
- Preview avant upload
- Stockage dans Supabase Storage
- Avatar avec fallback (initiales ou icône)

### 2. Informations personnelles
- Prénom (éditable)
- Nom (éditable)
- Email (lecture seule)
- Téléphone (éditable)
- Date de naissance (éditable, DatePicker)
- Adresse (éditable)

### 3. Informations du mariage
- Date du mariage (éditable, DatePicker)
- Ville du mariage (éditable)
- Budget (lecture seule, lien vers /dashboard/budget)
- Nombre d'invités (éditable)
- Type de cérémonie (Select : Religieuse / Civile / Les deux)
- Culture/Style (éditable)
- Description personnalisée (Textarea)

### 4. Préférences
- Types de prestataires recherchés (Multi-select avec badges)
- Couleurs du mariage (Ajout/suppression dynamique)
- Thème du mariage (Input libre)
- Notifications email (Switch)

## 🔄 Mode édition

### Fonctionnement
- **Par défaut** : Mode lecture seule
- **Bouton "Modifier le profil"** : Active le mode édition
- **En mode édition** :
  - Tous les champs deviennent éditables
  - Boutons "Enregistrer" et "Annuler" apparaissent
- **Enregistrer** : Sauvegarde toutes les modifications
- **Annuler** : Restaure les valeurs initiales

## 🎯 Utilisation

### Accès à la page profil
1. Connectez-vous en tant que couple
2. Allez sur `/dashboard/profil`
3. Ou cliquez sur "Compléter votre profil" dans le dashboard

### Modifier le profil
1. Cliquez sur "Modifier le profil"
2. Modifiez les champs souhaités
3. Cliquez sur "Enregistrer"

### Uploader une photo
1. Cliquez sur "Modifier la photo"
2. Sélectionnez une image (JPG, PNG ou WEBP, max 5MB)
3. La photo est uploadée automatiquement

## 🔐 Sécurité

### Storage Policies
- Les utilisateurs ne peuvent uploader que leurs propres photos
- Les photos sont publiques (pour l'affichage)
- Les utilisateurs peuvent supprimer uniquement leurs photos

### RLS
- Les policies RLS existantes sur `profiles` et `couple_profiles` s'appliquent
- Les utilisateurs ne peuvent modifier que leur propre profil

## 📱 Responsive

Tous les composants sont responsive et s'adaptent aux écrans mobiles, tablettes et desktop.

## 🎨 Design

Le design suit la charte graphique NUPLY :
- Couleur principale : Violet (#8B5CF6)
- Fond : Blanc
- Texte : Gris foncé (#111827)
- Cards avec bordures arrondies
- Animations avec Framer Motion

## 🔧 Validation

### Formats acceptés pour la photo
- JPG / JPEG
- PNG
- WEBP
- Taille max : 5MB

### Validation des champs
- Prénom/Nom : Minimum 2 caractères (côté serveur)
- Téléphone : Format français (optionnel)
- Date de naissance : Date valide (optionnel)
- Nombre d'invités : Entre 1 et 1000

## 🐛 Dépannage

### La photo ne s'upload pas
1. Vérifiez que le bucket `profile-photos` existe
2. Vérifiez que les policies Storage sont configurées
3. Vérifiez que le fichier fait moins de 5MB
4. Vérifiez le format (JPG, PNG, WEBP uniquement)

### Les modifications ne sont pas sauvegardées
1. Vérifiez que les tables ont été modifiées avec le script SQL
2. Vérifiez que l'utilisateur est bien connecté
3. Vérifiez les erreurs dans la console du navigateur

### Erreur lors de l'accès au profil
1. Vérifiez que l'utilisateur a un profil dans la table `profiles`
2. Vérifiez que les policies RLS sont correctement configurées

## 📝 Notes importantes

- L'email est géré par Supabase Auth et n'est pas modifiable depuis le profil
- Le budget est géré dans la section Budget (lien direct depuis le profil)
- Les prestataires recherchés peuvent être ajoutés depuis une liste prédéfinie ou personnalisés
- Les couleurs du mariage sont stockées sous forme de tableau (TEXT[])

## ✅ Checklist de déploiement

- [x] Script SQL créé et exécuté
- [x] Bucket Storage créé
- [x] Policies Storage configurées
- [x] Server actions implémentées
- [x] Composants UI créés
- [x] Composants de profil créés
- [x] Page profil créée
- [x] Mode édition fonctionnel
- [x] Upload photo fonctionnel
- [x] Validation des champs
- [x] Responsive design
- [x] Gestion des erreurs

---

**Page de profil prête à l'emploi ! 🎉**

