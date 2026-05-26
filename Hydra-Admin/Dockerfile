# ============================================================
# Dockerfile — Hydra Admin (Next.js + NestJS)
# Multi-stage build: frontend (Next.js) + backend (NestJS)
# ============================================================

# --- Stage 1: Install dependencies ---
FROM oven/bun:1.2 AS deps
WORKDIR /app

# Install root-level dev dependency (concurrently)
COPY package.json bun.lock ./

# Copy sub-project manifests
COPY app/package.json app/
COPY backend/package.json backend/
COPY backend/prisma/ backend/prisma/

RUN bun install --frozen-lockfile

# --- Stage 2: Build Backend (NestJS) ---
FROM oven/bun:1.2 AS be-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY . .

WORKDIR /app/backend
RUN bun run prisma:generate
RUN bun run build:api:only

# --- Stage 3: Build Frontend (Next.js) ---
FROM oven/bun:1.2 AS admin-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/app/node_modules ./app/node_modules
COPY . .

WORKDIR /app/app
RUN bun run build

# --- Stage 4: Production image ---
FROM oven/bun:1.2-slim AS runner
WORKDIR /app

# Install only necessary runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend
COPY --from=be-builder /app/backend/dist ./backend/dist
COPY --from=be-builder /app/backend/node_modules ./backend/node_modules
COPY --from=be-builder /app/backend/prisma ./backend/prisma
COPY --from=be-builder /app/backend/package.json ./backend/package.json

# Copy frontend (standalone output)
COPY --from=admin-builder /app/app/.next/standalone ./app/
COPY --from=admin-builder /app/app/.next/static ./app/.next/static
COPY --from=admin-builder /app/app/public ./app/public

# Copy root devDependencies (concurrently)
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Expose both ports
EXPOSE 3001 3002

# Health checks
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD bun --eval "fetch('http://localhost:3002/api/v1/health').then(r => {process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

# Default: run both services via concurrently
CMD ["bun", "run", "start"]
