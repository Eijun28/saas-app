# PROMPT CURSOR - TESTS FINAUX V1

## CONTEXTE

Tests exhaustifs avant déploiement en production pour garantir que toutes les fonctionnalités critiques fonctionnent correctement.

**Objectifs :**

- ✅ Valider l'authentification complète
- ✅ Tester le flow prestataire (profil, demandes, messagerie, agenda)
- ✅ Tester le flow couple (profil, matching, budget, timeline)
- ✅ Vérifier la sécurité (RLS, rate limiting)
- ✅ Confirmer la performance (Lighthouse > 90)
- ✅ Valider le responsive (mobile/tablet/desktop)

---

## 🎯 MÉTHODOLOGIE DE TEST

### Environnements

1. **Local** : `npm run dev` sur http://localhost:3000
2. **Preview** : Déploiement Vercel preview (optionnel)
3. **Production** : Test final après déploiement

### Types de tests

- ✅ **Tests manuels** : Parcours utilisateur complet
- ✅ **Tests automatisés** : Lighthouse, accessibilité
- ✅ **Tests de sécurité** : RLS Supabase, rate limiting
- ✅ **Tests de performance** : Core Web Vitals

---

## 🔐 PARTIE 1 : TESTS AUTHENTIFICATION

### 1.1 Inscription (Sign-up) Prestataire

**URL :** `/sign-up`

**Scénario de test :**

```
1. Aller sur /sign-up
2. Remplir le formulaire :
   - Email : test-prestataire@example.com
   - Mot de passe : TestPassword123!
   - Type : Prestataire
   - Prénom : Jean
   - Nom : Dupont
   - Nom entreprise : DJ Jean Events
3. Cliquer "S'inscrire"

✅ Vérifications :
- [ ] Email de confirmation reçu
- [ ] Lien de confirmation fonctionne
- [ ] Redirection vers /prestataire/dashboard après confirmation
- [ ] Toast de succès affiché
- [ ] Profil créé dans Supabase (table profiles)
```

### 1.2 Inscription (Sign-up) Couple

**URL :** `/sign-up`

**Scénario de test :**

```
1. Aller sur /sign-up
2. Remplir le formulaire :
   - Email : test-couple@example.com
   - Mot de passe : TestPassword123!
   - Type : Couple
   - Partenaire 1 : Marie
   - Partenaire 2 : Thomas
   - Date mariage : 01/06/2026
3. Cliquer "S'inscrire"

✅ Vérifications :
- [ ] Email de confirmation reçu
- [ ] Lien de confirmation fonctionne
- [ ] Redirection vers /couple/dashboard après confirmation
- [ ] Toast de succès affiché
- [ ] Couple créé dans Supabase (table couples)
```

### 1.3 Connexion (Sign-in)

**URL :** `/sign-in`

**Scénario de test :**

```
1. Aller sur /sign-in
2. Connexion avec email prestataire :
   - Email : test-prestataire@example.com
   - Mot de passe : TestPassword123!
3. Cliquer "Se connecter"

✅ Vérifications :
- [ ] Connexion réussie
- [ ] Redirection vers /prestataire/dashboard
- [ ] TopBar affiche nom + photo de profil
- [ ] Status "En ligne" affiché

4. Se déconnecter
5. Connexion avec email couple :
   - Email : test-couple@example.com
   - Mot de passe : TestPassword123!

✅ Vérifications :
- [ ] Connexion réussie
- [ ] Redirection vers /couple/dashboard
- [ ] TopBar affiche noms des partenaires
```

### 1.4 Déconnexion (Sign-out)

**Scénario de test :**

```
1. Connecté en tant que prestataire
2. Cliquer sur avatar dans TopBar
3. Cliquer "Déconnexion"

✅ Vérifications :
- [ ] Déconnexion réussie
- [ ] Redirection vers / (homepage)
- [ ] Session Supabase supprimée
- [ ] Impossible d'accéder à /prestataire/dashboard (redirect /sign-in)
```

### 1.5 Mot de passe oublié (optionnel si implémenté)

**URL :** `/sign-in` (lien "Mot de passe oublié")

**Scénario de test :**

```
1. Aller sur /sign-in
2. Cliquer "Mot de passe oublié"
3. Entrer email : test-prestataire@example.com
4. Cliquer "Réinitialiser"

✅ Vérifications :
- [ ] Email de réinitialisation reçu
- [ ] Lien de réinitialisation fonctionne
- [ ] Formulaire de nouveau mot de passe affiché
- [ ] Changement de mot de passe réussi
- [ ] Connexion avec nouveau mot de passe fonctionne
```

