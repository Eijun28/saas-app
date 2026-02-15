# PLANNING DE CORRECTIONS — NUPLY

> Audit du 15/02/2026 — Plan d'action priorisé

---

## PHASE 1 — CRITIQUE (Stabilité & Sécurité)

> Objectif : Sécuriser la production avant toute nouvelle feature

### 1.1 Résoudre les 24 TODO/FIXME

| # | Fichier | Ligne | TODO | Action |
|---|---------|-------|------|--------|
| 1 | `lib/logger.ts` | 23, 31 | Envoyer à un service de monitoring | Brancher sur Sentry (déjà intégré) |
| 2 | `components/messaging/ChatInput.tsx` | 105 | Ouvrir la caméra | Implémenter ou retirer le bouton caméra |
| 3 | `components/messaging/ChatInput.tsx` | 111, 118 | Upload fichiers vers Supabase Storage | Implémenter l'upload media dans le chat |
| 4 | `components/messaging/ChatInput.tsx` | 128, 133 | Enregistrement vocal | Implémenter ou retirer le bouton vocal |
| 5 | `components/messaging/ChatHeader.tsx` | 57, 62 | WebRTC appels vidéo/audio | Reporter en Phase 3 — retirer les boutons pour l'instant |
| 6 | `components/messaging/ChatHeader.tsx` | 73 | Sauvegarder dans conversation_participants | Implémenter la sauvegarde |
| 7 | `components/messaging/ChatHeader.tsx` | 78 | Système de signalement | Implémenter un report basique |
| 8 | `components/messaging/ChatHeader.tsx` | 84 | Suppression conversation | Implémenter soft-delete |
| 9 | `components/messaging/ChatList.tsx` | 83 | Vérifier user_presence | Implémenter le statut en ligne via Supabase Presence |
| 10 | `components/messages/MessageThread.tsx` | 39, 71, 98 | Supabase Realtime + envoi messages | Brancher sur le système existant (doublon probable) |
| 11 | `components/matching/ChatbotModal.tsx` | 106 | Lancement matching avec critères | Connecter au système de matching existant |
| 12 | `components/budget/BudgetCategoriesSection.tsx` | 264, 274 | Modal ajout prestataire + voir détails | Implémenter les modals |
| 13 | `components/prestataire/profil/ServiceImportDialog.tsx` | 57, 62, 100 | Upload PDF + webhook n8n | Finaliser l'intégration n8n ou retirer la feature |
| 14 | `app/sitemap.ts` | 68 | Ajouter pages dynamiques | Ajouter profils prestataires + articles blog |
| 15 | `app/couple/matching/page.tsx` | 446 | Charger conversation sélectionnée | Connecter au système de messaging |

### 1.2 Rate limiting global

- **Actuel** : Rate limiting uniquement sur les routes chatbot
- **Action** : Étendre à toutes les routes API sensibles (auth, messaging, devis, stripe)
- **Fichiers** : `lib/rate-limit.ts` → créer un middleware générique
- **Fichiers impactés** : `middleware.ts` + toutes les routes `/api/*`

### 1.3 Dette TypeScript — Éliminer les `any`

Top 10 fichiers à corriger en priorité :

| # | Fichier | `any` count | Priorité |
|---|---------|-------------|----------|
| 1 | `app/couple/demandes/page.tsx` | 12 | Haute |
| 2 | `app/couple/matching/page.tsx` | 11 | Haute |
| 3 | `lib/pdf/marriage-dossier-generator.ts` | 10 | Moyenne |
| 4 | `lib/auth/actions.ts` | 10 | Haute (sécurité) |
| 5 | `lib/supabase/chatbot-conversations.ts` | 8 | Moyenne |
| 6 | `lib/email/notifications.ts` | 8 | Moyenne |
| 7 | `hooks/useChatbot.ts` | 6 | Moyenne |
| 8 | `app/couple/favoris/page.tsx` | 6 | Basse |
| 9 | `components/reviews/ReviewsList.tsx` | 5 | Basse |
| 10 | `components/NuplyNavbarMenu.tsx` | 5 | Basse |

