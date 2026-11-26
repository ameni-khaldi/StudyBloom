# Modèle de données

| Collection | Clé | Relations | Champs facultatifs |
|---|---|---|---|
| users | id | Parent de subjects.userId | avatar |
| categories | id | Parent de subjects.categoryId | description |
| subjects | id | userId et categoryId | description |
| tasks | id | subjectId | description, completedAt |

Les clés sont des chaînes générées par `crypto.randomUUID()` lors de la création. Les échéances sont des dates locales sous la forme AAAA-MM-JJ. Les dates de création et de réalisation acceptent les chaînes ISO. Les unions TypeScript énumèrent les rôles, statuts et priorités.

Les données initiales contiennent 4 comptes, 5 catégories, 8 matières et 24 tâches. La suppression d’une matière supprime ses tâches avant de retirer la matière. Les opérations sont successives. En cas de panne intermédiaire, une nouvelle tentative recharge les tâches restantes avant de reprendre.
