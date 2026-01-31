import { defineConfig } from 'tsup'

export default defineConfig([
  // Library (existing)
  {
    entry: ['src/index.ts', 'src/headless.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: false,
    external: ['react', 'react-dom'],
  },
  // Viewer (IIFE, self-contained with React bundled)
  {
    entry: { viewer: 'src/viewer/index.tsx' },
    format: ['iife'],
    clean: false,
    sourcemap: false,
    minify: true,
    noExternal: [/.*/],
    splitting: false,
    platform: 'browser',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  },
  // CLI (Node.js ESM)
  {
    entry: { cli: 'src/cli/index.ts' },
    format: ['esm'],
    clean: false,
    sourcemap: false,
    target: 'node18',
    banner: { js: '#!/usr/bin/env node' },
    noExternal: [/^\./, /^src\//],
    dts: false,
    splitting: false,
  },
])
