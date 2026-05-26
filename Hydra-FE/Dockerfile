# ============================================================
# Dockerfile — Hydra FE (Next.js + NestJS)
# Single sequential builder stage to avoid OOM from parallel builds.
# ============================================================

# ── Stage 1: Build ───────────────────────────────────────────
FROM oven/bun:1.3 AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars must be declared as build args — they are
# baked into the JS bundle at build time, not read at runtime.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_ADMIN_URL
ARG NEXT_PUBLIC_SELLER_URL
ARG NEXT_PUBLIC_AUTH_SERVICE_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL \
    NEXT_PUBLIC_SELLER_URL=$NEXT_PUBLIC_SELLER_URL \
    NEXT_PUBLIC_AUTH_SERVICE_URL=$NEXT_PUBLIC_AUTH_SERVICE_URL

# ── 1. Frontend (Next.js) ─────────────────────────────────────
COPY app/package.json app/bun.lock* ./app/
COPY theme/package.json ./theme/
COPY app/ ./app/
COPY theme/ ./theme/

WORKDIR /app/app
RUN bun install

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=1536" \
    NEXT_CPUS=1

RUN rm -rf .next && bun run build

# ── 2. Backend (NestJS) — runs after frontend finishes ────────
WORKDIR /app
COPY backend/package.json backend/bun.lock* ./backend/
COPY backend/ ./backend/

WORKDIR /app/backend
RUN bun install

RUN bunx prisma generate && bun scripts/fix-prisma-client-resolution.cjs || true

ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN bun run build:api:only || bun run build || true

# ── Stage 2: Runner ───────────────────────────────────────────
FROM oven/bun:1.3 AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/app/.next/standalone ./app/
COPY --from=builder /app/app/.next/static ./app/.next/static
COPY --from=builder /app/app/public ./app/public

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/prisma ./backend/prisma

RUN mkdir -p ./backend/public/uploads

EXPOSE 3000
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3002/api/v1/health || exit 1

CMD bun run --cwd backend dist/main.js & bun run app/server.js
