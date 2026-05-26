# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## hydra-admin: Management Dashboard

Next.js 16 (App Router) internal dashboard for merchants and admins.

## Dev Commands

```bash
bun run dev              # Dev server (port 3001)
bun run build            # Production build (standalone output)
bun run test             # Vitest unit tests
bun run lint             # ESLint
bun run type-check       # tsc --noEmit
bun run format           # Prettier --write
```

## Architecture

- **Framework**: Next.js 16 App Router + shadcn/ui (New York style).
- **Styling**: Tailwind CSS v4. shadcn primitives in `components/ui/`. Use `cn()` utility for conditional classes.
- **Auth**: JWT stored as `accessToken` in `localStorage`. User object stored as `user` in `localStorage`. No Supabase SDK used directly — auth is backend-JWT-based.
- **API**: Centralized `apiCall` wrapper in `lib/api.ts`. All resource-specific API functions (orders, products, listings, users) are defined there.
- **Analytics**: Recharts for charts. `@dnd-kit` for drag-and-drop reordering.

## Key Paths

```
app/(auth)/                          # Admin login route
app/(dashboard)/dashboard/           # All protected management routes
  orders/                            # Order CRUD + Mercado Pago payment flows
  products/                          # Product catalog management
  listings/                          # Seller inventory
  users/                             # User administration
components/ui/                       # shadcn/ui primitives (do not modify directly)
components/sidebar.tsx               # Sidebar navigation — add new routes here
lib/api.ts                           # All backend API calls + apiCall wrapper
```

## Patterns

- **Page split**: `page.tsx` exports metadata and renders a `*-content.tsx` client component. Keep `page.tsx` as a server component shell.
- **CRUD flows**: Use `Dialog` (from shadcn) for create/edit operations instead of separate pages.
- **Tables**: Responsive — card layout on mobile, table on desktop.
- **Toast feedback**: Use `sonner` (`toast.success`, `toast.error`) for user feedback after mutations.
- **New route**: Create the folder under `app/(dashboard)/dashboard/`, add a link to `components/sidebar.tsx`, add any API functions to `lib/api.ts`.
