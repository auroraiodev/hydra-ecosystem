# ============================================================
# Dockerfile — Hydra Seller (Next.js + NestJS)
# Single sequential builder stage to avoid OOM from parallel builds.
# ============================================================

# ── Stage 1: Build (sequential) ──────────────────────────────
FROM oven/bun:1.3 AS builder
WORKDIR /build

# NEXT_PUBLIC_* vars must be declared as build args — baked into JS bundle.
ARG NEXT_PUBLIC_SELLER_URL
ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_ADMIN_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BACKEND_API_URL
ARG NEXT_PUBLIC_AUTH_SERVICE_URL

ENV NEXT_PUBLIC_SELLER_URL=$NEXT_PUBLIC_SELLER_URL \
    NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL \
    NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_BACKEND_API_URL=$NEXT_PUBLIC_BACKEND_API_URL \
    NEXT_PUBLIC_AUTH_SERVICE_URL=$NEXT_PUBLIC_AUTH_SERVICE_URL

# ── 1. Backend (NestJS) ───────────────────────────────────────
WORKDIR /build/backend

COPY backend/package.json backend/bun.lock* ./
RUN bun install

COPY backend/prisma.config.ts ./
COPY backend/prisma ./prisma
COPY backend/scripts ./scripts
RUN bunx prisma generate && bun scripts/fix-prisma-client-resolution.cjs

COPY backend/src ./src
COPY backend/apps ./apps
COPY backend/libs ./libs
COPY backend/tsconfig.json ./
COPY backend/tsconfig.build.json ./
COPY backend/nest-cli.json ./
COPY backend/webpack.config.cjs ./

ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN bun run build:api:only

# ── 2. Frontend (Next.js) — runs after backend finishes ───────
WORKDIR /build/app

COPY app/package.json app/bun.lock* ./
RUN bun install

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=1536" \
    NEXT_CPUS=1

COPY app/ ./
RUN bun run build

# ── Stage 2: Runner ───────────────────────────────────────────
FROM oven/bun:1.3 AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/backend/dist ./backend/dist
COPY --from=builder /build/backend/node_modules ./backend/node_modules
COPY --from=builder /build/backend/package.json ./backend/package.json
COPY --from=builder /build/backend/prisma ./backend/prisma
COPY --from=builder /build/backend/scripts ./backend/scripts
COPY --from=builder /build/backend/docker-entrypoint.sh ./backend/docker-entrypoint.sh
RUN sed -i 's/\r$//' backend/docker-entrypoint.sh && chmod +x backend/docker-entrypoint.sh

COPY --from=builder /build/app/.next/standalone ./app
COPY --from=builder /build/app/.next/static ./app/.next/static
COPY --from=builder /build/app/public ./app/public

ENV NODE_ENV=production
EXPOSE 3002
EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3002/api/v1/health || exit 1

CMD ["sh", "-c", "cd /app/backend && ./docker-entrypoint.sh & cd /app/app && node server.js"]
