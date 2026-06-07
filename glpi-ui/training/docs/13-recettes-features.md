# 13 — Recettes de fonctionnalités (CRUD complet de bout en bout)

Ce guide couvre **les éventualités les plus probables d'un examen/atelier** : créer une page de
création d'élément, étendre la création de ticket, créer un utilisateur GLPI, éditer, supprimer.
Chaque recette donne **la couche données (service + GLPI)** puis **la couche UI**.

> Pré-requis : `05-couche-donnees-services.md` (services + mapping), `04-rxjs.md` (opérateurs),
> et les guides `ui/` pour les composants. Toutes les requêtes passent par le **proxy** (`/api.php`).

---

## 0. Rappels GLPI indispensables

### a) Forme d'une écriture v1
GLPI v1 attend **toujours** un objet `{ input: … }` :
```ts
this.http.post(`${base}/Computer`, { input: { name: 'PC-01', states_id: 2 } });
```
- **Lot (batch)** : `input` peut être un **tableau** → un seul POST/PUT/DELETE pour N items.
- **Suppression définitive** : `?force_purge=1` (sinon GLPI met juste `is_deleted=1`).

### b) Les champs sont des **clés étrangères** (FK), pas des libellés
Un asset ne stocke pas `"Dell"` mais `manufacturers_id: 2`. Pour transformer un libellé saisi en
id, on **trouve-ou-crée** le dropdown via `GlpiDropdownService` :
```ts
this.dropdown.resolve('Manufacturer', 'Dell');  // Observable<number> (crée si absent)
```

### c) Itemtypes namespacés & encodage d'URL
Certaines classes sont namespacées (`Glpi\Socket`, `Glpi\SocketModel`). Le `\` doit être
**encodé** dans l'URL (`encodeURIComponent`) sinon le navigateur le transforme en `/`. Le bon
endpoint REST d'un type est `assetType(itemtype).apiType` ; pour une relation, utilise
`apiTypeOf(itemtype)` (voir `glpi.constants.ts`).

### d) Champs disponibles selon le type
Tous les types n'ont pas tous les champs. Ex. **Software** n'a ni `states_id` ni `otherserial`,
**Cable** n'a ni `locations_id` ni `manufacturers_id`. GLPI **ignore silencieusement** un champ
inconnu (pas d'erreur, mais donnée perdue). Vérifie le type avant d'envoyer.

---

## 1. Recette : page de **création d'un élément** (asset)

Aujourd'hui l'app importe les éléments par CSV et `ItemV1Service` a déjà `create()`. On ajoute une
**page de saisie unitaire**.

### 1.1 Service (déjà présent — rappel)
```ts
// item-v1.service.ts
create(data: Partial<Item>, type: ItemType): Observable<{ id: number }> {
  const cfg = assetType(type)!;
  return this.http.post<{ id: number }>(`${this.base}/${encodeURIComponent(cfg.apiType)}`, { input: data });
}
```
Mais `data` doit contenir des **FK** (`states_id`, …), pas des libellés. On résout les dropdowns
dans le composant via `GlpiDropdownService`.

### 1.2 Composant `features/back-office/items/item-create/`
```ts
@Component({
  selector: 'app-item-create',
  imports: [PageHeaderComponent, CardComponent, InputComponent, SelectComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-create.component.html',
})
export class ItemCreateComponent {
  private readonly itemService = inject(ItemV1Service);
  private readonly dropdown    = inject(GlpiDropdownService);
  private readonly toast       = inject(ToastService);
  private readonly router      = inject(Router);

  readonly name      = signal('');
  readonly type      = signal<string | null>(null);
  readonly status    = signal<string | null>(null);   // libellé d'état
  readonly location  = signal('');
  readonly manufacturer = signal('');
  readonly model     = signal('');
  readonly inventory = signal('');
  readonly submitting = signal(false);

  readonly typeOptions   = ASSET_TYPE_OPTIONS.filter(o => o.value);  // sans "Tous"
  readonly statusOptions = ITEM_STATUS_OPTIONS.filter(o => o.value);

  onSubmit(): void {
    const type = this.type();
    if (!this.name().trim() || !type) {
      this.toast.warning('Nom et type sont obligatoires.');
      return;
    }
    const cfg = assetType(type)!;
    this.submitting.set(true);

    // 1) résoudre tous les dropdowns en parallèle (find-or-create)
    forkJoin({
      states_id:        this.dropdown.resolve('State', this.status() ?? ''),
      locations_id:     this.dropdown.resolve('Location', this.location()),
      manufacturers_id: this.dropdown.resolve('Manufacturer', this.manufacturer()),
      model_id:         cfg.modelType ? this.dropdown.resolve(cfg.modelType, this.model()) : of(0),
    }).pipe(
      // 2) puis créer l'asset avec les FK résolues
      switchMap(({ states_id, locations_id, manufacturers_id, model_id }) => {
        const input: Record<string, unknown> = {
          name: this.name().trim(),
          otherserial: this.inventory(),
          states_id, locations_id, manufacturers_id,
        };
        if (cfg.modelField) input[cfg.modelField] = model_id;
        return this.itemService.create(input, type);
      }),
    ).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.success('Élément créé.');
        this.router.navigate(['/front-office/items']);
      },
      error: () => { this.submitting.set(false); this.toast.error('Échec de la création.'); },
    });
  }

  goBack(): void { this.router.navigate(['/front-office/items']); }
}
```
```html
<div class="page">
  <app-page-header title="Nouvel élément" />
  <app-card title="Détails">
    <div class="form">
      <app-input  label="Nom" [(value)]="name" />
      <app-select label="Type" [options]="typeOptions" [(value)]="type" />
      <app-select label="Statut" [options]="statusOptions" [(value)]="status" />
      <app-input  label="Localisation" [(value)]="location" />
      <app-input  label="Fabricant" [(value)]="manufacturer" />
      <app-input  label="Modèle" [(value)]="model" />
      <app-input  label="N° inventaire" [(value)]="inventory" />
    </div>
  </app-card>
  <div class="actions">
    <app-button variant="ghost" (clicked)="goBack()">Annuler</app-button>
    <app-button [loading]="submitting()" (clicked)="onSubmit()">Créer</app-button>
  </div>
