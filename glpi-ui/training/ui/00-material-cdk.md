# 00 — Angular Material & CDK : comment ça marche dans ce projet

Depuis la refonte, le projet utilise **Angular Material 21** (`@angular/material`) et le
**CDK** (`@angular/cdk`) **directement dans les templates** pour tous les widgets génériques.
Ce guide explique : le thème, comment importer un module, quel composant utiliser pour quel
besoin, et les patterns CDK déjà en place (drag & drop du kanban, overlay du modal).

---

## 1. Le thème : déjà configuré, ne rien refaire

Deux fichiers pilotent l'apparence de **tous** les composants Material :

```
src/
├── material-theme.scss        ← le thème global (mat.theme + overrides)
└── styles/
    ├── _theme-colors.scss     ← palettes générées (ng generate @angular/material:theme-color)
    ├── colors.css             ← tokens couleur du projet (--color-primary: #FFD600, …)
    └── variables.css          ← tokens espacement / typo / radius / ombres
```

`material-theme.scss` fait deux choses :

```scss
@use '@angular/material' as mat;
@use './styles/theme-colors' as palettes;

html {
  // 1. Applique le thème Material 21 (système M3) avec les palettes générées
  @include mat.theme((
    color: ( primary: palettes.$primary-palette, tertiary: palettes.$tertiary-palette ),
    typography: Roboto,
    density: 0,
  ));

  // 2. Re-cale les tokens système sur les couleurs EXACTES de la marque
  //    (sinon Material "harmonise" le jaune #FFD600 vers des tons plus sombres)
  @include mat.theme-overrides((
    primary:  var(--color-primary),
    error:    var(--color-danger),
    surface:  var(--color-surface),
    // …
  ));
}
```

**Conséquences pratiques :**
- Un `<button mat-flat-button>` sort **déjà jaune marque** ; `color="warn"` sort rouge danger.
- Le fond/texte de la page suivent `var(--mat-sys-surface)` / `var(--mat-sys-on-surface)`.
- Dans ton CSS tu peux consommer les **tokens système Material** (`--mat-sys-*`) ou les
  **tokens projet** (`--color-*`, `--spacing-*`) — les deux sont alignés.
- **Tu ne touches au thème que** pour changer la marque globalement, jamais par page.

---

## 2. Importer un module Material dans un composant

Material s'importe **par module, dans le `@Component`** (composants standalone) :

```ts
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-ma-page',
  imports: [MatButtonModule, MatCardModule],   // ← sinon : erreur de template
  templateUrl: './ma-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

```html
<mat-card>
  <mat-card-header><mat-card-title>Titre</mat-card-title></mat-card-header>
  <mat-card-content>
    <button mat-flat-button (click)="save()">Enregistrer</button>
  </mat-card-content>
