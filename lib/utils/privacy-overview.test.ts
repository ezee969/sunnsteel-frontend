import type { ProfilePrivacySettings } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	getDiscoverySummary,
	getPendingPrivacyRules,
	getPrivacyAudienceGroups,
} from '@/lib/utils/privacy-overview'

const privacy: ProfilePrivacySettings = {
	biography: 'PUBLIC',
	location: 'FOLLOWERS',
	trainingIdentity: 'PUBLIC',
	workoutHistory: 'PRIVATE',
	records: 'FOLLOWERS',
	bodyMetrics: 'PRIVATE',
	routines: 'PUBLIC',
	achievements: 'FOLLOWERS',
}

describe('privacy overview', () => {
	it('groups the rendered sections by audience in a stable order', () => {
		const groups = getPrivacyAudienceGroups(privacy, 'atlas_lifts')
		expect(groups.map(group => [group.title, group.sections])).toEqual([
			['Everyone', ['Biography', 'Training identity']],
			['Followers', ['Location', 'Personal records']],
			['Only me', ['Workout history', 'Body metrics']],
		])
		expect(groups[0].surfaces).toContain('/members/atlas_lifts')
		expect(groups[1].surfaces).toContain('Never on your public link')
	})

	it('keeps rules for not-yet-shown sections out of the live groups', () => {
		const groups = getPrivacyAudienceGroups(privacy, 'atlas_lifts')
		const shown = groups.flatMap(group => group.sections)
		expect(shown).not.toContain('Routines')
		expect(shown).not.toContain('Achievements')
		expect(getPendingPrivacyRules(privacy)).toEqual([
			{ label: 'Routines', audience: 'Everyone' },
			{ label: 'Achievements', audience: 'Followers' },
		])
	})

	it('describes discovery without implying contact matching works', () => {
		expect(
			getDiscoverySummary({
				discoverableByName: true,
				discoverableByUsername: false,
				discoverableByContacts: true,
			}).map(item => item.value),
		).toEqual(['On', 'Off', 'Allowed, not available yet'])
	})
})
