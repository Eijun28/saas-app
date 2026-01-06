# 🚀 Configuration de Resend pour l'envoi d'emails

## ✅ Étape 1 : Installation (DÉJÀ FAIT)
```bash
npm install resend
```
✅ **Résultat** : `added 17 packages` - Installation réussie !

## 📝 Étape 2 : Créer un compte Resend

1. Allez sur **https://resend.com**
2. Cliquez sur **"Sign Up"** (gratuit jusqu'à 3 000 emails/mois)
3. Créez votre compte avec votre email

## 🔑 Étape 3 : Obtenir votre clé API

1. Une fois connecté, allez dans **API Keys** (menu de gauche)
2. Cliquez sur **"Create API Key"**
3. Donnez un nom (ex: "Nuply Production" ou "Nuply Development")
4. **Copiez la clé** (elle commence par `re_` et ressemble à `re_AbCdEf123456...`)
   - ⚠️ **Important** : Vous ne pourrez plus voir cette clé après, alors copiez-la maintenant !

## 📧 Étape 4 : Vérifier votre domaine (pour la production)

### Pour le développement (localhost) :
- Vous pouvez utiliser l'email par défaut de Resend : `onboarding@resend.dev`
- Ou ajouter votre propre domaine plus tard

### Pour la production :
1. Allez dans **Domains** dans le dashboard Resend
2. Ajoutez votre domaine (ex: `nuply.fr`)
3. Suivez les instructions pour vérifier votre domaine (ajout de records DNS)

## ⚙️ Étape 5 : Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet (`C:\Users\karim\Desktop\nuply\.env.local`) avec ce contenu :

```env
# ============================================
# EMAIL (RESEND)
# ============================================
RESEND_API_KEY=re_VOTRE_CLE_API_ICI
RESEND_FROM_EMAIL=onboarding@resend.dev

# ============================================
# APPLICATION
# ============================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ============================================
# SUPABASE (si pas déjà configuré)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Remplacez** :
- `re_VOTRE_CLE_API_ICI` par votre vraie clé API Resend
- `onboarding@resend.dev` par votre email vérifié (en production)

## 🧪 Étape 6 : Tester l'envoi d'email

1. Démarrez votre serveur de développement :
   ```bash
   npm run dev
   ```

2. Testez l'invitation d'un collaborateur :
   - Allez sur `/couple/collaborateurs`
   - Cliquez sur "Inviter un collaborateur"
   - Entrez un email de test
   - L'email devrait être envoyé via Resend

## 🔍 Vérification

Pour vérifier que tout fonctionne :

1. **Vérifiez les logs** : Dans la console du serveur Next.js, vous ne devriez pas voir d'erreur Resend
2. **Vérifiez le dashboard Resend** : Allez dans "Emails" pour voir les emails envoyés
3. **Vérifiez votre boîte mail** : L'email d'invitation devrait arriver

## ⚠️ En cas d'erreur

Si vous voyez `RESEND_API_KEY non configurée` dans les logs :
- Vérifiez que `.env.local` existe bien à la racine du projet
- Vérifiez que la clé API est correcte (commence par `re_`)
- Redémarrez le serveur Next.js après avoir modifié `.env.local`

## 📚 Documentation

- **Resend Docs** : https://resend.com/docs
- **API Reference** : https://resend.com/docs/api-reference/emails/send-email

