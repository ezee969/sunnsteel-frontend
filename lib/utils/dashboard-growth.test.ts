import { DEFAULT_DASHBOARD_LAYOUT } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	type DashboardGrowthSignals,
	effectiveDashboardLayout,
	GETTING_STARTED_WORKOUTS,
	gettingStartedSteps,
	isGettingStarted,
} from './dashboard-growth'
import { dashboardRows } from './dashboard-layout'

const NEW_ACCOUNT: DashboardGrowthSignals = {
	completedWorkouts: 0,
	recentActivity: 0,
	personalRecords: 0,
	followingCount: 0,
}

const shown = (signals: DashboardGrowthSignals, stored = undefined) =>
	effectiveDashboardLayout(stored, signals)
		.filter(entry => !entry.hidden)
		.map(entry => entry.id)

describe('isGettingStarted (UX-19)', () => {
	it('holds for a default layout under three finished workouts', () => {
		expect(isGettingStarted(undefined, 0)).toBe(true)
		expect(isGettingStarted(DEFAULT_DASHBOARD_LAYOUT, 2)).toBe(true)
	})

	it('ends at the third finished workout', () => {
		expect(isGettingStarted(undefined, GETTING_STARTED_WORKOUTS)).toBe(false)
	})

	it('never applies to a customized layout', () => {
		const reordered = [...DEFAULT_DASHBOARD_LAYOUT].reverse()
		expect(isGettingStarted(reordered, 0)).toBe(false)
		const oneHidden = DEFAULT_DASHBOARD_LAYOUT.map((entry, index) => ({
			...entry,
			hidden: index === 1,
		}))
		expect(isGettingStarted(oneHidden, 0)).toBe(false)
	})
})

describe('effectiveDashboardLayout (UX-19)', () => {
	it('shows only This Week to an account with nothing yet', () => {
		expect(shown(NEW_ACCOUNT)).toEqual(['this-week'])
	})

	it('adds each section once it has something, in the default order', () => {
		expect(
			shown({
				completedWorkouts: 1,
				recentActivity: 1,
				personalRecords: 2,
				followingCount: 1,
			}),
		).toEqual([
			'this-week',
			'stats',
			'recent-activity',
			'personal-records',
			'upcoming-milestones',
			'following',
		])
	})

	it('adds Following on a follow alone, before any workout', () => {
		expect(shown({ ...NEW_ACCOUNT, followingCount: 3 })).toEqual([
			'this-week',
			'following',
		])
	})

	it('returns the full default at the third finished workout', () => {
		const layout = effectiveDashboardLayout(undefined, {
			...NEW_ACCOUNT,
			completedWorkouts: GETTING_STARTED_WORKOUTS,
		})
		expect(layout).toEqual(DEFAULT_DASHBOARD_LAYOUT)
	})

	it('leaves a customized layout exactly as stored', () => {
		const custom = DEFAULT_DASHBOARD_LAYOUT.map((entry, index) => ({
			...entry,
			hidden: index !== 0,
		}))
		expect(effectiveDashboardLayout(custom, NEW_ACCOUNT)).toEqual(custom)
	})

	it('still pairs Recent Activity and Personal Records when both join', () => {
		const rows = dashboardRows(
			effectiveDashboardLayout(undefined, {
				completedWorkouts: 1,
				recentActivity: 1,
				personalRecords: 1,
				followingCount: 0,
			}),
		)
		expect(rows).toContainEqual({
			kind: 'pair',
			ids: ['recent-activity', 'personal-records'],
		})
	})
})

describe('gettingStartedSteps (UX-19)', () => {
	it('lists the routine, the first workout and the gym, in that order', () => {
		expect(
			gettingStartedSteps({
				routines: 0,
				completedWorkouts: 0,
				trainingLocations: 0,
			}),
		).toEqual([
			{ id: 'routine', done: false },
			{ id: 'workout', done: false },
			{ id: 'gym', done: false },
		])
	})

	it('marks each step done from the data the account already has', () => {
		expect(
			gettingStartedSteps({
				routines: 2,
				completedWorkouts: 1,
				trainingLocations: 1,
			}).every(step => step.done),
		).toBe(true)
	})
})
