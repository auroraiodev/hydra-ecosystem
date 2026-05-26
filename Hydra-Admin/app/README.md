# hydra-admin — Admin Dashboard

Internal management dashboard for Hydra merchants and admins. Built with Next.js 16 + shadcn/ui.

## Dev

```bash
pnpm dev        # → http://localhost:3001
pnpm build      # Production build (standalone output)
pnpm lint
pnpm type-check
pnpm test       # Vitest
```

## Key Features

- Order management + supplemental Mercado Pago payments
- Product and listing management
- User management
- Sales analytics (Recharts)

## Structure

```
app/
└── (dashboard)/dashboard/
    ├── orders/      # Order management + payment flows
    ├── products/    # Product catalog
    ├── listings/    # Seller listings
    └── users/       # User management
components/
├── ui/              # shadcn/ui primitives
└── sidebar.tsx      # Navigation config
lib/
└── api.ts           # Centralized API client
```

## Patterns

- CRUD pages split into `page.tsx` (metadata) + `*-content.tsx` (client)
- `Dialog` for create/edit operations
- `sonner` for toast notifications
- Responsive: cards on mobile, tables on desktop

## Environment

Copy `.env.example` → `.env.local` and fill in:

```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
