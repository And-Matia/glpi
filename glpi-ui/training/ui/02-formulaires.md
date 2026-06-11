# 02 — Formulaires : `Input`, `Textarea`, `Select`, `SearchInput` + Material direct

Tous les champs maison exposent un **`model<T>()`** → tu les branches en **two-way** avec
`[(prop)]="monSignal"`. Pas de `FormsModule`, pas de `ReactiveFormsModule` : ici **un signal par
champ**, et la validation se fait à la main dans `onSubmit()`.

Depuis la refonte, `app-input` / `app-textarea` / `app-select` **wrappent Angular Material**
(`mat-form-field` + `matInput` / `mat-select`) : tu profites du look Material thémé, mais avec
une API signal minimaliste. Pour **checkbox** et **switch**, on utilise Material **directement**.

> Rappel signals : `[(value)]="titre"` est du sucre pour `[value]="titre()" (valueChange)="titre.set($event)"`.
> Donc tu passes **le signal lui-même** (`titre`), pas son appel (`titre()`).

---

## `app-input`

Wrappe `mat-form-field` + `matInput` ; l'erreur s'affiche via `mat-error`.

### API exacte
| Membre | Type | Défaut | Sens |
|--------|------|--------|------|
| `label` | `string` (**requis**) | — | input |
| `placeholder` | `string` | `''` | input |
| `errorMessage` | `string` | `''` | input — affiché sous le champ (`mat-error`) |
| `type` | `string` | `'text'` | input — `text`, `email`, `password`, `number`… |
| `value` | `model<string>('')` | `''` | **two-way** |

### Exemple réel
```ts
readonly titre = signal('');
readonly titreError = computed(() => this.submitted() && !this.titre().trim() ? 'Titre obligatoire' : '');
```
```html
<app-input
  label="Titre"
  placeholder="Ex. PC ne démarre plus"
  [(value)]="titre"
  [errorMessage]="titreError()" />
```

> ⚠️ Avec `type="number"`, `value` reste une **chaîne**. Convertis avec `Number(...)` avant l'envoi.

---

## `app-textarea`

Identique à `Input` + `rows`.

| Membre | Type | Défaut |
|--------|------|--------|
| `label` | `string` (**requis**) | — |
| `placeholder` | `string` | `''` |
| `errorMessage` | `string` | `''` |
| `rows` | `number` | `4` |
| `value` | `model<string>('')` | `''` |

```html
<app-textarea label="Description" [rows]="6" [(value)]="description" />
```

---

## `app-select`

Liste déroulante (wrappe `mat-select`). `options` est un tableau `SelectOption`.

```ts
export interface SelectOption { value: string | number; label: string; }
```

| Membre | Type | Défaut |
|--------|------|--------|
| `label` | `string` (**requis**) | — |
| `options` | `SelectOption[]` (**requis**) | — |
| `placeholder` | `string` | `'Sélectionner…'` |
| `errorMessage` | `string` | `''` |
| `value` | `model<string \| number \| null>(null)` | `null` |

### Exemple réel (options depuis les constantes)
```ts
import { TICKET_PRIORITY_OPTIONS } from '@app/core/constants/ticket.constants';
readonly priorityOptions = TICKET_PRIORITY_OPTIONS;   // [{value:1,label:'Très basse'}, …]
readonly priority = signal<number | null>(null);
```
```html
<app-select label="Priorité" [options]="priorityOptions" [(value)]="priority" />
```

> ⚠️ `value` peut valoir `null` (rien de choisi). Teste `if (!priority())` dans la validation.
> Les `value` numériques restent numériques — pas besoin de `Number(...)` ici.

### Construire des options à la volée
```ts
import { ASSET_TYPES } from '@app/core/models/asset.model';
readonly typeOptions: SelectOption[] = ASSET_TYPES.map(a => ({ value: a.itemtype, label: a.label }));
```
(Des listes prêtes existent déjà : `ASSET_TYPE_OPTIONS`, `TICKET_TYPE_OPTIONS`,
`TICKET_PRIORITY_OPTIONS`, `ITEM_STATUS_OPTIONS` dans `core/constants/`.)

