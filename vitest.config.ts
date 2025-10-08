import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
    globals: true,
    css: true,
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    // Exclude removed legacy auth hook test (Supabase migration)
    exclude: [
      '__tests__/lib/api/hooks/useAuth.test.tsx',
      '__tests__/lib/api/hooks/useAuth.test.skip.ts',
      'node_modules',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'components/**/*.{ts,tsx}',
        'features/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'lib/utils/**/*.{ts,tsx}',
        'lib/analytics/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/index.ts',
        'lib/api/types/**',
        'lib/constants/**',
        'lib/supabase/**',
        'providers/**',
        'public/**',
        'schema/**',
        'next.config.ts',
        'postcss.config.mjs',
        'tailwind.config.ts',
        'vitest.config.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})
