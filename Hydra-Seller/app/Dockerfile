# BASE STAGE
FROM oven/bun:1.3 AS base
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# BUILD STAGE
FROM base AS builder
# Copy workspace configuration
COPY package.json bun.lock ./
# Prune workspaces to only include required ones
RUN node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); pkg.workspaces = ['apps/hydra-seller', 'packages/*']; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Copy only required workspaces
COPY apps/hydra-seller/package.json ./apps/hydra-seller/
COPY packages/ui/package.json ./packages/ui/
COPY packages/ui/ ./packages/ui/

# Install dependencies (only for required workspaces)
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install

# Copy only seller source
COPY apps/hydra-seller/ ./apps/hydra-seller/

# Build the seller
WORKDIR /app/apps/hydra-seller

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN bun run build

# RUNNER STAGE
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

# Assets
COPY --from=builder /app/apps/hydra-seller/public ./apps/hydra-seller/public
COPY --from=builder /app/apps/hydra-seller/.next/standalone ./
COPY --from=builder /app/apps/hydra-seller/.next/static ./apps/hydra-seller/.next/static

EXPOSE 3003

CMD ["bun", "apps/hydra-seller/server.js"]
