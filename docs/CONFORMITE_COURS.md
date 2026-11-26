# Conformité au cours

Les chemins sont relatifs à la racine de StudyBloom. Pour le périmètre des tests exécutés, voir le [rapport de tests](RAPPORT_TESTS.md).

| Chapitre | Notion obligatoire | Fonctionnalité | Fichier exact | Classe ou méthode | Vérification |
|---|---|---|---|---|---|
| 1 | CLI et standalone | Projet et composant racine | angular.json, src/app/app.component.ts | AppComponent | Build |
| 1 | Interfaces, unions et propriétés optionnelles | Contrats des entités | src/app/models/study.ts | User, Subject, Category, Task, Role, Priority, TaskStatus | Compilation TypeScript |
| 1 | Mode strict et aucun any explicite | Vérification des types et templates | tsconfig.json | strict, strictTemplates | Build et recherche dans src |
| 2 | Interpolation, propriété, événement et liaison bidirectionnelle | Tâches et recherche | src/app/pages/tasks/tasks-page.ts | TasksPage | Compilation des templates |
| 2 | ngOnInit | Chargement initial | src/app/pages/dashboard/dashboard-page.ts | DashboardPage.ngOnInit | Compilation |
| 2 | @if, @for, @empty, @switch | Affichage des listes et sections | src/app/pages/admin/admin-page.ts | AdminPage | Compilation des templates |
| 2 | Classes et styles dynamiques | Accent matière et priorité de tâche | src/app/pages/subjects/subjects-page.ts, src/app/components/task-card/task-card.ts | SubjectsPage, TaskCardComponent | Compilation des templates |
| 2 | DatePipe, UpperCasePipe et PercentPipe | Affichage du tableau de bord | src/app/pages/dashboard/dashboard-page.ts | DashboardPage | Compilation des templates |
| 2 | Pipe personnalisé | Échéance relative | src/app/pipes/deadline.ts | DeadlinePipe.transform | Test Angular dédié |
| 3 | input() et output() | Carte de tâche | src/app/components/task-card/task-card.ts | TaskCardComponent | Compilation des templates |
| 3 | model() | Champ de recherche | src/app/components/filter-bar/filter-bar.ts | FilterBarComponent.value | Compilation du binding |
| 3 | signal() et computed() | État, compteurs et jardin | src/app/services/api.ts, src/app/components/bloom-garden/bloom-garden.ts | TaskService, BloomGardenComponent | Tests des compteurs et seuils |
| 3 | effect() | Titre de l’onglet | src/app/pages/dashboard/dashboard-page.ts | DashboardPage.constructor | Compilation |
| 4 | Services injectés et état partagé | Collections et session | src/app/services/api.ts, src/app/services/auth.ts | Collection, AuthService | Tests Angular avec HttpTestingController |
| 4 | Routes paramétrées, routerLink et lazy loading | Fiche et éditeur de tâche | src/app/app.routes.ts, src/app/components/task-card/task-card.ts | routes, TaskCardComponent | Build et chargement différé |
| 4 | Guard | Navigation authentifiée | src/app/guards/session.ts | authGuard | Test de redirection |
| 5 | JSON Server, HttpClient typé et CRUD complet | Tâches, matières, catégories | src/app/services/api.ts, tests/api-smoke.cjs | Collection | Test REST réel |
| 5 | catchError, debounceTime et switchMap | Recherche réactive et erreurs | src/app/pages/tasks/tasks-page.ts | TasksPage.ngOnInit | Test de requête et compilation |
| 5 et 6 | Interceptor et jeton simulé | En-tête Authorization | src/app/interceptors/token.ts, src/app/services/auth.ts | tokenInterceptor, AuthService.login | Test HTTP Angular |
| 6 | Formulaires réactifs, validateurs natifs et erreurs | Connexion et édition d’une tâche | src/app/pages/auth/auth-page.ts, src/app/pages/tasks/task-editor.ts | AuthPage.form, TaskEditor.form | Compilation des templates et test de connexion |
| 6 | Validateur personnalisé | Contrôle d’une échéance | src/app/validators/deadline.ts | futureDeadlineValidator | Test des échéances passées et futures |
| 6 | Guard par rôle | Séparation des espaces | src/app/guards/session.ts | roleGuard, studentGuard | Compilation et règles de navigation |
| Final | Entités liées, deux rôles, au moins dix enregistrements | Données de démo | db.seed.json | users, categories, subjects, tasks | Test REST, 24 tâches |
| Final | Recherche, filtres et détail | Parcours des tâches | src/app/pages/tasks/tasks-page.ts, src/app/pages/tasks/task-editor.ts | TasksPage, TaskEditor | Test de requête et compilation |
| Final | États utilisateur | Chargement, erreur, nouvelle tentative, succès | src/app/pages/page-state.ts, src/app/components/toast/toast.ts | PageState, StateComponent, ToastComponent | Compilation |
| Final | Compilation sans erreur | Build de production | angular.json, tsconfig.json | build, strict, strictTemplates | Réussi avec `npm run build` |