**Action** : Créer des types/interfaces dans `types/` pour chaque entité Supabase et remplacer tous les `any`.

### 1.4 Tests automatisés — Fondations

**Framework** : Jest (déjà configuré dans `jest.config.js`)

Tests critiques à écrire en premier :

| # | Scope | Fichier test | Ce qu'on teste |
|---|-------|-------------|----------------|
| 1 | Auth | `__tests__/auth/actions.test.ts` | signUp, signIn, signOut, resetPassword |
| 2 | Matching | `__tests__/matching/algorithm.test.ts` | Scoring culturel, budget, localisation, fairness |
| 3 | Stripe | `__tests__/stripe/webhook.test.ts` | Événements webhook, gestion abonnements |
| 4 | Devis | `__tests__/devis/generate.test.ts` | Génération PDF, calculs montants |
| 5 | Rate Limit | `__tests__/rate-limit.test.ts` | Limiter correctement, reset |
| 6 | API Routes | `__tests__/api/*.test.ts` | Réponses 200/401/403/500 sur chaque route |

---

## PHASE 2 — HAUTE PRIORITÉ (Expérience utilisateur core)

> Objectif : Compléter les parcours essentiels couple & prestataire

### 2.1 Messagerie — Compléter les fonctionnalités

- [ ] **Upload fichiers/images** dans le chat (Supabase Storage)
- [ ] **Suppression de conversation** (soft-delete)
- [ ] **Signalement** d'un utilisateur (report basique)
- [ ] **Indicateur de présence** (en ligne / hors ligne) via Supabase Presence
- [ ] Résoudre le doublon `components/messages/` vs `components/messaging/`

### 2.2 Workflow devis complet

- [ ] **Acceptation/refus** d'un devis par le couple (boutons dans l'interface)
- [ ] **Négociation** : le couple peut demander une modification
- [ ] **Historique des versions** d'un devis
- [ ] **Notification** au prestataire quand un devis est accepté/refusé
- [ ] **Conversion devis → facture** simplifiée (le bouton existe mais vérifier le flow)

### 2.3 Disponibilités prestataires publiques

- [ ] **Calendrier de disponibilité** visible sur le profil public du prestataire
- [ ] **Vérification de dispo** avant envoi de demande par le couple
- [ ] **Blocage automatique** de dates après acceptation d'un devis

### 2.4 Profil prestataire enrichi

- [ ] **Galerie portfolio** structurée (photos + vidéos, organisées par événement)
- [ ] **Vidéo de présentation** (embed YouTube/Vimeo ou upload)
- [ ] **FAQ personnalisable** par le prestataire
- [ ] **Tarifs détaillés** visibles publiquement (fourchettes, options)

### 2.5 Avis vérifiés

- [ ] **Vérification d'achat** : seuls les couples ayant eu un devis accepté peuvent laisser un avis
- [ ] **Modération** : signalement de faux avis
- [ ] **Photos dans les avis** : le couple peut joindre des photos

---

## PHASE 3 — PRIORITÉ MOYENNE (Différenciation)

> Objectif : Se démarquer de la concurrence

### 3.1 Appels vidéo/audio

- [ ] Intégration WebRTC ou service tiers (Daily.co, Twilio, Jitsi)
- [ ] Bouton d'appel depuis la conversation
- [ ] Historique des appels
- [ ] Planification d'un RDV visio

### 3.2 Comparateur de prestataires

- [ ] Sélection de 2-3 prestataires à comparer
- [ ] Vue côte à côte (tarifs, avis, services, style)
- [ ] Export de la comparaison en PDF

### 3.3 Paiement sécurisé (escrow)

- [ ] Acompte via Stripe Connect
- [ ] Paiement fractionné (30/30/40 par exemple)
- [ ] Protection acheteur
- [ ] Libération des fonds après l'événement
- [ ] Commission plateforme configurable

### 3.4 Contrats numériques

