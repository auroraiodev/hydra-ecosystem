FROM oven/bun:1.3 AS base
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS builder
WORKDIR /app/hydra-be
COPY hydra-be/package.json ./
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install
COPY hydra-be/ ./
RUN bunx prisma generate
RUN bunx nest build catalog
RUN node scripts/fix-prisma-import-meta.cjs

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3003

# curl needed for Coolify healthcheck (bun base image omits it)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app/hydra-be
COPY hydra-be/package.json ./
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --production

COPY --from=builder /app/hydra-be/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/hydra-be/prisma ./prisma
COPY --from=builder /app/hydra-be/scripts ./scripts
RUN bunx prisma generate && node scripts/fix-prisma-import-meta.cjs

COPY --from=builder /app/hydra-be/dist ./dist

EXPOSE 3003

CMD ["/bin/sh", "-c", "MAIN_JS=$(find dist/apps/catalog -name main.js | head -n 1); if [ -z \"$MAIN_JS\" ]; then echo \"ERROR: main.js not found in dist/apps/catalog\"; exit 1; fi; echo \"Starting application from $MAIN_JS...\"; exec bun \"$MAIN_JS\""]
