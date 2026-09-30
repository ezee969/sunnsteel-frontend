import type { MessageKey, Translator } from '@/i18n/translator'

import type { HashRule, PageTab } from './page-tabs'

/**
 * UX-11: Progress's five tabs, each answering one question. Overview is the
 * bare route, so every existing link to `/progress` still lands somewhere
 * that makes sense.
 */
const PROGRESS_TAB_KEYS = [
	{ href: '/progress', key: 'overview' },
	{ href: '/progress/strength', key: 'strength' },
	{ href: '/progress/load', key: 'load' },
	{ href: '/progress/workouts', key: 'workouts' },
	{ href: '/progress/body', key: 'body' },
] as const satisfies readonly {
	href: string
	key: MessageKey<'progress.tabs'>
}[]

export function progressTabs(
	t: Translator<'progress.tabs'>,
): readonly PageTab[] {
	return PROGRESS_TAB_KEYS.map(tab => ({ href: tab.href, label: t(tab.key) }))
}

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
