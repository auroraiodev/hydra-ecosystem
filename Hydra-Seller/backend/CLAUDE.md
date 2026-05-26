# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## hydra-be: NestJS Backend API

NestJS 11 + Express REST API and WebSocket server for the Hydra TCG platform.

## Dev Commands

```bash
pnpm dev               # Watch-mode dev server (port 3002)
pnpm build             # Production build
pnpm test              # Jest unit tests (src/**/*.spec.ts)
pnpm test:watch        # Jest watch mode
pnpm test:e2e          # E2E tests
pnpm lint              # ESLint with auto-fix
pnpm type-check        # TypeScript check
pnpm prisma:generate   # Regenerate Prisma client after schema changes
pnpm db:seed           # Seed roles, categories, and base data
```

For Prisma schema changes: edit `prisma/schema.prisma` → `pnpm prisma:generate` → `prisma db push` (dev) or `prisma migrate dev` (migration).

## Architecture

- **Pattern**: Controller → Service → PrismaService. Controllers are thin; business logic lives in services.
- **Auth**: Passport JWT (`JwtAuthGuard` applied globally). Use `@Public()` to exempt a route. Roles enforced via `RolesGuard` + `@Roles()` decorator. User roles: `ADMIN`, `CLIENT`, `SELLER`.
- **Validation**: All controller inputs go through class-validator DTOs. Never trust raw request body.
- **Responses**: `ResponseInterceptor` wraps all successful responses. Throw standard NestJS exceptions (`NotFoundException`, `BadRequestException`, etc.) for errors.
- **Real-time**: socket.io gateway in `src/chat/` and `src/notifications/` for live events.
- **Queue**: Bull jobs in `src/*/` processors for background work (email, push notifications, Importation imports).
- **Caching**: Redis via cache-manager for expensive queries.

## Key Paths

```
src/auth/               # JWT strategy, guards, OAuth handlers, refresh tokens
src/products/           # TCG singles (product catalog)
src/orders/             # Order lifecycle + Mercado Pago webhook handling
src/listings/           # Seller inventory listings
src/cart/               # Shopping cart operations
src/payments/           # Payment processing
src/search/             # Hybrid search + Importation integration
src/users/              # User profiles and accounts
src/importation/        # Card import service (JPY→MXN conversion)
src/assistant/          # AI chatbot (Gemini/Groq)
src/notifications/      # Email (nodemailer) + web push (VAPID)
src/wallet/             # User balance ledger
src/common/             # Guards, interceptors, pipes, cache utilities
src/config/             # CORS, Swagger, OpenTelemetry, Sentry setup
prisma/schema.prisma    # Source of truth for all database models
```

## Database

- PostgreSQL via Supabase. `DATABASE_URL` uses the pooling endpoint; `DIRECT_URL` is the direct connection (required for Prisma migrations).
- Key enums: `role_type` (ADMIN, CLIENT, SELLER), `order_status_enum`, `listing_status_enum`, `transaction_type`.
- Always run `pnpm prisma:generate` after modifying `schema.prisma`.

## Adding a New Module

1. `nest g module src/<name>` / `nest g service` / `nest g controller`
2. Create `dto/create-<name>.dto.ts` and `dto/update-<name>.dto.ts` with class-validator decorators
3. Inject `PrismaService` in the service
4. Register in the module's `imports`/`providers`/`exports` arrays
5. Mark public endpoints with `@Public()`; add `@Roles()` for role-restricted ones
