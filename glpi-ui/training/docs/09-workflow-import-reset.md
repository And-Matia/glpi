# 09 — Le workflow Import / Reset (logique métier centrale)

C'est la fonctionnalité la plus riche du projet. La comprendre = comprendre comment les
couches collaborent (composant → services → registre → GLPI), comment RxJS orchestre, et
comment on gère les dépendances entre données.

---

## 1. Les 4 fichiers à importer

| Étape | Fichier | Contenu | Endpoint GLPI | Dépend de |
|------|---------|---------|---------------|-----------|
| 0 | **Feuille 1** (CSV) | Éléments (Computer/Monitor…) | `/Computer`, `/Monitor`… | — |
| 1 | **Feuille 2** (CSV) | Tickets + liste d'éléments associés | `/Ticket`, `/Item_Ticket` | étape 0 |
| 2 | **Feuille 3** (CSV) | Coûts des tickets | `/TicketCost` | étape 1 |
| 3 | **ZIP** | Images nommées comme les éléments | `/Document`, `/Document_Item` | étape 0 |

**Ordre imposé** : éléments → tickets → coûts → images, car chaque étape référence la
précédente.

### Exemples de données (réelles)
```
# Feuille 1
Name,Status,Location,Manufacturer,Item_Type,Model,Inventory_Number,User
PC-ADM-001,En production,Administration,Dell,Computer,OptiPlex 7010,ITU-2026-0001,Rakoto Jean

# Feuille 2
Ref_Ticket,Date,Heure,Type,Titre,Description,Status,Priority,Items
2,04/06/2026,13:45,Incident,Michauffe,mamay be,New,Medium,"[""PC-ADM-001"",""MN-FORM-002""]"

# Feuille 3
Num_Ticket,Duration_second,Time_Cost,Fixed_Cost
1,600,"8,7",50
```

---

## 2. Le parsing CSV générique (`core/utils/csv.utils.ts`)

```ts
parseCsvText<T>(text, mapper): ParseResult<T>     // { rows: T[], errors: {row,error}[] }
```
- Gère les guillemets et les virgules échappées (`parseCsvLine`).
- Le `mapper(record)` reçoit un objet `{ entête: valeur }` et **renvoie la ligne typée ou
  lève une erreur** (collectée, pas bloquante).
- `parseFrenchFloat("8,7")` → `8.7` (les CSV utilisent la virgule décimale).

```ts
parseCsvText<ItemRow>(text, record => {
  if (!record['Name']) throw new Error('Nom manquant');
  if (!ASSET_ITEMTYPES.includes(record['Item_Type'])) throw new Error(`Type inconnu`);
  return { name: record['Name'], status: record['Status'] ?? '', /* … */ };
});
```

---

## 3. La config extensible des assets (`ASSET_TYPES`)

Le projet ne code PAS en dur « Computer/Monitor ». Tout passe par une table centrale
(`core/constants/glpi.constants.ts`) :

```ts
function asset(itemtype, label): AssetTypeConfig {
  return { itemtype, label,
    v2Path:     `Assets/${itemtype}`,                 // ex. "Assets/Printer"
    modelType:  `${itemtype}Model`,                   // ex. "PrinterModel"
    modelField: `${itemtype.toLowerCase()}models_id`, // ex. "printermodels_id"
  };
}
export const ASSET_TYPES = [ asset('Computer','Ordinateur'), asset('Monitor','Moniteur'),
  asset('Printer','Imprimante'), asset('Phone','Téléphone'),
  asset('Peripheral','Périphérique'), asset('NetworkEquipment','Équipement réseau') ];

export const ASSET_ITEMTYPES = ASSET_TYPES.map(a => a.itemtype);
export function assetType(itemtype: string) { return ASSET_TYPES.find(a => a.itemtype === itemtype); }
```

➡️ **Ajouter un type d'asset = ajouter UNE ligne.** Tous les services (import, lecture v1/v2,
reset) et l'UI (filtres, dashboard) en découlent automatiquement. C'est un pattern
**Open/Closed** : ouvert à l'extension, fermé à la modification.

