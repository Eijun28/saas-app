# Estimation Coûts & Marges - Nuply SaaS

## Hypothèses de base

### Stack technique & services externes

| Service | Coût de base | Coût variable |
|---------|-------------|---------------|
| **Vercel Pro** (hosting Next.js) | 20 $/mois | +0.01$/invocation serverless au-delà du quota |
| **Supabase Pro** (PostgreSQL + Storage + Auth + Realtime) | 25 $/mois | +stockage/bande passante au-delà quota |
| **OpenAI GPT-4 Turbo** (chatbot IA + matching) | Variable | ~0.01-0.03 $/1K tokens |
| **Stripe** (paiements) | 0 $ fixe | 1.5% + 0.25€ par transaction (EU) |
| **Resend** (emails transactionnels) | 0-20 $/mois | ~0.0007$/email au-delà du quota gratuit |
| **Domaine + DNS** | ~15 $/an (~1.25 $/mois) | - |

### Estimation coût IA par utilisateur actif/mois

- Chatbot advisor : ~5-10 conversations/mois/utilisateur
- ~150 tokens max par réponse, ~300 tokens par échange (prompt + réponse)
- GPT-4 Turbo : ~0.01$/1K input tokens, ~0.03$/1K output tokens
- **Coût IA estimé : ~0.15-0.40 €/utilisateur actif/mois**

### Coût Stripe par transaction d'abonnement

- Abonnement 60€ : Stripe prend ~1.15€ (1.5% + 0.25€) → **net = 58.85€**
- Abonnement 90€ : Stripe prend ~1.60€ (1.5% + 0.25€) → **net = 88.40€**

---

## Palier 1 : Lancement (50 abonnés)

### Hypothèse : 50 prestataires abonnés

| Poste | Coût/mois |
|-------|-----------|
| Vercel Pro | 20 $ (~19€) |
| Supabase Pro | 25 $ (~23€) |
| OpenAI (50 users × 0.30€) | 15€ |
| Resend (emails) | 0€ (quota gratuit suffisant) |
| Stripe (frais variables) | Inclus ci-dessous |
| Domaine/DNS | 1€ |
| **Total infrastructure** | **~58€/mois** |

| Formule | Revenu brut | Frais Stripe | Revenu net | Marge brute | Taux de marge |
|---------|-------------|-------------|------------|-------------|---------------|
| **50 × 60€** | 3 000€ | -58€ | 2 942€ | **2 884€** | **96.1%** |
| **50 × 90€** | 4 500€ | -80€ | 4 420€ | **4 362€** | **96.9%** |

> Les coûts infra sont quasi fixes à ce stade. Marge très élevée mais revenu absolu encore faible.

---

## Palier 2 : Traction (200 abonnés)

### Hypothèse : 200 prestataires abonnés

| Poste | Coût/mois |
|-------|-----------|
| Vercel Pro | 20 $ (~19€) |
| Supabase Pro | 25 $ (~23€) + ~10€ overages |
| OpenAI (200 users × 0.30€) | 60€ |
| Resend | 20€ |
| Support client (temps partiel / freelance) | 500€ |
| Domaine/DNS | 1€ |
| **Total infrastructure + support** | **~633€/mois** |

| Formule | Revenu brut | Frais Stripe | Revenu net | Coûts totaux | Marge brute | Taux de marge |
|---------|-------------|-------------|------------|-------------|-------------|---------------|
| **200 × 60€** | 12 000€ | -230€ | 11 770€ | 633€ | **11 137€** | **92.8%** |
| **200 × 90€** | 18 000€ | -320€ | 17 680€ | 633€ | **17 047€** | **94.7%** |

> Le support client commence à être nécessaire. L'IA reste peu coûteuse grâce au max_tokens limité (150).

---

## Palier 3 : Croissance (500 abonnés)

### Hypothèse : 500 prestataires abonnés

| Poste | Coût/mois |
|-------|-----------|
| Vercel Pro | 50€ (hausse serverless) |
| Supabase Pro | 50€ (+ overages stockage PDF devis/factures) |
| OpenAI (500 users × 0.35€) | 175€ |
| Resend | 40€ |
| Support client (mi-temps) | 1 200€ |
| Maintenance / DevOps (freelance) | 800€ |
| Domaine/DNS + sécurité | 10€ |
| **Total** | **~2 325€/mois** |

| Formule | Revenu brut | Frais Stripe | Revenu net | Coûts totaux | Marge brute | Taux de marge |
|---------|-------------|-------------|------------|-------------|-------------|---------------|
| **500 × 60€** | 30 000€ | -575€ | 29 425€ | 2 325€ | **27 100€** | **90.3%** |
| **500 × 90€** | 45 000€ | -800€ | 44 200€ | 2 325€ | **41 875€** | **93.1%** |

> Les coûts humains (support, maintenance) deviennent le poste principal. L'infra technique reste peu chère.

---

## Palier 4 : Scale (1 000 abonnés)

### Hypothèse : 1 000 prestataires abonnés

| Poste | Coût/mois |
|-------|-----------|
| Vercel Pro / Team | 100€ |
| Supabase Team | 150€ |
| OpenAI (1000 users × 0.40€) | 400€ |
| Resend | 80€ |
| Support client (temps plein) | 2 500€ |
| Dev/maintenance (mi-temps) | 1 500€ |
| Marketing / acquisition | 2 000€ |
| Juridique / compta | 300€ |
| Divers (outils, monitoring) | 200€ |
| **Total** | **~7 230€/mois** |

