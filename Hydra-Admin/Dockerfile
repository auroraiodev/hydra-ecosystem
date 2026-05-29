# =============================================================================
# Hydra Admin — Root Dockerfile (build context: Hydra-Admin/)
#
# Coolify deploys from Hydra-Admin/ and expects a Dockerfile here.
# This builds the Next.js frontend (app/) with the shared theme package (theme/)
# which lives as a sibling and is referenced via the workspace alias
# "arcane-vault-ui": "../theme" in app/package.json.
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Builder
# ---------------------------------------------------------------------------
FROM oven/bun:1.3 AS builder
WORKDIR /workspace

# Build-time env vars injected by Coolify for NEXT_PUBLIC_* values
ARG NEXT_PUBLIC_ADMIN_URL
ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_SELLER_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BACKEND_API_URL
ARG NEXT_PUBLIC_AUTH_SERVICE_URL
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL \
    NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL \
    NEXT_PUBLIC_SELLER_URL=$NEXT_PUBLIC_SELLER_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_BACKEND_API_URL=$NEXT_PUBLIC_BACKEND_API_URL \
    NEXT_PUBLIC_AUTH_SERVICE_URL=$NEXT_PUBLIC_AUTH_SERVICE_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Copy lockfiles & manifests first for layer caching
COPY app/package.json app/bun.lock* ./app/
COPY theme/package.json theme/bun.lock* ./theme/

# Install app dependencies (bun resolves "../theme" workspace link from app/)
WORKDIR /workspace/app
RUN bun install --frozen-lockfile

# Copy full source
WORKDIR /workspace
COPY app ./app
COPY theme ./theme

# Inline the local theme package into node_modules so Next.js can resolve it
# (mirrors what app/Dockerfile does when theme is a sibling directory)
RUN rm -rf /workspace/app/node_modules/arcane-vault-ui && \
    mkdir -p /workspace/app/node_modules/arcane-vault-ui && \
    find /workspace/theme -maxdepth 1 -mindepth 1 ! -name 'node_modules' \
      -exec cp -r {} /workspace/app/node_modules/arcane-vault-ui/ \;

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

WORKDIR /workspace/app
RUN bun run build

# ---------------------------------------------------------------------------
# Stage 2: Runner
# ---------------------------------------------------------------------------
FROM oven/bun:1.3-slim AS runner
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /workspace/app/.next/standalone ./
COPY --from=builder /workspace/app/.next/static ./.next/static
COPY --from=builder /workspace/app/public ./public

COPY ws-proxy.js ./ws-proxy.js

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -sf http://localhost:3001/api/health || exit 1

CMD ["sh", "-c", "PORT=3010 bun server.js & PORT=3001 NEXT_PORT=3010 bun ws-proxy.js"]
