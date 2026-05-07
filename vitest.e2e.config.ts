import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/e2e/e2e.test.ts'],
    exclude: [],
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 30_000,
    pool: 'forks',
  },
});