</div>
```

### 1.3 Route + lien
```ts
// app.routes.ts (enfant de back-office)
{ path: 'items/new', loadComponent: () =>
    import('./features/back-office/items/item-create/item-create.component')
      .then(m => m.ItemCreateComponent) },
```

### Pièges
- Oublier de résoudre les dropdowns → envoyer `"Dell"` dans `manufacturers_id` (attend un nombre).
- Ne pas masquer les champs non supportés par le type (Software sans statut…). Tu peux
  conditionner l'affichage : `@if (assetType(type()!)?.modelField) { <app-input label="Modèle" …/> }`.
- `status`/`type` valent `null` tant que rien n'est choisi → valider avant l'envoi.

---

## 2. Recette : **modifier la création de ticket**

`TicketCreateComponent` existe déjà (front-office). Cas typiques d'extension :

### 2.1 Ajouter un champ envoyé à GLPI (ex. `status`)
1. Étends l'entrée du service :
```ts
// ticket-v1.service.ts
export interface CreateTicketInput {
  titre: string; description: string; type: number; priority: number;
  status?: number;             // ← nouveau (1 = New par défaut côté GLPI)
}
create(data: CreateTicketInput): Observable<{ id: number }> {
  return this.http.post<{ id: number }>(this.base, {
    input: {
      name: data.titre, content: data.description,
      type: data.type, priority: data.priority,
      ...(data.status ? { status: data.status } : {}),
    },
  });
}
```
2. Ajoute le signal + le `app-select` dans le composant (options depuis une constante), puis
   passe `status: Number(this.status())` dans l'`input` d'`onSubmit`.

### 2.2 Stocker une **référence externe** (utile pour relier des imports ultérieurs)
GLPI Ticket possède un champ natif **`externalid`** (chaîne, cherchable via
`searchText[externalid]`). Pour qu'un ticket créé soit retrouvable plus tard sans registre local :
```ts
input: { name, content, type, priority, externalid: String(ref) }
```
> C'est exactement ce que fait l'import des tickets pour relier la feuille des coûts.

### 2.3 Lier des éléments au ticket (déjà en place — rappel du flux RxJS)
```ts
this.ticketService.create(input).pipe(
  concatMap(({ id: ticketId }) => {
    const selected = this.allItems().filter(i => this.selectedIds().has(i.id));
    if (!selected.length) return of(void 0);
    return from(selected).pipe(
      concatMap(item => this.ticketService.addItem(ticketId, item.item_type, item.id)),
    );
  }),
).subscribe({ /* … */ });
```
> ⚠️ **Piège namespacing** : `addItem` envoie `itemtype` dans la relation `Item_Ticket`. Pour un
> Socket, GLPI attend `Glpi\Socket`, pas `Socket`. Corrige en passant `apiTypeOf(item.item_type)`.

### Pièges
- `type`/`priority` sont des **codes numériques** (voir `GLPI_TICKET_*`), pas des libellés.
- Oublier `Number(...)` : un `app-select` à options numériques renvoie un nombre, mais un champ
  texte renvoie une string.

---

## 3. Recette : **création d'un utilisateur GLPI**

Pas de service utilisateur aujourd'hui → on le crée. Endpoint v1 = `User`.
Champs vérifiés : `name` (= login), `realname`, `firstname`, `_password` + `_password2`
(obligatoires ensemble), `is_active` (défaut 1).

### 3.1 Modèle + service
```ts
// core/models/user.model.ts
export interface AppUser { id: number; login: string; firstname: string; lastname: string; active: boolean; }