---

## 👨‍💼 PARTIE 2 : TESTS FLOW PRESTATAIRE

### 2.1 Dashboard Prestataire

**URL :** `/prestataire/dashboard`

**Connecté en tant que :** test-prestataire@example.com

**Scénario de test :**

```
1. Aller sur /prestataire/dashboard

✅ Vérifications visuelles :
- [ ] Avatar + nom "Jean Dupont" affiché dans TopBar (gauche)
- [ ] Titre "Dashboard" centré dans TopBar
- [ ] Recherche + Notifications + Menu alignés à droite
- [ ] Header "Bonjour Jean 👋" avec avatar violet
- [ ] Date du jour affichée
- [ ] Badge "En ligne"

✅ Statistiques (3 cards) :
- [ ] Card "Nouvelles demandes" : valeur affichée (0 si pas de données)
- [ ] Card "Messages non lus" : valeur affichée (0 si pas de données)
- [ ] Card "Taux de réponse" : pourcentage affiché (0% si pas de données)

✅ Actions rapides (4 boutons) :
- [ ] "Voir les demandes" cliquable → /prestataire/demandes-recues
- [ ] "Messagerie" cliquable → /prestataire/messagerie
- [ ] "Mon profil" cliquable → /prestataire/profil-public
- [ ] "Agenda" cliquable → /prestataire/agenda

✅ Section "Demandes récentes" :
- [ ] Affiche "Aucune demande récente" si vide
- [ ] Ou affiche les 3 dernières demandes

✅ Section "Performance du mois" :
- [ ] Panel affiché avec infos pertinentes
```

### 2.2 Profil Public Prestataire

**URL :** `/prestataire/profil-public`

**Scénario de test :**

```
1. Aller sur /prestataire/profil-public

✅ Vérifications header :
- [ ] Titre "Profil public"
- [ ] Bouton "Prévisualiser" présent
- [ ] Barre de progression affichée (0-100%)

✅ Section "Informations de base" :
- [ ] Avatar uploader fonctionne (cliquer, sélectionner image, voir preview)
- [ ] Upload réussi (image visible dans Supabase Storage)
- [ ] Nom entreprise éditable (cliquer, modifier, enregistrer)
- [ ] Description éditable
- [ ] Infos professionnelles éditables (budget, expérience, ville)

✅ Section "Cultures maîtrisées" :
- [ ] Cliquer sur le sélecteur
- [ ] Popover s'ouvre PROPREMENT (pas de chevauchement visuel) ✨
- [ ] Recherche dans les cultures fonctionne
- [ ] Sélectionner "Pakistanais" et "Libanais"
- [ ] Badges VIOLETS DÉGRADÉS affichés ✨
- [ ] Bouton X blanc visible et fonctionnel
- [ ] Cliquer "Enregistrer"
- [ ] Toast "Cultures mises à jour" affiché
- [ ] Rafraîchir la page : cultures toujours sélectionnées

✅ Section "Zones d'intervention" :
- [ ] Cliquer sur le sélecteur
- [ ] Popover s'ouvre PROPREMENT (pas de chevauchement) ✨
- [ ] Recherche dans les départements fonctionne
- [ ] Sélectionner "Moselle (57)", "Bas-Rhin (67)", "Val-de-Marne (94)"
- [ ] Badges VIOLETS DÉGRADÉS affichés ✨
- [ ] Cliquer "Enregistrer"
- [ ] Toast "Zones mises à jour" affiché
- [ ] Rafraîchir la page : zones toujours sélectionnées

✅ Section "Portfolio" :
- [ ] Uploader des photos fonctionne
- [ ] Photos affichées dans la grille
- [ ] Bouton supprimer fonctionne
- [ ] Réorganisation (drag & drop) fonctionne si implémenté

✅ Bouton "Prévisualiser" :
- [ ] Modal s'ouvre
- [ ] Affiche le profil tel que vu par les couples
- [ ] Toutes les sections sont visibles
```

### 2.3 Demandes Reçues

**URL :** `/prestataire/demandes-recues`

**Prérequis :** Créer une demande de test depuis un compte couple

**Scénario de test :**

