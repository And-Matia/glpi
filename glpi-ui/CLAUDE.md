# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server at http://localhost:4200
npm run build      # production build → dist/
npm test           # run unit tests with Vitest via Angular CLI
ng generate component path/to/name  # scaffold a component
```

## Architecture

Angular 21 standalone-component app with a clean architecture:

```
src/app/
  core/
    services/    # HTTP access + business logic + signal-based state
                 #   - glpi.service.ts  → native GLPI API (apirest.php), maps raw → app models
                 #   - item.service.ts / ticket.service.ts → glpi-core backend (clean DTOs)
                 #   - auth.service.ts, toast.service.ts
    guards/      # Functional route guards (e.g. auth.guard.ts)
    models/      # App-internal domain models (item, ticket, ticket-cost, dashboard-stats)
    constants/   # GLPI code↔label maps (status, priority, type)
  features/
    back-office/ # Admin portal — layout: AdminLayout + SidebarComponent
    front-office/# Store/customer portal — layout: StoreLayout + NavbarComponent
  shared/
    ui/          # Presentational-only components (see list below)
    components/  # Shared smart/composite components
```

Data layer (Option B): services call `HttpClient` directly. The GLPI raw shape
is mapped to clean internal models *inside the service* (private `mapXxx`
methods) — there is no separate http/serializer layer.

Each feature area has its own `layout/` shell and its feature pages as sibling folders (e.g. `tickets/ticket-list/`).

## Shared UI components

Custom components live in `src/app/shared/ui/`. These wrap Material/CDK where it saves boilerplate but keep a clean signal-based API.

| Component         | Selector               | Key inputs                                      |
|-------------------|------------------------|-------------------------------------------------|
| Input             | `app-input`            | `label`, `[(value)]`, `errorMessage`, `type`    |
| Textarea          | `app-textarea`         | `label`, `[(value)]`, `errorMessage`, `rows`    |
| Select            | `app-select`           | `label`, `options`, `[(value)]`, `errorMessage` |
| SearchInput       | `app-search-input`     | `[(value)]`, `placeholder`                      |
| Table             | `app-table`            | `columns`, `rows`, `searchKeys`                 |
| Modal             | `app-modal`            | `[open]`, `title`, `size` — `(closed)` output, `slot="footer"` for footer content |
| ConfirmDialog     | `app-confirm-dialog`   | `[open]`, `title`, `message`, `[danger]` — `(confirmed)` / `(cancelled)` outputs |
| Spinner           | `app-spinner`          | `size` (`sm`/`md`/`lg`)                         |
| ProgressBar       | `app-progress-bar`     | `value`, `max`, `variant`, `showLabel`          |
| Badge             | `app-badge`            | `variant`, `size`                               |
| Avatar            | `app-avatar`           | `name`, `src`, `size` — shows initials if no src |
| PageHeader        | `app-page-header`      | `title`, `subtitle` — `ng-content` for actions |
| EmptyState        | `app-empty-state`      | `icon`, `title`, `message`                      |
| Alert             | `app-alert`            | `variant`, `title`, `dismissible`               |
| Breadcrumb        | `app-breadcrumb`       | `items`                                         |
| Dropzone          | `app-dropzone`         | `accept`, `multiple` — `(filesSelected)` output |
| Skeleton          | `app-skeleton`         | `width`, `height`, `variant`                    |
| StatCard          | `app-stat-card`        | `label`, `value`, `icon`, `trend`               |

Toast is driven by `ToastService` (inject it, call `.success()` / `.error()` / `.warning()` / `.info()`). Place `<app-toast />` once in `app.html`.

## Angular Material / CDK — use directly in templates

Do not create `app-*` wrappers for these — use them straight from Material/CDK:

| Need                    | Use                                                        |
|-------------------------|------------------------------------------------------------|
| Button (primary/filled) | `<button mat-flat-button>`                                 |
| Button (text/ghost)     | `<button mat-button>`                                      |
| Button (outlined)       | `<button mat-stroked-button>`                              |
| Button (danger/warn)    | `<button mat-flat-button color="warn">`                    |
| Icon button             | `<button mat-icon-button>`                                 |
| Card                    | `<mat-card>` + `<mat-card-header>` + `<mat-card-content>` |
| Tabs                    | `<mat-tab-group>` + `<mat-tab>`                            |
| Paginator               | `<mat-paginator>`                                          |
| Tooltip                 | `matTooltip="text"` directive                              |
| Checkbox                | `<mat-checkbox>`                                           |
| Toggle / switch         | `<mat-slide-toggle>`                                       |
| Divider                 | `<mat-divider>`                                            |
| Chip                    | `<mat-chip>` / `<mat-chip-set>`                            |
| Date picker             | `<mat-datepicker>` + `<mat-form-field>`                    |
| Autocomplete            | `<mat-autocomplete>`                                       |
| Menu                    | `<mat-menu>`                                               |
| Stepper                 | `<mat-stepper>`                                            |
| Virtual scroll          | `<cdk-virtual-scroll-viewport>`                            |
| Drag & drop             | `cdkDrag` / `cdkDropList`                                  |

`app-modal` uses CDK focus trap + scroll blocking internally — callers still use `<app-modal>`.

## Key conventions

- All components use `ChangeDetectionStrategy.OnPush` and Angular signals (`signal`, `computed`, `input`, `model`).
- Use `inject()` — never constructor injection.
- Path alias `@app/*` → `src/app/*` is configured in `tsconfig.json`.
- CSS uses design tokens only (never hard-coded values). Tokens: `src/styles/variables.css` (spacing, typography, radius, shadows) and `src/styles/colors.css` (palette + semantic colors).
- Test runner is **Vitest** (not Karma/Jest) via `@angular/build`.
- Feature components inject services from `core/services/` — they never call `HttpClient` directly.
