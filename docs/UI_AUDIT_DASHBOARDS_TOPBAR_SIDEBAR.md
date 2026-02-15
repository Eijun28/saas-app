# Audit UI — Dashboard Couple & Prestataire + Top bar + Sidebar

_Date : 2026-02-15_

## 1) Périmètre audité
- `app/couple/dashboard/page.tsx`
- `app/prestataire/dashboard/page.tsx`
- `components/layout/CoupleHeader.tsx`
- `components/layout/PrestataireHeader.tsx`
- `app/couple/sidebar-wrapper.tsx`
- `app/prestataire/sidebar-wrapper.tsx`
- `components/ui/sidebar.tsx`

## 2) Forces UI (ce qui fonctionne déjà bien)

### A. Structure et lisibilité globale
- Base visuelle cohérente entre les deux espaces (cards blanches, arrondis larges, ombres légères, layout aéré), ce qui facilite l’apprentissage produit.
- Pattern de navigation stable : sidebar + top bar + zone contenu principale.
- Présence de KPI cards, de blocs “action recommandée” et de sections d’activité récente : bonne hiérarchisation macro.

### B. Interaction
- Feedback d’état actif dans les sidebars (fond teinté + couleur primaire + barre latérale active).
- États de chargement/skeleton déjà présents sur les dashboards.
- Micro-interactions utiles (hover, transitions courtes, badges notifications).

### C. Mobile / responsive
- Sidebar mobile gérée via overlay + fermeture au clic extérieur + touche Escape.
- CTA principaux globalement accessibles sur mobile (zones cliquables correctes, structure verticale).

---

## 3) Points améliorables (impact moyen)

### A. Textes / microcopy
- Mélange FR/EN dans la navigation (`Operations`, `Dashboard`) qui casse la perception premium/localisée.
- Plusieurs textes sans accents (`Demandes recues`, `Deconnexion`, `Reessayer`, `Activite recente`, etc.) : perception “produit non fini”.
- Libellés parfois orientés système plutôt que bénéfice utilisateur.

### B. Cohérence des composants
- Même logique de composant, mais variations de wording entre couple/prestataire (ex: `Messages` vs `Messagerie`) qui augmentent la charge cognitive.
- Quick actions top bar parfois peu différenciées visuellement d’actions secondaires.

### C. Couleurs
- Forte dépendance à un violet unique pour beaucoup d’usages (primaire, badges, accents, actions recommandées), ce qui limite la hiérarchie sémantique.
- Manque de système “état” explicite harmonisé (info/success/warning/danger) appliqué partout.

### D. Effets / motion
- Motion globalement agréable, mais parfois homogène (mêmes timings/types d’animation) : impression de “même niveau d’importance” pour tous les blocs.

---

## 4) Points critiques (impact fort)

### 1) Qualité linguistique et crédibilité perçue
Le volume de microcopy non accentuée ou hétérogène FR/EN dans des zones premium (sidebar/top bar/dashboard) dégrade directement la confiance et la sensation de finition.

### 2) Accessibilité en sidebar repliée
Le composant sidebar supporte des tooltips en mode icône, mais les wrappers couple/prestataire ne passent pas encore la prop `tooltip` aux entrées de navigation. En mode replié, la compréhension dépend donc des icônes seules.

### 3) Sémantique visuelle insuffisamment codifiée
Le violet est utilisé à la fois pour la marque, les états d’action, et certains signaux d’alerte légère. Sans tokens d’états bien définis, la lecture des priorités est moins immédiate.

---

## 5) Plan d’action UI actionnable

## Sprint 1 (Quick wins — 2 à 4 jours)

### Axe Texte (priorité haute)
1. Uniformiser 100% des labels navigation en français cohérent (ex: `Opérations`, `Tableau de bord`, `Demandes reçues`, `Déconnexion`, `Réessayer`, `Activité récente`).
2. Définir une mini-charte microcopy :
   - ton (clair, humain, orienté action),
   - longueur max par label,
   - règles d’accents/pluriels.
3. Harmoniser les termes inter-surfaces (`Messagerie` vs `Messages`) selon un choix unique.

**Livrable**: dictionnaire UI des labels critiques (sidebar, top bar, CTA principaux).

### Axe Navigation / compréhension
4. Activer les `tooltip` sur chaque `SidebarMenuButton` (couple + prestataire) pour le mode collapsed.
5. Vérifier l’`aria-label` de tous les boutons icône (toggle, notifications, close).

**Livrable**: sidebar collapsed compréhensible sans ambiguïté.

---

## Sprint 2 (Structuration design system — 1 semaine)

### Axe Couleurs
6. Introduire des tokens d’état minimum :
   - `--color-info`, `--color-success`, `--color-warning`, `--color-danger` (+ versions bg/texte/border).
7. Réserver le violet de marque pour:
   - CTA primaires,
   - éléments identité.
8. Migrer les badges/alertes contextuelles vers la couleur d’état appropriée.

### Axe Composants
9. Standardiser un composant “KPI card” partagé couple/prestataire (mêmes tailles typo, spacing, states, slots action).
10. Standardiser un composant “Bannière d’attention” (warning/info/action recommandée) avec variantes.

**Livrable**: primitives UI unifiées + mapping des usages.

---

## Sprint 3 (Polish & perception premium — 1 semaine)

### Axe Effets
11. Définir une échelle motion:
   - `fast` (120–160ms) pour hover,
   - `normal` (180–240ms) pour transitions de panneau,
   - `emphasis` (260–320ms) pour entrée de section clé.
12. Réduire l’animation décorative sur sections secondaires pour mieux mettre en avant les actions critiques.

### Axe Qualité perçue
13. Introduire un contrôle QA UI systématique avant release:
   - orthographe/accents,
   - contraste,
   - état collapsed sidebar,
   - cohérence des labels.

**Livrable**: checklist QA UI “dashboard shell”.

---

## 6) KPIs de succès (à suivre)
- **Compréhension navigation**: baisse des hésitations sur sidebar repliée (tests utilisateurs qualitatifs).
- **Temps d’accès à action clé**: -15 à -20% sur “ouvrir demandes/messagerie”.
- **Perception de finition**: score QA linguistique > 95% sur labels critiques.
- **Consistance UI**: 0 libellé FR/EN mixte sur dashboard shell.

---

## 7) Priorisation résumée
- **P0 immédiat**: correction microcopy + tooltips sidebar collapsed.
- **P1**: tokens couleurs d’état + standardisation KPI/banner.
- **P2**: raffinement motion et QA process continu.

Ce plan permet d’améliorer rapidement la sensation “user friendly + premium” sans refonte lourde, puis de sécuriser la cohérence via des composants et règles durables.
