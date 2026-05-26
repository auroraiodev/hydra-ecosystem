#!/bin/sh
set -e

echo "=== HYDRA STARTUP ==="
echo "DATABASE_URL set: ${DATABASE_URL:+yes}"
echo "DIRECT_URL set:   ${DIRECT_URL:+yes}"

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set at runtime."
  exit 1
fi

# Verify build exists before doing anything else
# Possible paths: ./dist/main.js (standard), ./dist/src/main.js (monorepo root), ./dist/apps/api/main.js (monorepo api)
MAIN_JS=""
if [ -f "./dist/main.js" ]; then
  MAIN_JS="./dist/main.js"
elif [ -f "./dist/src/main.js" ]; then
  MAIN_JS="./dist/src/main.js"
elif [ -f "./dist/apps/api/main.js" ]; then
  MAIN_JS="./dist/apps/api/main.js"
else
  # Fallback: search for any main.js in dist
  MAIN_JS=$(find dist -name main.js | head -n 1)
fi

if [ -z "$MAIN_JS" ]; then
  echo "ERROR: Build output (main.js) not found. Build likely failed."
  echo "Top-level dist/ contents:"
  ls -F dist/ 2>/dev/null || echo "dist/ directory not found"
  exit 1
fi

echo "Running database migrations..."
bunx prisma migrate deploy --schema prisma/schema.prisma

echo "Starting application from $MAIN_JS..."
exec bun "$MAIN_JS"
