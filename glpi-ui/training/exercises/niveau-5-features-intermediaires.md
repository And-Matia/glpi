# Niveau 5 — Fonctionnalités intermédiaires (multi-couches)

Une feature complète de bout en bout : service + RxJS + route + UI + état + cas limites.
**Chronomètre-toi : cible ≤ 45 min/exercice.**

---

## Exercice 5.1 — Fiche détaillée d'un élément

**Contexte métier.** Depuis la liste store, cliquer sur un élément ouvre une **fiche** qui
montre tous ses champs **et** les tickets qui le référencent.

**Objectifs.**
1. Route `/front-office/items/:type/:id` (le type est nécessaire car l'endpoint dépend du type).
2. Composant `item-detail` qui charge l'élément (`ItemV2Service.getById(id, type)`).
3. Afficher les champs dans des `app-card` + `app-badge` pour le statut.
4. (Bonus) Lister les tickets liés via `Item_Ticket`.

**Contraintes.** v2 pour lire l'élément ; OnPush + signals ; tokens ; gérer loading/erreur.

**Fichiers.** `app.routes.ts`, `features/front-office/items/item-detail/`, `item-list`
(rendre les lignes cliquables), éventuellement un service pour les tickets liés.

**Compétences.** Paramètres de route multiples, `getById`, UI fiche, navigation.

<details><summary>Solution (squelette)</summary>

Route :
```ts
{ path: 'items/:type/:id', loadComponent: () => import('.../item-detail/item-detail.component').then(m => m.ItemDetailComponent) }
```
Composant :
```ts
private route = inject(ActivatedRoute);
private itemService = inject(ItemV2Service);
readonly item = signal<Item | null>(null);
readonly loading = signal(true); readonly error = signal('');
ngOnInit() {
  const type = this.route.snapshot.paramMap.get('type') as ItemType;
  const id   = Number(this.route.snapshot.paramMap.get('id'));
  this.itemService.getById(id, type).subscribe({
    next: i => { this.item.set(i); this.loading.set(false); },
    error: e => { this.error.set('Élément introuvable'); this.loading.set(false); },
  });
}
```
Liste cliquable : ajouter une colonne action ou un `(click)` qui
`router.navigate(['/front-office/items', item.item_type, item.id])`.

Bonus tickets liés : `GET /api.php/v1/Item_Ticket?searchText[items_id]=<id>&searchText[itemtype]=<type>`
puis pour chaque `tickets_id`, `TicketV1Service.getById` (via `forkJoin`).
</details>

**Pièges.** Oublier le `type` dans la route (l'endpoint v2 en a besoin). Ne pas gérer
l'élément introuvable. Mapper le statut comme texte brut au lieu d'un `app-badge`.

**Critères de validation.** Navigation liste→fiche OK ; tous les champs visibles ; statut en
badge ; états loading/erreur ; build sans warning.

---

## Exercice 5.2 — Modifier le statut d'un ticket depuis la fiche

**Contexte métier.** Sur la fiche ticket (back-office), permettre de **changer le statut**
(New → Solved…) et enregistrer.

**Objectifs.**
1. Un `app-select` des statuts (libellés via `GLPI_TICKET_STATUS`).
2. Un bouton « Enregistrer » qui appelle `TicketV1Service.update(id, { status })`.
3. Toast de succès/erreur ; rafraîchir l'affichage.

**Contraintes.** v1 (écriture) ; pas de mapping en dur ; gérer l'erreur.

**Fichiers.** `ticket-detail.component.ts/.html`, `ticket-v1.service.ts` (a déjà `update`),
`glpi.constants.ts` (ajouter `TICKET_STATUS_OPTIONS` dérivé si utile).

**Compétences.** Écriture v1, formulaire, options dérivées, toasts, re-chargement.

<details><summary>Solution (extrait)</summary>

Constante (option) :
```ts
export const TICKET_STATUS_OPTIONS: SelectOption[] =
  Object.entries(GLPI_TICKET_STATUS).map(([code, label]) => ({ value: Number(code), label }));
```
Composant :
```ts
readonly newStatus = signal<number | null>(null);
save() {
  const s = this.newStatus(); const id = this.ticket()?.id;
  if (!s || !id) return;
  this.ticketService.update(id, { status: s }).subscribe({
    next: () => { this.toast.success('Statut mis à jour'); this.reload(id); },
    error: () => this.toast.error('Échec de la mise à jour'),
  });
}
```
HTML : `<app-select [options]="statusOptions" [(value)]="newStatus" />` +
`<app-button (clicked)="save()">Enregistrer</app-button>`.
</details>

**Pièges.** `update` attend `{ input: {...} }` — c'est le service qui l'enveloppe, tu passes
`{ status }`. Oublier de recharger après update. Type `status` (number) vs string.

**Critères de validation.** Le statut change dans GLPI (vérifiable en rechargeant), toast,
build OK.

---

## Exercice 5.3 — Pagination de la liste store

**Contexte métier.** La liste peut être longue ; ajouter une pagination cliente.

**Objectifs.** Utiliser `app-pagination` (`total`, `pageSize`, `[(page)]`) pour n'afficher
qu'une tranche des `filteredItems()`.

**Fichiers.** `item-list.component.ts/.html`.

**Compétences.** `computed` dépendant de plusieurs signaux, composant Pagination.

<details><summary>Solution (extrait)</summary>

```ts
readonly page = signal(1);
readonly pageSize = 10;
readonly pagedRows = computed(() => {
  const start = (this.page() - 1) * this.pageSize;
  return this.rows().slice(start, start + this.pageSize);
});
// réinitialiser la page quand un filtre change : effect(() => { this.searchText(); this.page.set(1); });
```
HTML : table sur `pagedRows()` + `<app-pagination [total]="filteredItems().length" [pageSize]="pageSize" [(page)]="page" />`.
</details>

**Pièges.** Ne pas remettre `page` à 1 quand on filtre → page vide. `slice` sur la mauvaise
source (filtrée, pas brute).

**Critères de validation.** Navigation entre pages OK ; le filtre remet à la page 1 ; total
correct.

---

## Exercice 5.4 — Import d'une nouvelle entité : les « contrats » (tickets récurrents fictifs)

**Contexte métier.** On veut importer un 5ᵉ CSV `Contracts` : `Name, Begin_Date, Duration_Months`.

**Objectifs.**
1. Un `ContractImportService` (modèle de `item-import`) qui crée des `/Contract` GLPI.
2. Ajouter une 5ᵉ étape dans `import.component` (label, icône, accept `.csv`, service).

**Contraintes.** Réutiliser `parseCsvText`, `ImportStats`, le pattern `concatMap` + erreurs
par ligne.

**Fichiers.** `core/services/import/contract-import.service.ts`, `import.component.ts`
(tableaux `STEP_LABELS`, `STEP_ICONS`, `ACCEPT`, `getService`, `steps` initial).

**Compétences.** Reproduire le pattern d'import complet, brancher une étape dans l'UI.

<details><summary>Solution (squelette)</summary>

Service (même structure que `item-import`) : `importFile` → `parseFile` → `importRows`
(`from(rows).pipe(concatMap(importRow), toArray(), map(()=>stats))`). `importRow` :
```ts
this.http.post('/Contract', { input: { name: row.name, begin_date: toGlpiDate(row.begin), duration: row.months } });
```
Composant : ajouter une 5ᵉ entrée à `STEP_LABELS`/`STEP_ICONS`/`ACCEPT`, un 5ᵉ `emptyStep()`,
et `case 4: return this.contractImport;` dans `getService`.
</details>

**Pièges.** Oublier d'agrandir le tableau `steps` initial (4 → 5). Mauvais index dans
`getService`. Champs GLPI `/Contract` (vérifier les noms réels si tu testes en vrai).

**Critères de validation.** L'étape 5 apparaît, valide un CSV, importe ligne par ligne, agrège
les erreurs ; build OK.
