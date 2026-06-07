# 🏋️ Parcours d'exercices

7 niveaux, du débutant à la simulation d'examen. **Ne saute pas de niveau.** Chaque exercice
suit le même format pour t'entraîner à raisonner comme à l'examen :

> **Contexte métier** · **Objectifs** · **Contraintes** · **Fichiers à modifier** ·
> **Compétences évaluées** · **Solution détaillée** · **Pièges courants** · **Critères de validation**

## Progression

| Niveau | Thème | Objectif | Durée indicative |
|--------|-------|----------|------------------|
| 1 | **Compréhension du code** | savoir lire et tracer l'existant | 1 h |
| 2 | **RxJS ciblé** | maîtriser les opérateurs | 1 h 30 |
| 3 | **Modifications** | changer une feature existante | 1 h 30 |
| 4 | **Petites features** | ajouter du neuf, bien intégré | 2 h |
| 5 | **Features intermédiaires** | une feature complète multi-couches | 2 h |
| 6 | **Features complexes** | plusieurs couches + cas limites | 3 h |
| 7 | **Simulations d'examen** | conditions réelles, chronométré | 2 × 2 h |
| 8 | **CRUD complet** | créer/éditer/supprimer (élément, user, ticket…) | 2 h 30 |

> Le **niveau 8** couvre toutes les écritures (création d'élément, d'utilisateur, édition, suppression,
> mini-CRUD en modale). Fais-le après le 5 ; il s'appuie sur `../docs/13-recettes-features.md` et le
> dossier `../ui/`.

## Méthode (rappel)

1. Lis le contexte, **reformule** le besoin.
2. **Conçois** (quels fichiers, quelles couches, quel flux ?) AVANT de coder.
3. Implémente **sans** la solution.
4. Vérifie avec les **critères de validation** + `npm run build`.
5. Lis la **solution** et les **pièges**.
6. Échec ? refais l'exercice 24 h plus tard.

## Règle du chronomètre

- Niveaux 1–4 : prends le temps de comprendre.
- Niveaux 5–7 : **chronomètre-toi**. Cible examen : feature intermédiaire ≤ 45 min,
  feature complexe ≤ 120 min, 2–3 features dans une fenêtre de 2 h.

## Pré-requis

Avoir lu les `docs/` (au minimum 02-architecture, 04-rxjs, 05-services, 09-workflow).
Avoir l'app qui tourne (`npm start`) avec GLPI accessible.

Bon entraînement 💪