// core/services/glpi/user/user-v1.service.ts
export interface CreateUserInput {
  login: string; firstname: string; lastname: string; password: string; active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserV1Service {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v1ApiUrl}/User`;

  getAll(): Observable<AppUser[]> {
    return this.http.get<any[]>(`${this.base}?range=0-9999`).pipe(
      catchError(() => of([])),
      map(raws => raws.map(r => this.map(r))),
    );
  }

  create(data: CreateUserInput): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, {
      input: {
        name:       data.login,
        firstname:  data.firstname,
        realname:   data.lastname,
        _password:  data.password,
        _password2: data.password,
        is_active:  data.active === false ? 0 : 1,
      },
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}?force_purge=1`);
  }

  private map(r: any): AppUser {
    return {
      id: r.id,
      login: String(r.name ?? ''),
      firstname: String(r.firstname ?? ''),
      lastname: String(r.realname ?? ''),
      active: r.is_active === 1 || r.is_active === '1',
    };
  }
}
```

### 3.2 Composant `features/back-office/users/user-create/`
```ts
export class UserCreateComponent {
  private readonly users = inject(UserV1Service);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly login = signal(''); readonly firstname = signal(''); readonly lastname = signal('');
  readonly password = signal(''); readonly active = signal(true);
  readonly submitting = signal(false);

  onSubmit(): void {
    if (!this.login().trim() || this.password().length < 4) {
      this.toast.warning('Login et mot de passe (≥ 4 caractères) obligatoires.');
      return;
    }
    this.submitting.set(true);
    this.users.create({
      login: this.login().trim(), firstname: this.firstname(), lastname: this.lastname(),
      password: this.password(), active: this.active(),
    }).subscribe({
      next: () => { this.submitting.set(false); this.toast.success('Utilisateur créé.'); this.router.navigate(['/back-office/users']); },
      error: () => { this.submitting.set(false); this.toast.error('Échec (login déjà pris ?).'); },
    });
  }
}
```
```html
<div class="page">
  <app-page-header title="Nouvel utilisateur" />
  <app-card title="Compte">
    <div class="form">
      <app-input label="Login" [(value)]="login" />
      <app-input label="Prénom" [(value)]="firstname" />
      <app-input label="Nom" [(value)]="lastname" />
      <app-input label="Mot de passe" type="password" [(value)]="password" />
      <app-switch label="Compte actif" [(checked)]="active" />
    </div>
  </app-card>
  <div class="actions">
    <app-button [loading]="submitting()" (clicked)="onSubmit()">Créer</app-button>
  </div>
