# 01 — Boutons : Angular Material (`mat-flat-button`, `mat-button`, …)

> 🪦 Les composants `app-button` et `app-icon-button` **n'existent plus**. Tous les boutons du
> projet sont des boutons **Angular Material**, thémés globalement (voir `00-material-cdk.md`).
> Ne jamais écrire un `<button>` brut non plus : tu perds le thème, les états et l'accessibilité.

## Import

```ts
import { MatButtonModule } from '@angular/material/button';
// @Component({ imports: [MatButtonModule] })
```

Un seul module couvre toutes les variantes.

---

## Les variantes

| Variante | Syntaxe | Usage |
|----------|---------|-------|
| **Plein (primaire)** | `<button mat-flat-button>` | action principale d'un écran (1 seule par zone) |
| **Texte (ghost)** | `<button mat-button>` | action discrète / secondaire (Annuler, Retour, Voir) |
| **Contour** | `<button mat-stroked-button>` | action secondaire qui doit rester visible |
| **Danger** | `<button mat-flat-button color="warn">` | action destructrice (Supprimer, Réinitialiser) |
| **Icône seule** | `<button mat-icon-button>` | actions de ligne de tableau, fermeture… |

```html
<!-- Action principale -->
<button mat-flat-button [disabled]="submitting()" (click)="onSubmit()">
  Créer le ticket
</button>

<!-- Action discrète -->
<button mat-button (click)="goBack()">← Retour</button>

<!-- Action destructrice -->
<button mat-flat-button color="warn" (click)="askDelete()">Supprimer</button>

<!-- Bouton icône (FontAwesome, comme partout dans le projet) -->
<button mat-icon-button aria-label="Modifier l'élément" (click)="edit(row)">
  <i class="fa-solid fa-pen"></i>
</button>
```

> Le thème global rend le `mat-flat-button` **jaune marque** (`--color-primary: #FFD600`) et le
> `color="warn"` **rouge danger** — rien à styler.

---

## Exemples réels du projet

**Login (back-office)** — `login.component.html` :
```html
<button mat-flat-button [disabled]="!password()" (click)="onSubmit()">Se connecter</button>
```

**Création de ticket (front-office)** — `ticket-create.component.html` :
```html
<button mat-button (click)="goBack()">← Retour</button>
<button mat-flat-button [disabled]="submitting()" (click)="onSubmit()">Créer</button>
```

**ConfirmDialog (interne au composant)** — `confirm-dialog.component.html` :
```html
<button mat-button (click)="cancelled.emit()">{{ cancelLabel() }}</button>
<button mat-flat-button [color]="danger() ? 'warn' : 'primary'" (click)="confirmed.emit()">
  {{ confirmLabel() }}
</button>
```

---

## État « chargement »

`app-button` avait un input `loading` ; les boutons Material n'en ont pas. Le pattern projet :
**désactiver le bouton + adapter le libellé** (et/ou afficher un `app-spinner` à côté) :

```ts
readonly submitting = signal(false);
```
```html
<button mat-flat-button [disabled]="submitting()" (click)="onSubmit()">
  {{ submitting() ? 'Création…' : 'Créer le ticket' }}
</button>
```

---

## Accessibilité

- Un `mat-icon-button` n'a **pas de texte** → renseigne **toujours** `aria-label` :
  ```html
  <button mat-icon-button aria-label="Supprimer" (click)="askDelete(row)">
    <i class="fa-solid fa-trash"></i>
  </button>
  ```
  Sans `aria-label`, le bouton est muet pour un lecteur d'écran — défaut bloquant en revue.

---

## Pièges récurrents

- Chercher `app-button` / `(clicked)` : c'est l'**ancienne** API. Aujourd'hui : bouton Material
  + `(click)` natif. Le garde-fou `disabled` est géré par l'attribut `[disabled]`.
- Oublier `MatButtonModule` dans `imports` → l'attribut `mat-flat-button` est ignoré
  silencieusement (le bouton s'affiche sans style).
- Styler la couleur à la main au lieu d'utiliser la bonne variante (`color="warn"`).
- Mettre des marges en dur autour du bouton : gère l'espacement depuis le **parent**
  (`flex` + `gap`).
- Plusieurs `mat-flat-button` côte à côte : garde **une seule** action pleine par zone, les
  autres en `mat-button`/`mat-stroked-button`.
