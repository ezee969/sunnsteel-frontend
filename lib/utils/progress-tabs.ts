import type { HashRule, PageTab } from './page-tabs'

/**
 * UX-11: Progress's five tabs, each answering one question. Overview is the
 * bare route, so every existing link to `/progress` still lands somewhere
 * that makes sense.
 */
export const PROGRESS_TABS = [
	{ href: '/progress', label: 'Overview' },
	{ href: '/progress/strength', label: 'Strength' },
	{ href: '/progress/load', label: 'Load' },
	{ href: '/progress/workouts', label: 'Workouts' },
	{ href: '/progress/body', label: 'Body' },
] as const satisfies readonly PageTab[]

/**
 * Where each section that left the single Progress page now lives, by the
 * id an old `/progress#…` link names (design system §21.4). Overview's own
 * sections (`personal-goals`, `plateau-watch`, `training-signals`) stay.
 */
export const PROGRESS_HASH_RULES: readonly HashRule[] = [
	{ id: 'body-progress', href: '/progress/body' },
	{ id: 'body-progress-heading', href: '/progress/body' },
	{ id: 'muscle-distribution', href: '/progress/load' },
	{ id: 'volume-trends', href: '/progress/load' },
	{ id: 'consistency-calendar', href: '/progress/workouts' },
	{ id: 'session-comparison', href: '/progress/workouts' },
	{ id: 'progress-timeline', href: '/progress/strength' },
	{ id: 'progress-exercise', href: '/progress/strength' },
	{ id: 'current-strength', href: '/progress/strength' },
	{ id: 'performance-history', href: '/progress/strength' },
]
