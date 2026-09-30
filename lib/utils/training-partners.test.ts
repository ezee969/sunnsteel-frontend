import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	findTrainingPartnership,
	trainingPartnerActionLabel,
	trainingPartnerEncouragementLabel,
	trainingPartnerEncouragementOptions,
} from './training-partners'

const t = translatorFor('en', 'settings.trainingPartners')
const tEs = translatorFor('es', 'settings.trainingPartners')

const relationship = (overrides: Record<string, unknown> = {}) => ({
	id: 'partnership-1',
	status: 'PENDING' as const,
	member: {
		id: 'member-1',
		username: 'cassia',
		name: 'Cassia',
		lastName: null,
		avatarUrl: null,
	},
	requestedByMe: true,
	permissionsGrantedByMe: {
		schedule: false,
		progress: false,
		activity: false,
		routines: false,
		encouragement: false,
	},
	permissionsGrantedToMe: {
		schedule: false,
		progress: false,
		activity: false,
		routines: false,
		encouragement: false,
	},
	createdAt: '2026-09-22T00:00:00.000Z',
	...overrides,
})

describe('training-partner presentation', () => {
	it('finds a relationship by stable member id rather than username', () => {
		expect(findTrainingPartnership([relationship()], 'member-1')?.id).toBe(
			'partnership-1',
		)
	})

	it('names each request state without implying access before acceptance', () => {
		expect(trainingPartnerActionLabel(t, undefined)).toBe(
			'Add Training Partner',
		)
		expect(trainingPartnerActionLabel(t, relationship())).toBe(
			'Request Pending',
		)
		expect(
			trainingPartnerActionLabel(t, relationship({ requestedByMe: false })),
		).toBe('Accept Partner Request')
		expect(
			trainingPartnerActionLabel(t, relationship({ status: 'ACTIVE' })),
		).toBe('Training Partner')
	})

	it('offers only the four fixed encouragement prompts', () => {
		expect(trainingPartnerEncouragementOptions(t)).toEqual([
			{ kind: 'READY_TO_TRAIN', label: 'Ready to train' },
			{ kind: 'STRONG_SESSION', label: 'Strong session' },
			{ kind: 'GOOD_WORK', label: 'Good work' },
			{ kind: 'KEEP_GOING', label: 'Keep going' },
		])
		expect(trainingPartnerEncouragementLabel('GOOD_WORK')).toBe('Good work')
	})

	it('says the same in Spanish', () => {
		expect(trainingPartnerActionLabel(tEs, undefined)).toBe(
			'Agregar compañero de entrenamiento',
		)
		expect(trainingPartnerActionLabel(tEs, relationship())).toBe(
			'Solicitud pendiente',
		)
		expect(
			trainingPartnerActionLabel(tEs, relationship({ requestedByMe: false })),
		).toBe('Aceptar solicitud de compañero')
		expect(
			trainingPartnerEncouragementOptions(tEs).map(option => option.label),
		).toEqual([
			'Listo para entrenar',
			'Gran sesión',
			'Buen trabajo',
			'Sigue así',
		])
	})
})
