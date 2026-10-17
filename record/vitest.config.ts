import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['schema/**/*.test.ts'],
    environment: 'node',
  },
});
