# 11 — Flux de données de bout en bout

Ce guide trace, pour chaque écran, le chemin complet **UI → service → GLPI → modèle → UI**.
Savoir tracer un flux = savoir déboguer et savoir construire.

---

## 1. Démarrage de l'application

```
main.ts → bootstrapApplication(App, appConfig)
  appConfig.providers:
    provideRouter(routes)
    provideHttpClient(withInterceptors([glpiAuthInterceptor]))
    provideAppInitializer(() => inject(GlpiSessionService).initAll())
                                   │
        initAll() ── Promise.all ──┼─ initV1Session() → GET /api.php/v1/initSession (user_token) → sessionToken
                                   └─ initV2Token()   → POST /api.php/token (OAuth)              → accessToken
  → l'app s'affiche, les tokens sont prêts, l'intercepteur les injecte sur chaque requête
```

---

## 2. Dashboard (back-office, lecture v1)

```
SuperCostComponent.ngOnInit
  forkJoin({ tickets: TicketV1Service.getAll(), items: ItemV1Service.getAll() }).subscribe
        │                              │
        │  GET /api.php/v1/Ticket      │  forkJoin(ASSET_TYPES → GET /api.php/v1/<type>?expand_dropdowns=1)
        │  map(mapTicket)              │  map(mapItem) ; .flat()
        ▼                              ▼
  this.tickets.set(...) ; this.items.set(...) ; loading.set(false)
        │
   computed itemsByType()  (compte par ASSET_TYPES)
   computed ticketsByType()/ticketsByStatus()  (via GLPI_TICKET_TYPE / GLPI_TICKET_STATUS)
        ▼
   template : @for (e of itemsByType()) → <app-badge>{{ e.count }}</app-badge>
```
Header d'auth ajouté par l'intercepteur (`Session-Token`).

---

## 3. Liste des éléments (front-office, lecture v2 + filtre)

```
ItemListComponent.ngOnInit
  ItemV2Service.getAll() → forkJoin(ASSET_TYPES → GET /api.php/v2/Assets/<type>) → map(mapItem) → .flat()
  .subscribe → items.set(data)

l'utilisateur tape / choisit un filtre :
  <app-search-input [(value)]="searchText" />  → searchText.set(x)
  <app-select [(value)]="filterType" />         → filterType.set(x)
        │
   computed filteredItems()  (filtre items() par texte/type/statut)
   computed rows()           (map → ligne affichable, assetLabel(item_type))
        ▼
   <app-table [columns]="columns" [rows]="rows()" />
```
Auth : `Bearer` (OAuth) ajouté par l'intercepteur sur `/api.php/v2/...`.

---

## 4. Fiche ticket (back-office, paramètre de route)

```
URL /back-office/tickets/42
  TicketDetailComponent.ngOnInit
    id = Number(route.snapshot.paramMap.get('id'))     // 42
    TicketV1Service.getById(42) → GET /api.php/v1/Ticket/42 → map(mapTicket) → ticket.set(t)
        ▼
    template : <app-card> + <app-badge>{{ statusLabel(t.status) }}</app-badge>
               (statusLabel = GLPI_TICKET_STATUS[code])
```

---

## 5. Création d'un ticket (front-office, écriture + liaisons)

```
TicketCreateComponent
  ngOnInit : ItemV2Service.getAll() → allItems.set(...)   (pour la sélection)
  l'utilisateur remplit le formulaire (signals titre/description/type/priority)
  + sélectionne des éléments (selectedIds: Set<number>)

  onSubmit :
    TicketV1Service.create({titre,description,type,priority})   → POST /api.php/v1/Ticket → {id}
      .pipe(concatMap(({id}) =>
        from(selectedItems).pipe(
          concatMap(item => TicketV1Service.addItem(id, item.item_type, item.id))  → POST /Item_Ticket
        )))
      .subscribe({ complete: → toast.success + navigate('/front-office/items'),
                   error:    → toast.error })
```
Remarque : `create` puis `addItem` en boucle **séquentielle** (`concatMap`), car les liaisons
ont besoin de l'`id` du ticket.

---

## 6. Import (back-office, orchestration multi-étapes)

Voir doc 09 §11 pour le schéma détaillé. Résumé du flux :
```
fichier déposé → handleFile → service.validateFile(file) → status 'validated'
clic "Lancer" → startImport :
   dropdown.clearCache()
   tasks = étapes validées → runStep(file,i)   (defer)
   from(tasks).pipe(concatMap(t$ => t$))         ← séquentiel : 0→1→2→3
       chaque étape : service.importFile → POST… → maj ImportStats → patchStep(status/result)
   le registre relie les étapes ; localStorage persiste
```

---

## 7. Reset (back-office, suppression ordonnée)

```
clic → confirm-dialog → onConfirmed
  ResetService.resetAll() :
    from(ENTITIES) ─concatMap─▶ GET /<entity>?range=0-9999 → ids
                    ─concatMap─▶ for each id : DELETE /<entity>/<id>?force_purge=1
  complete → registry.clearAll() + toast.success
```
Ordre `ENTITIES` = TicketCost → Item_Ticket → Document_Item → Ticket → Document → assets
(respect des clés étrangères).

---

## 8. Authentification du back-office

```
LoginComponent : password = signal(environment.backOfficePassword)  // prérempli
  onSubmit → AuthService.login(code)
     code === backOfficePassword ? localStorage + user.set(code) + navigate(dashboard) : erreur

navigation vers /back-office/* :
  authGuard → AuthService.isLoggedIn() ? true : redirect /back-office/login
```

---

## 9. Comment tracer un flux pour déboguer

1. **Pars de l'écran** : quel composant ? quel `ngOnInit` / quelle action ?
2. **Quel service** est appelé ? quelle méthode ?
3. **Quel endpoint** GLPI ? (v1 ? v2 ? quel header ajoute l'intercepteur ?)
4. **Quel mapping** transforme la réponse ?
5. **Quel signal** est mis à jour ? quel `computed` en dépend ?
6. **Quel bout de template** consomme ce signal ?

Garde ce fil rouge en tête : il répond à 90 % des « pourquoi ça n'affiche pas / pourquoi
ça plante ».

➡️ Ensuite : **`12-debugging.md`**.
