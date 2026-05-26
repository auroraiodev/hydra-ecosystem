# hydra-be — Backend API

NestJS 11 REST API with Prisma ORM and PostgreSQL (Supabase).

## Dev

```bash
pnpm dev              # Watch mode → http://localhost:3002
pnpm build            # Production build
pnpm start:prod       # Run production build
pnpm prisma:generate  # Regenerate Prisma client
pnpm db:seed          # Seed database
pnpm test
```

## Architecture

```
src/
├── auth/          # JWT guards, strategies, decorators
├── products/      # TCG singles — search, listings
├── orders/        # Order processing + Mercado Pago
├── users/         # User profiles
├── categories/    # Product categories
├── search/        # Importation integration + hybrid search
├── common/        # Guards, interceptors, pipes, cache, queue
└── config/        # CORS, Swagger, OpenTelemetry
prisma/
└── schema.prisma  # Source of truth for DB schema
```

## Patterns

- All responses wrapped via `ResponseInterceptor`
- DTOs with `class-validator` for all inputs
- Standard Nest exceptions (`NotFoundException`, etc.)
- `@Public()` decorator to skip auth on a route

## Environment

Copy `.env.example` → `.env` and fill in:

```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
JWT_SECRET=
MERCADOPAGO_ACCESS_TOKEN=
FRONTEND_URL=https://hydracollect.com,https://admin.hydracollect.com
REDIS_URL=
```
