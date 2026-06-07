# 06 — Overlays & fichiers : `Modal`, `ConfirmDialog`, `Dropzone`

Les composants qui s'affichent **par-dessus** la page, et le sélecteur de fichiers.

---

## `app-modal` — fenêtre modale générique
| Membre | Type | Défaut |
|--------|------|--------|
| `open` | `boolean` (**requis**) | — |
| `title` | `string` | `''` |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` |
| `closed` | `output<void>()` | — (clic sur ✕ / fond / Échap) |
| *(contenu)* | `ng-content` | le corps |
| `[slot=footer]` | projection nommée | les boutons du pied |

> ⚠️ Le modal **ne se ferme pas tout seul** : `closed` est une *sortie*. Tu dois remettre ton
> signal `open` à `false` dans le handler. C'est volontaire (tu peux empêcher la fermeture).

### Exemple : formulaire en modale
```ts
readonly modalOpen = signal(false);
readonly name = signal('');

openModal()  { this.name.set(''); this.modalOpen.set(true); }
save()       { /* … POST … */ this.modalOpen.set(false); }
```
```html
<app-button (clicked)="openModal()">Ajouter</app-button>

<app-modal [open]="modalOpen()" title="Nouvel élément" size="md" (closed)="modalOpen.set(false)">
  <app-input label="Nom" [(value)]="name" />

  <div slot="footer">
    <app-button variant="ghost" (clicked)="modalOpen.set(false)">Annuler</app-button>
    <app-button [loading]="saving()" (clicked)="save()">Enregistrer</app-button>
  </div>
</app-modal>
```

---

## `app-confirm-dialog` — confirmation (oui / non)
Spécialisation du modal pour les confirmations, surtout les actions **destructrices**.

| Membre | Type | Défaut |
|--------|------|--------|
| `open` | `boolean` (**requis**) | — |
| `title` | `string` | `'Confirmer'` |
| `message` | `string` | `'Êtes-vous sûr de vouloir continuer ?'` |
| `confirmLabel` | `string` | `'Confirmer'` |
| `cancelLabel` | `string` | `'Annuler'` |
| `danger` | `boolean` | `false` (bouton de confirmation rouge) |
| `confirmed` | `output<void>()` | — |
| `cancelled` | `output<void>()` | — |

```ts
readonly confirmOpen = signal(false);

askDelete()  { this.confirmOpen.set(true); }
onConfirmed(){ this.confirmOpen.set(false); /* … DELETE … */ }
```
```html
<app-button variant="danger" (clicked)="askDelete()">Supprimer</app-button>

<app-confirm-dialog
  [open]="confirmOpen()"
  title="Supprimer l'élément ?"
  message="Cette action est irréversible."
  confirmLabel="Supprimer"
  [danger]="true"
  (confirmed)="onConfirmed()"
  (cancelled)="confirmOpen.set(false)" />
```
> Pattern réel : voir `reset.component` (réinitialisation GLPI derrière un ConfirmDialog).

---

## `app-dropzone` — dépôt de fichier (glisser-déposer + clic)
| Membre | Type | Défaut |
|--------|------|--------|
| `accept` | `string` | `''` (ex. `'.csv'`, `'image/*'`, `'.zip'`) |
| `multiple` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `label` | `string` | `'Glissez un fichier ici ou'` |
| `hint` | `string` | `''` (texte d'aide secondaire) |
| `icon` | `string` | `'fa-solid fa-cloud-arrow-up'` |
| `filesSelected` | `output<File[]>()` | — |

```ts
onFiles(files: File[]): void {
  const file = files[0];
  if (!file) return;
  // valider puis importer via le service…
}
```
```html
<app-dropzone
  accept=".csv"
  hint="Format attendu : CSV séparé par des virgules"
  (filesSelected)="onFiles($event)" />
```
> `filesSelected` émet **toujours un tableau** (`File[]`), même si `multiple=false` → prends
> `files[0]`.

---

## Imports
```ts
import { ModalComponent } from '@app/shared/ui/modal/modal.component';
import { ConfirmDialogComponent } from '@app/shared/ui/confirm-dialog/confirm-dialog.component';
import { DropzoneComponent } from '@app/shared/ui/dropzone/dropzone.component';
```

## Pièges récurrents
- Croire que le modal/dialog se ferme seul : remets **toujours** `open` à `false` dans les handlers
  `closed` / `confirmed` / `cancelled`.
- Oublier de réinitialiser le formulaire à l'ouverture (`openModal()` qui remet les signals à vide).
- Oublier `[danger]="true"` sur une suppression (le bouton doit être rouge).
- Lire `event` au lieu de `event[0]` sur `filesSelected`.
