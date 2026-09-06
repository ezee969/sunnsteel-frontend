import path from 'node:path'

import { defineConfig } from 'vitest/config'

// Node environment: pure logic, auth event orchestration and mocked API calls.
// No DOM, live network or component rendering. Adding React Testing Library is a
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
