# BASE STAGE
FROM oven/bun:1.3 AS base
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# BUILD STAGE
FROM base AS builder

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG BACKEND_API_URL
ENV BACKEND_API_URL=$BACKEND_API_URL

# Copy workspace configuration
COPY package.json bun.lock ./
# Prune workspaces to only include required ones (prevents "Workspace not found" errors)
RUN node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); pkg.workspaces = ['apps/hydra-fe', 'packages/*']; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Copy only required workspaces
COPY apps/hydra-fe/package.json ./apps/hydra-fe/
COPY packages/ui/package.json ./packages/ui/
COPY packages/ui/ ./packages/ui/

# Install dependencies (only for required workspaces)
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install

# Copy only frontend source
COPY apps/hydra-fe/ ./apps/hydra-fe/

# Build the frontend
WORKDIR /app/apps/hydra-fe
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Limit memory and workers to avoid OOM on constrained build servers
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NEXT_CPUS=1
RUN rm -rf .next && bun run build

# RUNNER STAGE
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Server-side backend URL (set at runtime to the internal Docker service name, e.g. http://hydra-be:3002)
ENV BACKEND_API_URL=""

# Assets
COPY --from=builder /app/apps/hydra-fe/public ./apps/hydra-fe/public
COPY --from=builder /app/apps/hydra-fe/.next/standalone ./
COPY --from=builder /app/apps/hydra-fe/.next/static ./apps/hydra-fe/.next/static

EXPOSE 3000

CMD ["bun", "apps/hydra-fe/server.js"]
