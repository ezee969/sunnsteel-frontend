import type {
	BlockedMember,
	ModerationReport,
	ReportSubjectPreview,
} from '@sunsteel/contracts'
import {
	MODERATION_ACTION_KINDS,
	REPORT_REASONS,
	REPORT_STATUSES,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	availableReviewActions,
	blockedMemberName,
	capturedAuthorName,
	describeModerationAction,
	describeOtherReports,
	describeReportFiled,
	describeReportSubject,
	MODERATION_ACTION_LABELS,
	moderationSubjectHref,
	REPORT_REASON_LABELS,
	REPORT_REASON_OPTIONS,
	REPORT_STATUS_LABELS,
	reportSubjectOwner,
} from './moderation'

const t = translatorFor('en', 'social.moderation')
const es = translatorFor('es', 'social.moderation')

const BLOCK_EXPLANATION = t('blockExplanation')
const BLOCK_LINK_CAVEAT = t('blockLinkCaveat')
const UNBLOCK_EXPLANATION = t('unblockExplanation')
const REPORT_RECEIPT = t('reportReceipt')
const MODERATION_ACCESS_NOTE = t('accessNote')
const MODERATION_WITHHELD_NOTE = t('withheldNote')
const MODERATION_WITHHELD_ACTIONS_NOTE = t('withheldActionsNote')
const MODERATION_QUEUE_SCOPE = t('queueScope')
const MODERATION_HIDE_EXPLANATION = t('hideExplanation')
const MODERATION_RECORD_NOTE = t('recordNote')
const ROUTINE_HIDDEN_BY_MODERATION = t('routineHidden')
const SESSION_SHARE_HIDDEN_BY_MODERATION = t('sessionShareHidden')

const block = (
	overrides: Partial<BlockedMember['member']> = {},
): BlockedMember => ({
	member: {
		id: 'them',
		username: 'them',
		name: 'Them',
		lastName: null,
		avatarUrl: null,
		...overrides,
	},
	blockedAt: '2026-09-18T10:00:00.000Z',
})

describe('blocking copy', () => {
	it('says the block runs both ways and removes the follows', () => {
		// A control described as one-directional would leave the blocker
		// believing they are still visible to the person they blocked.
		expect(BLOCK_EXPLANATION).toMatch(/both ways/i)
		expect(BLOCK_EXPLANATION).toMatch(/follow/i)
	})

	it('states what a block cannot do, rather than implying it does', () => {
		// A SOC-07 or ROUT-04 link carries no viewer identity, so a block cannot
		// withdraw one; claiming otherwise would be a false safety promise.
		expect(BLOCK_LINK_CAVEAT).toMatch(/links/i)
		expect(BLOCK_LINK_CAVEAT).toMatch(/revoke/i)
	})

	it('warns that unblocking restores nothing it removed', () => {
		expect(UNBLOCK_EXPLANATION).toMatch(/not restored/i)
	})
})

describe('reporting copy', () => {
	it('confirms recording without promising a review or a timetable', () => {
		// TRUST-04 now reads these rows, and the receipt still must not say when.
		expect(REPORT_RECEIPT).toMatch(/recorded/i)
		expect(REPORT_RECEIPT).not.toMatch(/within|24 hours|we will review it/i)
	})

	it('labels every reason the contract defines, in contract order', () => {
		for (const reason of REPORT_REASONS) {
			expect(t(REPORT_REASON_LABELS[reason])).toBeTruthy()
		}
		expect(REPORT_REASON_OPTIONS.map(option => option.value)).toEqual([
			...REPORT_REASONS,
		])
	})
})

describe('a blocked member row', () => {
	it('prefers a real name and falls back to the handle', () => {
		expect(
			blockedMemberName(block({ name: 'Ada', lastName: 'Lovelace' })),
		).toBe('Ada Lovelace')
		expect(blockedMemberName(block({ name: '', lastName: null }))).toBe('@them')
	})
})

const subject = (
	overrides: Partial<ReportSubjectPreview> = {},
): ReportSubjectPreview => ({
	kind: 'ROUTINE',
	id: 'routine-1',
	resolvedId: 'routine-1',
	title: 'Upper / Lower',
	owner: {
		id: 'owner',
		username: 'owner',
		name: 'Owner',
		lastName: null,
		avatarUrl: null,
	},
	isMissing: false,
	isWithheld: false,
	isHidden: false,
	messagingRestricted: null,
	messageGone: false,
	...overrides,
})

