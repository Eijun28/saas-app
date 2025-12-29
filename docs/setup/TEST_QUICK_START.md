# 🚀 Guide de Test Rapide

## Démarrage rapide

### 1. Lancer l'application
```bash
npm run dev
```

### 2. Ouvrir la page de test
Naviguer vers : **http://localhost:3000/trouver-prestataires**

---

## Tests manuels rapides

### ✅ Test 1 : Message d'accueil
1. La page s'ouvre
2. Un message d'accueil de l'IA apparaît automatiquement
3. **Vérifier** : Le message contient des exemples de questions

### ✅ Test 2 : Nouvelle recherche
1. Taper : `"Je cherche un photographe"`
2. Cliquer sur "Envoyer" ou appuyer sur Entrée
3. **Vérifier** : L'IA pose des questions pour collecter les infos

### ✅ Test 3 : Recherche complète
1. Taper : `"Je cherche un traiteur halal pour 200 personnes, mariage le 20 juillet à Lyon, budget 5000€, on est franco-marocain"`
2. Cliquer sur "Envoyer"
3. **Vérifier** :
   - Message "Recherche en cours..." apparaît
   - Des prestataires s'affichent avec des scores de compatibilité
   - Le premier prestataire a le badge "Notre coup de cœur"

### ✅ Test 4 : Affichage des résultats
**Vérifier pour chaque prestataire** :
- [ ] Badge de rang (1, 2, 3...)
- [ ] Nom du prestataire
- [ ] Score de compatibilité (en %)
- [ ] Raison de sélection
- [ ] Tags culturels
- [ ] Prix
- [ ] Bouton "Voir le profil complet"

### ✅ Test 5 : Favoris
1. Cliquer sur l'icône ❤️ d'un prestataire
2. **Vérifier** : L'icône devient rouge et remplie

### ✅ Test 6 : Interface responsive
1. Réduire la fenêtre du navigateur
2. **Vérifier** : L'interface s'adapte correctement

---

## Tests API (optionnel)

### Avec PowerShell (Windows)
```powershell
.\scripts\test-api.ps1
```

### Avec Bash (Linux/Mac)
```bash
chmod +x scripts/test-api.sh
./scripts/test-api.sh
```

### Test du moteur de compatibilité
```bash
npm run test:compatibility
```

---

## Vérifications visuelles

### Couleurs
- [ ] Violet principal : `#823F91`
- [ ] Violet clair : `#E8D4EF`
- [ ] Texte : `#0B0E12` (Dark Navy)
- [ ] Texte secondaire : `#6B7280`

### Police
- [ ] Police Inter utilisée partout
- [ ] Pas de Poppins visible

### Cohérence
- [ ] Tous les boutons ont le même style
- [ ] Tous les messages ont le même style
- [ ] Les cartes de prestataires sont cohérentes

---

## Problèmes courants

### ❌ Erreur : "Module not found"
**Solution** : Redémarrer le serveur de développement
```bash
# Arrêter (Ctrl+C) puis relancer
npm run dev
```

### ❌ Erreur : "OPENAI_API_KEY is not defined"
**Solution** : Vérifier le fichier `.env.local`
```env
OPENAI_API_KEY=sk-...
```

### ❌ Aucun prestataire trouvé
**Solution** : Vérifier que la table `prestataire_profiles` contient des données dans Supabase

### ❌ Les couleurs ne s'affichent pas correctement
**Solution** : Vider le cache du navigateur (Ctrl+Shift+R)

---

## Checklist finale

Avant de considérer les tests comme réussis :

- [ ] La page s'affiche sans erreur
- [ ] Le chat fonctionne (envoi/réception de messages)
- [ ] Les prestataires s'affichent avec leurs scores
- [ ] Les couleurs sont cohérentes
- [ ] La police Inter est utilisée
- [ ] L'interface est responsive
- [ ] Aucune erreur dans la console (F12)

---

## Support

Pour plus de détails, voir `GUIDE_TEST.md`

