import { defineConfig } from 'vitest/config';

// Testes de lógica pura (domínio/providers). Sem DOM: ambiente node.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
