import { FlatCompat } from '@eslint/eslintrc'
import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import prettierPlugin from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
	baseDirectory: __dirname,
})

const eslintConfig = [
	{
		ignores: ['.next/**', 'coverage/**', 'node_modules/**', 'next-env.d.ts'],
	},
	...compat.extends('next/core-web-vitals', 'next/typescript'),
	// Turns off every stylistic rule inherited above that would fight Prettier.
	// Must come after the extends and before our own rules.
	prettierConfig,
	{
		plugins: {
			prettier: prettierPlugin,
			'simple-import-sort': simpleImportSort,
			import: importPlugin,
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			// Formatting is now enforced, not suggested: .prettierrc is the single
			// source of truth (tabs, single quotes, no semicolons, printWidth 80).
			// Before CL-06 these plugins were installed but never wired up, so two
			// styles coexisted and nothing arbitrated between them.
			'prettier/prettier': 'error',
			// Side-effect imports (e.g. `import './globals.css'`) are deliberately
			// NOT reordered by this plugin — it treats them as barriers — so module
			// side-effect order is preserved.
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',
			// The one rule from eslint-plugin-import worth having here: it merges
			// split imports of the same module, which sorting alone cannot do. The
			// plugin's path-resolution rules (no-unresolved, no-cycle) are NOT
			// enabled — they need eslint-import-resolver-typescript, which is not
			// installed, and would only re-check what `tsc` already checks.
			'import/no-duplicates': 'error',
		},
	},
]

export default eslintConfig