---

## `app-search-input`

Champ de recherche maison (icône loupe, pas de `mat-form-field`). Deux façons de réagir :
- `[(value)]` → tu dérives une liste filtrée par `computed` (le plus courant).
- `(search)` → sortie qui émet la valeur à chaque frappe (si tu préfères un handler).

| Membre | Type | Défaut |
|--------|------|--------|
| `placeholder` | `string` | `'Rechercher…'` |
| `disabled` | `boolean` | `false` |
| `value` | `model<string>('')` | `''` |
| `search` | `output<string>()` | — |

```ts
readonly q = signal('');
readonly filtered = computed(() => {
  const t = this.q().toLowerCase().trim();
  return !t ? this.all() : this.all().filter(x => x.name.toLowerCase().includes(t));
});
```
```html
<app-search-input placeholder="Rechercher un élément…" [(value)]="q" />
```

> ⚠️ **Ne filtre jamais le signal source** : garde la liste brute (`all`) et dérive `filtered`
> via `computed`, sinon tu perds des données à chaque frappe.

---

## Checkbox & switch : Material **direct**

> 🪦 `app-checkbox` et `app-switch` n'existent plus. Utilise Material :

```ts
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
```
```ts
readonly active   = signal(true);
readonly accepted = signal(false);
```
```html
<mat-slide-toggle [checked]="active()" (change)="active.set($event.checked)">
  Compte actif
</mat-slide-toggle>

<mat-checkbox [checked]="accepted()" (change)="accepted.set($event.checked)">
  J'accepte les conditions
</mat-checkbox>
```

> Le `$event` de `(change)` est un `MatCheckboxChange` / `MatSlideToggleChange` → la valeur est
> dans **`$event.checked`**.

Champs Material avancés (à utiliser directement aussi, avec `mat-form-field`) :
`mat-datepicker` (dates) et `mat-autocomplete` (suggestion) — voir `00-material-cdk.md` §2 pour
les imports.

---

## Recette : un formulaire complet validé à la main

```ts
readonly name = signal('');
readonly type = signal<number | null>(null);
readonly submitted = signal(false);
readonly submitting = signal(false);

readonly nameError = computed(() =>
  this.submitted() && !this.name().trim() ? 'Nom obligatoire' : '');

async onSubmit(): Promise<void> {
  this.submitted.set(true);
  if (!this.name().trim() || this.type() === null) {
    this.toast.warning('Veuillez remplir les champs obligatoires.');
    return;
  }
  this.submitting.set(true);
  try {
    await this.service.create({ name: this.name().trim() /* … */ });
    this.toast.success('Créé avec succès !');
  } catch {
    this.toast.error('Erreur lors de la création.');
  } finally {
    this.submitting.set(false);
  }
}
```
```html
<app-input label="Nom" [(value)]="name" [errorMessage]="nameError()" />
<app-select label="Type" [options]="typeOptions" [(value)]="type" />
<button mat-flat-button [disabled]="submitting()" (click)="onSubmit()">Créer</button>
```

## Imports
```ts
import { InputComponent } from '@app/shared/ui/input/input.component';
import { TextareaComponent } from '@app/shared/ui/textarea/textarea.component';
import { SelectComponent, SelectOption } from '@app/shared/ui/select/select.component';
import { SearchInputComponent } from '@app/shared/ui/search-input/search-input.component';
import { MatCheckboxModule } from '@angular/material/checkbox';      // checkbox direct
import { MatSlideToggleModule } from '@angular/material/slide-toggle'; // switch direct
import { MatButtonModule } from '@angular/material/button';
```

## Pièges récurrents
- Passer `titre()` au lieu de `titre` dans `[(value)]` → erreur (le banana-in-a-box veut le signal).
- Oublier que `input type="number"` renvoie une **string**.
- Filtrer le signal source d'une recherche au lieu d'un `computed` dérivé.
- Oublier d'ajouter le composant / module aux `imports` du `@Component`.
- Sur `mat-checkbox`/`mat-slide-toggle`, lire `$event` au lieu de **`$event.checked`**.
