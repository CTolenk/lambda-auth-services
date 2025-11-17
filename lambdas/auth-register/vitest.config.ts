import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// @ts-ignore
const sharedDir = fileURLToPath(new URL('../shared', import.meta.url));

const sharedSetupFile = fileURLToPath(
    // @ts-ignore
  new URL('../shared/tests/setup/mock-console.ts', import.meta.url)
);

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', '../shared/**/*.test.ts'],
    setupFiles: [sharedSetupFile],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts', '../shared/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        '../shared/**/*.d.ts',
        'src/**/*.test.ts',
        '../shared/**/*.test.ts',
        'src/index.ts',
        'dist/**',
        'dist-tests/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@shared': sharedDir
    }
  }
});
