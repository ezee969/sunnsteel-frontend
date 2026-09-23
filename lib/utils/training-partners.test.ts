import { describe, expect, it } from 'vitest'

import {
	findTrainingPartnership,
	TRAINING_PARTNER_ENCOURAGEMENT_OPTIONS,
	trainingPartnerActionLabel,
	trainingPartnerEncouragementLabel,
} from './training-partners'

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
		expect(trainingPartnerActionLabel(undefined)).toBe('Add Training Partner')
		expect(trainingPartnerActionLabel(relationship())).toBe('Request Pending')
		expect(
			trainingPartnerActionLabel(relationship({ requestedByMe: false })),
		).toBe('Accept Partner Request')
		expect(trainingPartnerActionLabel(relationship({ status: 'ACTIVE' }))).toBe(
			'Training Partner',
		)
	})

	it('offers only the four fixed encouragement prompts', () => {
		expect(TRAINING_PARTNER_ENCOURAGEMENT_OPTIONS).toEqual([
			{ kind: 'READY_TO_TRAIN', label: 'Ready to train' },
			{ kind: 'STRONG_SESSION', label: 'Strong session' },
			{ kind: 'GOOD_WORK', label: 'Good work' },
			{ kind: 'KEEP_GOING', label: 'Keep going' },
		])
		expect(trainingPartnerEncouragementLabel('GOOD_WORK')).toBe('Good work')
	})
})
