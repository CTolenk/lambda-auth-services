import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// @ts-ignore
const sharedDir = fileURLToPath(new URL('../shared', import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', '../shared/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@shared': sharedDir
    }
  }
});