```
1. Aller sur /prestataire/demandes-recues

✅ Vérifications :
- [ ] Liste des demandes affichée
- [ ] Groupées par statut (Nouvelles, En cours, Acceptées, Refusées)
- [ ] Chaque card affiche :
  - [ ] Nom du couple
  - [ ] Type de service
  - [ ] Date du mariage
  - [ ] Budget indicatif
  - [ ] Nombre d'invités
  - [ ] Message du couple
  - [ ] Badge de statut (violet pour "Nouvelle")
  - [ ] Date de création ("il y a X jours")

✅ Actions sur une demande :
- [ ] Cliquer "Voir détails" → Modal s'ouvre avec infos complètes
- [ ] Cliquer "Accepter" → Statut change en "Acceptée"
- [ ] Toast de confirmation affiché
- [ ] Badge devient vert
- [ ] Cliquer "Refuser" → Statut change en "Refusée"
```

### 2.4 Messagerie Prestataire

**URL :** `/prestataire/messagerie`

**Prérequis :** Avoir une conversation active avec un couple

**Scénario de test :**

```
1. Aller sur /prestataire/messagerie

✅ Liste des conversations :
- [ ] Conversations affichées dans sidebar
- [ ] Nom du couple visible
- [ ] Dernier message preview affiché
- [ ] Timestamp affiché
- [ ] Badge "non lu" si messages non lus
- [ ] Tri par date (plus récent en premier)

✅ Conversation sélectionnée :
- [ ] Messages affichés dans l'ordre chronologique
- [ ] Messages du prestataire alignés à droite (violet)
- [ ] Messages du couple alignés à gauche (gris)
- [ ] Timestamps visibles
- [ ] Scroll automatique vers le dernier message

✅ Envoi de message :
- [ ] Taper "Bonjour, j'ai bien reçu votre demande !"
- [ ] Cliquer "Envoyer" ou Entrée
- [ ] Message apparaît immédiatement (optimistic update)
- [ ] Message enregistré dans Supabase
- [ ] Compteur "non lus" du couple incrémenté

✅ Marquer comme lu :
- [ ] Ouvrir une conversation avec messages non lus
- [ ] Messages automatiquement marqués comme lus
- [ ] Badge "non lu" disparaît
- [ ] Compteur "non lus" décrémenté
```

### 2.5 Agenda Prestataire

**URL :** `/prestataire/agenda`

**Scénario de test :**

```
1. Aller sur /prestataire/agenda

✅ Calendrier :
- [ ] Calendrier affiché (mois actuel)
- [ ] Navigation mois précédent/suivant fonctionne
- [ ] Date du jour mise en évidence (violet)

✅ Créer un événement :
- [ ] Cliquer sur une date ou "Créer un événement"
- [ ] Modal s'ouvre PROPREMENT (fond opaque, pas de blur) ✨
- [ ] Remplir :
  - Titre : "Mariage Marie & Thomas"
  - Date : 01/06/2026
  - Heure début : 14:00
  - Heure fin : 23:00
  - Lieu : Château de Versailles
  - Notes : "DJ set + sonorisation"
- [ ] Cliquer "Enregistrer"
- [ ] Toast "Événement créé" affiché
- [ ] Événement apparaît dans la liste du jour sélectionné

✅ Liste des événements :
- [ ] Événements du jour sélectionné affichés
- [ ] Triés par heure de début
- [ ] Icônes calendrier, horloge, lieu visibles
- [ ] Cliquer sur un événement → Modal édition s'ouvre
- [ ] Modifier l'événement → Enregistrer → Changements visibles
- [ ] Cliquer "Supprimer" → Confirmation → Événement supprimé
```

---

## 💑 PARTIE 3 : TESTS FLOW COUPLE

### 3.1 Dashboard Couple

**URL :** `/couple/dashboard`

**Connecté en tant que :** test-couple@example.com

**Scénario de test :**

```
1. Aller sur /couple/dashboard

✅ Vérifications visuelles :
- [ ] TopBar affiche "Marie & Thomas"
- [ ] Avatar couple affiché
- [ ] Dashboard adapté au couple (widgets budget, timeline, etc.)

✅ Navigation :
- [ ] Sidebar affiche toutes les options :
  - [ ] Dashboard
  - [ ] Matching IA
  - [ ] Demandes & Devis
  - [ ] Messagerie
  - [ ] Budget
  - [ ] Timeline
  - [ ] Profil
```