| Formule | Revenu brut | Frais Stripe | Revenu net | Coûts totaux | Marge brute | Taux de marge |
|---------|-------------|-------------|------------|-------------|-------------|---------------|
| **1000 × 60€** | 60 000€ | -1 150€ | 58 850€ | 7 230€ | **51 620€** | **86.0%** |
| **1000 × 90€** | 90 000€ | -1 600€ | 88 400€ | 7 230€ | **81 170€** | **90.2%** |

---

## Palier 5 : Maturité (2 500 abonnés)

### Hypothèse : 2 500 prestataires abonnés

| Poste | Coût/mois |
|-------|-----------|
| Vercel Enterprise / Infra dédiée | 300€ |
| Supabase Team + overages | 400€ |
| OpenAI (2500 × 0.45€) | 1 125€ |
| Resend / SendGrid | 150€ |
| Équipe support (2 personnes) | 5 000€ |
| Équipe technique (2 devs) | 6 000€ |
| Marketing / acquisition | 5 000€ |
| Juridique / compta / assurance | 800€ |
| Bureaux / outils | 1 000€ |
| **Total** | **~19 775€/mois** |

| Formule | Revenu brut | Frais Stripe | Revenu net | Coûts totaux | Marge brute | Taux de marge |
|---------|-------------|-------------|------------|-------------|-------------|---------------|
| **2500 × 60€** | 150 000€ | -2 875€ | 147 125€ | 19 775€ | **127 350€** | **84.9%** |
| **2500 × 90€** | 225 000€ | -4 000€ | 221 000€ | 19 775€ | **201 225€** | **89.4%** |

---

## Tableau récapitulatif - ARR (Annual Recurring Revenue)

| Palier | Abonnés | ARR à 60€ | Marge annuelle 60€ | ARR à 90€ | Marge annuelle 90€ |
|--------|---------|-----------|--------------------|-----------|--------------------|
| Lancement | 50 | 36 000€ | 34 608€ | 54 000€ | 52 344€ |
| Traction | 200 | 144 000€ | 133 644€ | 216 000€ | 204 564€ |
| Croissance | 500 | 360 000€ | 325 200€ | 540 000€ | 502 500€ |
| Scale | 1 000 | 720 000€ | 619 440€ | 1 080 000€ | 974 040€ |
| Maturité | 2 500 | 1 800 000€ | 1 528 200€ | 2 700 000€ | 2 414 700€ |

---

## Scénario mixte recommandé : 2 plans

### Structure tarifaire suggérée

| Plan | Prix | Cible |
|------|------|-------|
| **Starter** | 60€/mois | Petits prestataires, indépendants |
| **Pro** | 90€/mois | Prestataires établis, agences |

### Hypothèse de répartition : 60% Starter / 40% Pro

| Palier | Abonnés | Revenu mensuel mixte | Coûts | Marge mensuelle | Taux |
|--------|---------|---------------------|-------|-----------------|------|
| Lancement | 50 | 3 600€ | 58€ | **3 474€** | 96.5% |
| Traction | 200 | 14 400€ | 633€ | **13 497€** | 93.7% |
| Croissance | 500 | 36 000€ | 2 325€ | **32 960€** | 91.6% |
| Scale | 1 000 | 72 000€ | 7 230€ | **63 620€** | 88.4% |
| Maturité | 2 500 | 180 000€ | 19 775€ | **157 350€** | 87.4% |

> **Revenu mensuel mixte** = (nb × 60% × 60€) + (nb × 40% × 90€) = nb × 72€ en moyenne

---

## Points clés

### Pourquoi les marges sont élevées

1. **SaaS pur** : Pas de coût marginal physique par client
2. **IA optimisée** : max_tokens à 150, température basse → coût IA maîtrisé (~0.30-0.45€/user)
3. **Stack serverless** : Vercel + Supabase = pas de serveurs à gérer, scaling automatique
4. **PDF client-side** : Génération de devis/factures côté navigateur (pdf-lib) → pas de coût serveur

### Risques sur les coûts

1. **OpenAI** : Si usage IA augmente (conversations plus longues, modèles plus chers) → coût peut doubler
2. **Stockage Supabase** : PDFs devis/factures s'accumulent → prévoir du nettoyage ou de l'archivage
3. **Support client** : Le poste humain devient le coût #1 dès 200+ abonnés
4. **Churn** : Un taux de désabonnement >5%/mois détruirait la rentabilité

### Recommandations

- **Le plan à 60€ est viable** dès le lancement avec des marges >85%
- **Le plan à 90€ est très rentable** et justifié par les features IA + matching + devis/factures
- **Le mix 60€/90€** permet de capter un marché plus large tout en maximisant l'ARPU
- **Seuil de rentabilité** : atteint dès le 1er abonné (coûts fixes < 60€ au lancement)
- **Focus acquisition** : Le vrai enjeu n'est pas le coût mais l'acquisition de prestataires

---

*Document généré le 12/02/2026 - Basé sur l'analyse complète de la codebase Nuply*
