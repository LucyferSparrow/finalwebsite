// Build script — copies static assets to public/ for Cloudflare Pages deployment
// Run with: node build.js

import { cpSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, 'public');

// Create public directory
mkdirSync(publicDir, { recursive: true });

// Copy WASM binary from node_modules → engine/ephemeris/ (needed for wrangler bundling)
const wasmDest = join(__dirname, 'engine', 'ephemeris', 'libswephe.wasm');
if (!existsSync(wasmDest)) {
  // Try multiple known locations for the WASM file
  const wasmPaths = [
    join(__dirname, 'node_modules', '@fusionstrings', 'swisseph-wasi', 'wasm', 'libswephe.wasm'),
    join(__dirname, 'node_modules', '@fusionstrings', 'swisseph-wasi', 'esm', 'generated', 'libswephe.wasm'),
  ];
  // Also try resolving via Node's module resolution
  try {
    const resolved = import.meta.resolve('@fusionstrings/swisseph-wasi/wasm');
    const resolvedPath = resolved.startsWith('file://') ? fileURLToPath(resolved) : resolved;
    wasmPaths.push(resolvedPath);
  } catch {}
  const wasmSrc = wasmPaths.find(p => existsSync(p));
  if (wasmSrc) {
    cpSync(wasmSrc, wasmDest);
    console.log('  ✓ engine/ephemeris/libswephe.wasm (from node_modules)');
  } else {
    console.error('  ✗ libswephe.wasm not found! Searched:');
    wasmPaths.forEach(p => console.error('    -', p));
    process.exit(1);
  }
} else {
  console.log('  ✓ engine/ephemeris/libswephe.wasm (already exists)');
}

// Static files to copy
const staticFiles = [
  'index.html',
  'kundali.html',
  'admin.html',
  'course-view.html',
  'deva.html',
  'levels.html',
  'styles.css',
  'kundali.css',
  'script.js',
  'kundali.js',
];

for (const file of staticFiles) {
  const src = join(__dirname, file);
  if (existsSync(src)) {
    cpSync(src, join(publicDir, file));
    console.log(`  ✓ ${file}`);
  } else {
    console.warn(`  ⚠ ${file} not found, skipping`);
  }
}

// Copy ephemeris data to public (served as static assets, fetched by the Function)
const epheSrc = join(__dirname, 'ephe');
if (existsSync(epheSrc)) {
  cpSync(epheSrc, join(publicDir, 'ephe'), { recursive: true });
  console.log('  ✓ ephe/');
}

// Create _routes.json so only /api/* invokes Functions (static stays free-tier)
writeFileSync(
  join(publicDir, '_routes.json'),
  JSON.stringify({ version: 1, include: ['/api/*'], exclude: [] }, null, 2)
);
console.log('  ✓ _routes.json');

console.log('\nBuild complete! Output → public/');