### 3.2 Matching IA

**URL :** `/couple/matching`

**Scénario de test :**

```
1. Aller sur /couple/matching

✅ Interface matching :
- [ ] Formulaire de critères affiché
- [ ] Sélecteurs de services (Photographe, DJ, Traiteur, etc.)
- [ ] Sélecteur budget
- [ ] Sélecteur date mariage
- [ ] Sélecteur nombre invités
- [ ] Sélecteur cultures (si applicable)
- [ ] Sélecteur zones géographiques

✅ Lancer le matching :
- [ ] Remplir les critères
- [ ] Cliquer "Trouver mes prestataires"
- [ ] Loader affiché pendant la recherche
- [ ] Résultats affichés (cards prestataires)
- [ ] Filtres fonctionnent
- [ ] Tri par pertinence/prix/note

✅ Fiche prestataire :
- [ ] Cliquer sur un prestataire → Modal détails s'ouvre
- [ ] Photo + nom + description visibles
- [ ] Portfolio affiché
- [ ] Cultures et zones affichées
- [ ] Budget indiqué
- [ ] Années d'expérience
- [ ] Bouton "Envoyer une demande" fonctionnel
```

### 3.3 Envoyer une Demande

**Depuis :** Page matching ou profil prestataire

**Scénario de test :**

```
1. Cliquer "Envoyer une demande" sur un prestataire

✅ Formulaire demande :
- [ ] Modal s'ouvre
- [ ] Champs pré-remplis si possible :
  - [ ] Date mariage
  - [ ] Nombre invités
  - [ ] Budget indicatif
- [ ] Champ message personnalisé
- [ ] Remplir : "Bonjour, nous recherchons un DJ pour notre mariage..."
- [ ] Cliquer "Envoyer"

✅ Vérifications :
- [ ] Toast "Demande envoyée" affiché
- [ ] Demande créée dans Supabase (table demandes)
- [ ] Statut : "pending"
- [ ] Prestataire reçoit la demande dans /prestataire/demandes-recues
```

### 3.4 Budget Couple

**URL :** `/couple/budget`

**Scénario de test :**

```
1. Aller sur /couple/budget

✅ Vue d'ensemble :
- [ ] Budget total affiché
- [ ] Montant dépensé affiché
- [ ] Montant restant affiché
- [ ] Graphique circulaire (si implémenté)

✅ Ajouter une dépense :
- [ ] Cliquer "Ajouter une dépense"
- [ ] Remplir :
  - Catégorie : "Lieu de réception"
  - Nom : "Château de Versailles"
  - Montant estimé : 5000€
  - Statut : "Estimé"
- [ ] Cliquer "Enregistrer"
- [ ] Dépense apparaît dans la liste
- [ ] Budget restant mis à jour

✅ Modifier une dépense :
- [ ] Cliquer sur une dépense → Modal édition
- [ ] Changer statut "Estimé" → "Payé"
- [ ] Ajouter montant réel : 4800€
- [ ] Enregistrer
- [ ] Changements visibles
```

### 3.5 Timeline Couple

**URL :** `/couple/timeline`

**Scénario de test :**

```
1. Aller sur /couple/timeline

✅ Calendrier événements :
- [ ] Calendrier grand format affiché
- [ ] Date du mariage mise en évidence
- [ ] Événements/tâches affichés sur le calendrier

✅ Ajouter une tâche :
- [ ] Cliquer "Créer un événement"
- [ ] Remplir :
  - Titre : "Essayage robe"
  - Date : 01/03/2026
  - Heure : 14:00
  - Notes : "Rendez-vous chez la créatrice"
- [ ] Enregistrer
- [ ] Événement visible sur le calendrier
- [ ] Badge sur la date indiquant l'événement

✅ Vue liste :
- [ ] Basculer en vue liste (si disponible)
- [ ] Événements triés par date
- [ ] Statut (À faire, En cours, Terminé) visible
- [ ] Cocher comme "Terminé" fonctionne
```

### 3.6 Profil Couple

**URL :** `/couple/profil`

**Scénario de test :**

```
1. Aller sur /couple/profil

✅ Informations personnelles :
- [ ] Avatar couple éditable (upload photo)
- [ ] Noms partenaires éditables
- [ ] Date mariage éditable
- [ ] Lieu mariage éditable
- [ ] Nombre invités éditable
- [ ] Budget total éditable

✅ Sauvegarder :
- [ ] Modifier plusieurs champs
- [ ] Cliquer "Enregistrer"
- [ ] Toast "Profil mis à jour"
- [ ] Rafraîchir → Changements persistés
```

