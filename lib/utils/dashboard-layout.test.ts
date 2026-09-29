import {
	DASHBOARD_SECTION_IDS,
	type DashboardLayout,
	DEFAULT_DASHBOARD_LAYOUT,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	dashboardRows,
	dashboardSectionLabel,
	describeShownCount,
	moveDashboardSection,
	sameDashboardLayout,
	setDashboardSectionShown,
} from './dashboard-layout'

const layout = (...entries: Array<[string, boolean?]>): DashboardLayout =>
	entries.map(([id, hidden]) => ({
		id,
		hidden: hidden ?? false,
	})) as DashboardLayout

const en = translatorFor('en', 'planning.dashboardLayout')
const es = translatorFor('es', 'planning.dashboardLayout')

describe('dashboard layout', () => {
	it('names every section', () => {
		for (const id of DASHBOARD_SECTION_IDS) {
			expect(dashboardSectionLabel(id, en)).toBeTruthy()
		}
	})

	it('lays out the default with Recent Activity beside Personal Records', () => {
		expect(dashboardRows(undefined)).toEqual([
			{ kind: 'single', id: 'this-week' },
			{ kind: 'single', id: 'stats' },
			{ kind: 'pair', ids: ['recent-activity', 'personal-records'] },
			{ kind: 'single', id: 'training-insights' },
			{ kind: 'single', id: 'upcoming-milestones' },
			{ kind: 'single', id: 'following' },
		])
	})

	it('pairs the two only when both are shown and adjacent among shown sections', () => {
		const apart = layout(
			['recent-activity'],
			['stats'],
			['personal-records'],
			['this-week'],
			['training-insights'],
			['upcoming-milestones'],
			['following'],
		)
		expect(dashboardRows(apart).some(row => row.kind === 'pair')).toBe(false)
		const hiddenBetween = setDashboardSectionShown(apart, 'stats', false)
		expect(dashboardRows(hiddenBetween)[0]).toEqual({
			kind: 'pair',
			ids: ['recent-activity', 'personal-records'],
		})
		const oneHidden = setDashboardSectionShown(
			DEFAULT_DASHBOARD_LAYOUT,
			'personal-records',
			false,
		)
		expect(dashboardRows(oneHidden)).toContainEqual({
			kind: 'single',
			id: 'recent-activity',
		})
		expect(dashboardRows(oneHidden).some(row => row.kind === 'pair')).toBe(
			false,
		)
	})

	it('moves a section one place and ignores a move past either end', () => {
		const moved = moveDashboardSection(DEFAULT_DASHBOARD_LAYOUT, 1, -1)
		expect(moved.slice(0, 2).map(entry => entry.id)).toEqual([
			'stats',
			'this-week',
		])
		expect(moveDashboardSection(DEFAULT_DASHBOARD_LAYOUT, 0, -1)).toBe(
			DEFAULT_DASHBOARD_LAYOUT,
		)
		expect(moveDashboardSection(DEFAULT_DASHBOARD_LAYOUT, 6, 1)).toBe(
			DEFAULT_DASHBOARD_LAYOUT,
		)
		expect(DEFAULT_DASHBOARD_LAYOUT[0].id).toBe('this-week')
	})

	it('compares layouts and counts what is shown', () => {
		const hidden = setDashboardSectionShown(
			DEFAULT_DASHBOARD_LAYOUT,
			'following',
			false,
		)
		expect(sameDashboardLayout(hidden, DEFAULT_DASHBOARD_LAYOUT)).toBe(false)
		expect(
			sameDashboardLayout(DEFAULT_DASHBOARD_LAYOUT, [
				...DEFAULT_DASHBOARD_LAYOUT,
			]),
		).toBe(true)
		expect(describeShownCount(hidden, en)).toBe('6 of 7 sections shown')
	})
})

describe('the layout copy in Spanish (I18N-04)', () => {
	it('counts what is shown and names every section', () => {
		const hidden = setDashboardSectionShown(
			DEFAULT_DASHBOARD_LAYOUT,
			'following',
			false,
		)
		expect(describeShownCount(hidden, es)).toBe('6 de 7 secciones visibles')
		expect(dashboardSectionLabel('this-week', es)).toBe('Esta semana')
		// Every id the contract defines has a name in both languages.
		for (const entry of DEFAULT_DASHBOARD_LAYOUT) {
			expect(dashboardSectionLabel(entry.id, es)).toBeTruthy()
		}
	})
})
