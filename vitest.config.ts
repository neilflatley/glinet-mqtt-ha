import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    exclude: [],
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        global: {
          lines: 30,
          branches: 25,
          functions: 35,
        },
      },
    },
    
    testTimeout: 10000,
    pool: 'forks',
  },
});