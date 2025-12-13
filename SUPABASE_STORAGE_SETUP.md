# 📸 Configuration Supabase Storage pour les photos de profil

## Comment fonctionne le stockage des photos

Les photos de profil sont stockées sur **Supabase Storage**, un service de stockage d'objets similaire à AWS S3.

### Architecture actuelle

1. **Bucket Supabase** : `profile-photos`
   - Les photos sont uploadées dans ce bucket
   - Chemin : `profile-photos/{user_id}.{extension}`
   - Exemple : `profile-photos/abc123.jpg`

2. **Table `profiles`** : Colonne `photo_url`
   - L'URL publique de la photo est stockée dans cette colonne
   - Format : `https://[project].supabase.co/storage/v1/object/public/profile-photos/[user_id].[ext]`

### Configuration requise dans Supabase

#### 1. Créer le bucket `profile-photos`

Dans votre dashboard Supabase :

1. Allez dans **Storage** (menu de gauche)
2. Cliquez sur **New bucket**
3. Nom : `profile-photos`
4. **Public bucket** : ✅ Activé (pour que les photos soient accessibles publiquement)
5. Cliquez sur **Create bucket**

#### 2. Configurer les politiques RLS (Row Level Security)

Pour permettre aux utilisateurs d'uploader leurs propres photos :

```sql
-- Politique pour permettre l'upload de sa propre photo
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre la lecture publique des photos
CREATE POLICY "Profile photos are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Politique pour permettre la mise à jour de sa propre photo
CREATE POLICY "Users can update their own profile photo"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre la suppression de sa propre photo
CREATE POLICY "Users can delete their own profile photo"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Fonctionnement du code

Le code actuel dans `lib/actions/profile.ts` :

1. **Upload** : La photo est uploadée vers Supabase Storage
2. **URL publique** : L'URL publique est récupérée
3. **Mise à jour** : L'URL est sauvegardée dans `profiles.photo_url`

### Avantages de Supabase Storage

- ✅ **Gratuit** jusqu'à 1GB de stockage
- ✅ **CDN intégré** pour des chargements rapides
- ✅ **Sécurisé** avec RLS (Row Level Security)
- ✅ **Scalable** automatiquement
- ✅ **Optimisé** pour les images

### Limites actuelles

- **Taille max** : 5MB par photo
- **Formats acceptés** : JPG, PNG, WEBP uniquement
- **Compression** : Non automatique (à ajouter si nécessaire)

### Optimisation future possible

Pour réduire le poids des photos sur le dashboard :

1. **Générer des thumbnails** lors de l'upload
2. **Utiliser Next.js Image** avec optimisation automatique
3. **Lazy loading** des avatars
4. **CDN** pour le chargement rapide

### Exemple d'utilisation

```typescript
// Upload d'une photo
const formData = new FormData()
formData.append('photo', file)

const result = await uploadProfilePhoto(formData)
// result.photoUrl contient l'URL publique de la photo
```

### Vérification

Pour vérifier que tout fonctionne :

1. Allez sur `/couple/profil` ou `/dashboard/profil`
2. Cliquez sur "Modifier la photo"
3. Sélectionnez une image
4. La photo devrait apparaître après l'upload

