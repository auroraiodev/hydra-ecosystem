# BASE STAGE
FROM oven/bun:1.3 AS base
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# BUILD STAGE
FROM base AS builder
# Copy workspace configuration
COPY package.json bun.lock ./
# Prune workspaces to only include required ones
RUN node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); pkg.workspaces = ['apps/hydra-admin', 'packages/*']; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Copy only required workspaces
COPY apps/hydra-admin/package.json ./apps/hydra-admin/
COPY packages/ui/package.json ./packages/ui/
COPY packages/ui/ ./packages/ui/

# Install dependencies (only for required workspaces)
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install

# Copy only admin source
COPY apps/hydra-admin/ ./apps/hydra-admin/

# Build the admin
WORKDIR /app/apps/hydra-admin
ENV NODE_ENV=production
# Cap Node.js heap to prevent OOM-killing the server during Next.js build
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN bun run build

# RUNNER STAGE
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Assets
COPY --from=builder /app/apps/hydra-admin/public ./apps/hydra-admin/public
COPY --from=builder /app/apps/hydra-admin/.next/standalone ./
COPY --from=builder /app/apps/hydra-admin/.next/static ./apps/hydra-admin/.next/static

EXPOSE 3001

CMD ["bun", "apps/hydra-admin/server.js"]
