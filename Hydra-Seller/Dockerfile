# ============================================================
# Stage 1: Build backend (NestJS)
# ============================================================
FROM oven/bun:1.3 AS backend-builder
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

# ============================================================
# Stage 2: Build frontend (Next.js)
# ============================================================
FROM oven/bun:1.3 AS frontend-builder
WORKDIR /build/app

COPY app/package.json app/bun.lock* ./
RUN bun install

COPY app/ ./
RUN bun run build

# ============================================================
# Stage 3: Production runner
# ============================================================
FROM oven/bun:1.3 AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy backend artifacts
COPY --from=backend-builder /build/backend/dist ./backend/dist
COPY --from=backend-builder /build/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /build/backend/package.json ./backend/package.json
COPY --from=backend-builder /build/backend/prisma ./backend/prisma
COPY --from=backend-builder /build/backend/scripts ./backend/scripts
COPY --from=backend-builder /build/backend/docker-entrypoint.sh ./backend/docker-entrypoint.sh
RUN sed -i 's/\r$//' backend/docker-entrypoint.sh
RUN chmod +x backend/docker-entrypoint.sh

# Copy frontend artifacts
COPY --from=frontend-builder /build/app/.next/standalone ./app
COPY --from=frontend-builder /build/app/.next/static ./app/.next/static
COPY --from=frontend-builder /build/app/public ./app/public

ENV NODE_ENV=production
EXPOSE 3002
EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3002/api/v1/health || exit 1

CMD ["sh", "-c", "cd /app/backend && ./docker-entrypoint.sh & cd /app/app && node server.js"]
