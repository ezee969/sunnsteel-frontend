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

const FINISH_COPY: SessionResolutionCopy = {
	title: 'Finish Session',
	prompt: 'Are you sure you want to finish your workout session for',
	confirmLabel: 'Finish Session',
	pendingLabel: 'Finishing...',
	successTitle: 'Session finished',
	successDescription: 'Your workout progress was saved.',
	errorTitle: 'Could not finish workout',
}

const DISCARD_COPY: SessionResolutionCopy = {
	title: 'Discard Session',
	prompt: 'Are you sure you want to discard your workout session for',
	confirmLabel: 'Discard Session',
	pendingLabel: 'Discarding...',
	successTitle: 'Workout discarded',
	successDescription: 'You can start a new workout whenever you are ready.',
	errorTitle: 'Could not discard workout',
}

/**
 * Keeps finish/discard labels aligned without requiring component rendering in
 * the Node-only test suite.
 */
export const getSessionResolutionCopy = (
	status: SessionStatus | null,
): SessionResolutionCopy => (status === 'ABORTED' ? DISCARD_COPY : FINISH_COPY)
