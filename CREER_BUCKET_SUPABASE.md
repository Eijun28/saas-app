# 🚀 Guide rapide : Créer le bucket Supabase Storage

## ⚠️ Erreur "Bucket not found"

Si vous voyez l'erreur **"Bucket not found"** lors de l'upload d'une photo de profil, c'est que le bucket `profile-photos` n'existe pas encore dans votre projet Supabase.

## 📝 Étapes pour créer le bucket

### 1. Accéder au dashboard Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet

### 2. Créer le bucket

1. Dans le menu de gauche, cliquez sur **"Storage"** (ou **"Stockage"**)
2. Cliquez sur le bouton **"New bucket"** (ou **"Nouveau bucket"**)
3. Remplissez le formulaire :
   - **Name** (Nom) : `profile-photos` ⚠️ **Important : exactement ce nom**
   - **Public bucket** : ✅ **Cochez cette case** (nécessaire pour que les photos soient accessibles publiquement)
   - **File size limit** : Optionnel (par défaut 50MB, vous pouvez laisser tel quel)
   - **Allowed MIME types** : Optionnel (laissez vide pour accepter tous les types d'images)
4. Cliquez sur **"Create bucket"** (ou **"Créer le bucket"**)

### 3. Configurer les politiques RLS (Recommandé)

Pour permettre aux utilisateurs d'uploader leurs propres photos, vous devez configurer les politiques de sécurité :

1. Dans le dashboard Supabase, allez dans **Storage** → **Policies**
2. Sélectionnez le bucket `profile-photos`
3. Cliquez sur **"New Policy"** (ou utilisez l'éditeur SQL)

#### Option 1 : Via l'interface (plus simple)

Créez ces politiques une par une :

**Politique 1 : Lecture publique**
- **Policy name** : `Public read access`
- **Allowed operation** : `SELECT`
- **Target roles** : `public`
- **USING expression** : `bucket_id = 'profile-photos'`

**Politique 2 : Upload pour utilisateurs authentifiés**
- **Policy name** : `Authenticated users can upload`
- **Allowed operation** : `INSERT`
- **Target roles** : `authenticated`
- **WITH CHECK expression** : `bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text`

**Politique 3 : Mise à jour pour propriétaires**
- **Policy name** : `Users can update own photos`
- **Allowed operation** : `UPDATE`
- **Target roles** : `authenticated`
- **USING expression** : `bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text`

**Politique 4 : Suppression pour propriétaires**
- **Policy name** : `Users can delete own photos`
- **Allowed operation** : `DELETE`
- **Target roles** : `authenticated`
- **USING expression** : `bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text`

#### Option 2 : Via SQL (plus rapide)

Allez dans **SQL Editor** et exécutez ce script :

```sql
-- Politique pour lecture publique
CREATE POLICY "Profile photos are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Politique pour upload
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour mise à jour
CREATE POLICY "Users can update their own profile photo"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour suppression
CREATE POLICY "Users can delete their own profile photo"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 4. Vérifier que ça fonctionne

1. Retournez sur votre application
2. Allez sur la page de profil (`/couple/profil` ou `/dashboard/profil`)
3. Cliquez sur **"Modifier la photo"**
4. Sélectionnez une image
5. L'upload devrait maintenant fonctionner ! ✅

## 🔍 Vérification

Pour vérifier que le bucket existe :

1. Dans Supabase Dashboard → **Storage**
2. Vous devriez voir le bucket `profile-photos` dans la liste
3. Cliquez dessus pour voir son contenu (vide au début)

## 📚 Documentation complète

Pour plus de détails, consultez `SUPABASE_STORAGE_SETUP.md`

## ⚡ Solution rapide (copier-coller)

Si vous voulez créer le bucket rapidement :

1. **Dashboard Supabase** → **Storage** → **New bucket**
2. Nom : `profile-photos`
3. ✅ **Public bucket** : Activé
4. **Create**

Puis dans **SQL Editor**, exécutez le script SQL ci-dessus.

C'est tout ! 🎉

