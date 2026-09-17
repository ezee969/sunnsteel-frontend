import { describe, expect, it } from 'vitest'

import { runsProject } from './preconditions'

/**
 * `runsProject` decides whether a run-level guard fires, so getting it wrong
 * either blocks a gate that should run or skips one that should not. The bug it
 * replaces did the first: `config.projects.some(p => p.name === 'portfolio')`
 * reads the *configured* projects, which never shrink, so the portfolio seed
 * check fired on `--project=regression` too and refused to start the sweep
 * CLAUDE.md requires for every UI change.
 *
 * Playwright's own `.spec.ts` files are matched by `playwright test`; this is a
 * `.test.ts`, so only vitest picks it up. The two runners cannot collide.
 */
const CONFIGURED = ['before', 'after', 'regression', 'portfolio']

const argv = (...args: string[]) => ['node', 'playwright', 'test', ...args]

describe('runsProject', () => {
	it('runs every project when nothing is selected', () => {
		expect(runsProject(argv(), CONFIGURED, 'portfolio')).toBe(true)
	})

	it('excludes the project when another one is selected', () => {
		expect(
			runsProject(argv('--project=regression'), CONFIGURED, 'portfolio'),
		).toBe(false)
		expect(
			runsProject(argv('--project', 'regression'), CONFIGURED, 'portfolio'),
		).toBe(false)
	})

	it('includes the project when it is the one selected', () => {
		expect(
			runsProject(argv('--project=portfolio'), CONFIGURED, 'portfolio'),
		).toBe(true)
	})

	it('reads a repeated flag and a variadic list', () => {
		expect(
			runsProject(
				argv('--project=before', '--project=portfolio'),
				CONFIGURED,
				'portfolio',
			),
		).toBe(true)
		expect(
			runsProject(
				argv('--project', 'before', 'portfolio'),
				CONFIGURED,
				'portfolio',
			),
		).toBe(true)
	})

	it('does not swallow a trailing file filter as a project name', () => {
		// `before` is selected and `e2e/baseline.spec.ts` is a path, not a project,
		// so portfolio is genuinely not running.
		expect(
			runsProject(
				argv('--project', 'before', 'e2e/baseline.spec.ts'),
				CONFIGURED,
				'portfolio',
			),
		).toBe(false)
	})

	it('fails closed on a token that is not a configured project name', () => {
		// `--project` accepts patterns. There is no way to tell here whether
		// `port*` matches, so the guard runs rather than being silently skipped.
		expect(runsProject(argv('--project=port*'), CONFIGURED, 'portfolio')).toBe(
			true,
		)
	})

	it('fails closed on a flag with no readable value', () => {
		expect(
			runsProject(
				argv('--project', '--reporter=list'),
				CONFIGURED,
				'portfolio',
			),
		).toBe(true)
	})
})
