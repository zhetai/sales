import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    reportsDirectory: './coverage',
    include: ['src/workers/**', 'src/lib/**'],
    exclude: [
      'test/**', 
      'node_modules/**', 
      'dist/**', 
      'dist-worker/**', 
      'dist-worker-optimized/**',
      'src/components/**',
      'src/layouts/**',
      'src/pages/**',
      '**/*.astro',
      '**/*.spec.js'
    ],
    lines: 98,
    functions: 100,
    branches: 90,
    statements: 95,
  },
});