</mat-card>
```

| Tu utilises… | Tu importes… | Depuis |
|--------------|--------------|--------|
| `mat-flat-button`, `mat-button`, `mat-icon-button` | `MatButtonModule` | `@angular/material/button` |
| `mat-card` + header/content | `MatCardModule` | `@angular/material/card` |
| `mat-form-field`, `mat-label`, `mat-error` | `MatFormFieldModule` | `@angular/material/form-field` |
| `matInput` | `MatInputModule` | `@angular/material/input` |
| `mat-select`, `mat-option` | `MatSelectModule` | `@angular/material/select` |
| `mat-tab-group`, `mat-tab` | `MatTabsModule` | `@angular/material/tabs` |
| `mat-paginator` | `MatPaginatorModule` | `@angular/material/paginator` |
| `matTooltip` | `MatTooltipModule` | `@angular/material/tooltip` |
| `mat-checkbox` | `MatCheckboxModule` | `@angular/material/checkbox` |
| `mat-slide-toggle` | `MatSlideToggleModule` | `@angular/material/slide-toggle` |
| `mat-divider` | `MatDividerModule` | `@angular/material/divider` |
| `mat-chip`, `mat-chip-set` | `MatChipsModule` | `@angular/material/chips` |
| `mat-menu` | `MatMenuModule` | `@angular/material/menu` |
| `mat-datepicker` | `MatDatepickerModule` | `@angular/material/datepicker` |
| `mat-autocomplete` | `MatAutocompleteModule` | `@angular/material/autocomplete` |
| `mat-stepper` | `MatStepperModule` | `@angular/material/stepper` |
| `cdkDrag`, `cdkDropList` | `DragDropModule` | `@angular/cdk/drag-drop` |
| `cdk-virtual-scroll-viewport` | `ScrollingModule` | `@angular/cdk/scrolling` |

---

## 3. Besoin → solution (la table de référence)

**Utilise Material/CDK directement — ne crée pas de wrapper `app-*` pour ça :**

| Besoin | Utilise |
|--------|---------|
| Bouton principal (plein) | `<button mat-flat-button>` |
| Bouton texte / discret | `<button mat-button>` |
| Bouton contour | `<button mat-stroked-button>` |
| Bouton danger | `<button mat-flat-button color="warn">` |
| Bouton icône | `<button mat-icon-button>` |
| Carte | `<mat-card>` + `<mat-card-header>` + `<mat-card-content>` |
| Onglets | `<mat-tab-group>` + `<mat-tab>` |
| Paginator | `<mat-paginator>` |
| Infobulle | directive `matTooltip="texte"` |
| Case à cocher | `<mat-checkbox>` |
| Interrupteur | `<mat-slide-toggle>` |
| Séparateur | `<mat-divider>` |
| Chip / étiquette retirable | `<mat-chip>` / `<mat-chip-set>` |
| Sélecteur de date | `<mat-datepicker>` + `<mat-form-field>` |
| Autocomplétion | `<mat-autocomplete>` |
| Menu contextuel | `<mat-menu>` |
| Assistant par étapes | `<mat-stepper>` |
| Liste virtualisée | `<cdk-virtual-scroll-viewport>` |
| Glisser-déposer | `cdkDrag` / `cdkDropList` |

**Garde les composants `shared/ui`** pour : champs de formulaire signal (`app-input`,
`app-select`, …), table (`app-table`), modal/confirmation, et le feedback maison (badge,
toast, empty-state, skeleton…). Détail dans les fichiers `01` à `07`.

---

## 4. Pattern CDK n°1 du projet : le drag & drop du kanban

Le kanban front-office (`features/front-office/tickets/kanban/`) est l'exemple de référence.
Chaque colonne est une `cdkDropList`, chaque carte un `cdkDrag` ; les listes sont connectées
entre elles :

```ts
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({ imports: [DragDropModule, /* … */] })
export class KanbanComponent {
  onDrop(event: CdkDragDrop<Ticket[]>, toStatusCode: number): void {
    if (event.previousContainer === event.container) return; // même colonne → rien
    const ticket = event.item.data as Ticket;                // [cdkDragData]
    // … confirmation éventuelle puis update optimiste …
  }
}
```

```html
@for (col of settings.columns(); track col.statusCode) {
  <div class="kanban-col"
       cdkDropList
       [id]="'col-' + col.statusCode"
       [cdkDropListData]="ticketsForColumn(col.statusCode)"
       [cdkDropListConnectedTo]="allColumnIds"
       (cdkDropListDropped)="onDrop($event, col.statusCode)">

    @for (t of ticketsForColumn(col.statusCode); track t.id) {
      <div class="kanban-card" cdkDrag [cdkDragData]="t">{{ t.titre }}</div>
    }
  </div>
}
```

À retenir :
- `[cdkDragData]="t"` → récupéré dans le handler via `event.item.data`.
- `event.previousContainer === event.container` → drop dans la même colonne, à ignorer.
- L'update est **optimiste** : on met à jour le signal local tout de suite, le `PUT` part en
  parallèle (voir `docs/13-recettes-features.md`).

---

## 5. Pattern CDK n°2 : overlay & focus-trap (déjà encapsulés dans `app-modal`)

`app-modal` utilise en interne :
- `A11yModule` (`cdkTrapFocus`) → le focus reste piégé dans la modale ;
- `Overlay.scrollStrategies.block()` → la page ne défile plus tant que la modale est ouverte.

```ts
// Extrait réel de modal.component.ts
private readonly scrollStrategy = inject(Overlay).scrollStrategies.block();
constructor() {
  effect(() => {
    this.open() ? this.scrollStrategy.enable() : this.scrollStrategy.disable();
  });
}
```

→ **Tu n'as pas à recoder ça** : utilise `<app-modal>` (voir `06-overlays.md`). Mais sache que
c'est du CDK pur ; si un jour tu dois construire un autre overlay (drawer, popover custom),
ce sont ces mêmes briques (`@angular/cdk/overlay`, `@angular/cdk/a11y`).

---

## Pièges récurrents

- **Oublier l'import du module Material** dans `imports: [...]` → `'mat-card' is not a known
  element`. L'erreur cite l'élément : importe le module correspondant (tableau §2).
- Importer le composant individuel (`MatButton`) au lieu du **module** (`MatButtonModule`) :
  les deux marchent en standalone, mais le projet importe **les modules** — reste cohérent.
- Re-styler un bouton Material à la main (`background: yellow`) : le thème s'en charge déjà.
  Si une couleur ne va pas, c'est un problème de **thème global**, pas du composant.
- Recréer un wrapper `app-button`/`app-card`/… : ces wrappers ont été **supprimés** exprès.
- Sur `mat-paginator`, oublier que `pageIndex` est **0-based** (voir `07-pagination.md`).