- [ ] Templates de contrats par type de service
- [ ] Signature électronique intégrée (DocuSign API ou alternative)
- [ ] Archivage des contrats signés
- [ ] Lien contrat ↔ devis accepté

### 3.5 Checklist de mariage

- [ ] Templates par culture et par timeline (J-12 mois → Jour J)
- [ ] Checklist personnalisable
- [ ] Progression visuelle
- [ ] Lien avec le budget et les prestataires réservés

### 3.6 Intégration calendrier externe

- [ ] Sync Google Calendar (OAuth2)
- [ ] Sync Outlook/Microsoft (Graph API)
- [ ] Export iCal (.ics)
- [ ] Rappels automatiques

---

## PHASE 4 — NICE-TO-HAVE (Scaling & Polish)

> Objectif : Préparer la croissance

### 4.1 Internationalisation (i18n)

- [ ] Setup next-intl ou react-i18next
- [ ] Extraction des chaînes FR existantes
- [ ] Traduction EN (priorité 1), AR (priorité 2)
- [ ] Détection automatique de la langue

### 4.2 Admin panel avancé

- [ ] Dashboard métriques plateforme (GMV, taux de conversion, churn)
- [ ] Modération des avis et signalements
- [ ] Gestion des prestataires (validation, suspension)
- [ ] Gestion des couples
- [ ] Logs d'activité

### 4.3 Notifications push

- [ ] Service Worker + Web Push API
- [ ] Préférences granulaires par type de notification
- [ ] Push mobile (PWA)

### 4.4 Recherche avancée

- [ ] Recherche géographique avec carte (Mapbox ou Google Maps)
- [ ] Autocomplétion
- [ ] Suggestions "prestataires similaires"
- [ ] Filtres sauvegardés

### 4.5 Blog enrichi

- [ ] Catégories et tags
- [ ] SEO avancé par article (schema.org, breadcrumbs)
- [ ] Articles liés aux prestataires
- [ ] Système de commentaires

### 4.6 Performance & Monitoring

- [ ] Lazy loading systématique des composants lourds
- [ ] Stratégie de cache (ISR/SSG pour profils publics)
- [ ] Dashboard de monitoring (uptime, latence API)
- [ ] Alertes automatiques (erreur rate > seuil)

### 4.7 Système de litiges

- [ ] Ouverture de litige par couple ou prestataire
- [ ] Médiation par l'admin
- [ ] Résolution avec remboursement partiel/total
- [ ] Historique des litiges

---

## RÉCAPITULATIF PAR PRIORITÉ

| Phase | Items | Focus |
|-------|-------|-------|
| **Phase 1** | 4 chantiers | Stabilité, sécurité, dette technique, tests |
| **Phase 2** | 5 chantiers | Messagerie complète, workflow devis, dispos, profils, avis |
| **Phase 3** | 6 chantiers | Visio, comparateur, escrow, contrats, checklist, sync calendrier |
| **Phase 4** | 7 chantiers | i18n, admin, push, recherche carte, blog, perf, litiges |

---

## ORDRE D'EXÉCUTION RECOMMANDÉ

```
Phase 1.1  →  Résoudre les 24 TODO/FIXME
Phase 1.3  →  Typer les `any` (top 5 fichiers)
Phase 1.2  →  Rate limiting global
Phase 1.4  →  Tests critiques (auth, matching, stripe)
Phase 2.2  →  Workflow devis (accepter/refuser/négocier)
Phase 2.1  →  Messagerie (upload, suppression, signalement)
Phase 2.3  →  Disponibilités publiques
Phase 2.4  →  Profil prestataire enrichi
Phase 2.5  →  Avis vérifiés
Phase 3.5  →  Checklist mariage
Phase 3.2  →  Comparateur
Phase 3.6  →  Sync calendrier
Phase 3.1  →  Appels vidéo
Phase 3.3  →  Paiement sécurisé (escrow)
Phase 3.4  →  Contrats numériques
Phase 4.*  →  Selon roadmap produit
```

---

*Document généré le 15/02/2026 — NUPLY v0.1.1*
