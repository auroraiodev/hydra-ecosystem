# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## hydra-fe: Customer Marketplace

Next.js 16 (App Router + Turbopack) storefront for the Hydra TCG platform.

## Dev Commands

```bash
pnpm dev           # Dev server with Turbopack (port 3000)
pnpm build         # Production build (standalone output)
pnpm test          # Jest unit tests
pnpm test:watch    # Jest watch mode
pnpm test:e2e      # Playwright E2E tests
pnpm lint          # ESLint with auto-fix
pnpm type-check    # TypeScript check
pnpm storybook     # Component explorer (port 6006)
```

## Architecture

- **Routing**: `app/(marketplace)/` for the public storefront; `app/(auth)/` for login/register/OAuth callbacks.
- **State**: Redux Toolkit for global state (auth, cart, wishlist) in `lib/store/slices/`. React Query for server data. Local `useState` for component-level state.
- **Auth**: Supabase Auth (Google OAuth + email/password). JWT stored in localStorage. Auth state driven by `hooks/useAuth.ts` Redux slice.
- **API**: Axios clients in `lib/api/`. Server requests proxy through `/api/` rewrite to the backend.
- **Real-time**: socket.io-client connects to backend for live order/notification updates.
- **Styling**: Tailwind CSS v4. Use theme tokens (`bg-surface`, `bg-surface-low`) and dark-mode-aware classes (`dark:bg-zinc-900`). Glassmorphism / Arcane Vault aesthetic.
- **PWA**: next-pwa configured for offline capability.

## Key Paths

```
app/(marketplace)/          # Public storefront routes
app/(auth)/                 # Auth flow routes
components/ui/              # Primitive, reusable components (barrel export via index.ts)
components/layout/          # Navbar, Footer, Sidebar
lib/api/                    # Axios-based API client modules
lib/store/slices/           # Redux feature slices
hooks/                      # Custom React hooks
middleware.ts               # Protected route enforcement
```

## Patterns

- **Components**: Functional + TypeScript interfaces. PascalCase names. Use `forwardRef` when exposing refs. No business logic in `components/ui/`.
- **Imports**: Absolute imports with `@/`. Barrel exports from `components/ui/index.ts`. Group: external → internal → relative.
- **Page entry**: Wrap content in `animate-page-enter` class for transition consistency.
- **Protected routes**: Add new guarded paths to `middleware.ts`.
- **New UI**: Is it reusable? → `components/ui/`. Layout? → `components/layout/`. Page-specific? → `app/[page]/components/`.
- **New logic**: Utility → `lib/utils/`. Hook → `hooks/`. API call → `lib/api/`. Global state → `lib/store/slices/`.
