import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['src/types.ts'],
      include: ['src/**/*.ts'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
