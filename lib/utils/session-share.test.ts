import type { SharedSessionRecap } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	describeShareFields,
	getSharedSessionPath,
	getSharedSessionUrl,
	sharedRecapToRecapView,
	toggleShareField,
} from '@/lib/utils/session-share'

describe('session share links', () => {
	it('builds a public route outside the authenticated shell', () => {
		expect(getSharedSessionPath('abc_DEF-123')).toBe(
			'/shared/sessions/abc_DEF-123',
		)
		expect(
			getSharedSessionUrl('abc_DEF-123', 'https://sunnsteel.example/app'),
		).toBe('https://sunnsteel.example/shared/sessions/abc_DEF-123')
	})

	it('toggles fields while keeping the canonical order', () => {
		expect(toggleShareField(['notes', 'duration'], 'records', true)).toEqual([
			'duration',
			'records',
			'notes',
		])
		expect(
			toggleShareField(['duration', 'records'], 'duration', false),
		).toEqual(['records'])
		expect(describeShareFields(['duration', 'records'])).toBe(
			'Duration · Personal records',
		)
	})
})

describe('shared recap view', () => {
	const shared: SharedSessionRecap = {
		fields: ['volume', 'notes'],
		owner: { username: 'atlas', name: 'Ana' },
		weightUnit: 'LB',
		routineName: 'Upper / Lower',
		dayName: 'Monday',
		endedAt: '2026-09-01T11:00:00.000Z',
		totalVolumeKg: 5400,
		notes: 'Felt strong.',
	}

	it('shows only the regions the owner selected and never the comparison', () => {
		const { sections, recap } = sharedRecapToRecapView(shared)
		expect(sections).toEqual({
			duration: false,
			volume: true,
			completedSets: false,
			comparison: false,
			records: false,
			progression: false,
			notes: true,
		})
		expect(recap.totalVolumeKg).toBe(5400)
		expect(recap.previousSession).toBeNull()
		expect(recap.records).toEqual([])
	})
})
