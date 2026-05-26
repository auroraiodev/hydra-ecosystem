FROM oven/bun:1.3 AS runner
WORKDIR /app/apps/hydra-be

ENV NODE_ENV=production
ENV PORT=3002

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Install dependencies (dev deps needed for build)
COPY apps/hydra-be/package.json ./
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install

# Generate Prisma client, fix bun cache resolution, and patch import.meta
COPY apps/hydra-be/prisma.config.ts ./prisma.config.ts
COPY apps/hydra-be/prisma ./prisma
COPY apps/hydra-be/scripts ./scripts
RUN bunx prisma generate && bun scripts/fix-prisma-client-resolution.cjs && node scripts/fix-prisma-import-meta.cjs

# Copy all TypeScript source
COPY apps/hydra-be/src ./src
COPY apps/hydra-be/apps ./apps
COPY apps/hydra-be/libs ./libs
COPY apps/hydra-be/tsconfig.json ./
COPY apps/hydra-be/tsconfig.build.json ./
COPY apps/hydra-be/nest-cli.json ./
COPY apps/hydra-be/webpack.config.cjs ./
COPY apps/hydra-be/docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' docker-entrypoint.sh

# Cap Node.js heap to prevent OOM-killing the server during webpack build
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Build specific app or all projects
ARG APP_NAME
RUN if [ -z "$APP_NAME" ] || [ "$APP_NAME" = "all" ]; then \
      bun run build:all:only; \
    elif [ "$APP_NAME" = "api" ]; then \
      bun run build:api:only; \
    else \
      bun run build:$APP_NAME && node scripts/fix-prisma-import-meta.cjs; \
    fi

EXPOSE 3002

# Healthcheck to ensure the container is "good" in Coolify
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3002/api/v1/health || exit 1

ENTRYPOINT ["/bin/sh", "docker-entrypoint.sh"]
