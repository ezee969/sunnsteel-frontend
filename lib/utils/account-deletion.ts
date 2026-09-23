import { matchesDeletionConfirmation } from '@sunsteel/contracts'

/**
 * TRUST-01. What deleting an account does, stated before it is done.
 *
 * Deletion is immediate and cannot be undone, so the confirmation lists what
 * goes, the one thing that stays and the one thing the product cannot offer
 * yet, rather than a single line of warning a member has learned to skip.
 */
export const ACCOUNT_DELETION_REMOVES = [
	'Your profile, username, photo and privacy settings',
	'Every routine you made, with its versions and share links',
	'Your workout history, records, goals, achievements and rank',
	'Your follows, training partners, activity, comments, reactions and reports',
	'Your sign-in, so this email can only start a new, empty account',
] as const

export const ACCOUNT_DELETION_KEEPS =
	'Copies other members made of your shared routines stay theirs. They no longer name you.'

/**
 * EXPORT-01 does not exist yet. Saying so is the honest version of "download
 * your data first", which a member would otherwise look for and not find.
 */
export const ACCOUNT_DELETION_NO_EXPORT =
	'There is no data export yet, so save anything you want to keep before you delete.'

export const ACCOUNT_DELETED_NOTICE =
	'Your account and everything in it has been deleted. You can create a new account with the same email at any time.'

/**
 * Why this account cannot be deleted from Settings, or null when it can. The
 * server refuses the same case; stating it here keeps the control from
 * looking broken.
 */
export function deletionBlockedReason(profile: {
	isModerator: boolean
}): string | null {
	return profile.isModerator
		? 'A moderator account cannot be deleted here. Its moderator access has to be removed first, because the moderation record depends on it.'
		: null
}

/** The prompt above the confirmation field, naming exactly what to type. */
export function deletionConfirmationPrompt(username: string): string {
	return `Type ${username} to confirm.`
}

/** Whether the typed confirmation lets the delete control be used. */
export function canConfirmDeletion(typed: string, username: string): boolean {
	return matchesDeletionConfirmation(typed, username)
}

/** The value the login page reads to show `ACCOUNT_DELETED_NOTICE`. */
export const ACCOUNT_DELETED_PARAM = 'deleted'

export const ACCOUNT_DELETED_LOGIN_URL = `/login?account=${ACCOUNT_DELETED_PARAM}`
