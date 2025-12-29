# Vidéos de démonstration

## Fichier requis

### `nuply-demo.mp4`

**Spécifications recommandées :**
- Durée : 30-60 secondes maximum
- Format : MP4 (H.264)
- Taille : < 5MB (optimisé pour web)
- Résolution : 1920x1080 (16:9) ou 1280x720
- Pas de son au démarrage (autoplay muté)

**Contenu à montrer dans l'ordre :**
1. Formulaire de matching (3-5 secondes)
2. Résultats IA avec scores (5-10 secondes)
3. Interface de messagerie (5 secondes)
4. Dashboard final (5 secondes)

**Outils recommandés pour l'optimisation :**
- HandBrake (compression)
- FFmpeg (conversion/optimisation)
- Cloudinary (optimisation automatique)

## Alternative : YouTube/Vimeo

Si vous préférez héberger la vidéo sur YouTube ou Vimeo, modifiez dans `components/landing/Hero.tsx` :

```tsx
<HeroVideoDialog
  videoSrc="https://www.youtube.com/embed/VIDEO_ID"
  // ou
  videoSrc="https://player.vimeo.com/video/VIDEO_ID"
  videoType="iframe"
  // ...
/>
```

