# 05 — La couche données : services & API GLPI

## 1. Authentification : `GlpiSessionService` + intercepteur

GLPI a **deux** mécanismes d'auth utilisés ici :
- **v1 (legacy)** : header `Session-Token` obtenu via `initSession` avec un `user_token`.
- **v2 (high-level)** : header `Authorization: Bearer <access_token>` obtenu par OAuth
  (`password grant`).

`GlpiSessionService` récupère les deux **au démarrage** (`initAll()` appelé par
`provideAppInitializer`) :

```ts
async initAll(): Promise<void> {
  await Promise.all([ this.initV1Session(), this.initV2Token() ]);
}
private async initV1Session() {
  const res = await firstValueFrom(this.http.get<{session_token:string}>(
    `${environment.glpi.v1ApiUrl}/initSession`,
    { headers: new HttpHeaders({ Authorization: `user_token ${environment.glpi.userToken}` }) }));
  this.sessionToken = res.session_token;
}
private async initV2Token() {
  const body = new URLSearchParams({ grant_type:'password', client_id, client_secret, username, password, scope:'api graphql' });
  const res = await firstValueFrom(this.http.post<{access_token:string}>(environment.glpi.tokenUrl, body.toString(),
    { headers: { 'Content-Type':'application/x-www-form-urlencoded' } }));
  this.accessToken = res.access_token;
}
```

Les tokens sont ensuite **injectés automatiquement** par l'intercepteur sur chaque requête.

## 2. `glpiAuthInterceptor` — le portier de toutes les requêtes

Un **intercepteur fonctionnel** (`HttpInterceptorFn`) ajoute les bons headers selon l'URL :

```ts
export const glpiAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(GlpiSessionService);

  if (req.url === environment.glpi.tokenUrl) return next(req);    // pas d'auth sur /token

  // ⚠️ On NE met PAS Content-Type:application/json si pas de corps (GET) ni si FormData.
  const isFormData = req.body instanceof FormData;
  const wantsJson  = req.body != null && !isFormData;

  if (req.url.startsWith(environment.glpi.v1ApiUrl)) {
    const token = session.getSessionToken();
    if (token) {
      const headers: Record<string,string> = { 'Session-Token': token };
      if (wantsJson) headers['Content-Type'] = 'application/json';
      req = req.clone({ setHeaders: headers });
    }
  }
  if (req.url.startsWith(environment.glpi.v2ApiUrl) || req.url.startsWith(environment.glpi.graphqlUrl)) {
    const token = session.getAccessToken();
    if (token) {
      const headers: Record<string,string> = { Authorization: `Bearer ${token}` };
      if (wantsJson) headers['Content-Type'] = 'application/json';
      req = req.clone({ setHeaders: headers });
    }
  }
  return next(req);
};
```

**Deux subtilités vitales (causes de bugs réels) :**
1. **Pas de `Content-Type: application/json` sur un GET sans corps** → sinon l'API v2 répond
   `400 "Contenu du JSON invalide"` (elle tente de parser un corps vide).
2. **Pas de `Content-Type` forcé sur un `FormData`** → le navigateur doit poser lui-même le
   `multipart/form-data; boundary=…`. Sinon l'upload d'images casse.

Branché dans `app.config.ts` :
```ts
provideHttpClient(withInterceptors([glpiAuthInterceptor]))
```

## 3. Les trois familles d'API et quand les utiliser

| API | Base (relative) | Header | Forme des données | Services |
|-----|-----------------|--------|-------------------|----------|
| **v1** | `/api.php/v1` | `Session-Token` | plat, `{input:{…}}` en écriture ; `expand_dropdowns=1` transforme les ids en **noms** (string) | `*-v1.service.ts`, tous les imports, reset, dropdown |
| **v2** | `/api.php/v2` | `Bearer` | endpoints `/Assets/Computer`, dropdowns = **objets** `{id,name}` | `item-v2.service.ts`, `ticket-v2.service.ts` |
| **GraphQL** | `/api.php/GraphQL` | `Bearer` | requêtes GraphQL | `glpi-graphql.service.ts` |

