# API d'inscription - Documentation

## Endpoint

`POST /api/auth/signup`

## Description

Cette API gère l'inscription complète d'un utilisateur dans Supabase :
1. Création du compte auth
2. Création du profil dans la table `profiles`
3. Création du profil spécifique (`couple_profiles` ou `prestataire_profiles`)

## Body de la requête

```typescript
{
  email: string
  password: string
  profileType: 'couple' | 'prestataire'
  coupleData?: {
    prenom: string
    nom: string
    dateMariage: string | null // Format ISO string ou YYYY-MM-DD
    budget: number
    lieu: string
    typeCeremonie: string
    infosCulturelles: string
  }
  prestataireData?: {
    nomEntreprise: string
    typePrestation: string
    zoneIntervention: string
    prixMin: number
    prixMax: number
  }
}
```

## Réponse succès

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "role": "couple" | "prestataire"
  }
}
```

## Réponse erreur

```json
{
  "error": "Message d'erreur"
}
```

## Codes de statut

- `200` : Inscription réussie
- `400` : Données invalides ou manquantes
- `500` : Erreur serveur

## Tables Supabase utilisées

1. `auth.users` : Création du compte utilisateur
2. `profiles` : Profil de base (rôle, prénom, nom, onboarding_completed)
3. `couple_profiles` : Si profileType = 'couple'
4. `prestataire_profiles` : Si profileType = 'prestataire'

## Notes importantes

- Les dates sont converties au format DATE PostgreSQL (YYYY-MM-DD)
- Les budgets/prix sont convertis en nombres
- Utilisation de `upsert` pour éviter les erreurs de duplication
- Le champ `onboarding_completed` est automatiquement mis à `true`

