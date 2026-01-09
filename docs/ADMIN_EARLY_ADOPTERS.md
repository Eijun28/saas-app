# 🔐 Guide d'utilisation - Page Admin Early Adopters

## 📋 Configuration initiale

### 1. Ajouter les emails autorisés

Ouvrez le fichier `lib/config/admin.ts` et modifiez les adresses email :

```typescript
export const ADMIN_EMAILS = [
  'votre-email-1@exemple.com',  // Remplacez par votre première adresse
  'votre-email-2@exemple.com',  // Remplacez par votre deuxième adresse
]
```

**Important** : Les emails doivent correspondre exactement aux adresses utilisées lors de l'inscription sur Nuply.

## 🚀 Comment accéder à la page admin

### Étape 1 : Se connecter avec un compte autorisé

1. Allez sur `/sign-up` ou `/sign-in`
2. Connectez-vous avec **l'une des deux adresses email** configurées dans `ADMIN_EMAILS`
3. Le compte peut être de type "couple" ou "prestataire" (peu importe)

### Étape 2 : Accéder à la page admin

Une fois connecté, allez sur :
```
http://localhost:3000/admin/early-adopters-alerts
```

ou en production :
```
https://votre-domaine.com/admin/early-adopters-alerts
```

## 🔒 Sécurité

- ✅ Seuls les emails dans `ADMIN_EMAILS` peuvent accéder
- ✅ Vérification à deux niveaux (layout + page)
- ✅ Redirection automatique si non autorisé
- ✅ Message d'erreur clair si accès refusé

## 📊 Utilisation de la page

### Section 🔴 URGENTE (≤ 7 jours ou expiré)

- **Action** : Appeler immédiatement ces prestataires
- **Informations affichées** :
  - Nom et prénom
  - Email
  - Téléphone (si disponible)
  - Jours restants ou statut "EXPIRÉ"
  - Date de fin de l'essai
- **Script d'appel** : Un script personnalisé est fourni pour chaque utilisateur
- **Tracking** : Cochez la case "✅ Appelé et discuté" après chaque appel

### Section 🟡 BIENTÔT (8-30 jours)

- **Action** : Préparer les appels pour les prochains jours
- **Affichage** : Liste compacte avec les informations essentielles

### Section 🟢 OK (30+ jours)

- **Action** : Aucune action immédiate nécessaire
- **Affichage** : Compteur du nombre de prestataires concernés

## 💡 Conseils d'utilisation

1. **Vérifiez quotidiennement** la section URGENTE
2. **Utilisez le script d'appel** fourni pour chaque prestataire
3. **Cochez les cases** après chaque appel pour suivre vos actions
4. **Planifiez les appels** de la section BIENTÔT à l'avance

## 🐛 Dépannage

### "Accès refusé" même avec un email autorisé

1. Vérifiez que l'email dans `lib/config/admin.ts` correspond **exactement** à celui de votre compte
2. Les emails sont comparés en minuscules (case-insensitive)
3. Assurez-vous d'être bien connecté avec le bon compte

### La page ne charge pas les données

1. Vérifiez que vous êtes bien connecté
2. Vérifiez les logs du serveur pour d'éventuelles erreurs
3. Assurez-vous que la table `profiles` contient bien les colonnes `is_early_adopter` et `early_adopter_trial_end_date`

## 📝 Notes importantes

- Les données sont récupérées en temps réel à chaque chargement de la page
- Les checkboxes ne sont pas sauvegardées (c'est normal, c'est pour votre suivi personnel)
- Pour un suivi plus avancé, vous pouvez exporter les données ou créer un système de tracking séparé
