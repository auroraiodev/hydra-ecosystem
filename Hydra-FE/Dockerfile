# ============================================================
# Stage 1: Build Next.js frontend
# ============================================================
FROM oven/bun:1.3 AS fe-builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy frontend source
COPY app/package.json app/bun.lock* ./app/
COPY theme/package.json ./theme/
COPY app/ ./app/
COPY theme/ ./theme/

# Install frontend dependencies
WORKDIR /app/app
RUN bun install

# Build the frontend
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NEXT_CPUS=1
RUN rm -rf .next && bun run build

# ============================================================
# Stage 2: Build NestJS backend
# ============================================================
FROM oven/bun:1.3 AS be-builder
WORKDIR /app

# Copy backend source
COPY backend/package.json backend/bun.lock* ./backend/
COPY backend/ ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN bun install

# Generate Prisma client
COPY backend/prisma ./prisma
COPY backend/scripts ./scripts
RUN bunx prisma generate && bun scripts/fix-prisma-client-resolution.cjs || true

# Build NestJS
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN bun run build:api:only || bun run build || true

# ============================================================
# Stage 3: Runner
# ============================================================
FROM oven/bun:1.3 AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy frontend standalone build
COPY --from=fe-builder /app/app/.next/standalone ./app/
COPY --from=fe-builder /app/app/.next/static ./app/.next/static
COPY --from=fe-builder /app/app/public ./app/public

# Copy backend build
COPY --from=be-builder /app/backend/dist ./backend/dist
COPY --from=be-builder /app/backend/node_modules ./backend/node_modules
COPY --from=be-builder /app/backend/package.json ./backend/package.json
COPY --from=be-builder /app/backend/prisma ./backend/prisma

# Copy backend public directory for uploads
RUN mkdir -p ./backend/public/uploads

# Expose ports
EXPOSE 3000
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3002/api/v1/health || exit 1

# Start both services
CMD bun run --cwd backend dist/main.js & bun run app/server.js
