/**
 * Points git at the repository's hooks in `.githooks/`, so the pre-commit lock
 * check (TD-33) is active in every clone that runs `npm ci` or `npm install`.
 *
 * Runs from `prepare`, and never fails the install. It does nothing where there
 * is no git checkout (Vercel's build, a tarball) or no git binary, and leaves
 * core.hooksPath alone when it already points somewhere else.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const git = args =>
	execFileSync('git', args, {
		cwd: root,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'ignore'],
	}).trim()

try {
	if (existsSync(new URL('../.git', import.meta.url))) {
		let current = ''
		try {
			current = git(['config', '--get', 'core.hooksPath'])
		} catch {
			// Unset: `git config --get` exits 1.
		}
		if (!current) {
			git(['config', 'core.hooksPath', '.githooks'])
			console.log('git hooks: core.hooksPath set to .githooks (TD-33).')
		} else if (current !== '.githooks') {
			console.warn(
				`git hooks: core.hooksPath is ${current}; left as it is. ` +
					'The TD-33 pre-commit lock check lives in .githooks/.',
			)
		}
	}
} catch {
	// No git binary, or a checkout git cannot read: hooks are a convenience.
}
