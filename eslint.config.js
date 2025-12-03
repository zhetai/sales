// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'dist-worker/**',
      'dist-worker-optimized/**',
      'dist/**',
      'node_modules/**',
      '.git/**',
      'coverage/**',
      '.astro/**',
      '.wrangler/**',
      '**/*.d.ts'
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        Response: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        crypto: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Headers: 'readonly',
        caches: 'readonly',
        document: 'readonly',
        process: 'writable',
        Request: 'readonly'
      }
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  }
];