---

## 4. Étape 0 — import des éléments (`item-import.service.ts`)

Problème : un élément GLPI référence des **dropdowns** par id (statut, localisation,
fabricant, modèle). Le CSV donne des **noms**. Il faut donc résoudre (ou créer) chaque
dropdown, puis créer l'élément.

```ts
private importRow(row: ItemRow): Observable<{ id: number }> {
  const cfg = assetType(row.item_type)!;                       // config du type
  return forkJoin({                                            // 4 dropdowns EN PARALLÈLE
    states_id:        this.dropdown.resolve('State', row.status),
    locations_id:     this.dropdown.resolve('Location', row.location),
    manufacturers_id: this.dropdown.resolve('Manufacturer', row.manufacturer),
    model_id:         this.dropdown.resolve(cfg.modelType, row.model),
  }).pipe(
    switchMap(({ states_id, locations_id, manufacturers_id, model_id }) =>
      this.http.post<{ id:number }>(`${this.base}/${cfg.itemtype}`, {
        input: {
          name: row.name, otherserial: row.inventory_number,
          contact: row.user,                                   // l'utilisateur va dans `contact`
          states_id, locations_id, manufacturers_id,
          [cfg.modelField]: model_id,                          // champ modèle dynamique
        },
      })
    )
  );
}
```
Et la boucle séquentielle (pour partager le cache de dropdowns) :
```ts
from(rows).pipe(
  concatMap((row, i) => this.importRow(row).pipe(
    map(({ id }) => { stats.success++; this.registry.registerItem(row.name, id, row.item_type); return null; }),
    catchError(err => { stats.failed++; stats.errors.push({ row: i+2, error: … }); return of(null); }),
  )),
  toArray(), map(() => stats),
);
```
**Décisions de conception à comprendre :**
- `contact` reçoit le « User » du CSV (les valeurs sont des noms libres, parfois des groupes
  comme « ITU Labs » → un champ texte est le choix robuste, visible dans GLPI).
- `states_id` : les statuts (`En production`…) **n'existent pas par défaut** dans GLPI → ils
  sont créés via `dropdown.resolve('State', …)`. (Sinon le statut serait perdu.)
- Chaque élément créé est **enregistré dans le registre** (`name → {id, item_type}`) pour les
  étapes suivantes.

---

## 5. Étape 1 — import des tickets (`ticket-import.service.ts`)

Patron « POST parent → lier enfants » :
```ts
this.http.post<{id:number}>(`${this.base}/Ticket`, { input: { name, content, type, status, priority, date } }).pipe(
  switchMap(({ id: ticketId }) => {
    this.registry.registerTicket(row.ref_ticket, ticketId);          // réf CSV → id GLPI
    const items = row.items.map(n => this.registry.getItem(n)).filter(Boolean);
    if (!items.length) return of(void 0);
    return from(items).pipe(
      concatMap(item => this.http.post(this.itemTicket, { input: { tickets_id: ticketId, itemtype: item.item_type, items_id: item.id } })
        .pipe(catchError(() => of(void 0)))),
      toArray(), map(() => void 0),
    );
  })
);
```
- Le champ `Items` du CSV est du JSON (`'["PC-ADM-001","MN-FORM-002"]'`) → parsé en tableau.
- On retrouve l'id GLPI de chaque élément **via le registre** (rempli à l'étape 0).
- Les mappings `Incident→1`, `New→1`, `Medium→3`… viennent des constantes
  (`TICKET_TYPE_CODE`, `TICKET_STATUS_CODE`, `TICKET_PRIORITY_CODE`).
- La date `03/06/2026` + `13:45` → `2026-06-03 13:45:00` (`toGlpiDate`).

---

## 6. Étape 2 — import des coûts (`ticket-cost-import.service.ts`)

