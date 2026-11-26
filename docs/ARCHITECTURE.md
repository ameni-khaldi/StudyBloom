# Architecture

Les pages standalone sont chargées à la demande par le routeur. Elles utilisent les services par `inject()`. Les appels HTTP sont typés dans `services/api.ts`. Les pages observent les Signals des services et dérivent les agrégats avec `computed()`.

```mermaid
flowchart LR
    UI[Pages Angular] --> Service[Services et Signals]
    Service --> HTTP[HttpClient et interceptor]
    HTTP --> REST[JSON Server]
    REST --> DB[db.json]
```

`StudyService.load()` charge les matières du compte, puis les tâches de ces matières. Le paramètre `title_like` de JSON Server 0.17.4 reçoit une expression régulière échappée pour rechercher un titre littéral. Les identifiants de matière sont transmis comme paramètres répétés. `switchMap` remplace la requête précédente et `takeUntilDestroyed` termine les abonnements avec la page.

Le tableau de bord emploie `effect()` pour synchroniser le titre de l’onglet, une écriture qui concerne le navigateur. Les compteurs et les étapes du jardin sont calculés par `computed()`.
