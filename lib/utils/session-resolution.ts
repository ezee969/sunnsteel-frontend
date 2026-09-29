import type { Translator } from '@/i18n/translator'

import type { SessionStatus } from './workout-session.types'

export interface SessionResolutionCopy {
	title: string
	prompt: string
	confirmLabel: string
	pendingLabel: string
	successTitle: string
	successDescription: string
	errorTitle: string
}

/**
 * Keeps finish/discard labels aligned without requiring component rendering in
 * the Node-only test suite.
 */
export const getSessionResolutionCopy = (
	status: SessionStatus | null,
	t: Translator<'workout.sessionResolution'>,
): SessionResolutionCopy => {
	const kind = status === 'ABORTED' ? 'discard' : 'finish'
	return {
		title: t(`${kind}.title`),
		prompt: t(`${kind}.prompt`),
		confirmLabel: t(`${kind}.confirmLabel`),
		pendingLabel: t(`${kind}.pendingLabel`),
		successTitle: t(`${kind}.successTitle`),
		successDescription: t(`${kind}.successDescription`),
		errorTitle: t(`${kind}.errorTitle`),
	}
}
