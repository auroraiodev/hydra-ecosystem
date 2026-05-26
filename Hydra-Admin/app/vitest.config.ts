import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: [path.resolve(__dirname, './tests/setup.ts')],
      exclude: ['**/node_modules/**', '**/dist/**'],
      include: ['**/*.{test,spec}.{ts,tsx}'],
      css: true,
    },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/*': path.resolve(__dirname, './*'),
    },
  },
});