</div>
```

### Pièges
- `_password` **et** `_password2` sont requis et doivent être identiques, sinon 400.
- `name` GLPI = **login** (unique). Un login existant → erreur ; gère le message.
- `is_active` est un entier `0/1`, pas un booléen.

---

## 4. Recette : **édition** (charger → pré-remplir → PUT)

Schéma générique pour toute entité disposant de `getById` + `update`.
```ts
export class XEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(XService);
  readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly name = signal(''); readonly loading = signal(true); readonly saving = signal(false);

  ngOnInit() {
    this.service.getById(this.id).subscribe(x => {
      this.name.set(x.name);          // pré-remplir les signaux du formulaire
      this.loading.set(false);
    });
  }

  save() {
    this.saving.set(true);
    this.service.update(this.id, { name: this.name() }).subscribe({
      next: () => { this.saving.set(false); this.toast.success('Enregistré.'); },
      error: () => { this.saving.set(false); this.toast.error('Échec.'); },
    });
  }
}
```
> GLPI : la mise à jour est un **PUT** `{ input: { …champs modifiés… } }`. Tu peux n'envoyer que
> les champs changés.

### Pièges
- Lire l'`id` : `route.snapshot.paramMap.get('id')` renvoie une **string** → `Number(...)`.
- Ne pas pré-remplir tous les signaux → champs vidés à la sauvegarde.

---

## 5. Recette : **suppression avec confirmation**
```ts
readonly confirmOpen = signal(false);
readonly toDelete = signal<X | null>(null);

ask(row: X)   { this.toDelete.set(row); this.confirmOpen.set(true); }
confirm() {
  const row = this.toDelete();
  this.confirmOpen.set(false);
  if (!row) return;
  this.service.delete(row.id).subscribe({
    next: () => { this.toast.success('Supprimé.'); this.reload(); },
    error: () => this.toast.error('Échec de la suppression.'),
  });
}
```
```html
<app-icon-button icon="fa-solid fa-trash" variant="danger" ariaLabel="Supprimer" (clicked)="ask(row)" />

<app-confirm-dialog [open]="confirmOpen()" title="Supprimer ?"
  [message]="'Supprimer « ' + (toDelete()?.name ?? '') + ' » ?'"
  [danger]="true" (confirmed)="confirm()" (cancelled)="confirmOpen.set(false)" />
```
> Suppression **définitive** côté GLPI : ajoute `?force_purge=1` dans le service `delete`.

---

## 6. Recette : **création en lot** (batch)
Quand tu crées/supprimes N entités, **un seul** appel avec un tableau `input` :
```ts
// create N
this.http.post(`${base}/Computer`, { input: rows.map(r => ({ name: r.name })) });
// delete N (purge)
this.http.delete(`${base}/Computer`, { body: { input: ids.map(id => ({ id })), force_purge: true } });
```
> Le DELETE avec corps utilise l'option `{ body }` d'`HttpClient`. GLPI renvoie un tableau de
> résultats `[{ "<id>": true }, …]`.

---

## Checklist « je crée une feature CRUD »
1. **Modèle** propre dans `core/models` (jamais la forme brute GLPI dans l'UI).
2. **Service** dans `core/services/glpi/**` : `getAll`/`getById`/`create`/`update`/`delete`, avec
   `map(raw → modèle)` privé. URL via `apiType` + `encodeURIComponent`.
3. **Dropdowns** : libellé → id via `GlpiDropdownService.resolve`.
4. **Composant** standalone OnPush + signals ; valider dans `onSubmit`.
5. **RxJS** : `forkJoin` (parallèle), puis `switchMap`/`concatMap` (séquence dépendante).
6. **UI** : composants `shared/ui` uniquement, espacement par tokens.
7. **Route** lazy + lien (sidebar/navbar) + guard si back-office.
8. **Feedback** : `ToastService` au succès/erreur, `loading` pendant l'appel.
9. **Build** : `npm run build` doit passer.
