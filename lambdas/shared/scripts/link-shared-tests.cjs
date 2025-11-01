const fs = require('node:fs');
const path = require('node:path');

const [, , distDirArg] = process.argv;
const distDir = path.resolve(process.cwd(), distDirArg ?? 'dist-tests');
const sharedDir = path.join(distDir, 'shared');

if (!fs.existsSync(sharedDir)) {
  process.stderr.write(
    `Shared directory not found at ${sharedDir}. Did you run the TypeScript build first?\n`
  );
  process.exit(1);
}

const nodeModulesDir = path.join(distDir, 'node_modules');
const sharedTarget = path.join(nodeModulesDir, '@shared');

const shouldCopy = (source) => {
  const relative = path.relative(sharedDir, source);

  if (!relative || relative.startsWith('..')) {
    return true;
  }

  if (relative.split(path.sep).includes('__tests__')) {
    return false;
  }

  if (relative.endsWith('.test.js') || relative.endsWith('.test.d.ts')) {
    return false;
  }

  return true;
};

fs.mkdirSync(nodeModulesDir, { recursive: true });
fs.rmSync(sharedTarget, { recursive: true, force: true });
fs.cpSync(sharedDir, sharedTarget, { recursive: true, filter: shouldCopy });
