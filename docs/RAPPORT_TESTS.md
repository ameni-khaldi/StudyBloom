# Rapport de tests

Tests sous Windows avec Node.js 20.12.2, npm 10.5.0, Angular CLI 19.2.27, Angular 19.2.25 et JSON Server 0.17.4.

| Commande | Périmètre | Résultat |
|---|---|---|
| `npm start` et `npm run api` | Réponse de la page sur 4200 et lecture des 24 tâches sur 3000 | Réussi |
| `npm run build` | Compilation de production et vérification stricte des templates | Réussi |
| `npm test -- --watch=false --browsers=ChromeHeadless` | Tests Jasmine/Karma sur le guard visiteur, la connexion, les identifiants invalides et comptes désactivés, le Bearer, les paramètres HTTP, les Signals, le pipe, le validateur et le jardin | 7 sur 7 |
| `npm run test:api` | Requêtes réelles sur JSON Server, recherche par titre avec caractères spéciaux, opérations CRUD et vérification du fichier de persistance | Réussi |
| `npm run test:browser` | Application compilée dans Chrome Headless avec JSON Server et une copie temporaire de la base | Réussi |

Le scénario navigateur couvre les deux rôles, la redirection depuis chaque espace protégé, le refus d’accès à une tâche appartenant à un autre compte, la recherche et les sorties de la carte de tâche, le changement de statut, les formulaires CRUD, le calendrier, les statistiques, la largeur mobile et la reprise après erreur API.

Les données de test sont isolées du fichier `db.json` de démonstration. Le test navigateur utilise le port 3000 et un port web éphémère. Le test API utilise un port éphémère.
