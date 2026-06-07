# Niveau 8 — CRUD complet : création, édition, suppression

Le niveau qui couvre **toutes les éventualités d'écriture** : créer des entités à la main (élément,
utilisateur), étendre une création existante, éditer, supprimer. Chaque exercice = service +
composant + route + UI. Réfère-toi à `../docs/13-recettes-features.md` et aux guides `../ui/`.

> Format : **Contexte · Objectifs · Contraintes · Fichiers · Compétences · Solution · Pièges · Validation**

---

## Exercice 8.1 — Page de création d'un élément (asset)

**Contexte métier.** En plus de l'import CSV, l'admin veut **créer un élément à l'unité** via un
formulaire (nom, type, statut, localisation, fabricant, modèle, n° inventaire).

**Objectifs.**
- Route `/back-office/items/new` + composant `ItemCreateComponent`.
- Résoudre les libellés (statut/localisation/fabricant/modèle) en **FK** via `GlpiDropdownService`.
- Créer via `ItemV1Service.create(input, type)`.

**Contraintes.** v1 ; OnPush + signals ; composants `shared/ui` ; tokens CSS ; valider nom + type.

**Fichiers.** `features/back-office/items/item-create/*`, `app.routes.ts`, `sidebar.component.html`.

**Compétences.** `forkJoin` (résoudre N dropdowns) → `switchMap` (créer), find-or-create, formulaire
signals, route lazy.

<details><summary>Solution (extrait)</summary>

Voir `docs/13-recettes-features.md` §1. Cœur :
```ts
forkJoin({
  states_id:        this.dropdown.resolve('State', this.status() ?? ''),
  locations_id:     this.dropdown.resolve('Location', this.location()),
  manufacturers_id: this.dropdown.resolve('Manufacturer', this.manufacturer()),
  model_id:         cfg.modelType ? this.dropdown.resolve(cfg.modelType, this.model()) : of(0),
}).pipe(
  switchMap(ids => {
    const input: Record<string, unknown> = {
      name: this.name().trim(), otherserial: this.inventory(),
      states_id: ids.states_id, locations_id: ids.locations_id, manufacturers_id: ids.manufacturers_id,
    };
    if (cfg.modelField) input[cfg.modelField] = ids.model_id;
    return this.itemService.create(input, this.type()!);
  }),
).subscribe({ /* toast + navigate */ });
```
</details>

**Pièges.** Envoyer un libellé (`"Dell"`) là où GLPI attend un id → résoudre d'abord. Champs non
supportés selon le type (Software sans statut). `type()`/`status()` à `null` non validés.

**Validation.** Un élément saisi apparaît dans la liste ; les dropdowns sont créés s'ils manquaient ;
build OK ; lien dans la sidebar.

---

## Exercice 8.2 — Création d'utilisateur GLPI

**Contexte métier.** L'admin doit pouvoir **créer un compte utilisateur** (login, prénom, nom, mot
de passe, actif).

**Objectifs.**
- `UserV1Service` (`getAll`, `create`, `delete`) + modèle `AppUser`.
- Route `/back-office/users/new` + `UserCreateComponent` (form).

**Contraintes.** Endpoint `User` ; `_password` **et** `_password2` ; `is_active` entier 0/1 ;
mapping `name→login`, `realname→nom`, `firstname→prénom`.

**Fichiers.** `core/models/user.model.ts`, `core/services/glpi/user/user-v1.service.ts`,
`features/back-office/users/user-create/*`, `app.routes.ts`, `sidebar.component.html`.

**Compétences.** Créer un service d'écriture neuf, mapping bidirectionnel, `app-switch`.

<details><summary>Solution (extrait)</summary>

Voir `docs/13-recettes-features.md` §3. Cœur du service :
```ts
create(data: CreateUserInput) {
  return this.http.post<{id:number}>(this.base, { input: {
    name: data.login, firstname: data.firstname, realname: data.lastname,
    _password: data.password, _password2: data.password,
    is_active: data.active === false ? 0 : 1,
  }});
}
```
</details>

**Pièges.** Oublier `_password2` → 400. Login déjà pris → message clair. Traiter `is_active` comme
booléen côté envoi.

**Validation.** L'utilisateur est créé et visible dans GLPI ; un login dupliqué affiche une erreur ;
build OK.

---

## Exercice 8.3 — Étendre la création de ticket (champ « Statut » + référence externe)

**Contexte métier.** À la création d'un ticket, on veut choisir le **statut** initial et stocker une
**référence externe** (`externalid`) pour le relier plus tard.

**Objectifs.**
- Étendre `CreateTicketInput` (+ `status?`, + `externalid?`) et le `create()` du service.
- Ajouter un `app-select` de statut + un `app-input` « Réf. externe » dans le formulaire.

**Contraintes.** `status` = code numérique (`GLPI_TICKET_STATUS`) ; ne pas casser l'existant
(champs optionnels).

**Fichiers.** `ticket-v1.service.ts`, `ticket-create.component.ts` (+ `.html`),
`glpi.constants.ts` (option list de statut si absente).

**Compétences.** Étendre une interface + un POST sans régression, options de select, `Number(...)`.

<details><summary>Solution (extrait)</summary>

```ts
export interface CreateTicketInput { titre:string; description:string; type:number; priority:number; status?:number; externalid?:string; }
// dans create():
input: { name:data.titre, content:data.description, type:data.type, priority:data.priority,
  ...(data.status ? { status:data.status } : {}),
  ...(data.externalid ? { externalid:data.externalid } : {}) }
```
Form : `<app-select label="Statut" [options]="statusOptions" [(value)]="status" />` + champ réf.
</details>

