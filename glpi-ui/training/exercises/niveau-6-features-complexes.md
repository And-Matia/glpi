# Niveau 6 — Fonctionnalités complexes (multi-couches + cas limites)

Features ambitieuses touchant plusieurs couches, avec dépendances entre données et gestion
fine des erreurs/ordre. **Cible ≤ 90–120 min/exercice.** Conçois d'abord sur papier.

---

## Exercice 6.1 — Édition complète d'un élément (formulaire + dropdowns)

**Contexte métier.** Depuis la fiche d'un élément, permettre de **modifier** nom, statut,
localisation, fabricant, modèle, utilisateur, et enregistrer dans GLPI.

**Objectifs.**
1. Formulaire pré-rempli avec les valeurs actuelles.
2. Les champs statut/localisation/fabricant/modèle sont des `app-select` dont les options
   sont les valeurs existantes dans GLPI **+** possibilité de saisir une nouvelle valeur
   (find-or-create via `GlpiDropdownService`).
3. À l'enregistrement : résoudre les dropdowns (ids), puis `ItemV1Service.update(id, input, type)`.
4. Toast + retour à la fiche.

**Contraintes.** Réutiliser `GlpiDropdownService.resolve` ; écriture v1 ; `forkJoin` pour
résoudre les dropdowns en parallèle puis `switchMap` vers l'`update`.

**Fichiers.** nouveau `item-edit` (ou mode édition dans `item-detail`), `item-v1.service.ts`,
`dropdown.service.ts` (déjà prêt), `glpi.constants.ts`.

**Compétences.** Formulaire complexe, find-or-create, `forkJoin`+`switchMap`, mapping
champ modèle dynamique (`assetType(type).modelField`).

<details><summary>Solution (cœur)</summary>

```ts
save() {
  const cfg = assetType(this.type)!;
  forkJoin({
    states_id:        this.dropdown.resolve('State', this.status()),
    locations_id:     this.dropdown.resolve('Location', this.location()),
    manufacturers_id: this.dropdown.resolve('Manufacturer', this.manufacturer()),
    model_id:         this.dropdown.resolve(cfg.modelType, this.model()),
  }).pipe(
    switchMap(d => this.itemService.update(this.id, {
      name: this.name(), contact: this.user(),
      states_id: d.states_id, locations_id: d.locations_id,
      manufacturers_id: d.manufacturers_id, [cfg.modelField]: d.model_id,
    } as any, this.type))
  ).subscribe({ next: () => { this.toast.success('Élément mis à jour'); this.goBack(); },
               error: () => this.toast.error('Échec') });
}
```
NB : `ItemV1Service.update` envoie `{ input: data }` ; les clés doivent être les champs GLPI
(`states_id`…), pas le modèle propre. Tu peux assouplir la signature de `update` pour accepter
un `Record<string, unknown>`.
</details>

**Pièges.** Confondre **modèle propre** (`status`) et **champ GLPI** (`states_id`). Champ
modèle dynamique. Oublier `clearCache` n'est pas requis ici (édition unitaire). Pré-remplir
avec les **libellés** (v1 expand) et non des ids.

**Critères de validation.** Modifier puis recharger montre les nouvelles valeurs dans GLPI ;
créer une localisation inexistante la crée ; build OK.

---

## Exercice 6.2 — Suppression d'un ticket avec confirmation et nettoyage des dépendances

**Contexte métier.** Sur la fiche ticket, un bouton « Supprimer » doit retirer le ticket
**et** ses liaisons (`Item_Ticket`) et coûts (`TicketCost`) avant de supprimer le ticket
lui-même (clés étrangères), puis revenir à la liste.

**Objectifs.**
1. `app-confirm-dialog` (danger).
2. Un service qui : récupère les `Item_Ticket` et `TicketCost` du ticket, les supprime, puis
   supprime le ticket — **dans l'ordre**, en ignorant les échecs partiels.
3. Toast + navigation.

**Contraintes.** v1 ; `force_purge=1` ; `concatMap` pour l'ordre ; `catchError` pour ne pas
bloquer.

**Fichiers.** `ticket-detail.component.ts/.html`, un `ticket-delete` (ou méthode dans
`TicketV1Service`).

**Compétences.** Suppression ordonnée (cf. `ResetService`), recherche par `searchText`,
`concatMap`, confirm-dialog.

<details><summary>Solution (cœur)</summary>

