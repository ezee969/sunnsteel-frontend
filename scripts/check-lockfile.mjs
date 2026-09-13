/**
 * Keeps package-lock.json installable on Linux (TD-33).
 *
 * npm on Windows resolves only the win32 branch of optional platform packages
 * and drops the dependencies of the others (`@emnapi/*` under the wasm32
 * variants of sharp, rolldown, oxide and unrs) whenever it rewrites the lock -
 * a bare `npm install` is enough. `npm ci` on Linux then validates every
 * platform and stops with `EUSAGE — Missing: … from lock file`, and
 * `npm ci --dry-run` on Windows cannot reproduce that. So this script resolves
 * every declared dependency the way Node does - nearest `node_modules` first,
 * walking up - and reports any that resolve to nothing.
 *
 *   npm run lock:check    fail when an entry is missing (verify, CI)
 *   npm run lock:repair   restore the missing entries, unchanged, from the
 *                         committed lock (`--from <ref>`, default HEAD)
 *   --postinstall         repair, but never fail the install. npm runs the root
 *                         `postinstall` after writing the lock for a bare
 *                         `npm install` and for `npm ci`, but not for
 *                         `npm install <pkg>` or `npm uninstall` - which is
 *                         what the pre-commit hook is for.
 *   --stdin               check a lock read from stdin (the hook pipes the
 *                         staged one)
 *
 * It reads only the lock, so it runs before `npm ci` and needs no installed
 * packages. Presence only: a version that no longer satisfies its range is
 * `npm ci`'s own error, not this platform bug.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const LOCK_PATH = fileURLToPath(
	new URL('../package-lock.json', import.meta.url),
)

const args = process.argv.slice(2)
const mode = ['--repair', '--postinstall', '--stdin']
	.find(flag => args.includes(flag))
	?.slice(2)
const fromIndex = args.indexOf('--from')
const REF = fromIndex >= 0 ? args[fromIndex + 1] : 'HEAD'

const HINT =
	'This is TD-33: an `npm install`/`uninstall` on Windows dropped the\n' +
	"dependencies of another platform's optional package. Run\n" +
	'`npm run lock:repair`, which restores them from the committed lock, rather\n' +
	'than regenerating the lock. To sync node_modules after a pull, use `npm ci`,\n' +
	'which never writes the lock. See docs/roadmaps/technical-debt.md#td-33.'

/** Where Node would find `name` from the package at `fromPath`, or null. */
function resolve(packages, fromPath, name) {
	let base = fromPath
	for (;;) {
		const candidate = base
			? `${base}/node_modules/${name}`
			: `node_modules/${name}`
		if (candidate in packages) return candidate
		if (!base) return null
		const cut = base.lastIndexOf('/node_modules/')
		base = cut === -1 ? '' : base.slice(0, cut)
	}
}

function declaredDependencies(path, entry) {
	const names = new Set([
		...Object.keys(entry.dependencies ?? {}),
		...Object.keys(entry.optionalDependencies ?? {}),
	])
	// Only the root's devDependencies are installed.
	if (path === '') {
		for (const name of Object.keys(entry.devDependencies ?? {})) names.add(name)
	}
	// npm 7+ installs peers unless they are marked optional.
	for (const name of Object.keys(entry.peerDependencies ?? {})) {
		if (!entry.peerDependenciesMeta?.[name]?.optional) names.add(name)
	}
	return names
}

function findMissing(packages) {
	const missing = []
	for (const [path, entry] of Object.entries(packages)) {
		// A link's dependencies are declared on its target, which is its own entry.
		if (entry.link) continue
		for (const name of declaredDependencies(path, entry)) {
			if (!resolve(packages, path, name)) missing.push({ from: path, name })
		}
	}
	return missing
}

function report(missing, what) {
	console.error(
		`${what} is missing ${missing.length} entr${missing.length === 1 ? 'y' : 'ies'} — \`npm ci\` on Linux will fail:\n`,
	)
	for (const { from, name } of missing) {
		console.error(`  ${name}  (required by ${from || '(root)'})`)
	}
	console.error(`\n${HINT}`)
}