const report = (
	overrides: Partial<ModerationReport> = {},
): ModerationReport => ({
	id: 'report-1',
	status: 'OPEN',
	reason: 'SPAM',
	details: null,
	createdAt: '2026-09-20T10:00:00.000Z',
	reporter: {
		id: 'reporter',
		username: 'reporter',
		name: 'Rep',
		lastName: null,
		avatarUrl: null,
	},
	subject: subject(),
	otherOpenReports: 0,
	resolvedAt: null,
	...overrides,
})

describe('the review queue never fills in what it may not show', () => {
	it('names a withheld subject by its kind and nothing else', () => {
		// The title and the owner are the content. Printing them "for context"
		// would be the bypass the whole design exists to avoid.
		const described = describeReportSubject(
			subject({ isWithheld: true, title: null, owner: null }),
			t,
		)
		expect(described).toMatch(/not visible to you/i)
		expect(described).not.toMatch(/Upper/)
	})

	it('says a missing subject is gone rather than withheld', () => {
		expect(describeReportSubject(subject({ isMissing: true }), t)).toMatch(
			/no longer exists/i,
		)
	})

	it('names a readable subject', () => {
		expect(describeReportSubject(subject(), t)).toBe('Routine · Upper / Lower')
		expect(describeReportSubject(subject(), es)).toBe('Rutina · Upper / Lower')
	})

	it('offers no link for a subject the reviewer cannot open', () => {
		// A link that 404s on arrival is worse than no link: it reads as a bug
		// rather than as the rule working.
		expect(moderationSubjectHref(subject({ isWithheld: true }))).toBeNull()
		expect(moderationSubjectHref(subject({ isMissing: true }))).toBeNull()
		expect(moderationSubjectHref(subject({ resolvedId: null }))).toBeNull()
	})

	it('sends the reviewer to the subject own page, not a moderation copy', () => {
		expect(moderationSubjectHref(subject())).toBe('/routines/routine-1')
		expect(
			moderationSubjectHref(
				subject({ kind: 'MEMBER', resolvedId: 'user-1', id: 'user-1' }),
			),
		).toBe('/profile/user-1')
		expect(
			moderationSubjectHref(
				subject({ kind: 'SESSION', resolvedId: 'tok', id: 'tok' }),
			),
		).toBe('/shared/sessions/tok')
	})

	it('omits an owner it was not given', () => {
		expect(reportSubjectOwner(subject({ owner: null }))).toBeNull()
		expect(reportSubjectOwner(subject())).toBe('Owner')
	})
})

describe('which actions a report offers', () => {
	it('always allows dismissing an open report, even about something gone', () => {
		const gone = availableReviewActions(
			report({ subject: subject({ isMissing: true }) }),
		)
		expect(gone.canDismiss).toBe(true)
		expect(gone.canHide).toBe(false)
		expect(gone.canOpen).toBe(false)
	})

	it('does not offer a hide that is already in force', () => {
		const hidden = availableReviewActions(
			report({ subject: subject({ isHidden: true }) }),
		)
		expect(hidden.canHide).toBe(false)
		expect(hidden.canRestore).toBe(true)
	})

	it('still offers a restore after the report has left the queue', () => {
		// Undoing a hide is the one thing a reviewer needs once the report is
		// resolved, so it is not gated on the report being open.
		const resolved = availableReviewActions(
			report({ status: 'ACTIONED', subject: subject({ isHidden: true }) }),
		)
		expect(resolved.canRestore).toBe(true)
		expect(resolved.canDismiss).toBe(false)
		expect(resolved.canHide).toBe(false)
	})

	it('does not offer opening a subject the rules withhold', () => {
		expect(
			availableReviewActions(report({ subject: subject({ isWithheld: true }) }))
				.canOpen,
		).toBe(false)
	})
})

