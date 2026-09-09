/**
 * The capture manifest, in code. Mirrors docs/ui-restyle/capture-manifest.md —
 * keep the two in step.
 */

export const WIDTHS = [390, 768, 1440] as const

export const THEMES = ['light', 'dark'] as const

/** The Phase 9 responsive sweep. Not part of the frozen baseline. */
export const SWEEP_WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440] as const

export type Target = {
	/** File-name slug: `<slug>-<width>-<theme>.png`. */
	slug: string
	path: string
	/** Skipped unless the matching env var supplies an id. */
	requiresId?: 'session' | 'sessionFull'
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
	if (target.requiresId === 'session') {
		const id = process.env.UI_SESSION_ID
		if (!id) return null
		return target.path.replace('__ID__', id)
	}
	if (target.requiresId === 'sessionFull') {
		const id = process.env.UI_SESSION_FULL_ID
		if (!id) return null
		return target.path.replace('__ID__', id)
	}
	return target.path
}
