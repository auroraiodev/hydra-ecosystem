# hydra-fe — Marketplace Frontend

Customer-facing TCG marketplace built with Next.js 16 App Router.

## Dev

```bash
pnpm dev        # Turbopack dev server → http://localhost:3000
pnpm build      # Production build (standalone output)
pnpm lint
pnpm type-check
pnpm test
```

## Key Features

- Product search with importation integration
- Mercado Pago checkout
- Supabase Auth (Google OAuth + email)
- PWA support
- Glassmorphism design system (Arcane Vault)

## Structure

```
app/
├── (marketplace)/   # Public storefront routes
├── (auth)/          # Login, register, OAuth
└── layout.tsx       # Root layout + providers
components/
├── ui/              # Shared UI primitives
└── layout/          # Navbar, footer, etc.
features/            # Feature-scoped components
hooks/               # Custom React hooks
lib/api/             # API client modules
```

## Environment

Copy `.env.example` → `.env.local` and fill in:

```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
