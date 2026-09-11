/**
 * The capture manifest, in code. Mirrors docs/ui-restyle/capture-manifest.md —
 * keep the two in step.
 */

export const WIDTHS = [390, 768, 1440] as const

export const THEMES = ['light', 'dark'] as const

/** The Phase 9 responsive sweep. Not part of the frozen baseline. */
export const SWEEP_WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440] as const

/** The Phase 14 regression sweep (e2e/regression.spec.ts), per the plan. */
export const REGRESSION_WIDTHS = [320, 390, 430, 768, 1024, 1280, 1440] as const

/** Which environment variable supplies the id for a `requiresId` target. */
export const ID_ENV = {
	session: 'UI_SESSION_ID',
	sessionFull: 'UI_SESSION_FULL_ID',
	historyDetail: 'UI_HISTORY_ID',
} as const

export type Target = {
	/** File-name slug: `<slug>-<width>-<theme>.png`. */
	slug: string
	path: string
	/** Skipped unless the matching env var (ID_ENV) supplies an id. */
	requiresId?: keyof typeof ID_ENV
	note?: string
}

export const ROUTES: Target[] = [
	{ slug: 'login', path: '/login', note: 'the only public route' },
	{ slug: 'dashboard', path: '/dashboard' },
	{ slug: 'routines', path: '/routines' },
	{ slug: 'routines-new', path: '/routines/new' },
	{
		slug: 'workouts',
		path: '/workouts',
		note: 'redirects into the live session when one exists',
	},
	{ slug: 'history', path: '/workouts/history' },
	{
		slug: 'history-detail',
		path: '/workouts/history/__ID__',
		requiresId: 'historyDetail',
		note:
			'restyled in the Phase 13 follow-up, after the baseline was frozen, so ' +
			'it has no `before/` counterpart. Any finished session id; set ' +
			'UI_HISTORY_ID.',
	},
	{
		slug: 'session',
		path: '/workouts/sessions/__ID__',
		requiresId: 'session',
		note: 'highest-density screen in the app; set UI_SESSION_ID',
	},
	{
		slug: 'session-full',
		path: '/workouts/sessions/__ID__',
		requiresId: 'sessionFull',
		note:
			'the same screen carrying real data — logged sets, previous-performance ' +
			'rows, a full progress bar. The `session` slug shows a freshly started ' +
			'session with nothing in it, which hides most of what this screen is. ' +
			'Any finished session id works, since the route renders by id; set ' +
			'UI_SESSION_FULL_ID.',
	},
	{ slug: 'profile', path: '/profile' },
	{ slug: 'search', path: '/search?q=press' },
	{ slug: 'settings', path: '/settings' },
]

export function resolvePath(target: Target): string | null {
	if (!target.requiresId) return target.path
	const id = process.env[ID_ENV[target.requiresId]]
	if (!id) return null
	return target.path.replace('__ID__', id)
}