---

## 🔒 PARTIE 4 : TESTS DE SÉCURITÉ

### 4.1 Row Level Security (RLS) Supabase

**Objectif :** Vérifier qu'un utilisateur ne peut pas accéder aux données d'un autre

**Scénario de test :**

```
1. Connecté en tant que Prestataire A (test-prestataire@example.com)
2. Ouvrir DevTools > Network
3. Aller sur /prestataire/profil-public
4. Observer la requête Supabase à la table profiles

✅ Vérifications :
- [ ] Seul le profil de Prestataire A est retourné
- [ ] Pas d'accès aux profils des autres prestataires

5. Essayer manuellement via Supabase client :

const { data } = await supabase.from('profiles').select('*')

✅ Vérifications :
- [ ] Retourne uniquement le profil de l'utilisateur connecté
- [ ] Erreur ou tableau vide pour les autres profils

6. Tester les demandes :

const { data } = await supabase.from('demandes').select('*')

✅ Vérifications :
- [ ] Retourne uniquement les demandes où provider_id = user.id
- [ ] Pas d'accès aux demandes d'autres prestataires

7. Tester les messages :

const { data } = await supabase.from('messages').select('*')

✅ Vérifications :
- [ ] Retourne uniquement les messages des conversations de l'utilisateur
- [ ] Pas d'accès aux messages d'autres conversations
```

### 4.2 Rate Limiting

**Objectif :** Vérifier que le rate limiting fonctionne sur les API routes

**Scénario de test :**

```
1. Ouvrir DevTools > Console
2. Exécuter ce script pour spammer une route :

for (let i = 0; i < 60; i++) {
  fetch('/api/some-endpoint', { method: 'POST' })
    .then(r => console.log(i, r.status))
}

✅ Vérifications :
- [ ] Premières requêtes (< 50) : statut 200
- [ ] Requêtes suivantes (> 50) : statut 429 (Too Many Requests)
- [ ] Header "Retry-After" présent
- [ ] Message d'erreur clair : "Trop de requêtes, réessayez plus tard"

3. Attendre 1 minute
4. Refaire une requête

✅ Vérifications :
- [ ] Requête réussit (statut 200)
- [ ] Rate limit a été réinitialisé
```

### 4.3 CORS Protection

**Objectif :** Vérifier que seules les origines autorisées peuvent faire des requêtes

**Scénario de test :**

```
1. Ouvrir DevTools > Console sur https://malicious-site.com
2. Tenter une requête vers votre API :

fetch('https://votre-domaine.com/api/endpoint', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})

✅ Vérifications :
- [ ] Requête bloquée par CORS
- [ ] Erreur dans la console : "CORS policy: No 'Access-Control-Allow-Origin' header"
- [ ] Statut 403 ou CORS error

3. Tester depuis votre propre domaine :

fetch('https://votre-domaine.com/api/endpoint', {
  method: 'POST',
  credentials: 'include',
})

✅ Vérifications :
- [ ] Requête réussit
- [ ] Header 'Access-Control-Allow-Origin' présent avec votre domaine
```

### 4.4 Console.log Production

**Objectif :** Vérifier qu'aucun console.log ne fuite des données sensibles

**Scénario de test :**

```
1. Ouvrir DevTools > Console en mode production (npm run build && npm start)
2. Naviguer dans toute l'application

✅ Vérifications :
- [ ] Aucun console.log affiché (ou seulement via logger.ts en dev)
- [ ] Pas d'user IDs exposés
- [ ] Pas de tokens/secrets exposés
- [ ] Erreurs loggées de manière sécurisée (pas de stack traces complètes)
```

---

## ⚡ PARTIE 5 : TESTS DE PERFORMANCE

### 5.1 Lighthouse (Desktop)

**Scénario de test :**

```
1. Ouvrir Chrome DevTools > Lighthouse
2. Configuration :
   - Mode : Desktop
   - Catégories : Performance, Accessibility, Best Practices, SEO
3. Lancer l'audit sur les pages clés :
   - / (Homepage)
   - /prestataire/dashboard
   - /couple/dashboard
   - /tarifs

✅ Scores minimum attendus :
- [ ] Performance : > 90
- [ ] Accessibility : > 95
- [ ] Best Practices : > 95
- [ ] SEO : 100

✅ Core Web Vitals :
- [ ] LCP (Largest Contentful Paint) : < 2.5s
- [ ] FID (First Input Delay) : < 100ms
- [ ] CLS (Cumulative Layout Shift) : < 0.1
```

