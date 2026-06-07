# 01 — Boutons : `Button` & `IconButton`

Deux composants pour toutes les actions cliquables. **Ne jamais** écrire un `<button>` brut :
tu perds les variantes, l'état `loading`, l'accessibilité et la cohérence visuelle.

---

## `app-button`

Bouton texte (avec label projeté via `ng-content`).

### API exacte
| Membre | Type | Défaut | Sens |
|--------|------|--------|------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | input |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | input |
| `loading` | `boolean` | `false` | input |
| `disabled` | `boolean` | `false` | input |
| `clicked` | `output<void>()` | — | **sortie** |
| *(contenu)* | `ng-content` | — | le label |

> ⚠️ La sortie s'appelle **`clicked`**, pas `click`. `(click)` brancherait l'événement DOM natif
> (qui fonctionne aussi mais court-circuite la logique `disabled`/`loading` du composant).
> Quand `loading` ou `disabled` est vrai, `clicked` **n'émet pas**.

### Exemple minimal
```html
<app-button (clicked)="save()">Enregistrer</app-button>
```

### Exemple réel (avec état de chargement)
```ts
readonly submitting = signal(false);
```
```html
<app-button
  variant="primary"
  [loading]="submitting()"
  [disabled]="submitting()"
  (clicked)="onSubmit()">
  Créer le ticket
</app-button>

<app-button variant="ghost" (clicked)="goBack()">Annuler</app-button>
<app-button variant="danger" (clicked)="askDelete()">Supprimer</app-button>
```

### Quand utiliser quelle variante
| Variante | Usage |
|----------|-------|
| `primary` | action principale d'un écran (1 seule par zone) |
| `secondary` | action secondaire à côté de la primaire |
| `ghost` | action discrète / tertiaire (Annuler, Voir, Rafraîchir) |
| `danger` | action destructrice (Supprimer, Réinitialiser) |

### Import
```ts
import { ButtonComponent } from '@app/shared/ui/button/button.component';
// @Component({ imports: [ButtonComponent] })
```

---

## `app-icon-button`

Bouton **icône seule** (actions de ligne de tableau, fermeture, etc.). L'icône est obligatoire.

### API exacte
| Membre | Type | Défaut | Sens |
|--------|------|--------|------|
| `icon` | `string` (**requis**) | — | input — classe FontAwesome |
| `variant` | `'ghost' \| 'primary' \| 'danger'` | `'ghost'` | input |
| `size` | `'sm' \| 'md'` | `'md'` | input |
| `disabled` | `boolean` | `false` | input |
| `ariaLabel` | `string` | `''` | input — **toujours le renseigner** (accessibilité) |
| `clicked` | `output<void>()` | — | sortie |

### Exemple
```html
<app-icon-button
  icon="fa-solid fa-pen"
  ariaLabel="Modifier l'élément"
  (clicked)="edit(row)" />

<app-icon-button
  icon="fa-solid fa-trash"
  variant="danger"
  ariaLabel="Supprimer"
  (clicked)="askDelete(row)" />
```

> ⚠️ Sans `ariaLabel`, le bouton est muet pour un lecteur d'écran. C'est un défaut bloquant
> en revue.

### Import
```ts
import { IconButtonComponent } from '@app/shared/ui/icon-button/icon-button.component';
```

---

## Pièges récurrents
- Confondre `(clicked)` (composant) et `(click)` (DOM). Utilise **`(clicked)`**.
- Oublier que `loading`/`disabled` bloquent l'émission → ne pas dupliquer le garde-fou côté handler
  (mais valider quand même les données dans `onSubmit`).
- Mettre des marges en dur autour du bouton : gère l'espacement depuis le **parent** (`flex` + `gap`).
