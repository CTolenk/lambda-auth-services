import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// @ts-ignore
const sharedDir = fileURLToPath(new URL('../shared', import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', '../shared/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts', '../shared/**/*.ts'],
      exclude: ['src/**/*.d.ts', '../shared/**/*.d.ts', 'dist/**', 'dist-tests/**']
    }
  },
  resolve: {
    alias: {
      '@shared': sharedDir
    }
  }
});