describe('MSG-09 message reports', () => {
	const messageSubject = (overrides: Partial<ReportSubjectPreview> = {}) =>
		subject({
			kind: 'MESSAGE',
			id: 'message-1',
			resolvedId: 'message-1',
			title: null,
			messagingRestricted: false,
			...overrides,
		})

	it('are read on the row, never opened on a page', () => {
		const actions = availableReviewActions(
			report({ subject: messageSubject() }),
		)
		expect(actions.canOpen).toBe(false)
		expect(actions.canReadMessages).toBe(true)
		expect(moderationSubjectHref(messageSubject())).toBeNull()
		expect(describeReportSubject(messageSubject(), t)).toBe('Message')
	})

	it('leave nothing to hide or restore once the author deleted the message', () => {
		const gone = availableReviewActions(
			report({
				subject: messageSubject({ messageGone: true, isHidden: true }),
			}),
		)
		expect(gone.canHide).toBe(false)
		expect(gone.canRestore).toBe(false)
		// The capture outlives the deletion.
		expect(gone.canReadMessages).toBe(true)
	})

	it('can no longer be read once the capture went with its author', () => {
		const missing = availableReviewActions(
			report({
				subject: messageSubject({ isMissing: true, messagingRestricted: null }),
			}),
		)
		expect(missing.canReadMessages).toBe(false)
		expect(missing.canRestrict).toBe(false)
		expect(missing.canLift).toBe(false)
	})

	it('offer restricting or lifting by what stands, whatever the report status', () => {
		const open = availableReviewActions(report({ subject: messageSubject() }))
		expect([open.canRestrict, open.canLift]).toEqual([true, false])
		const lifted = availableReviewActions(
			report({
				status: 'ACTIONED',
				subject: messageSubject({ messagingRestricted: true }),
			}),
		)
		expect([lifted.canRestrict, lifted.canLift]).toEqual([false, true])
	})

	it('offer restricting on a member report, never on a routine', () => {
		expect(
			availableReviewActions(
				report({
					subject: subject({ kind: 'MEMBER', messagingRestricted: false }),
				}),
			).canRestrict,
		).toBe(true)
		expect(availableReviewActions(report()).canRestrict).toBe(false)
	})

	it('names who wrote each captured message', () => {
		const context = {
			author: {
				id: 'author',
				username: 'author',
				name: 'Aria',
				lastName: 'Stone',
				avatarUrl: null,
			},
			messages: [],
			capturedAt: '2026-10-06T10:00:00.000Z',
		}
		const captured = {
			id: 'm',
			body: 'hi',
			deleted: false,
			isReported: false,
			createdAt: '2026-10-06T09:00:00.000Z',
		}
		const filed = report({ subject: messageSubject() })
		expect(
			capturedAuthorName({ ...captured, fromReporter: false }, filed, context),
		).toBe('Aria Stone')
		expect(
			capturedAuthorName({ ...captured, fromReporter: true }, filed, context),
		).toBe(reportSubjectOwner({ ...filed.subject, owner: filed.reporter }))
	})
})

describe('review copy states the powers honestly', () => {
	it('says there is no reviewer bypass', () => {
		expect(MODERATION_ACCESS_NOTE).toMatch(/same privacy rules/i)
	})

	it('keeps the withheld note free of actions the row may not be offering', () => {
		// A hidden subject is withheld from the reviewer who hid it, and that
		// row shows only Restore. The note must not name Dismiss or Hide.
		expect(MODERATION_WITHHELD_NOTE).not.toMatch(/dismiss|hide/i)
		expect(MODERATION_WITHHELD_ACTIONS_NOTE).toMatch(/dismiss/i)
	})

	it('says opening reported content is recorded', () => {
		expect(MODERATION_QUEUE_SCOPE).toMatch(/recorded/i)
	})

	it('says a hide deletes nothing and leaves the owner their content', () => {
		expect(MODERATION_HIDE_EXPLANATION).toMatch(/owner keeps it/i)
		expect(MODERATION_HIDE_EXPLANATION).toMatch(/nothing is deleted/i)
		expect(MODERATION_HIDE_EXPLANATION).toMatch(/restore/i)
	})

	it('says the record cannot be edited or removed', () => {
		expect(MODERATION_RECORD_NOTE).toMatch(/cannot be edited/i)
	})

	it('tells the owner a hidden routine reaches nobody, links included', () => {
		// A routine whose own control still reads "Public" while it resolves for
		// nobody is a switch with nothing behind it.
		expect(ROUTINE_HIDDEN_BY_MODERATION).toMatch(/nobody else/i)
		expect(ROUTINE_HIDDEN_BY_MODERATION).toMatch(/link/i)
		expect(ROUTINE_HIDDEN_BY_MODERATION).toMatch(/unchanged/i)
	})

	it('tells the owner a hidden share is not revoked', () => {
		expect(SESSION_SHARE_HIDDEN_BY_MODERATION).toMatch(/not revoked/i)
	})

	it('labels a status as a decision, never as a claim about the subject', () => {
		// Two reports can name one subject, so a restore through one leaves the
		// other resolved while the content is visible again. `subject.isHidden`
		// is the live fact; the status is only what was decided.
		expect(t(REPORT_STATUS_LABELS.ACTIONED)).not.toMatch(/hidden/i)
		expect(es(REPORT_STATUS_LABELS.ACTIONED)).not.toMatch(/ocult/i)
	})

	it('labels every status and action kind the contract defines', () => {
		for (const status of REPORT_STATUSES) {
			expect(t(REPORT_STATUS_LABELS[status])).toBeTruthy()
		}
		for (const kind of MODERATION_ACTION_KINDS) {
			expect(t(MODERATION_ACTION_LABELS[kind])).toBeTruthy()
		}
	})

	it('names reading as an action of its own in the record', () => {
		expect(t(MODERATION_ACTION_LABELS.VIEW_SUBJECT)).toMatch(/opened/i)
	})
})

