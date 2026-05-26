/**
 * Fixes Prisma Client type resolution when using bun's symlink-based cache.
 *
 * Prisma 7.8 modifies @prisma/client/{default,index}.d.ts to re-export from
 * '.prisma/client/default'. When @prisma/client lives inside bun's cache
 * directory (via symlink/junction), this bare specifier cannot be resolved
 * by TypeScript's module resolution.
 *
 * This script:
 *   1. Follows symlinks to find the real @prisma/client directory
 *   2. Creates a .prisma symlink there pointing to the project's .prisma
 *   3. Updates .d.ts files to use './.prisma/client/default' (relative path)
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const prismaClientDir = path.resolve(projectRoot, 'node_modules/@prisma/client');
const targetPrismaDir = path.resolve(projectRoot, 'node_modules/.prisma');

function main() {
  if (!fs.existsSync(prismaClientDir)) {
    console.error('[FIX] @prisma/client not found at', prismaClientDir);
    process.exit(1);
  }
  if (!fs.existsSync(targetPrismaDir)) {
    console.error('[FIX] .prisma not found at', targetPrismaDir);
    process.exit(1);
  }

  // Follow junction/symlink to get the real directory (bun cache)
  const realClientDir = fs.realpathSync(prismaClientDir);
  const prismaLinkPath = path.join(realClientDir, '.prisma');

  // Remove any stale symlink left by a previous build (absolute symlinks are
  // broken at runtime because /opt/build/... does not exist in /var/task/).
  try {
    if (fs.lstatSync(prismaLinkPath).isSymbolicLink()) {
      fs.rmSync(prismaLinkPath, { recursive: true, force: true });
      console.log(`[FIX] Removed old symlink at ${prismaLinkPath}`);
    }
  } catch {
    // Path doesn't exist yet — nothing to remove.
  }

  // Physically copy .prisma into the real @prisma/client dir so the files are
  // present in the Netlify function deployment package (symlinks are not
  // followed when the Lambda ZIP is assembled).
  if (!fs.existsSync(prismaLinkPath)) {
    fs.cpSync(targetPrismaDir, prismaLinkPath, { recursive: true, dereference: true });
    console.log(`[FIX] Copied .prisma to ${prismaLinkPath}`);
  } else {
    console.log(`[FIX] .prisma already exists at ${prismaLinkPath}`);
  }

  // Update files to use relative path instead of bare specifier
  const files = ['default.d.ts', 'default.js', 'index.d.ts', 'index.js'];
  for (const file of files) {
    const filePath = path.join(realClientDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[FIX] ${file} not found at ${filePath}, skipping`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    const isJs = file.endsWith('.js');
    if (isJs) {
      // JS: require('.prisma/client/default') → require('./.prisma/client/default')
      content = content.replace(
        /require\(['"]\.prisma\/client\/(?:default|index)['"]\)/g,
        "require('./.prisma/client/default')",
      );
    } else {
      // DTS: export * from '.prisma/client/default' → export * from './.prisma/client/default'
      content = content.replace(
        /export \* from '\.prisma\/client\/(?:default|index)'/g,
        "export * from './.prisma/client/default'",
      );
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[FIX] Updated ${file}`);
    } else {
      console.log(`[FIX] ${file} already up-to-date`);
    }
  }

  console.log('[FIX] Prisma client resolution fix complete');
}

main();
