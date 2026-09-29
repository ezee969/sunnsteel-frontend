import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	ACCOUNT_DELETED_LOGIN_URL,
	accountDeletedNotice,
	accountDeletionExportFirst,
	accountDeletionKeeps,
	accountDeletionRemoves,
	canConfirmDeletion,
	deletionBlockedReason,
	deletionConfirmationPrompt,
} from './account-deletion'

const en = translatorFor('en', 'core.accountDeletion')
const es = translatorFor('es', 'core.accountDeletion')

const everything = (t: typeof en) =>
	[
		accountDeletionRemoves(t).join(' '),
		accountDeletionKeeps(t),
		accountDeletionExportFirst(t),
		accountDeletedNotice(t),
	].join(' ')

describe('TRUST-01 account deletion copy', () => {
	it('lists what goes, including the sign-in, and never promises a recovery', () => {
		const removes = accountDeletionRemoves(en).join(' ')
		expect(removes).toMatch(/sign-in/)
		expect(removes).toMatch(/workout history/)
		expect(removes).toMatch(/comments, reactions and reports/)
		expect(
			[removes, accountDeletionKeeps(en), accountDeletionExportFirst(en)].join(
				' ',
			),
		).not.toMatch(/restore|recover|undo|30 days|grace/i)
	})

	it('never promises a recovery in Spanish either', () => {
		expect(everything(es)).not.toMatch(
			/restaur|recuper|deshacer|30 días|periodo de gracia/i,
		)
		expect(accountDeletionRemoves(es)).toHaveLength(5)
	})

	it('points to the export before anything is deleted', () => {
		expect(accountDeletionExportFirst(en)).toMatch(/Download Your Data/)
		expect(accountDeletionExportFirst(en)).not.toMatch(/no data export/)
		expect(accountDeletionExportFirst(es)).toMatch(/Descargar tus datos/)
	})

	it('explains the moderator refusal and allows everyone else', () => {
		expect(deletionBlockedReason({ isModerator: true }, en)).toMatch(
			/moderator access has to be removed first/i,
		)
		expect(deletionBlockedReason({ isModerator: true }, es)).toMatch(
			/acceso de moderador/i,
		)
		expect(deletionBlockedReason({ isModerator: false }, en)).toBeNull()
	})

	it('asks for the exact username and accepts only that', () => {
		expect(deletionConfirmationPrompt('athena', en)).toBe(
			'Type athena to confirm.',
		)
		expect(deletionConfirmationPrompt('athena', es)).toBe(
			'Escribe athena para confirmar.',
		)
		expect(canConfirmDeletion('athena', 'athena')).toBe(true)
		expect(canConfirmDeletion('@Athena ', 'athena')).toBe(true)
		expect(canConfirmDeletion('', 'athena')).toBe(false)
		expect(canConfirmDeletion('athen', 'athena')).toBe(false)
	})

	it('sends the member to a login page that can say the deletion happened', () => {
		expect(ACCOUNT_DELETED_LOGIN_URL).toBe('/login?account=deleted')
	})
})
