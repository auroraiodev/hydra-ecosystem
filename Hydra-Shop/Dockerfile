# ============================================================
# Dockerfile — Hydra Shop (Next.js + NestJS)
# The project workspace is structured to mirror the original pnpm monorepo
# layout (apps/hydra-fe, apps/theme) so that next.config.ts's
# outputFileTracingRoot: path.join(__dirname, '../../')
# correctly resolves to /app/ (the workspace root), producing a clean
# standalone output at apps/hydra-fe/server.js.
# ============================================================

# ── Stage 1: Build ───────────────────────────────────────────
FROM oven/bun:1.3 AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time.
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

# ── 1. Install workspace deps ─────────────────────────────────
# Place app at apps/hydra-fe and theme at apps/theme so that
# "arcane-vault-ui": "../theme" resolves correctly within the workspace,
# AND outputFileTracingRoot=../../ (from apps/hydra-fe) reaches /app/.
COPY theme/package.json ./apps/theme/package.json
COPY app/package.json ./apps/hydra-fe/package.json
RUN printf '{"private":true,"workspaces":["apps/hydra-fe","apps/theme"]}' > package.json && bun install

# ── 2. Frontend source + build ────────────────────────────────
COPY app/ ./apps/hydra-fe/
COPY theme/ ./apps/theme/

WORKDIR /app/apps/hydra-fe
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=2048"

# Run build steps explicitly so --no-turbopack reaches `next build`, not the cleanup script.
# NEXT_CPUS=1 was removed — single-threaded builds took 20+ min and hit Coolify's exec timeout.
RUN rm -rf .next && \
    node -e "require('fs').rmSync('.next/dev/types',{recursive:true,force:true})" && \
    bunx next build --no-turbopack && \
    node scripts/cleanup-maps.mjs

# ── 3. Backend (NestJS) — runs after frontend finishes ────────
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

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Standalone copies the entire output preserving the directory structure
# relative to outputFileTracingRoot (/app/), so server.js ends up at
# apps/hydra-fe/server.js after COPY.
COPY --from=builder /app/apps/hydra-fe/.next/standalone ./
COPY --from=builder /app/apps/hydra-fe/.next/static ./apps/hydra-fe/.next/static
COPY --from=builder /app/apps/hydra-fe/public ./apps/hydra-fe/public

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY ws-proxy.js ./ws-proxy.js

RUN mkdir -p ./backend/public/uploads

EXPOSE 3000
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3002/api/v1/health || exit 1

# NestJS on 3002, Next.js on 3009 (internal), ws-proxy on 3000 (public)
CMD bun backend/dist/main.js & PORT=3009 bun apps/hydra-fe/server.js & PORT=3000 NEXT_PORT=3009 bun ws-proxy.js