### 5.2 Lighthouse (Mobile)

**Scénario de test :**

```
1. Répéter l'audit en mode Mobile
2. Pages à tester : même liste

✅ Scores minimum attendus :
- [ ] Performance : > 85 (mobile est plus strict)
- [ ] Accessibility : > 95
- [ ] Best Practices : > 95
- [ ] SEO : 100
```

### 5.3 Temps de chargement

**Scénario de test :**

```
1. Ouvrir DevTools > Network
2. Activer "Disable cache"
3. Throttling : Fast 3G
4. Rafraîchir la page d'accueil

✅ Vérifications :
- [ ] Temps de chargement total : < 5s sur 3G
- [ ] First Contentful Paint : < 2s
- [ ] Tous les assets critiques chargés en priorité
```

---

## 📱 PARTIE 6 : TESTS RESPONSIVE

### 6.1 Mobile (375px - iPhone)

**Scénario de test :**

```
1. Ouvrir DevTools > Toggle device toolbar
2. Sélectionner iPhone SE (375x667)
3. Tester toutes les pages clés

✅ Homepage :
- [ ] Hero section lisible et attractive
- [ ] CTA boutons accessibles
- [ ] Navigation mobile (hamburger) fonctionne
- [ ] Texte lisible (taille > 16px)
- [ ] Pas de scroll horizontal

✅ Dashboard Prestataire :
- [ ] Sidebar mobile (drawer) fonctionne
- [ ] Stats cards empilées verticalement
- [ ] TopBar responsive :
  - [ ] Avatar visible
  - [ ] Nom caché sur petit écran (ou tronqué)
  - [ ] Recherche + Notifications accessibles
- [ ] Actions rapides sur 2 colonnes (au lieu de 4)

✅ Profil Public :
- [ ] Formulaires utilisables (inputs pas trop petits)
- [ ] Boutons tactiles (min 44x44px)
- [ ] Sélecteurs cultures/zones utilisables au doigt
- [ ] Upload photo fonctionne
```

### 6.2 Tablet (768px - iPad)

**Scénario de test :**

```
1. Sélectionner iPad (768x1024)
2. Tester les mêmes pages

✅ Vérifications :
- [ ] Layout adapté (ni mobile ni desktop)
- [ ] Sidebar visible ou cachable
- [ ] Grids en 2-3 colonnes (au lieu de 4)
- [ ] Lisibilité optimale
```

### 6.3 Desktop Large (1920px)

**Scénario de test :**

```
1. Fenêtre 1920x1080 (Full HD)
2. Tester les pages

✅ Vérifications :
- [ ] Contenu centré (max-width respecté)
- [ ] Pas d'étirement excessif
- [ ] Images nettes (pas pixelisées)
- [ ] Espacement harmonieux
```

---

## 🔗 PARTIE 7 : TESTS DE NAVIGATION

### 7.1 Tous les liens internes

**Scénario de test :**

```
1. Parcourir l'application
2. Cliquer sur TOUS les liens de navigation

✅ Sidebar Prestataire :
- [ ] Dashboard → /prestataire/dashboard
- [ ] Demandes reçues → /prestataire/demandes-recues
- [ ] Agenda → /prestataire/agenda
- [ ] Messagerie → /prestataire/messagerie
- [ ] Profil public → /prestataire/profil-public

✅ Sidebar Couple :
- [ ] Dashboard → /couple/dashboard
- [ ] Matching IA → /couple/matching
- [ ] Demandes & Devis → /couple/demandes
- [ ] Messagerie → /couple/messagerie
- [ ] Budget → /couple/budget
- [ ] Timeline → /couple/timeline
- [ ] Profil → /couple/profil

✅ TopBar :
- [ ] Logo → / (homepage)
- [ ] Recherche fonctionne
- [ ] Notifications s'ouvrent
- [ ] Menu utilisateur s'ouvre
- [ ] "Profil" dans menu → page profil
- [ ] "Déconnexion" → homepage

✅ Footer :
- [ ] Tous les liens sont cliquables
- [ ] Réseaux sociaux (si implémentés)
- [ ] Mentions légales, CGU, etc. (si implémentés)
```

