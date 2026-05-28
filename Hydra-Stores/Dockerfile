# ── Stage 1: Build ─────────────────────────────────────────────
FROM oven/bun:1.3 AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time
ARG NEXT_PUBLIC_SELLER_URL
ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_ADMIN_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BACKEND_API_URL
ARG NEXT_PUBLIC_AUTH_SERVICE_URL
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_SELLER_URL=$NEXT_PUBLIC_SELLER_URL \
    NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL \
    NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_BACKEND_API_URL=$NEXT_PUBLIC_BACKEND_API_URL \
    NEXT_PUBLIC_AUTH_SERVICE_URL=$NEXT_PUBLIC_AUTH_SERVICE_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# ── 1. Install frontend deps ──────────────────────────────────
COPY app/package.json ./app/package.json
RUN bun install --cwd app

# ── 2. Frontend source + build ────────────────────────────────
COPY app/ ./app/

WORKDIR /app/app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=1024"

RUN rm -rf .next && bun run build

# ── 3. Backend (NestJS) — runs after frontend finishes ────────
WORKDIR /app
COPY backend/package.json backend/bun.lock* ./backend/
COPY backend/ ./backend/

WORKDIR /app/backend
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN bun install && bun run build

# ── Stage 2: Runner ───────────────────────────────────────────
FROM oven/bun:1.3-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3003 \
    HOSTNAME="0.0.0.0"

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Next.js standalone output
COPY --from=builder /app/app/.next/standalone ./
COPY --from=builder /app/app/.next/static ./.next/static
COPY --from=builder /app/app/public ./public

# Backend dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/prisma ./backend/prisma

EXPOSE 3003
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3002/api/v1/health || exit 1

# NestJS on 3002, Next.js on 3003 (foreground, keeps container alive)
CMD bunx prisma migrate deploy --schema backend/prisma/schema.prisma 2>/dev/null; bun backend/dist/main.js & bun server.js
