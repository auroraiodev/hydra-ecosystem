/**
 * Post-processes tsc output in dist-serverless/ to replace @hydra/* path
 * aliases with relative paths. tsc resolves them during type-checking but
 * keeps bare specifiers in CommonJS require() output; esbuild can't resolve
 * them when bundling the pre-compiled JS files.
 */
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist-serverless');

const aliasMap = {
  '@hydra/database': 'libs/database/src',
  '@hydra/common': 'libs/common/src',
  '@hydra/queue': 'libs/queue/src',
  '@hydra/auth': 'libs/auth/src',
};

function resolveAlias(importPath) {
  for (const [alias, libDir] of Object.entries(aliasMap)) {
    if (importPath === alias) {
      return { libDir, subPath: 'index' };
    }
    if (importPath.startsWith(alias + '/')) {
      return { libDir, subPath: importPath.slice(alias.length + 1) };
    }
  }
  return null;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content.replace(
    /require\(['"](@hydra\/[^'"]+)['"]\)/g,
    (match, importPath) => {
      const resolved = resolveAlias(importPath);
      if (!resolved) return match;

      const targetPath = path.join(distDir, resolved.libDir, resolved.subPath);
      const fromDir = path.dirname(filePath);
      let rel = path.relative(fromDir, targetPath).replace(/\\/g, '/');
      if (!rel.startsWith('.')) rel = './' + rel;
      return `require("${rel}")`;
    },
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[PATH FIX] ${path.relative(distDir, filePath)}`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`[PATH FIX] dist-serverless not found: ${dir}`);
    process.exit(1);
  }
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (entry.endsWith('.js')) {
      processFile(full);
    }
  }
}

walk(distDir);
console.log('[PATH FIX] Done');
