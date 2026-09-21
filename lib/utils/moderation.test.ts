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

import {
	availableReviewActions,
	BLOCK_EXPLANATION,
	BLOCK_LINK_CAVEAT,
	blockedMemberName,
	describeOtherReports,
	describeReportSubject,
	MODERATION_ACCESS_NOTE,
	MODERATION_ACTION_LABELS,
	MODERATION_HIDE_EXPLANATION,
	MODERATION_QUEUE_SCOPE,
	MODERATION_RECORD_NOTE,
	MODERATION_WITHHELD_ACTIONS_NOTE,
	MODERATION_WITHHELD_NOTE,
	moderationSubjectHref,
	REPORT_REASON_LABELS,
	REPORT_REASON_OPTIONS,
	REPORT_RECEIPT,
	REPORT_STATUS_LABELS,
	reportSubjectOwner,
	ROUTINE_HIDDEN_BY_MODERATION,
	SESSION_SHARE_HIDDEN_BY_MODERATION,
	UNBLOCK_EXPLANATION,
} from './moderation'

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
			expect(REPORT_REASON_LABELS[reason]).toBeTruthy()
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
		)
		expect(described).toMatch(/not visible to you/i)
		expect(described).not.toMatch(/Upper/)
	})

	it('says a missing subject is gone rather than withheld', () => {
		expect(describeReportSubject(subject({ isMissing: true }))).toMatch(
			/no longer exists/i,
		)
	})

	it('names a readable subject', () => {
		expect(describeReportSubject(subject())).toBe('Routine · Upper / Lower')
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
		expect(REPORT_STATUS_LABELS.ACTIONED).not.toMatch(/hidden/i)
	})

	it('labels every status and action kind the contract defines', () => {
		for (const status of REPORT_STATUSES) {
			expect(REPORT_STATUS_LABELS[status]).toBeTruthy()
		}
		for (const kind of MODERATION_ACTION_KINDS) {
			expect(MODERATION_ACTION_LABELS[kind]).toBeTruthy()
		}
	})

	it('names reading as an action of its own in the record', () => {
		expect(MODERATION_ACTION_LABELS.VIEW_SUBJECT).toMatch(/opened/i)
	})
})

describe('other open reports are stated, not badged', () => {
	it('says nothing when there are none', () => {
		expect(describeOtherReports(0)).toBeNull()
	})

	it('agrees in number', () => {
		expect(describeOtherReports(1)).toMatch(/^1 other report/)
		expect(describeOtherReports(3)).toMatch(/^3 other reports/)
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