### 7.2 Redirections

**Scénario de test :**

```
1. Déconnecté, essayer d'accéder à /prestataire/dashboard

✅ Vérifications :
- [ ] Redirection automatique vers /sign-in
- [ ] Message "Veuillez vous connecter" (si implémenté)

2. Connecté en tant que couple, essayer /prestataire/dashboard

✅ Vérifications :
- [ ] Accès refusé (403) ou redirection vers /couple/dashboard
- [ ] Toast d'erreur "Accès non autorisé"

3. Connecté en tant que prestataire, essayer /couple/dashboard

✅ Vérifications :
- [ ] Accès refusé ou redirection vers /prestataire/dashboard
```

---

## 🎯 CHECKLIST RÉCAPITULATIVE

### Authentification

- [ ] Sign-up Prestataire fonctionne
- [ ] Sign-up Couple fonctionne
- [ ] Sign-in fonctionne
- [ ] Sign-out fonctionne
- [ ] Reset password fonctionne (si implémenté)

### Flow Prestataire

- [ ] Dashboard affiche stats + demandes récentes
- [ ] Profil public éditable (avatar, nom, description, cultures, zones, portfolio)
- [ ] Sélecteurs cultures/zones : pas de chevauchement, badges violets ✨
- [ ] Demandes reçues affichées et actions fonctionnelles
- [ ] Messagerie : envoi/réception/marquer comme lu
- [ ] Agenda : créer/modifier/supprimer événements

### Flow Couple

- [ ] Dashboard couple fonctionnel
- [ ] Matching IA retourne des résultats
- [ ] Envoi de demande fonctionne
- [ ] Budget : ajouter/modifier dépenses
- [ ] Timeline : créer/modifier événements
- [ ] Profil couple éditable

### Sécurité

- [ ] RLS empêche accès aux données des autres users
- [ ] Rate limiting fonctionne (429 après 50 req/min)
- [ ] CORS bloque requêtes non autorisées
- [ ] Pas de console.log en production

### Performance

- [ ] Lighthouse Desktop : Performance > 90, SEO 100
- [ ] Lighthouse Mobile : Performance > 85
- [ ] Core Web Vitals : LCP < 2.5s, FID < 100ms, CLS < 0.1

### Responsive

- [ ] Mobile (375px) : lisible et utilisable
- [ ] Tablet (768px) : layout adapté
- [ ] Desktop (1920px) : centré et harmonieux

### Navigation

- [ ] Tous les liens sidebar fonctionnent
- [ ] TopBar navigation fonctionne
- [ ] Redirections auth correctes
- [ ] Pas de liens cassés (404)

---

## 🐛 RAPPORT DE BUGS

Si vous trouvez des bugs pendant les tests, documentez-les ici :

```markdown
### BUG #1 : [Titre court]

**Page :** /prestataire/profil-public

**Navigateur :** Chrome 120

**Étapes de reproduction :**

1. Aller sur /prestataire/profil-public
2. Cliquer sur sélecteur cultures
3. ...

**Résultat attendu :** Popover s'ouvre sans chevauchement

**Résultat observé :** Section arrondie chevauche section rectangulaire

**Priorité :** 🔴 High / 🟡 Medium / 🟢 Low

**Statut :** ❌ Non corrigé / ✅ Corrigé
```

---

## ✅ VALIDATION FINALE

Une fois TOUS les tests passés :

- [ ] Créer un tableau Excel/Google Sheets avec résultats
- [ ] Capturer screenshots de Lighthouse scores
- [ ] Documenter tous les bugs trouvés et corrigés
- [ ] Obtenir validation client/product owner
- [ ] Créer un tag Git : `git tag -a v1.0.0 -m "Release v1.0.0"`
- [ ] Prêt pour déploiement production 🚀

---

## 📝 NOTES DE TEST

Utilisez cette section pour noter vos observations pendant les tests :

### Date de test : _______________

### Testeur : _______________

### Environnement : Local / Preview / Production

### Observations générales :



---

## 🔄 HISTORIQUE DES TESTS

| Date | Version | Testeur | Résultat | Notes |
|------|---------|---------|----------|-------|
|      |         |         |          |       |

---

**Document créé le :** _Date de création_  
**Dernière mise à jour :** _Date de mise à jour_  
**Version :** 1.0.0