```ts
deleteCascade(ticketId: number): Observable<void> {
  const links$ = this.http.get<{id:number}[]>(`${base}/Item_Ticket?searchText[tickets_id]=${ticketId}&range=0-999`).pipe(catchError(()=>of([])));
  const costs$ = this.http.get<{id:number}[]>(`${base}/TicketCost?searchText[tickets_id]=${ticketId}&range=0-999`).pipe(catchError(()=>of([])));
  return forkJoin({ links: links$, costs: costs$ }).pipe(
    concatMap(({ links, costs }) => from([
      ...links.map(l => ['Item_Ticket', l.id] as const),
      ...costs.map(c => ['TicketCost', c.id] as const),
    ]).pipe(
      concatMap(([type, id]) => this.http.delete(`${base}/${type}/${id}?force_purge=1`).pipe(catchError(()=>of(null)))),
      toArray(),
    )),
    concatMap(() => this.http.delete<void>(`${base}/Ticket/${ticketId}?force_purge=1`)),
  );
}
```
Composant : `confirm` → `deleteCascade(id).subscribe({ complete: → toast + navigate(liste) })`.
</details>

**Pièges.** Supprimer le ticket **avant** ses dépendances (FK). Oublier `range`. Ne pas gérer
le cas « pas de liaison/coût ».

**Critères de validation.** Le ticket et ses dépendances disparaissent de GLPI ; pas d'erreur
si aucune dépendance ; retour liste + toast.

---

## Exercice 6.3 — Export CSV de la liste des éléments (avec filtres appliqués)

**Contexte métier.** Bouton « Exporter » qui télécharge la liste **filtrée** en CSV, dans le
même format que l'import (round-trip).

**Objectifs.**
1. Générer un CSV (mêmes colonnes que la feuille 1) à partir de `filteredItems()`.
2. Échapper correctement les champs (guillemets, virgules).
3. Déclencher le téléchargement côté navigateur.

**Contraintes.** Pas de lib externe ; un util `core/utils/csv.utils.ts` peut accueillir un
`toCsv()`.

**Fichiers.** `csv.utils.ts` (ajouter `toCsv`), `item-list.component.ts`.

**Compétences.** Manipulation de chaînes, Blob/anchor download, réutilisation d'un util.

<details><summary>Solution (cœur)</summary>

```ts
// csv.utils.ts
export function toCsv(headers: string[], rows: (string|number)[][]): string {
  const esc = (v: string|number) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
  return [headers, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
}
```
```ts
// composant
exportCsv() {
  const headers = ['Name','Status','Location','Manufacturer','Item_Type','Model','Inventory_Number','User'];
  const rows = this.filteredItems().map(i => [i.name,i.status,i.location,i.manufacturer,i.item_type,i.model,i.inventory_number,i.user]);
  const blob = new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'elements.csv' });
  a.click(); URL.revokeObjectURL(url);
}
```
</details>

**Pièges.** Mauvais échappement (champs avec virgules/guillemets). Exporter la liste **non**
filtrée. Oublier `revokeObjectURL`.

**Critères de validation.** Le CSV téléchargé se ré-importe sans erreur (round-trip) ; respecte
les filtres actifs.

---

## Exercice 6.4 — Lier des images à des éléments depuis l'UI (hors import)

**Contexte métier.** Sur la fiche d'un élément, permettre de **téléverser une image** qui sera
attachée à l'élément (Document + Document_Item), avec correction d'extension.

**Objectifs.**
1. Un `<input type="file" accept="image/*">` ou drag&drop.
2. Détecter le vrai type (magic bytes), uploader via `/Document` (FormData), lier via
   `/Document_Item`.
3. Toast + (bonus) afficher l'image après upload.

**Contraintes.** Réutiliser la logique de `image-import.service` (extraire un service
partagé `GlpiDocumentService`). Intercepteur ne doit pas casser le FormData.

**Fichiers.** nouveau `core/services/glpi/document.service.ts` (extrait de `image-import`),
`image-import.service.ts` (réutilise le nouveau service), `item-detail.component.ts`.

**Compétences.** Refactor (extraire un service), upload multipart, détection de type,
réutilisation.

<details><summary>Solution (idée)</summary>

Extraire `detectImage`, `uploadDocument`, `linkDocument` dans `GlpiDocumentService` ;
`ImageImportService` l'injecte ; `item-detail` aussi :
```ts
async onFile(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = this.docs.detect(bytes); if (!kind) return this.toast.error('Format non supporté');
  const docId = await this.docs.upload(`${this.item().name}.${kind.ext}`, bytes, kind.mime, this.item().name);
  await this.docs.link(docId, this.type, this.id);
  this.toast.success('Image attachée');
}
```
</details>

**Pièges.** Forcer `Content-Type` (casse le multipart). Ne pas corriger l'extension. Coupler à
l'import au lieu d'extraire un service réutilisable.

**Critères de validation.** L'image apparaît dans GLPI (onglet Documents de l'élément) ;
fonctionne avec un `.png` qui est un JPEG ; build OK.
