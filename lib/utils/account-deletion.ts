import { matchesDeletionConfirmation } from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'

/**
 * TRUST-01. What deleting an account does, stated before it is done.
 *
 * Deletion is immediate and cannot be undone, so the confirmation lists what
 * goes, the one thing that stays and the one thing the product cannot offer
 * yet, rather than a single line of warning a member has learned to skip.
 */
export function accountDeletionRemoves(
	t: Translator<'core.accountDeletion'>,
): string[] {
	return [
		t('removesProfile'),
		t('removesRoutines'),
		t('removesHistory'),
		t('removesSocial'),
		t('removesSignIn'),
	]
}

export function accountDeletionKeeps(
	t: Translator<'core.accountDeletion'>,
): string {
	return t('keeps')
}

/**
 * EXPORT-01: the step to take first, named where it is -- the card directly
 * above -- because the deletion is final.
 */
export function accountDeletionExportFirst(
	t: Translator<'core.accountDeletion'>,
): string {
	return t('exportFirst')
}

export function accountDeletedNotice(
	t: Translator<'core.accountDeletion'>,
): string {
	return t('deletedNotice')
}

/**
 * Why this account cannot be deleted from Settings, or null when it can. The
 * server refuses the same case; stating it here keeps the control from
 * looking broken.
 */
export function deletionBlockedReason(
	profile: { isModerator: boolean },
	t: Translator<'core.accountDeletion'>,
): string | null {
	return profile.isModerator ? t('moderatorBlocked') : null
}

/** The prompt above the confirmation field, naming exactly what to type. */
export function deletionConfirmationPrompt(
	username: string,
	t: Translator<'core.accountDeletion'>,
): string {
	return t('confirmationPrompt', { username })
}

/** Whether the typed confirmation lets the delete control be used. */
export function canConfirmDeletion(typed: string, username: string): boolean {
	return matchesDeletionConfirmation(typed, username)
}

/** The value the login page reads to show `accountDeletedNotice`. */
export const ACCOUNT_DELETED_PARAM = 'deleted'

export const ACCOUNT_DELETED_LOGIN_URL = `/login?account=${ACCOUNT_DELETED_PARAM}`
