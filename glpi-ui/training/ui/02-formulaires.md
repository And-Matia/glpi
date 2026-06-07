# 02 — Formulaires : `Input`, `Textarea`, `Select`, `SearchInput`, `Checkbox`, `Switch`

Tous les champs de saisie exposent un **`model<T>()`** → tu les branches en **two-way** avec
`[(prop)]="monSignal"`. Pas de `FormsModule`, pas de `ReactiveFormsModule` : ici **un signal par
champ**, et la validation se fait à la main dans `onSubmit()`.

> Rappel signals : `[(value)]="titre"` est du sucre pour `[value]="titre()" (valueChange)="titre.set($event)"`.
> Donc tu passes **le signal lui-même** (`titre`), pas son appel (`titre()`).

---

## `app-input`

### API exacte
| Membre | Type | Défaut | Sens |
|--------|------|--------|------|
| `label` | `string` (**requis**) | — | input |
| `placeholder` | `string` | `''` | input |
| `errorMessage` | `string` | `''` | input — affiché en rouge sous le champ |
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

Liste déroulante. `options` est un tableau `SelectOption`.

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
import { TICKET_PRIORITY_OPTIONS } from '@app/core/constants/glpi.constants';
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
readonly typeOptions: SelectOption[] = ASSET_TYPES.map(a => ({ value: a.itemtype, label: a.label }));
```

---

## `app-search-input`

Champ de recherche avec icône loupe. Deux façons de réagir :
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

## `app-checkbox` & `app-switch`

Deux variantes booléennes : `checkbox` (case classique) et `switch` (interrupteur). Même API.

| Membre | Type | Défaut |
|--------|------|--------|
| `label` | `string` | `''` |
| `disabled` | `boolean` | `false` |
| `checked` | `model<boolean>(false)` | `false` |

```ts
readonly active = signal(true);
```
```html
<app-switch label="Compte actif" [(checked)]="active" />
<app-checkbox label="J'accepte les conditions" [(checked)]="accepted" />
```

---

## Recette : un formulaire complet validé à la main
```ts
readonly name = signal('');
readonly type = signal<number | null>(null);
readonly submitted = signal(false);

readonly nameError = computed(() =>
  this.submitted() && !this.name().trim() ? 'Nom obligatoire' : '');

onSubmit(): void {
  this.submitted.set(true);
  if (!this.name().trim() || this.type() === null) {
    this.toast.warning('Veuillez remplir les champs obligatoires.');
    return;
  }
  // … POST via le service …
}
```
```html
<app-input label="Nom" [(value)]="name" [errorMessage]="nameError()" />
<app-select label="Type" [options]="typeOptions" [(value)]="type" />
<app-button [loading]="submitting()" (clicked)="onSubmit()">Créer</app-button>
```

## Imports
```ts
import { InputComponent } from '@app/shared/ui/input/input.component';
import { TextareaComponent } from '@app/shared/ui/textarea/textarea.component';
import { SelectComponent, SelectOption } from '@app/shared/ui/select/select.component';
import { SearchInputComponent } from '@app/shared/ui/search-input/search-input.component';
import { CheckboxComponent } from '@app/shared/ui/checkbox/checkbox.component';
import { SwitchComponent } from '@app/shared/ui/switch/switch.component';
```

## Pièges récurrents
- Passer `titre()` au lieu de `titre` dans `[(value)]` → erreur (le banana-in-a-box veut le signal).
- Oublier que `input type="number"` renvoie une **string**.
- Filtrer le signal source d'une recherche au lieu d'un `computed` dérivé.
- Oublier d'ajouter le composant aux `imports` du `@Component`.
