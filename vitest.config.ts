import path from 'node:path'

import { defineConfig } from 'vitest/config'

// Node environment only: the agreed scope for T-01 is pure logic — no DOM, no
// network, no component rendering. Adding jsdom + React Testing Library is a
// deliberate later decision, not an oversight.
export default defineConfig({
	test: {
		environment: 'node',
		include: ['**/*.test.ts'],
		exclude: ['node_modules/**', '.next/**'],
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '.'),
		},
	},
})
