# ============================================================
# Dockerfile — Hydra Admin (Next.js + NestJS)
# Single sequential builder stage to avoid OOM from parallel builds.
# ============================================================

# ── Stage 1: Build (sequential) ──────────────────────────────
FROM oven/bun:1.3 AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars must be declared as build args — baked into JS bundle.
ARG NEXT_PUBLIC_ADMIN_URL
ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_SELLER_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BACKEND_API_URL
ARG NEXT_PUBLIC_AUTH_SERVICE_URL

ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL \
    NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL \
    NEXT_PUBLIC_SELLER_URL=$NEXT_PUBLIC_SELLER_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_BACKEND_API_URL=$NEXT_PUBLIC_BACKEND_API_URL \
    NEXT_PUBLIC_AUTH_SERVICE_URL=$NEXT_PUBLIC_AUTH_SERVICE_URL

# Copy lockfiles for all package roots so frozen installs work
COPY package.json bun.lock* ./
COPY theme/package.json theme/bun.lock* theme/
COPY app/package.json app/bun.lock* app/
COPY backend/package.json backend/bun.lock* backend/
COPY backend/prisma/ backend/prisma/

# Install root (concurrently), then each sub-package independently
RUN bun install --frozen-lockfile && \
    cd theme && bun install --frozen-lockfile && \
    cd ../app && bun install --frozen-lockfile && \
    cd ../backend && bun install --frozen-lockfile

# Copy the rest of the source files
COPY . .

# Bun copies path-based deps (arcane-vault-ui: ../theme) at install time, but only
# theme/package.json existed then. Sync the full source so Next.js can resolve it.
# Exclude node_modules: bun hardlinks theme/node_modules ↔ arcane-vault-ui/node_modules,
# so cp would fail with "are the same file" on every entry.
RUN find theme -maxdepth 1 -mindepth 1 ! -name 'node_modules' -exec cp -r {} app/node_modules/arcane-vault-ui/ \;

# 1. Backend (NestJS)
WORKDIR /app/backend
RUN bun run prisma:generate
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN bun run build:api:only

# 2. Frontend (Next.js) — runs after backend finishes
WORKDIR /app/app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=2048"

RUN bunx next build

# ── Stage 2: Runner ───────────────────────────────────────────
FROM oven/bun:1.3-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/prisma.config.ts ./backend/prisma.config.ts
COPY --from=builder /app/backend/package.json ./backend/package.json

COPY --from=builder /app/app/.next/standalone ./app/
COPY --from=builder /app/app/.next/static ./app/.next/static
COPY --from=builder /app/app/public ./app/public

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3001 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3002/api/v1/health || exit 1

CMD ["sh", "-c", "cd /app/backend && PORT=3002 bun ./dist/main.js & cd /app/app && PORT=3000 HOSTNAME=0.0.0.0 node server.js"]
