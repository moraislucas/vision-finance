import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.ts'],
      coverage: {
        reporter: ['text', 'html'],
        include: ['src/lib/finance/**/*.ts'],
      },
    },
  }),
);
