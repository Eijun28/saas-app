# 📎 Configuration des Attachments dans la Messagerie

## Vue d'ensemble

La messagerie supporte maintenant l'envoi d'images et de fichiers. Les fichiers sont stockés dans Supabase Storage et les URLs sont stockées dans le contenu des messages (format JSON).

## Configuration Supabase Storage

### 1. Créer le bucket `attachments`

Dans votre dashboard Supabase :

1. Allez dans **Storage** (menu de gauche)
2. Cliquez sur **New bucket**
3. Nom : `attachments`
4. **Public bucket** : ✅ Activé (pour que les fichiers soient accessibles)
5. Cliquez sur **Create bucket**

### 2. Configurer les politiques RLS

Exécutez ce SQL dans l'éditeur SQL de Supabase :

```sql
-- Politique pour permettre l'upload de fichiers dans les conversations
CREATE POLICY "Users can upload attachments in their conversations"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = 'messages'
);

-- Politique pour permettre la lecture publique des fichiers
CREATE POLICY "Attachments are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'attachments');

-- Politique pour permettre la suppression de ses propres fichiers
CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
```

## Formats supportés

### Images
- JPEG / JPG
- PNG
- WEBP
- GIF

**Taille max** : 10MB

### Fichiers
- PDF
- DOC / DOCX
- XLS / XLSX
- TXT

**Taille max** : 10MB

## Structure des données

### Format du message avec attachments

Quand un message contient des fichiers, le contenu est stocké en JSON :

```json
{
  "text": "Voici les photos du mariage",
  "attachments": [
    {
      "name": "photo1.jpg",
      "url": "https://[project].supabase.co/storage/v1/object/public/attachments/messages/[user_id]/[filename]",
      "size": 1024000,
      "type": "image/jpeg"
    }
  ]
}
```

### Format du message texte simple

Si le message n'a pas de fichiers, le contenu est du texte simple :

```
Bonjour, comment allez-vous ?
```

## Composants créés

### `MessageInput`
Composant d'entrée de message avec support des fichiers :
- Boutons pour sélectionner images et fichiers
- Aperçu des fichiers avant envoi
- Upload automatique vers Supabase Storage
- Validation des types et tailles

### `AttachmentPreview`
Composant pour afficher les fichiers attachés :
- Aperçu des images (cliquable pour agrandir)
- Icônes pour les fichiers
- Bouton de téléchargement
- Affichage de la taille

## Utilisation

### Dans les pages de messagerie

Les pages `/couple/messagerie` et `/prestataire/messagerie` utilisent maintenant :

```tsx
<MessageInput
  conversationId={conversationId}
  senderId={userId}
  onMessageSent={() => {
    // Recharger les messages
  }}
/>
```

### Affichage des attachments

Les attachments sont automatiquement détectés et affichés :

```tsx
<AttachmentPreview attachments={message.attachments} />
```

## Améliorations UI

### Messagerie Couple
- ✅ Design moderne avec gradients
- ✅ Avatars des prestataires
- ✅ Scroll automatique vers le bas
- ✅ Support des attachments
- ✅ Real-time updates

### Messagerie Prestataire
- ✅ Design cohérent avec le reste de l'app
- ✅ Badges pour messages non lus
- ✅ Recherche dans les conversations
- ✅ Support des attachments
- ✅ Real-time updates

## Sécurité

- ✅ Validation des types de fichiers côté client
- ✅ Validation de la taille des fichiers
- ✅ Noms de fichiers sanitizés
- ✅ RLS policies sur Supabase Storage
- ✅ URLs publiques sécurisées

## Limitations actuelles

- Taille max : 10MB par fichier
- Pas de compression automatique des images
- Pas de preview pour les fichiers non-images
- Pas de limite sur le nombre de fichiers par message (recommandé : max 5)

## Améliorations futures possibles

1. **Compression automatique** des images avant upload
2. **Thumbnails** pour les grandes images
3. **Progress bar** pour les uploads
4. **Drag & drop** pour les fichiers
5. **Preview PDF** dans le navigateur
6. **Limite** sur le nombre de fichiers par message

## Vérification

Pour vérifier que tout fonctionne :

1. Allez sur `/couple/messagerie` ou `/prestataire/messagerie`
2. Sélectionnez une conversation
3. Cliquez sur l'icône 📷 ou 📎
4. Sélectionnez une image ou un fichier
5. Le fichier devrait apparaître dans l'aperçu
6. Envoyez le message
7. Le fichier devrait apparaître dans la conversation

## Dépannage

### Erreur "Bucket not found"
- Vérifiez que le bucket `attachments` existe dans Supabase Storage
- Vérifiez qu'il est configuré comme bucket public

### Erreur "Permission denied"
- Vérifiez que les politiques RLS sont correctement configurées
- Vérifiez que l'utilisateur est authentifié

### Les fichiers ne s'affichent pas
- Vérifiez que le bucket est public
- Vérifiez les URLs dans la console du navigateur
- Vérifiez que le format JSON est correct dans la base de données