```ts
private importRow(row: TicketCostRow): Observable<void> {
  const ticketId = this.registry.getTicketId(row.num_ticket);
  if (ticketId === undefined) {
    return throwError(() => new Error(
      `Ticket #${row.num_ticket} introuvable : importez d'abord la feuille des tickets (feuille 2).`));
  }
  return this.http.post<void>(`${this.base}/TicketCost`, {
    input: { tickets_id: ticketId, actiontime: row.duration_second, cost_time: row.time_cost, cost_fixed: row.fixed_cost },
  });
}
```
> ⚠️ **Piège majeur :** `Num_Ticket` (CSV) ≠ id GLPI. Les ids GLPI sont **auto-incrémentés**
> (on a observé des tickets créés en id 2 et 3, pas 1 et 2). Il **faut** passer par le
> registre. Faire `tickets_id: row.num_ticket` attacherait le coût au **mauvais** ticket.

---

## 7. Étape 3 — import des images (`image-import.service.ts`)

Le plus impératif → écrit en `async/await`.

```ts
importFile(file): Observable<ImportStats> {
  return defer(() => from(this.run(file)));   // ⚠️ defer : ne démarre qu'à la souscription
}

private async run(file: File): Promise<ImportStats> {
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter(f =>
    !f.dir && !f.name.split('/').some(seg => seg.startsWith('__MACOSX') || seg.startsWith('._')));
  for (const entry of entries) {
    const bytes = await entry.async('uint8array');
    const kind  = detectImage(bytes);                  // vrai type via magic bytes
    const itemName = itemNameFromPath(entry.name);     // "images/PC-ADM-001.png" → "PC-ADM-001"
    const target   = await this.findItem(itemName);    // registre, sinon recherche API
    const docId    = await this.uploadDocument(`${itemName}.${kind.ext}`, bytes, kind.mime, itemName);
    await this.linkDocument(docId, target.type, target.id);   // Document_Item
  }
}
```
**Trois subtilités vitales :**
1. **`defer`** : sans lui, `this.run()` (async) démarrerait *immédiatement* à la construction
   de l'observable, donc **en parallèle** de l'import des éléments → l'image chercherait des
   éléments qui n'existent pas encore. *(Bug réel corrigé.)*
2. **Détection du vrai type** (`detectImage` lit les *magic bytes*) : certains fichiers `.png`
   sont en réalité des **JPEG**. GLPI 11 **valide le contenu vs l'extension** → on renomme à
   la vraie extension (`.jpg`) avant l'upload, sinon « Type de fichier invalide ».
3. **Upload `FormData`** : `uploadManifest` (JSON avec `_filename`) + `filename[0]` (le blob).
   L'intercepteur ne doit PAS forcer `Content-Type` (le navigateur pose le boundary).
4. `findItem` : d'abord le **registre** (même run), sinon **recherche API** par nom sur tous
   les `ASSET_ITEMTYPES` → permet d'importer les images **seules** si les éléments existent
   déjà dans GLPI.

---

## 8. Le registre : le liant entre fichiers (`ImportRegistryService`)

Voir doc 06. Il mappe `nom élément → {id, type}` et `réf CSV ticket → id GLPI`, **persisté en
localStorage**. C'est lui qui permet :
- les liaisons ticket↔éléments (étape 1) ;
- l'attribution correcte des coûts (étape 2) ;
- le rattachement des images (étape 3) ;
- et tout ça **même si les imports sont lancés séparément** (le registre survit).

Le registre est vidé lors d'un **reset** (sinon il pointerait vers des ids supprimés).

---

## 9. L'orchestration UI (`import.component.ts`)

```ts
startImport(): void {
  this.dropdown.clearCache();                       // re-valider les dropdowns (après un reset)
  const tasks = this.steps()
    .map((step, i) => ({ step, i }))
    .filter(({ step }) => step.status === 'validated' && step.selectedFile)
    .map(({ step, i }) => this.runStep(step.selectedFile!, i));
  from(tasks).pipe(concatMap(task$ => task$), toArray()).subscribe();   // étapes EN SÉQUENCE
}