**Pièges.** Rendre les nouveaux champs obligatoires (ils doivent rester optionnels). Oublier
`Number(status)`.

**Validation.** Un ticket créé avec un statut choisi a ce statut dans GLPI ; sans rien choisir, le
comportement d'avant est inchangé ; `externalid` est cherchable (`searchText[externalid]`).

---

## Exercice 8.4 — Page d'édition d'un ticket

**Contexte métier.** Modifier le titre, la description et la priorité d'un ticket existant.

**Objectifs.**
- Route `/back-office/tickets/:id/edit` + `TicketEditComponent`.
- Charger via `getById`, pré-remplir les signaux, sauver via `update` (PUT).

**Contraintes.** Lire l'`id` depuis la route (`ActivatedRoute`), `Number(...)` ; n'envoyer que les
champs du formulaire.

**Fichiers.** `features/back-office/tickets/ticket-edit/*`, `app.routes.ts`, lien depuis le détail.

**Compétences.** `ActivatedRoute`, charger→pré-remplir→PUT, état `loading`/`saving`.

<details><summary>Solution (extrait)</summary>

Voir `docs/13-recettes-features.md` §4. PUT GLPI :
```ts
update(id:number, data:Partial<Ticket>) { return this.http.put<void>(`${this.base}/${id}`, { input: {
  name: data.titre, content: data.description, priority: data.priority } }); }
```
</details>

**Pièges.** `paramMap.get('id')` est une string. Ne pas pré-remplir → on écrase avec du vide.

**Validation.** La page s'ouvre pré-remplie ; après sauvegarde, les valeurs changent dans GLPI ;
toast de succès.

---

## Exercice 8.5 — Suppression d'un élément avec confirmation

**Contexte métier.** Depuis la liste des éléments (back-office), supprimer un asset après
confirmation.

**Objectifs.**
- Colonne « actions » avec `app-icon-button` (corbeille, `danger`).
- `app-confirm-dialog` (`[danger]="true"`) ; supprimer via `ItemV1Service.delete(id, type)` ;
  recharger la liste.

**Contraintes.** Suppression définitive (`?force_purge=1` côté service) ; recharger après succès.

**Fichiers.** la liste back-office des éléments (ou créer la liste si absente), `item-v1.service.ts`
(vérifier `delete`).

**Compétences.** `appCell` avec `let-row`, ConfirmDialog (ouvrir/fermer manuellement), recharge.

<details><summary>Solution (extrait)</summary>

```html
<ng-template appCell="actions" let-row>
  <app-icon-button icon="fa-solid fa-trash" variant="danger" ariaLabel="Supprimer" (clicked)="ask(row)" />
</ng-template>
<app-confirm-dialog [open]="confirmOpen()" [danger]="true" title="Supprimer ?"
  (confirmed)="confirm()" (cancelled)="confirmOpen.set(false)" />
```
```ts
confirm(){ const r=this.toDelete(); this.confirmOpen.set(false); if(!r) return;
  this.itemService.delete(r.id, r.item_type).subscribe(()=>this.reload()); }
```
</details>

**Pièges.** Croire que le dialog se ferme seul (remets `open=false`). Oublier `force_purge`
(GLPI garde l'item en `is_deleted`). Ne pas recharger après suppression.

**Validation.** L'élément disparaît de GLPI et de la liste après confirmation ; « Annuler » ne
supprime rien.

---

## Exercice 8.6 — Mini-CRUD d'un dropdown en modale (Localisations)

**Contexte métier.** Gérer les **localisations** GLPI (`Location`) : lister, ajouter, renommer,
supprimer — le tout dans une page avec **modale** (sans changer d'écran).

**Objectifs.**
- `LocationV1Service` (`getAll`, `create`, `update`, `delete`).
- Page avec `app-table` + bouton « Ajouter » → `app-modal` (création/édition partagée).

**Contraintes.** `Location` est un simple dropdown `{ id, name }` ; réutiliser la même modale pour
créer et éditer (id null = création).

**Fichiers.** `core/services/glpi/location/location-v1.service.ts`,
`features/back-office/locations/*`, `app.routes.ts`, `sidebar.component.html`.

**Compétences.** CRUD complet, modale partagée création/édition, recharge, `appCell` actions.

<details><summary>Solution (extrait)</summary>

Voir `ui/08-recettes.md` Recette D (CRUD modale). Service identique au pattern dropdown :
```ts
getAll(){ return this.http.get<any[]>(`${this.base}?range=0-9999`).pipe(catchError(()=>of([])),
  map(rs=>rs.map(r=>({id:r.id,name:r.name})))); }
create(name:string){ return this.http.post<{id:number}>(this.base,{input:{name}}); }
update(id:number,name:string){ return this.http.put<void>(`${this.base}/${id}`,{input:{name}}); }
delete(id:number){ return this.http.delete<void>(`${this.base}/${id}?force_purge=1`); }
```
</details>

**Pièges.** Réinitialiser le formulaire à l'ouverture (création vs édition). Oublier de recharger.
Deux barres de recherche (mettre `[showToolbar]` selon le besoin).

**Validation.** Ajout/édition/suppression reflétés immédiatement dans la table et dans GLPI.

---

## Simulation chronométrée (cible examen)
Enchaîne **8.1 + 8.5** en **45 min** (création + suppression d'élément, bout en bout, build vert),
puis **8.2** en **30 min**. Si tu tiens les temps, tu es prêt sur le volet « écriture/CRUD ».
