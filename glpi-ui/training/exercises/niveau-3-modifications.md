# Niveau 3 — Modifications de fonctionnalités existantes

On touche au vrai code. Après chaque exercice : `npm run build` doit passer, et tu vérifies
dans le navigateur.

---

## Exercice 3.1 — Ajouter une colonne « Priorité » à la liste des tickets

**Contexte métier.** Les admins veulent voir la priorité directement dans la liste des tickets.

**Objectifs.** Ajouter une colonne « Priorité » affichée avec son libellé FR.

**Contraintes.** Réutiliser les constantes existantes ; pas de mapping dupliqué.

**Fichiers.** `features/back-office/tickets/ticket-list/ticket-list.component.ts` (+ `.html` si besoin).

**Compétences.** Tables, constantes, computed/subscribe.

<details><summary>Solution</summary>

Dans `columns`, ajouter `{ key: 'priority', label: 'Priorité', sortable: true, width: '110px' }`
(déjà présent dans certaines versions — sinon l'ajouter). Dans la préparation des `rows`,
mapper `priority: GLPI_TICKET_PRIORITY[t.priority] ?? t.priority`. Importer
`GLPI_TICKET_PRIORITY` depuis `@app/core/constants/glpi.constants`.
</details>

**Pièges.** Afficher le **code** brut au lieu du libellé ; oublier d'importer la constante.

**Validation.** La colonne s'affiche avec « Medium/High… », tri OK, build OK.

---

## Exercice 3.2 — Filtrer la liste store par fabricant

**Contexte métier.** Sur la liste des éléments (front-office), on veut un filtre « Fabricant ».

**Objectifs.** Ajouter un `app-select` « Fabricant » dont les options sont les fabricants
**présents** dans les données chargées, et filtrer la liste en conséquence.

**Contraintes.** Options dérivées des données (pas en dur) ; tout en `computed`.

**Fichiers.** `item-list.component.ts` (+ `.html`).

**Compétences.** `computed`, `signal`, `app-select`, filtrage.

<details><summary>Solution</summary>

```ts
readonly filterManufacturer = signal('');

readonly manufacturerOptions = computed<SelectOption[]>(() => {
  const set = new Set(this.items().map(i => i.manufacturer).filter(Boolean));
  return [{ value: '', label: 'Tous les fabricants' }, ...[...set].sort().map(m => ({ value: m, label: m }))];
});

readonly filteredItems = computed(() => {
  const text = this.searchText().toLowerCase().trim();
  const type = this.filterType(); const status = this.filterStatus(); const manu = this.filterManufacturer();
  return this.items().filter(i =>
    (!text || [i.name, i.user, i.location].some(v => v.toLowerCase().includes(text)))
    && (!type || i.item_type === type)
    && (!status || i.status === status)
    && (!manu || i.manufacturer === manu));
});
```
HTML : `<app-select label="Fabricant" [options]="manufacturerOptions()" [(value)]="filterManufacturer" />`.
Penser à importer `SelectOption`.
</details>

**Pièges.** Options en dur ; oublier d'ajouter la condition au `filteredItems`.

**Validation.** Le filtre apparaît, contient les vrais fabricants, filtre correctement.

---

## Exercice 3.3 — Afficher la description du ticket dans la liste (tronquée)

**Contexte.** Aperçu rapide du contenu.

**Objectifs.** Ajouter une colonne « Aperçu » montrant les 60 premiers caractères de la
description.

**Fichiers.** `ticket-list.component.ts`, `ticket-v1.service.ts` (vérifier que `description`
est mappée — oui : `mapTicket` mappe `content → description`).

<details><summary>Solution</summary>

Colonne `{ key: 'apercu', label: 'Aperçu' }` ; ligne `apercu: (t.description ?? '').slice(0, 60) + (t.description.length > 60 ? '…' : '')`.
</details>

**Pièges.** `description` peut être vide → garder le `?? ''`.

**Validation.** Aperçu tronqué affiché, pas d'erreur sur description vide.

---

## Exercice 3.4 — Ajouter le champ « date » dans la fiche ticket et la formater

**Contexte.** La fiche montre `date heure` brute.

**Objectifs.** Afficher la date au format `JJ/MM/AAAA à HHhMM`.

**Fichiers.** `ticket-detail.component.ts` (+ `.html`).

<details><summary>Solution</summary>

Le modèle `Ticket` a `date` (`YYYY-MM-DD`) et `heure` (`HH:mm`). Ajouter une méthode :
```ts
formatDate(d: string, h: string): string {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y} à ${h.replace(':', 'h')}`;
}
```
Template : `{{ formatDate(t.date, t.heure) }}`.
</details>

**Pièges.** Date vide ; supposer un format différent de celui mappé par `mapTicket`.

**Validation.** `2026-06-03` + `13:45` → `03/06/2026 à 13h45`.

---

## Exercice 3.5 — Rendre le bouton « Lancer l'import » désactivé tant qu'aucune étape n'est prête

**Contexte.** Éviter les clics inutiles.

**Objectifs.** Vérifier/renforcer le `computed canImport` : le bouton n'est actif que si au
moins une étape est `validated` et qu'aucun import n'est en cours.

**Fichiers.** `import.component.ts`.

<details><summary>Solution</summary>

C'est déjà le cas :
```ts
readonly isProcessing = computed(() => this.steps().some(s => s.status === 'validating' || s.status === 'importing'));
readonly canImport    = computed(() => this.steps().some(s => s.status === 'validated') && !this.isProcessing());
```
Vérifie que le template lie `[disabled]="!canImport() || isProcessing()"` et `[loading]="isProcessing()"`.
</details>

**Pièges.** Confondre `validated` (prêt) et `done` (déjà importé).

**Validation.** Bouton grisé sans fichier validé ; actif dès qu'une étape est validée ; grisé
pendant l'import.

---

## Exercice 3.6 — Ajouter un toast de succès à la fin de l'import

**Contexte.** Aujourd'hui l'import met à jour les cartes mais ne notifie pas globalement.

**Objectifs.** Afficher un `toast.success('Import terminé : X éléments, Y tickets…')` quand
toutes les étapes sont finies.

**Fichiers.** `import.component.ts`.

**Compétences.** `ToastService`, agréger des résultats, `subscribe({complete})`.

<details><summary>Solution</summary>

Injecter `private readonly toast = inject(ToastService)`. Dans `startImport`, sur la
complétion :
```ts
from(tasks).pipe(concatMap(t$ => t$), toArray()).subscribe({
  complete: () => {
    const done = this.steps().filter(s => s.status === 'done').length;
    this.toast.success(`Import terminé (${done} étape(s) réussie(s)).`);
  },
});
```
(Optionnel : sommer `result.success` par étape pour un message détaillé.)
</details>

**Pièges.** Mettre le toast dans `next` (déclenché par étape) au lieu de `complete` (fin
globale). Ne pas oublier `<app-toast />` dans `app.html` (déjà présent).

**Validation.** Un seul toast à la toute fin ; build OK.
