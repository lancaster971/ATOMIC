# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
make install          # Install all dependencies (frontend + local Supabase)
make start            # Start full stack (Supabase + Vite dev server)
make stop             # Stop Supabase
make start-demo       # Start with in-memory FakeRest data provider (no Supabase needed)
make build            # Production build (tsc + vite build)
make test             # Run vitest
make typecheck        # TypeScript type checking
make lint             # ESLint + Prettier checks
```

### Running a Single Test

```bash
npx vitest src/path/to/file.test.ts
```

Vitest uses globals (`describe`, `it`, `expect` available without imports). Test files: `*.test.ts` or `*.test.tsx`.

### Database Migrations

```bash
npx supabase migration new <name>   # Create migration
npx supabase migration up            # Apply locally
npx supabase db push                 # Push to remote
npx supabase db reset                # Reset local DB (destructive)
```

### Registry

```bash
make registry-gen     # Generate registry.json (also runs on pre-commit via Husky)
make registry-build   # Build shadcn registry
```

If `registry.json` misses changes, update `scripts/generate-registry.mjs` to include them.

## Architecture

Atomic CRM is a CRM built with **React 19 + TypeScript + Vite**, using **ra-core** (React Admin headless) for application logic and **Shadcn UI** for the UI layer, backed by **Supabase** (PostgreSQL).

### How the App Wires Together

`src/App.tsx` renders `<CRM>` (from `src/components/atomic-crm/root/CRM.tsx`), which:
- Wraps ra-core's `CoreAdminContext` + `CoreAdminUI` to provide data fetching, auth, i18n, and store
- Defines resources: deals, contacts, companies, contact_notes, deal_notes, tasks, sales, tags
- Switches between desktop (`DesktopAdmin`) and mobile (`MobileAdmin`) layouts
- Accepts configuration props (sectors, deal stages, themes, logo, etc.) via `CRMProps`
- Uses `PersistQueryClientProvider` (TanStack Query v5) for offline-first mobile support

### Dual Data Provider System

Two interchangeable data providers implement the same `CrmDataProvider` interface:

1. **Supabase** (`src/components/atomic-crm/providers/supabase/`) — default, uses `ra-supabase-core`. Maps resources to DB views (e.g., contacts → `contacts_summary`, companies → `companies_summary`). Requires `VITE_SUPABASE_URL` and `VITE_SB_PUBLISHABLE_KEY`.

2. **FakeRest** (`src/components/atomic-crm/providers/fakerest/`) — in-memory mock using `ra-data-fakerest`. Activated when `VITE_IS_DEMO=true` or via `make start-demo`. Data generators use `faker` in `providers/fakerest/dataGenerator/`. A `supabaseAdapter` translates `field@operator` filter syntax to FakeRest format.

Shared logic lives in `src/components/atomic-crm/providers/commons/` (avatars, merge contacts, activity logs, permissions).

### Mutable Dependencies

These directories are **meant to be modified directly**:
- `src/components/admin/` — Shadcn Admin Kit framework (wraps ra-core)
- `src/components/ui/` — Shadcn UI components

### Filter Convention

List filters use the `ra-data-postgrest` format: `field_name@operator` (e.g., `first_name@eq`, `tags@cs`). The FakeRest adapter maps these at runtime.

### Database Views and Triggers

- Complex queries use PostgreSQL views (e.g., `contacts_summary` aggregates task counts)
- User data syncs between `auth.users` and the CRM's `sales` table via triggers (`supabase/migrations/20240730075425_init_triggers.sql`)

### Edge Functions

Located in `supabase/functions/`: user management (create/update/disable accounts) and inbound email webhook processing.

## Key Files

- **Types**: `src/components/atomic-crm/types.ts` — all domain types (Contact, Company, Deal, Task, Sale, Note, Tag)
- **Configuration context**: `src/components/atomic-crm/root/ConfigurationContext.tsx` — runtime config shape
- **Constants**: `src/components/atomic-crm/consts.ts` — event constants
- **Environment**: `.env.development` — local Supabase URLs and keys

## Code Conventions

### ESLint Rules (flat config)

- `no-console`: **error** — use `console.warn` or `console.error` only
- `@typescript-eslint/no-unused-vars`: error, but variables prefixed with `_` are ignored
- `@typescript-eslint/no-explicit-any`: off in `src/components/atomic-crm/`, enforced in `src/components/admin/`, `src/hooks/`, `src/lib/`
- `@typescript-eslint/consistent-type-imports`: warn — use `import type` when importing only types
- `react-refresh/only-export-components`: warn

### Path Aliases

- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`

### Styling

Tailwind CSS v4 with Shadcn's "new-york" style. Themes customizable via `lightTheme`/`darkTheme` CRM props.

## Modifying Data Structures

When adding/changing contact or company fields:
1. Create a DB migration
2. Update the relevant DB view(s)
3. Update `src/components/atomic-crm/contacts/contacts_export.csv` (sample CSV)
4. Update `src/components/atomic-crm/contacts/useContactImport.tsx`
5. Update FakeRest data generators in `providers/fakerest/dataGenerator/`
6. Update export functions and contact merge logic (`providers/commons/mergeContacts.ts`)

## Local Services

- Frontend: http://localhost:5173/
- Supabase Dashboard: http://localhost:54323/
- REST API: http://127.0.0.1:54321
- Inbucket (email testing): http://localhost:54324/