**Règle pratique du projet :**
- **Écrire** (POST/PUT/DELETE : import, reset, créer un ticket) → **v1**.
- **Lire le parc côté front-office** (liste filtrable) → **v2** (objets propres directement).
- **Lire pour le dashboard / les tickets back-office** → **v1**.

## 4. Anatomie d'un service de lecture v1 (`item-v1.service.ts`)

```ts
@Injectable({ providedIn: 'root' })
export class ItemV1Service {
  private readonly http = inject(HttpClient);
  private readonly base = environment.glpi.v1ApiUrl;
  private readonly params = new HttpParams().set('expand_dropdowns', '1'); // ids → noms

  getAll(): Observable<Item[]> {
    return forkJoin(
      ASSET_TYPES.map(cfg =>
        this.http.get<GlpiItemRaw[]>(`${this.base}/${cfg.itemtype}`, { params: this.params }).pipe(
          catchError(() => of([] as GlpiItemRaw[])),       // type sans données → vide
          map(raws => raws.map(raw => this.mapItem(raw, cfg))),
        )
      )
    ).pipe(map(lists => lists.flat()));
  }

  private mapItem(raw: GlpiItemRaw, cfg: AssetTypeConfig): Item {
    return {
      id: raw.id, name: raw.name,
      status: raw.states_id, location: raw.locations_id, manufacturer: raw.manufacturers_id,
      item_type: cfg.itemtype,
      model: String(raw[cfg.modelField] ?? ''),         // champ modèle dynamique !
      inventory_number: raw.otherserial,
      user: raw.contact || raw.users_id_tech,            // l'utilisateur CSV est stocké dans `contact`
    };
  }
}
```

Points à retenir :
- `HttpParams().set('expand_dropdowns','1')` → GLPI renvoie les **libellés** au lieu des ids
  (ex. `states_id: "En production"` au lieu de `2`).
- Le **champ modèle est dynamique** (`raw[cfg.modelField]`) car il diffère selon le type
  (`computermodels_id`, `monitormodels_id`, …) — voir doc 06/09 sur `ASSET_TYPES`.
- Le **mapping** transforme la forme brute en `Item` propre.

## 5. Anatomie d'un service de lecture v2 (`item-v2.service.ts`)

```ts
interface GlpiV2Item {
  id: number; name: string;
  otherserial: string | null; contact: string | null;
  status: { name: string } | null; location: { name: string } | null;
  manufacturer: { name: string } | null; model: { name: string } | null; user: { name: string } | null;
}

getAll(filter?: string): Observable<Item[]> {
  const params = filter ? new HttpParams().set('filter', filter) : undefined;
  return forkJoin(
    ASSET_TYPES.map(cfg =>
      this.http.get<GlpiV2Item[]>(`${this.base}/${cfg.v2Path}`, { params }).pipe(
        catchError(() => of([] as GlpiV2Item[])),
        map(items => items.map(i => this.mapItem(i, cfg.itemtype))),
      )
    )
  ).pipe(map(lists => lists.flat()));
}

private mapItem(raw: GlpiV2Item, type: ItemType): Item {
  return {
    id: raw.id, name: raw.name,
    status: raw.status?.name ?? '', location: raw.location?.name ?? '',
    manufacturer: raw.manufacturer?.name ?? '', item_type: type,
    model: raw.model?.name ?? '', inventory_number: raw.otherserial ?? '',
    user: raw.contact ?? raw.user?.name ?? '',
  };
}
```

> Même modèle `Item` en sortie, mais source différente : v2 renvoie des objets imbriqués,
> donc `raw.status?.name`. C'est l'**isolation par le mapping** (doc 02).

## 6. Anatomie d'un service d'écriture v1 (`ticket-v1.service.ts`)