describe('other open reports are stated, not badged', () => {
	it('says nothing when there are none', () => {
		expect(describeOtherReports(0, t)).toBeNull()
	})

	it('agrees in number', () => {
		expect(describeOtherReports(1, t)).toMatch(/^1 other report/)
		expect(describeOtherReports(3, t)).toMatch(/^3 other reports/)
		expect(describeOtherReports(1, es)).toBe(
			'Hay 1 denuncia más sobre esto todavía abierta',
		)
		expect(describeOtherReports(3, es)).toBe(
			'Hay 3 denuncias más sobre esto todavía abiertas',
		)
	})
})

describe('the PROF-10 receipt has not drifted into a timetable', () => {
	it('still promises no update and no schedule now that a queue exists', () => {
		// A queue existing is not a promise about when anyone reaches a row.
		expect(REPORT_RECEIPT).toMatch(/recorded/i)
		expect(REPORT_RECEIPT).toMatch(/will not get an update/i)
		expect(REPORT_RECEIPT).not.toMatch(
			/within|hours|days|soon|shortly|as soon as|promptly/i,
		)
	})
})

describe('the Spanish copy keeps the same promises', () => {
	it('says the block runs both ways and what it cannot withdraw', () => {
		expect(es('blockExplanation')).toMatch(/ambos sentidos/i)
		expect(es('blockExplanation')).toMatch(/seguimiento/i)
		expect(es('blockLinkCaveat')).toMatch(/enlace/i)
		expect(es('blockLinkCaveat')).toMatch(/revoca/i)
		expect(es('unblockExplanation')).toMatch(/no se restauran/i)
	})

	it('confirms a report without promising an update or a timetable', () => {
		const receipt = es('reportReceipt')
		expect(receipt).toMatch(/registrada/i)
		expect(receipt).toMatch(/no recibirás novedades/i)
		expect(receipt).not.toMatch(
			/en un plazo|dentro de|horas|días|pronto|en breve|lo antes posible|enseguida|revisaremos/i,
		)
	})

	it('states the reviewer powers honestly', () => {
		expect(es('accessNote')).toMatch(/mismas reglas de privacidad/i)
		expect(es('withheldNote')).not.toMatch(/descart|ocult/i)
		expect(es('withheldActionsNote')).toMatch(/descartar/i)
		expect(es('queueScope')).toMatch(/registrado/i)
		expect(es('hideExplanation')).toMatch(/propietario lo conserva/i)
		expect(es('hideExplanation')).toMatch(/no se elimina nada/i)
		expect(es('hideExplanation')).toMatch(/restaurarlo/i)
		expect(es('recordNote')).toMatch(/no se puede editar/i)
		expect(es('routineHidden')).toMatch(/nadie más/i)
		expect(es('routineHidden')).toMatch(/enlace/i)
		expect(es('routineHidden')).toMatch(/no cambió/i)
		expect(es('sessionShareHidden')).toMatch(/no se revocó/i)
	})

	it('names a withheld subject by its kind alone', () => {
		const described = describeReportSubject(
			subject({ isWithheld: true, title: null, owner: null }),
			es,
		)
		expect(described).toBe('Rutina · no visible para ti')
	})

	it('dates the filing and the record in the reader language', () => {
		expect(describeReportFiled(report(), t, 'en')).toBe(
			'Filed Sep 20, 2026 by Rep',
		)
		expect(describeReportFiled(report(), es, 'es')).toMatch(
			/^Hecha el 20 sept?\.? 2026 por Rep$/,
		)
		const action = {
			id: 'a-1',
			kind: 'HIDE_SUBJECT',
			subjectKind: 'ROUTINE',
			subjectId: 'routine-1',
			note: null,
			createdAt: '2026-09-20T10:00:00.000Z',
			moderator: {
				id: 'mod',
				username: 'mod',
				name: 'Mo',
				lastName: 'D',
				avatarUrl: null,
			},
		} as unknown as Parameters<typeof describeModerationAction>[0]
		expect(describeModerationAction(action, t, 'en')).toMatch(
			/^Hid the content · Mo D · Sep 20, 2026/,
		)
		expect(describeModerationAction(action, es, 'es')).toMatch(
			/^Ocultó el contenido · Mo D · 20 sept?/,
		)
	})
})
