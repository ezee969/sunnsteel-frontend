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
    setupFiles: ['./test/setup.ts'],
    globals: true,
    css: true,
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    // Exclude removed legacy auth hook test (Supabase migration)
    exclude: [
      'test/lib/api/hooks/useAuth.test.tsx',
      'test/lib/api/hooks/useAuth.test.skip.ts',
      'node_modules',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})