function parseLock(text) {
	const lock = JSON.parse(text)
	if (!(lock.lockfileVersion >= 2)) {
		throw new Error('package-lock.json must be lockfileVersion 2 or later.')
	}
	return lock
}

/**
 * Puts each restored key where the committed lock had it, so the diff is
 * exactly the restored lines.
 */
function insertInOrder(packages, reference, additions) {
	const position = new Map(Object.keys(reference).map((key, i) => [key, i]))
	const queue = [...additions].sort((a, b) => position.get(a) - position.get(b))
	const result = {}
	for (const [key, value] of Object.entries(packages)) {
		const at = position.get(key)
		while (queue.length && at !== undefined && position.get(queue[0]) < at) {
			const restored = queue.shift()
			result[restored] = reference[restored]
		}
		result[key] = value
	}
	for (const restored of queue) result[restored] = reference[restored]
	return result
}

/**
 * Copies each missing entry from the reference lock, at the path Node would
 * have found it there, and repeats until nothing new resolves - a restored
 * entry can name dependencies of its own.
 */
function repair(lock, reference) {
	const restored = []
	for (;;) {
		const missing = findMissing(lock.packages)
		const additions = new Set()
		for (const { from, name } of missing) {
			const key = resolve(reference.packages, from, name)
			if (key && !(key in lock.packages)) additions.add(key)
		}
		if (additions.size === 0) return { restored, missing }
		lock.packages = insertInOrder(lock.packages, reference.packages, additions)
		restored.push(...additions)
	}
}

function readReference() {
	const text = execFileSync('git', ['show', `${REF}:package-lock.json`], {
		cwd: ROOT,
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	return parseLock(text)
}

/** Writes the lock back in the file's own line endings and indentation. */
function writeLock(original, lock) {
	const eol = original.includes('\r\n') ? '\r\n' : '\n'
	const indent = original.match(/^\{\r?\n([ \t]+)"/)?.[1] ?? '  '
	const body = JSON.stringify(lock, null, indent).replace(/\n/g, eol)
	writeFileSync(LOCK_PATH, original.endsWith(eol) ? body + eol : body)
}

function runRepair() {
	const original = readFileSync(LOCK_PATH, 'utf8')
	const lock = parseLock(original)
	const count = Object.keys(lock.packages ?? {}).length
	if (findMissing(lock.packages ?? {}).length === 0) {
		console.log(
			`package-lock.json: every dependency of ${count} entries resolves.`,
		)
		return true
	}
	const { restored, missing } = repair(lock, readReference())
	if (restored.length) {
		writeLock(original, lock)
		console.log(
			`package-lock.json: restored ${restored.length} entr${restored.length === 1 ? 'y' : 'ies'} from ${REF} (TD-33):\n` +
				restored.map(key => `  ${key}`).join('\n'),
		)
	}
	if (missing.length) {
		report(missing, `package-lock.json, after repair from ${REF},`)
		return false
	}
	return true
}

if (mode === 'repair') {
	process.exit(runRepair() ? 0 : 1)
}

if (mode === 'postinstall') {
	// An install must never fail here: on Vercel and in CI the lock is intact
	// and this is a no-op, and a repair that cannot run only warns.
	try {
		if (!runRepair()) {
			console.warn('\nThe lock could not be fully repaired; see above.')
		}
	} catch (error) {
		console.warn(
			`package-lock.json check skipped: ${error.message.split('\n')[0]}`,
		)
	}
	process.exit(0)
}

const text =
	mode === 'stdin' ? readFileSync(0, 'utf8') : readFileSync(LOCK_PATH, 'utf8')
const what =
	mode === 'stdin' ? 'The staged package-lock.json' : 'package-lock.json'
const packages = parseLock(text).packages ?? {}
const missing = findMissing(packages)

if (missing.length === 0) {
	console.log(
		`${what}: every dependency of ${Object.keys(packages).length} entries resolves.`,
	)
	process.exit(0)
}

report(missing, what)
process.exit(1)