```ts
create(data: CreateTicketInput): Observable<{ id: number }> {
  return this.http.post<{ id: number }>(this.base, {
    input: { name: data.titre, content: data.description, type: data.type, priority: data.priority },
  });
}
addItem(ticketId: number, itemtype: string, itemsId: number): Observable<void> {
  return this.http.post<void>(this.itemTicketBase, {
    input: { tickets_id: ticketId, itemtype, items_id: itemsId },
  });
}
```
**Conventions GLPI v1 en écriture :**
- Le corps est toujours `{ input: { …champs… } }`.
- Les liaisons sont des entités à part : un ticket ↔ un élément = une ligne `Item_Ticket`.
- Un POST renvoie `{ id, message }`. On récupère `id` pour enchaîner (cf. `concatMap`).

## 7. `GlpiDropdownService` — le pattern « find-or-create »

GLPI stocke beaucoup de valeurs comme **dropdowns** (tables séparées : `State`, `Location`,
`Manufacturer`, `ComputerModel`…). Pour créer un élément avec une localisation « Administration »,
il faut l'**id** de cette localisation. Si elle n'existe pas, il faut la **créer**.

```ts
@Injectable({ providedIn: 'root' })
export class GlpiDropdownService {
  private readonly cache = new Map<string, number>();          // évite les doublons & les appels répétés

  resolve(itemtype: string, name: string): Observable<number> {
    const clean = (name ?? '').trim();
    if (!clean) return of(0);
    const key = `${itemtype}::${clean.toLowerCase()}`;
    const cached = this.cache.get(key);
    if (cached !== undefined) return of(cached);

    const params = new HttpParams().set('searchText[name]', clean).set('range', '0-99');
    return this.http.get<{id:number;name:string}[]>(`${this.base}/${itemtype}`, { params }).pipe(
      catchError(() => of([])),
      switchMap(list => {
        const found = list.find(x => x.name.trim().toLowerCase() === clean.toLowerCase());
        if (found) { this.cache.set(key, found.id); return of(found.id); }
        return this.http.post<{id:number}>(`${this.base}/${itemtype}`, { input: { name: clean } })
          .pipe(map(res => { this.cache.set(key, res.id); return res.id; }));
      }),
    );
  }
  clearCache() { this.cache.clear(); }
}
```

Clés de compréhension :
- **Recherche exacte** côté client (`searchText` fait un *LIKE*, on filtre l'égalité stricte).
- **Cache** par `type::nom` : appelé en séquence (via `concatMap` côté import), il évite de
  recréer « Dell » à chaque ligne.
- `clearCache()` est appelé au début de chaque import (les dropdowns ont pu être supprimés).

## 8. `environment.ts` — la configuration

```ts
export const environment = {
  glpi: {
    v1ApiUrl: '/api.php/v1',          // relatif → passe par le proxy de dev
    v2ApiUrl: '/api.php/v2',
    graphqlUrl: '/api.php/GraphQL',
    tokenUrl: '/api.php/token',
    userToken: '…',                   // token v1
    oauth: { clientId, clientSecret, username, password, scope: 'api graphql' },
  },
  coreApiUrl: 'http://localhost:8080/api',
  backOfficePassword: 'admin1234',    // code d'accès back-office
};
```
URLs **relatives** ⇒ le navigateur appelle `localhost:4200/api.php/...` (même origine), et le
**proxy** relaie vers GLPI. Cela résout le CORS (voir doc 12).

## 9. Erreurs fréquentes (couche données)

| ❌ | ✅ |
|----|----|
| Lire le parc front-office en v1 et re-mapper à la main | utiliser `ItemV2Service` (objets prêts) |
| Oublier `expand_dropdowns=1` en v1 → on récupère des ids au lieu de noms | l'ajouter via `HttpParams` |
| Passer un nom de dropdown en écriture v1 | il faut l'**id** → `GlpiDropdownService.resolve` |
| Forcer `Content-Type json` sur un upload | laisser le navigateur gérer le `FormData` |
| Supposer `Num_Ticket === id GLPI` | les ids sont auto-incrémentés → passer par le registre |

➡️ Ensuite : **`06-gestion-etat.md`**.
