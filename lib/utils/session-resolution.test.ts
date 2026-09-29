import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import { getSessionResolutionCopy } from './session-resolution'

const en = translatorFor('en', 'workout.sessionResolution')
const es = translatorFor('es', 'workout.sessionResolution')

describe('getSessionResolutionCopy', () => {
	it('uses finish copy for a completed resolution', () => {
		expect(getSessionResolutionCopy('COMPLETED', en)).toMatchObject({
			title: 'Finish Session',
			confirmLabel: 'Finish Session',
			pendingLabel: 'Finishing...',
		})
	})

	it('uses destructive copy for an aborted resolution', () => {
		expect(getSessionResolutionCopy('ABORTED', en)).toMatchObject({
			title: 'Discard Session',
			confirmLabel: 'Discard Session',
			pendingLabel: 'Discarding...',
			successTitle: 'Workout discarded',
		})
	})

	it('defaults to finish copy while the dialog is closed', () => {
		expect(getSessionResolutionCopy(null, en).title).toBe('Finish Session')
	})

	it('says the same in Spanish (I18N-04)', () => {
		expect(getSessionResolutionCopy('COMPLETED', es)).toMatchObject({
			title: 'Terminar sesión',
			confirmLabel: 'Terminar sesión',
			pendingLabel: 'Terminando...',
		})
		expect(getSessionResolutionCopy('ABORTED', es)).toMatchObject({
			title: 'Descartar sesión',
			confirmLabel: 'Descartar sesión',
			pendingLabel: 'Descartando...',
			successTitle: 'Entrenamiento descartado',
		})
	})
})
