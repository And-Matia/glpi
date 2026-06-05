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

Angular 21 standalone-component app with a clean architecture split into three layers:

```
src/app/
  core/
    http/        # Raw HTTP calls only — one file per resource (e.g. ticket.http.ts)
    services/    # Business logic + signal-based state (e.g. ticket.service.ts, auth.service.ts, toast.service.ts)
    guards/      # Functional route guards (e.g. auth.guard.ts)
    models/      # Shared interfaces used across multiple http files
  features/
    back-office/ # Admin portal — layout: AdminLayout + SidebarComponent
    front-office/# Store/customer portal — layout: StoreLayout + NavbarComponent
  shared/
    ui/          # Presentational-only components (see list below)
    components/  # Shared smart/composite components
```

Each feature area has its own `layout/` shell and its feature pages as sibling folders (e.g. `tickets/ticket-list/`).

## Shared UI components

| Component         | Selector               | Key inputs                                      |
|-------------------|------------------------|-------------------------------------------------|
| Button            | `app-button`           | `variant`, `size`, `loading`, `disabled`        |
| Badge             | `app-badge`            | `variant`, `size`                               |
| Input             | `app-input`            | `label`, `[(value)]`, `errorMessage`, `type`    |
| Textarea          | `app-textarea`         | `label`, `[(value)]`, `errorMessage`, `rows`    |
| Select            | `app-select`           | `label`, `options`, `[(value)]`, `errorMessage` |
| SearchInput       | `app-search-input`     | —                                               |
| Table             | `app-table`            | `columns`, `rows`, `searchKeys`                 |
| Modal             | `app-modal`            | `[open]`, `title`, `size` — `(closed)` output, `slot="footer"` for footer content |
| ConfirmDialog     | `app-confirm-dialog`   | `[open]`, `title`, `message`, `[danger]` — `(confirmed)` / `(cancelled)` outputs |
| Card              | `app-card`             | `title`, `[padding]` — `slot="header-actions"` for header buttons |
| Badge             | `app-badge`            | `variant`, `size`                               |
| Spinner           | `app-spinner`          | `size`                                          |
| Tabs              | `app-tabs`             | `tabs`, `[(activeKey)]`                         |
| Avatar            | `app-avatar`           | `name`, `src`, `size` — shows initials if no src |
| Pagination        | `app-pagination`       | `total`, `pageSize`, `[(page)]`                 |
| Tooltip           | `app-tooltip`          | `text`, `position` — wraps any element          |
| Divider           | `app-divider`          | `label` (optional)                              |
| PageHeader        | `app-page-header`      | `title`, `subtitle` — `ng-content` for actions |
| EmptyState        | `app-empty-state`      | `icon`, `title`, `message`                      |

Toast is driven by `ToastService` (inject it, call `.success()` / `.error()` / `.warning()` / `.info()`). Place `<app-toast />` once in `app.html`.

## Key conventions

- All components use `ChangeDetectionStrategy.OnPush` and Angular signals (`signal`, `computed`, `input`, `model`).
- Use `inject()` — never constructor injection.
- Path alias `@app/*` → `src/app/*` is configured in `tsconfig.json`.
- CSS uses design tokens only (never hard-coded values). Tokens: `src/styles/variables.css` (spacing, typography, radius, shadows) and `src/styles/colors.css` (palette + semantic colors).
- Test runner is **Vitest** (not Karma/Jest) via `@angular/build`.
- Feature components inject services from `core/services/` — never from `core/http/` directly.
