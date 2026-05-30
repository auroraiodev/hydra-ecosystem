# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Hydra Ecosystem is a TCG (Trading Card Game) marketplace platform consisting of three deployable apps, a shared design system, and an external search proxy microservice.

```
Hydra-Admin/        # Merchant & admin management dashboard
  app/              # Next.js 16 (App Router, bun) — port 3001
  backend/          # NestJS 11 — port 3002
  theme/            # arcane-vault-ui design system (local dev)

Hydra-Shop/         # Customer marketplace (hydracollect.com)
  app/              # Next.js 16 (App Router + Turbopack, bun) — port 3000
  backend/          # NestJS 11 — port 3002
  theme/            # arcane-vault-ui design system (local dev)

Hydra-Stores/       # Seller dashboard (stores.hydracollect.com)
  app/              # Next.js 16 (App Router, bun) — port 3003
  backend/          # NestJS 11 — port 3002
  theme/            # arcane-vault-ui design system (local dev)

../mtgsrc/          # Standalone NestJS proxy for Hareruya/Importation card search — port 3006
```

Each project root has a `package.json` with unified scripts that run both Next.js and NestJS concurrently.

## Dev Commands

Run from each project's root directory (`Hydra-Admin/`, `Hydra-Shop/`, `Hydra-Stores/`):

```bash
bun run dev          # Start both Next.js + NestJS in watch mode
bun run build        # Build both
bun run lint         # Lint both
bun run type-check   # TypeScript check both
bun run test         # Test both

# Target individual layers:
bun --cwd app dev          # Next.js only
bun --cwd backend dev      # NestJS only
```

Run from `../mtgsrc/`:

```bash
bun run dev          # NestJS watch mode (port 3006)
bun run build        # nest build
```

## Backend Architecture (shared across all three apps)

All three backends are structurally identical NestJS apps. The key difference is `src/app.module.ts` — each includes a different subset of modules appropriate for its audience (Admin has extra `AdminModule`, `OcrModule`, `SellersModule`; FE has `AssistantModule`).

**Sub-application**: `backend/apps/catalog/` contains the Catalog and Search microservice code, which is currently loaded as a **monolithic fallback** into all three backends:

```
backend/src/             # Core NestJS app
  auth/                  # JWT + Google OAuth, Passport, guards
  orders/                # Order lifecycle + Mercado Pago webhooks
  listings/              # Seller inventory
  cart/, wallet/         # Cart and balance ledger
  notifications/         # Email (nodemailer) + web push (VAPID)
  chat/                  # socket.io chat gateway
  feature-flags/         # Maintenance mode guard + USE_*_MICROSERVICE flags

backend/apps/catalog/src/   # Catalog sub-app (loaded as inline module for now)
  products/              # TCG singles catalog
  search/                # Hybrid search (local DB + mtgsrc)
  importation/           # Importation card import: Hareruya → JPY→MXN, calls mtgsrc
  categories/, tcgs/, tags/, conditions/, languages/
```

The microservice flags (`USE_COMMERCE_MICROSERVICE`, `USE_ENGAGE_MICROSERVICE`, `USE_ADMIN_MICROSERVICE`) are set in `.env` but the backends currently always run in monolithic mode.

## mtgsrc Service

Lives at `c:\Users\demis\Code\mtgsrc` (separate directory, not inside this monorepo).

- Proxies card search queries to Hareruya, converts JPY→MXN, parses card metadata.
- Required by all three backends for `/search/hybrid` and the Importation import flow.
- Endpoint: `/search?cardName=X&tax=0.191&profit=0.20` — `tax` and `profit` are **required query parameters**.
- All three production `.env` files must set: `MTGSRC_SERVICE_URL=http://hydra-mtgsrc:3006`
- In Coolify, the mtgsrc container must have the Docker network alias `hydra-mtgsrc` set so it resolves on the `coolify` network.
- Local dev: `MTGSRC_SERVICE_URL=http://localhost:3006`

## Shared Database

All three backends share **the same PostgreSQL instance and Prisma schema**. The schema lives in each `backend/prisma/schema.prisma` (they are identical). Running `pnpm prisma:generate` in any one backend regenerates the client. Migrations should be run once — they affect the shared DB.

## Design System — arcane-vault-ui

Each project has a `theme/` directory containing the `arcane-vault-ui` component library (glassmorphism dark-mode design system). It is published to npm (`arcane-vault-ui`) and consumed by the Next.js apps. Local development uses the `theme/` copy.

- Tailwind CSS v4 tokens: `bg-surface`, `bg-surface-low`, vault-teal glassmorphism palette.
- Import styles in global CSS: `@import 'arcane-vault-ui/styles'` + `@source "../node_modules/arcane-vault-ui/dist"`.
- Storybook available: `pnpm storybook` in `theme/`.

## Deployment (Coolify)

- All three apps deploy as Docker containers on a Coolify-managed Ubuntu server (`87.99.141.73`).
- Containers join the `coolify` Docker network and resolve each other by container name.
- **`NEXT_PUBLIC_*` env vars are baked at Docker build time** (passed as `ARG` in the Dockerfile). Changing them requires a full rebuild, not just a container restart. This is critical: if `NEXT_PUBLIC_AUTH_SERVICE_URL` is wrong in the build args, OAuth redirects will go to the wrong URL.
- Each app exposes a `/api/v1/health` endpoint for Coolify health checks.
- Each app's `docker-compose.yml` is used for local reference; Coolify manages the production deployment directly.

## OAuth Flow Architecture

The admin app uses a proxy middleware (`app/proxy.ts`) that intercepts `/auth/google` and `/auth/google/callback` routes and rewrites them to the NestJS backend. Key points:

- `getAuthServiceUrl()` in `app/lib/api-config.ts` **automatically appends `/api/v1`** to `NEXT_PUBLIC_AUTH_SERVICE_URL`
- The `use-google-auth.ts` hook constructs: `${AUTH_SERVICE_URL}/auth/google?redirect_to=...`
- Session cookie is `__sid` (httpOnly, set on `.hydracollect.com` in production)
- On OAuth success, the backend redirects to `redirect_to` URL with `oauth_success=true` and `auth=<base64>` params

## Local Environment Setup

Each project uses a root-level `.env.local` for local dev (ignored by git). Copy from `.env` and adjust URLs to `localhost`. The `.env` file at each project root is the **production** configuration deployed to Coolify.

**Important URL distinction:**
- `NEXT_PUBLIC_AUTH_SERVICE_URL` — public URL for OAuth (baked into Docker image). Must be `https://admin.hydracollect.com` for admin, `https://hydracollect.com` for shop, etc.
- `AUTH_SERVICE_URL` (backend-only) — internal NestJS URL (`http://127.0.0.1:3002`)

Key local ports to know:
| Service | Port |
|---|---|
| Hydra-Shop (Next.js) | 3000 |
| Hydra-Admin (Next.js) | 3001 |
| NestJS backends | 3002 |
| Hydra-Stores (Next.js) | 3003 |
| mtgsrc | 3006 |
| Redis | 6379 |
