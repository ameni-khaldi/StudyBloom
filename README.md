# StudyBloom

Application universitaire de suivi des études pour Programmation Web Avancée 2, année 2026–2027. Soutenance le 23 janvier 2027.

## Démarrage local

Depuis ce dossier, avec Node.js 20.12 et npm 10 ou une version compatible avec Angular 19.2, lancez `npm ci`. Démarrez ensuite les deux terminaux suivants.

```powershell
npm run api
```

```powershell
npm start
```

Ouvrez http://localhost:4200. Vous pouvez aussi lancer Angular avec `npx ng serve`. L’API écoute sur http://127.0.0.1:3000.

| Rôle | Adresse | Mot de passe fictif |
|---|---|---|
| Étudiant | lina@studybloom.test | Bloom2027! |
| Étudiant | yasmine@studybloom.test | Bloom2027! |
| Étudiant | adam@studybloom.test | Bloom2027! |
| Administrateur | admin@studybloom.test | Bloom2027! |

JSON Server conserve les écritures dans `db.json`. Pour réinitialiser le jeu de démonstration, arrêtez l’API puis exécutez `Copy-Item db.seed.json db.json`.

## Vérifications

Exécutez `npm run build`, `npm test -- --watch=false --browsers=ChromeHeadless` et `npm run test:api`. Après la compilation, lancez `npm run test:browser` avec le port 3000 libre. Définissez `CHROME_BIN` si Chrome se trouve dans un emplacement personnalisé. Consultez le [rapport](docs/RAPPORT_TESTS.md) et la [grille de conformité](docs/CONFORMITE_COURS.md).

L’authentification est une simulation pédagogique. Le JWT est non signé. Les guards et le filtrage par propriétaire s’appliquent dans Angular. JSON Server expose les collections et ne contrôle ni le JWT ni les permissions, y compris l’intégrité référentielle côté serveur. Utilisez uniquement des données fictives et gardez l’API en local.