private runStep(file, index): Observable<ImportStats> {
  return defer(() => {                               // ⚠️ defer : chaque étape démarre À SON TOUR
    this.patchStep(index, { status: 'importing' });
    return this.getService(index).importFile(file);
  }).pipe(
    tap(stats => this.patchStep(index, { result: stats, status: stats.failed && !stats.success ? 'error' : 'done', errorMsg: … })),
    catchError(err => { this.patchStep(index, { status: 'error', errorMsg: … }); return throwError(() => err); }),
  );
}
```
- Chaque service expose la **même interface** : `validateFile(file): Promise<string[]>` et
  `importFile(file): Observable<ImportStats>`. Le composant les traite uniformément
  (`getService(index)`).
- `concatMap` garantit l'**ordre** (éléments avant tickets avant coûts avant images).
- `defer` (dans `runStep` ET dans l'image service) garantit que rien ne s'exécute avant son
  tour. **C'est le point le plus subtil : `.map(() => runStep(...))` appelle `runStep`
  immédiatement** ; sans `defer`, les `importFile()` partiraient tous en parallèle.

---

## 10. La réinitialisation (`reset.service.ts`)

```ts
const ENTITIES = ['TicketCost', 'Item_Ticket', 'Document_Item', 'Ticket', 'Document', ...ASSET_ITEMTYPES];

resetAll(): Observable<void> {
  return from(ENTITIES).pipe(
    concatMap(entityType =>
      this.http.get<{id:number}[]>(`${this.baseUrl}/${entityType}?range=0-9999`).pipe(
        map(items => items.map(i => i.id)),
        catchError(() => of([] as number[])),       // entité vide → on continue
        concatMap(ids => from(ids)),
        concatMap(id => this.http.delete(`${this.baseUrl}/${entityType}/${id}?force_purge=1`).pipe(catchError(() => of(undefined)))),
      )
    )
  );
}
```
- **Ordre de suppression** = respect des clés étrangères : liaisons/coûts d'abord, puis
  tickets/documents, puis les éléments (`...ASSET_ITEMTYPES`).
- `force_purge=1` = suppression définitive (pas la corbeille).
- `catchError → of(...)` partout pour qu'une entité vide ou une suppression ratée n'arrête pas
  le processus.
- Côté composant, au succès : `registry.clearAll()` (cohérence) + toast.

---

## 11. Schéma global

```
[Import UI]
  step0 ─concatMap─▶ ItemImport ──forkJoin(dropdowns)──▶ POST /Computer ──▶ registry.registerItem
  step1 ─concatMap─▶ TicketImport ─POST /Ticket─▶ registry.registerTicket ─concatMap─▶ POST /Item_Ticket
  step2 ─concatMap─▶ TicketCostImport ─registry.getTicketId─▶ POST /TicketCost
  step3 ─concatMap─▶ ImageImport ─JSZip─▶ detect ─findItem(registry|API)─▶ POST /Document ─▶ POST /Document_Item
                                  (registre persistant relie tout ça)
[Reset UI] ─▶ ResetService (DELETE force_purge, ordre FK) ─▶ registry.clearAll()
```

## 12. Erreurs fréquentes

| ❌ | ✅ |
|----|----|
| `tickets_id: num_ticket` | passer par `registry.getTicketId(num_ticket)` |
| `from(this.run(file))` sans `defer` | `defer(() => from(this.run(file)))` |
| Uploader un `.png` qui est un JPEG | détecter le vrai type + renommer l'extension |
| Coder en dur Computer/Monitor | passer par `ASSET_TYPES` / `assetType()` |
| Oublier de créer les dropdowns (statut, etc.) | `GlpiDropdownService.resolve` |
| Reset sans supprimer dans le bon ordre | liaisons → tickets/docs → éléments |

➡️ Ensuite : **`10-conventions-bonnes-pratiques.md`**.
