import { describe, expect, it } from 'vitest'

import { getSessionResolutionCopy } from './session-resolution'

describe('getSessionResolutionCopy', () => {
	it('uses finish copy for a completed resolution', () => {
		expect(getSessionResolutionCopy('COMPLETED')).toMatchObject({
			title: 'Finish Session',
			confirmLabel: 'Finish Session',
			pendingLabel: 'Finishing...',
		})
	})

	it('uses destructive copy for an aborted resolution', () => {
		expect(getSessionResolutionCopy('ABORTED')).toMatchObject({
			title: 'Discard Session',
			confirmLabel: 'Discard Session',
			pendingLabel: 'Discarding...',
			successTitle: 'Workout discarded',
		})
	})

	it('defaults to finish copy while the dialog is closed', () => {
		expect(getSessionResolutionCopy(null).title).toBe('Finish Session')
	})
})
