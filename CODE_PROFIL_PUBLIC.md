# CODE AFFICHAGE PROFIL PUBLIC

## 📁 Fichiers principaux

### 1. Composant Dialog d'aperçu du profil
**Fichier**: `components/provider/ProfilePreviewDialog.tsx`

Ce composant affiche le profil public dans un dialog avec 3 onglets :
- **À propos** : Description, bio, cultures, zones, réseaux sociaux
- **Portfolio** : Galerie de photos
- **Contact** : Formulaire pour envoyer une demande (vue couple) ou info contact (vue prestataire)

**Données affichées** :
- Nom d'entreprise
- Type de service
- Avatar
- Description courte
- Bio complète
- Cultures maîtrisées
- Zones d'intervention
- Budget (min/max)
- Années d'expérience
- Ville principale
- Réseaux sociaux (Instagram, Facebook, Website, LinkedIn, TikTok)
- Portfolio (photos)

---

### 2. Page de recherche prestataires
**Fichier**: `app/couple/recherche/page.tsx`

Cette page affiche :
- **Cartes de prestataires** (lignes 654-734) : Grille de cartes avec avatar, nom, service, ville, cultures, budget
- **Dialog détaillé** (lignes 740-769) : Utilise `ProfilePreviewDialog` pour afficher le profil complet

**Données affichées dans les cartes** :
- Avatar (ou initiales)
- Nom d'entreprise
- Type de service
- Ville principale
- Cultures (première + compteur)
- Budget min/max

---

## 🔍 Points clés du code

### ProfilePreviewDialog.tsx

**Structure** :
```typescript
- Header fixe : Avatar + Nom + Badges (ville, budget, expérience)
- Tabs : À propos / Portfolio / Contact
- ScrollArea : Contenu scrollable
- Footer fixe : Boutons d'action
```

**Props principales** :
- `userId` : ID du prestataire
- `profile` : Objet avec toutes les infos du profil
- `cultures` : Array des cultures maîtrisées
- `zones` : Array des zones d'intervention
- `portfolio` : Array des photos du portfolio
- `isCoupleView` : Si true, affiche "Envoyer une demande" au lieu de "Continuer l'édition"
- `coupleId` : ID du couple pour créer la demande

**Fonctionnalités** :
- Affichage conditionnel selon `isCoupleView`
- Formulaire de demande avec message, date, budget
- Gestion des erreurs de chargement d'images
- Timestamp sur les URLs d'avatar pour éviter le cache

---

### app/couple/recherche/page.tsx

**Fonction `searchProviders`** (ligne 120) :
- Récupère les prestataires depuis Supabase
- Filtre par catégorie, culture, pays, recherche textuelle
- Charge les cultures et zones associées

**Affichage des cartes** (ligne 654) :
- Grid responsive : 1 colonne mobile, 2 tablette, 3 desktop
- Animation Framer Motion au chargement
- Hover effect avec scale et shadow
- Clic ouvre le dialog détaillé

**Gestion du portfolio** :
- Chargé séparément quand un prestataire est sélectionné
- Réinitialisé quand le dialog se ferme

---

## 📊 Données chargées depuis Supabase

### Table `profiles` :
- `nom_entreprise`
- `prenom`, `nom`
- `avatar_url`
- `description_courte`
- `bio`
- `budget_min`, `budget_max`
- `ville_principale`
- `annees_experience`
- `service_type`
- `is_early_adopter`
- Réseaux sociaux (instagram_url, facebook_url, etc.)

### Table `provider_cultures` :
- Jointure avec `profiles` via `profile_id`
- Récupère les `culture_id` et les mappe avec `CULTURES`

### Table `provider_zones` :
- Jointure avec `profiles` via `profile_id`
- Récupère les `zone_id` et les mappe avec `DEPARTEMENTS`

### Table `provider_portfolio` :
- Jointure avec `profiles` via `profile_id`
- Récupère `id`, `image_url`, `title`
- Trié par `display_order`

---

## 🎨 Styles et UI

**Couleurs principales** :
- `#823F91` : Violet principal
- `#9D5FA8` : Violet secondaire
- `#6D3478` : Violet foncé

**Badges** :
- Early adopter : Gradient purple
- Ville/Budget/Expérience : Outline avec fond léger
- Cultures : Gradient violet
- Zones : Outline violet

**Responsive** :
- Mobile : Dialog plein écran (`max-w-[95vw]`)
- Desktop : Dialog centré (`max-w-md`)
- Textes adaptatifs : `text-xs md:text-sm`

---

## 🔗 Utilisation

### Dans la page de recherche (couple) :
```tsx
<ProfilePreviewDialog
  userId={provider.id}
  profile={{...}}
  cultures={cultures}
  zones={zones}
  portfolio={portfolio}
  isCoupleView={true}
  coupleId={user.id}
/>
```

### Dans la page profil public (prestataire) :
```tsx
<ProfilePreviewDialog
  userId={user.id}
  profile={profile}
  cultures={cultures}
  zones={zones}
  portfolio={portfolio}
  isCoupleView={false}
/>
```
