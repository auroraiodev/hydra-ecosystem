# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM oven/bun:1.3 AS builder
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

COPY . .

RUN bunx prisma generate && \
    bunx nest build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM oven/bun:1.3-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3007

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3007/api/v1/health || exit 1

CMD ["bun", "dist/main.js"]
