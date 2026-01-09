# 🔐 Guide de configuration des comptes Admin

## 📝 Création des comptes admin

Il y a **deux façons** de créer les comptes admin :

### Option 1 : Inscription normale (Recommandé) ✅

1. **Allez sur** `/sign-up`
2. **Remplissez le formulaire** avec :
   - Email : `karim.reziouk@kina-ia.xyz` ou `contact@nuply.fr`
   - Mot de passe : **Choisissez un mot de passe fort**
   - Rôle : Peu importe (couple ou prestataire)
3. **Confirmez votre email** (si la confirmation est activée)
4. **C'est tout !** Vous pouvez maintenant accéder à `/admin/early-adopters-alerts`

**Avantages** :
- ✅ Simple et rapide
- ✅ Pas besoin d'accès à Supabase
- ✅ Le compte fonctionne normalement pour le reste de l'app

### Option 2 : Création directe dans Supabase (Avancé)

Si vous avez accès au dashboard Supabase :

1. **Allez dans** Supabase Dashboard → Authentication → Users
2. **Cliquez sur** "Add user" → "Create new user"
3. **Remplissez** :
   - Email : `karim.reziouk@kina-ia.xyz` ou `contact@nuply.fr`
   - Password : **Choisissez un mot de passe fort**
   - Auto Confirm User : ✅ (pour éviter la confirmation email)
4. **Créez le profil** dans la table `profiles` si nécessaire

## 🔑 Gestion des mots de passe

### Changer le mot de passe

**Via l'application** :
1. Connectez-vous avec votre compte admin
2. Allez dans les paramètres de profil
3. Changez votre mot de passe

**Via Supabase** :
1. Dashboard Supabase → Authentication → Users
2. Trouvez l'utilisateur
3. Cliquez sur "Reset Password" ou modifiez directement

### Réinitialiser un mot de passe oublié

1. Allez sur `/sign-in`
2. Cliquez sur "Mot de passe oublié ?"
3. Entrez votre email admin
4. Suivez les instructions dans l'email reçu

## 🛡️ Bonnes pratiques de sécurité

### Mots de passe forts

Utilisez des mots de passe qui :
- ✅ Font au moins 12 caractères
- ✅ Contiennent des majuscules, minuscules, chiffres et symboles
- ✅ Ne sont pas réutilisés ailleurs
- ✅ Sont uniques pour chaque compte admin

**Exemple de mot de passe fort** :
```
Nuply@Admin2024!Secure
```

### Recommandations supplémentaires

1. **Ne partagez pas** les mots de passe par email ou chat
2. **Utilisez un gestionnaire de mots de passe** (1Password, LastPass, etc.)
3. **Activez la 2FA** si disponible dans Supabase
4. **Changez régulièrement** les mots de passe (tous les 3-6 mois)

## 📋 Checklist de configuration

- [ ] Les deux emails sont configurés dans `lib/config/admin.ts`
- [ ] Les deux comptes sont créés (via `/sign-up` ou Supabase)
- [ ] Les mots de passe sont forts et sécurisés
- [ ] Les comptes peuvent se connecter sur `/sign-in`
- [ ] Les comptes peuvent accéder à `/admin/early-adopters-alerts`
- [ ] Les mots de passe sont sauvegardés de manière sécurisée

## 🐛 Dépannage

### "Accès refusé" même avec un email autorisé

1. Vérifiez que l'email dans `lib/config/admin.ts` correspond exactement
2. Vérifiez que vous êtes bien connecté avec ce compte
3. Déconnectez-vous et reconnectez-vous

### Impossible de se connecter

1. Vérifiez que le compte existe bien dans Supabase
2. Vérifiez que l'email est confirmé (si confirmation activée)
3. Utilisez "Mot de passe oublié" pour réinitialiser

### Le compte admin n'a pas accès

1. Vérifiez que l'email est bien dans `ADMIN_EMAILS`
2. Redémarrez le serveur de développement si nécessaire
3. Vérifiez les logs du serveur pour d'éventuelles erreurs
