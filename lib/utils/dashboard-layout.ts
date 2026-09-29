import {
	type DashboardLayout,
	type DashboardSectionId,
	normalizeDashboardLayout,
} from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'

/** The name each section carries on the dashboard and in Customize. */
export function dashboardSectionLabel(
	id: DashboardSectionId,
	t: Translator<'planning.dashboardLayout'>,
): string {
	return t(`sections.${id}`)
}

/** A copy with one section moved by `delta` places; out of range is a no-op. */
export function moveDashboardSection(
	layout: DashboardLayout,
	index: number,
	delta: -1 | 1,
): DashboardLayout {
	const target = index + delta
	if (index < 0 || index >= layout.length) return layout
	if (target < 0 || target >= layout.length) return layout
	const next = layout.map(entry => ({ ...entry }))
	;[next[index], next[target]] = [next[target], next[index]]
	return next
}

export function setDashboardSectionShown(
	layout: DashboardLayout,
	id: DashboardSectionId,
	shown: boolean,
): DashboardLayout {
	return layout.map(entry =>
		entry.id === id ? { ...entry, hidden: !shown } : { ...entry },
	)
}

export function sameDashboardLayout(
	a: DashboardLayout,
	b: DashboardLayout,
): boolean {
	return (
		a.length === b.length &&
		a.every(
			(entry, index) =>
				entry.id === b[index].id && entry.hidden === b[index].hidden,
		)
	)
}

/** Sections that share a row at `lg` when both are shown and side by side. */
const PAIRED: ReadonlySet<DashboardSectionId> = new Set([
	'recent-activity',
	'personal-records',
])

export type DashboardRow =
	| { kind: 'single'; id: DashboardSectionId }
	| { kind: 'pair'; ids: [DashboardSectionId, DashboardSectionId] }

/**
 * The shown sections as the page lays them out. Recent Activity and Personal
 * Records share a row only when both are shown and adjacent among the shown
 * sections, in whichever order the member put them; otherwise each is a row.
 */
export function dashboardRows(
	stored: DashboardLayout | undefined,
): DashboardRow[] {
	const shown = normalizeDashboardLayout(stored)
		.filter(entry => !entry.hidden)
		.map(entry => entry.id)
	const rows: DashboardRow[] = []
	for (let index = 0; index < shown.length; index += 1) {
		const id = shown[index]
		const next = shown[index + 1]
		if (PAIRED.has(id) && next && PAIRED.has(next)) {
			rows.push({ kind: 'pair', ids: [id, next] })
			index += 1
		} else {
			rows.push({ kind: 'single', id })
		}
	}
	return rows
}

/** "3 of 7 shown"-style line for the Customize dialog. */
export function describeShownCount(
	layout: DashboardLayout,
	t: Translator<'planning.dashboardLayout'>,
): string {
	const shown = layout.filter(entry => !entry.hidden).length
	return t('shownCount', { shown, total: layout.length })
}
