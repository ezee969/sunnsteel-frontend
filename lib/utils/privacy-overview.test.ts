import type { ProfilePrivacySettings } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'
import {
	getDiscoverySummary,
	getPendingPrivacyRules,
	getPrivacyAudienceGroups,
} from '@/lib/utils/privacy-overview'

const t = translatorFor('en', 'settings.privacyOverview')
const tEs = translatorFor('es', 'settings.privacyOverview')

const privacy: ProfilePrivacySettings = {
	biography: 'PUBLIC',
	location: 'FOLLOWERS',
	trainingIdentity: 'PUBLIC',
	workoutHistory: 'PRIVATE',
	records: 'FOLLOWERS',
	bodyMetrics: 'PRIVATE',
	bodyProgress: 'FOLLOWERS',
	routines: 'PUBLIC',
	achievements: 'FOLLOWERS',
}

describe('privacy overview', () => {
	it('groups the rendered sections by audience in a stable order', () => {
		const groups = getPrivacyAudienceGroups(t, privacy, 'atlas_lifts')
		expect(groups.map(group => [group.title, group.sections])).toEqual([
			['Everyone', ['Biography', 'Training identity']],
			['Followers', ['Location', 'Personal records', 'Body progress']],
			['Only me', ['Workout history', 'Body metrics']],
		])
		expect(groups[0].surfaces).toContain('/members/atlas_lifts')
		expect(groups[1].surfaces).toContain('Never on your public link')
	})

	it('keeps rules for not-yet-shown sections out of the live groups', () => {
		const groups = getPrivacyAudienceGroups(t, privacy, 'atlas_lifts')
		const shown = groups.flatMap(group => group.sections)
		expect(shown).not.toContain('Routines')
		expect(shown).not.toContain('Achievements')
		expect(getPendingPrivacyRules(t, privacy)).toEqual([
			{ label: 'Routines', audience: 'Everyone' },
			{ label: 'Achievements', audience: 'Followers' },
		])
	})

	it('describes discovery without implying contact matching works', () => {
		expect(
			getDiscoverySummary(t, {
				discoverableByName: true,
				discoverableByUsername: false,
				discoverableByContacts: true,
			}).map(item => item.value),
		).toEqual(['On', 'Off', 'Allowed, not available yet'])
	})

	it('says the same in Spanish, in the same order', () => {
		const groups = getPrivacyAudienceGroups(tEs, privacy, 'atlas_lifts')
		expect(groups.map(group => [group.title, group.sections])).toEqual([
			['Todos', ['Biografía', 'Identidad de entrenamiento']],
			['Seguidores', ['Ubicación', 'Récords personales', 'Progreso corporal']],
			['Solo yo', ['Historial de entrenamientos', 'Datos corporales']],
		])
		expect(groups[0].surfaces).toContain('/members/atlas_lifts')
		expect(groups[1].surfaces).toContain('Nunca en tu enlace público')
		expect(getPendingPrivacyRules(tEs, privacy)).toEqual([
			{ label: 'Rutinas', audience: 'Todos' },
			{ label: 'Logros', audience: 'Seguidores' },
		])
		expect(
			getDiscoverySummary(tEs, {
				discoverableByName: true,
				discoverableByUsername: false,
				discoverableByContacts: true,
			}).map(item => item.value),
		).toEqual(['Activada', 'Desactivada', 'Permitida, aún no disponible'])
	})
})
