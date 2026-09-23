import { describe, expect, it } from 'vitest'

import {
	ACCOUNT_DELETED_LOGIN_URL,
	ACCOUNT_DELETION_KEEPS,
	ACCOUNT_DELETION_NO_EXPORT,
	ACCOUNT_DELETION_REMOVES,
	canConfirmDeletion,
	deletionBlockedReason,
	deletionConfirmationPrompt,
} from './account-deletion'

describe('TRUST-01 account deletion copy', () => {
	it('lists what goes, including the sign-in, and never promises a recovery', () => {
		const removes = ACCOUNT_DELETION_REMOVES.join(' ')
		expect(removes).toMatch(/sign-in/)
		expect(removes).toMatch(/workout history/)
		expect(removes).toMatch(/comments, reactions and reports/)
		const everything = [
			removes,
			ACCOUNT_DELETION_KEEPS,
			ACCOUNT_DELETION_NO_EXPORT,
		].join(' ')
		expect(everything).not.toMatch(/restore|recover|undo|30 days|grace/i)
	})

	it('says plainly that no export exists yet', () => {
		expect(ACCOUNT_DELETION_NO_EXPORT).toMatch(/no data export yet/)
	})

	it('explains the moderator refusal and allows everyone else', () => {
		expect(deletionBlockedReason({ isModerator: true })).toMatch(
			/moderator access has to be removed first/i,
		)
		expect(deletionBlockedReason({ isModerator: false })).toBeNull()
	})

	it('asks for the exact username and accepts only that', () => {
		expect(deletionConfirmationPrompt('athena')).toBe('Type athena to confirm.')
		expect(canConfirmDeletion('athena', 'athena')).toBe(true)
		expect(canConfirmDeletion('@Athena ', 'athena')).toBe(true)
		expect(canConfirmDeletion('', 'athena')).toBe(false)
		expect(canConfirmDeletion('athen', 'athena')).toBe(false)
	})

	it('sends the member to a login page that can say the deletion happened', () => {
		expect(ACCOUNT_DELETED_LOGIN_URL).toBe('/login?account=deleted')
	})
})
