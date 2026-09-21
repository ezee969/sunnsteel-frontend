import type {
	BlockedMember,
	ModerationActionKind,
	ModerationActionRecord,
	ModerationReport,
	ReportReason,
	ReportStatus,
	ReportSubjectKind,
	ReportSubjectPreview,
} from '@sunsteel/contracts'
import { REPORT_REASONS } from '@sunsteel/contracts'

/**
 * PROF-10 copy. Two things have to be said plainly, because guessing either
 * one wrong is how a safety control becomes a false promise.
 */

/** A block is symmetric, and the copy says which way it runs — both. */
export const BLOCK_EXPLANATION =
	'Blocking works both ways: neither of you will see the other in search, suggestions, follower lists or on each other’s profile, and any follow between you is removed.'

/**
 * What a block cannot do. A `SOC-07` session link and a `ROUT-04` routine link
 * carry no viewer identity — the token is the credential — so a block cannot
 * withdraw one, and saying otherwise would be a false promise.
 */
export const BLOCK_LINK_CAVEAT =
	'Links you already shared keep working for whoever holds them. Revoke the link itself to stop that.'

/** Unblocking restores nothing, which the confirmation states before it acts. */
export const UNBLOCK_EXPLANATION =
	'They will be able to find and follow you again. The follows removed by the block are not restored.'

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
	SPAM: 'Spam or misleading',
	HARASSMENT: 'Harassment or abuse',
	IMPERSONATION: 'Impersonation',
	UNSAFE_ADVICE: 'Unsafe training advice',
	SEXUAL_CONTENT: 'Sexual content',
	OTHER: 'Something else',
}

export const REPORT_REASON_OPTIONS = REPORT_REASONS.map(value => ({
	value,
	label: REPORT_REASON_LABELS[value],
}))

/**
 * What a report does, said honestly: it is recorded. `TRUST-04` shipped the
 * queue that reads it, and **this copy did not change** -- a queue existing
 * is not a promise that anyone will reach a particular row, or when. Nothing
 * here may acquire one.
 */
export const REPORT_RECEIPT =
	'Your report was recorded. Reports are reviewed as moderation is built out; you will not get an update on this one.'

export const REPORT_SUBJECT_LABELS: Record<ReportSubjectKind, string> = {
	MEMBER: 'this member',
	ROUTINE: 'this routine',
	SESSION: 'this shared workout',
}

/** Blocked members newest first, which is the order the server returns. */
export function describeBlockedSince(block: BlockedMember): string {
	return new Date(block.blockedAt).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}

export function blockedMemberName(block: BlockedMember): string {
	const { name, lastName, username } = block.member
	return [name, lastName].filter(Boolean).join(' ') || `@${username}`
}

// Moderation review (TRUST-04) ------------------------------------------------
//
// The reviewer-facing copy. Three things have to be said plainly here, for the
// same reason the block copy above says three: a moderation surface that
// implies a power it does not have is worse than no surface.

export const MODERATION_QUEUE_SCOPE =
	'Every report filed in the app, newest first. Opening a report’s subject is recorded, the same as any other action here.'

/**
 * There is no bypass, and the queue says so where a reviewer would otherwise
 * assume one. `PROF-06` and `PROF-10` decide what a reviewer reads exactly as
 * they decide what anyone reads.
 */
export const MODERATION_ACCESS_NOTE =
	'You see reported content under the same privacy rules as any other member. A profile, routine or workout you would not otherwise be able to open is not shown here either.'

export const MODERATION_WITHHELD_NOTE =
	'You cannot open this under the privacy rules that apply to you.'

/**
 * The second half of the withheld note, and only when something is still on
 * offer. A hidden subject is withheld from the reviewer who hid it, and
 * telling them they may "still dismiss or hide it" when the report is already
 * resolved describes controls the row is not showing.
 */
export const MODERATION_WITHHELD_ACTIONS_NOTE =
	'You can still dismiss the report or hide the content on what the report says.'

export const MODERATION_MISSING_NOTE =
	'This no longer exists. Dismissing is all that is left.'

/** What hiding does, and the two things it deliberately does not do. */
export const MODERATION_HIDE_EXPLANATION =
	'Hiding removes this from everyone else. The owner keeps it and can still see it, nothing is deleted, and you can restore it later.'

export const MODERATION_RESTORE_EXPLANATION =
	'Restoring makes this visible again under its own privacy settings. The hide stays in the record; restoring is added to it rather than replacing it.'

export const MODERATION_RECORD_NOTE =
	'Every action below was recorded when it happened and cannot be edited or removed.'

/**
 * A status describes what was decided about **the report**, not what is
 * currently true of its subject. Two reports can name one subject, so a
 * restore taken through one leaves the other resolved while the content is
 * visible again -- a label reading "Content hidden" would then be asserting
 * something false. The live fact is `subject.isHidden`, which the row shows
 * separately.
 */
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
	OPEN: 'Open',
	DISMISSED: 'Dismissed',
	ACTIONED: 'Acted on',
}

export const MODERATION_ACTION_LABELS: Record<ModerationActionKind, string> = {
	VIEW_SUBJECT: 'Opened the reported content',
	DISMISS_REPORT: 'Dismissed the report',
	HIDE_SUBJECT: 'Hid the content',
	RESTORE_SUBJECT: 'Restored the content',
}

export const REPORT_SUBJECT_HEADINGS: Record<ReportSubjectKind, string> = {
	MEMBER: 'Member',
	ROUTINE: 'Routine',
	SESSION: 'Shared workout',
}

/**
 * Where a reviewer opens a subject. It is the subject's **own page**, not a
 * moderation copy of it, so what they see is decided by the rules that decide
 * it for everyone. A subject that is missing or withheld has nowhere to go,
 * and the caller must not offer a link that would 404 on arrival.
 */
export function moderationSubjectHref(
	subject: ReportSubjectPreview,
): string | null {
	if (subject.isMissing || subject.isWithheld || !subject.resolvedId) {
		return null
	}
	switch (subject.kind) {
		case 'MEMBER':
			return `/profile/${subject.resolvedId}`
		case 'ROUTINE':
			return `/routines/${subject.resolvedId}`
		case 'SESSION':
			return `/shared/sessions/${subject.resolvedId}`
	}
}

/**
 * What a row can say about a subject without revealing it. A withheld subject
 * is named by its kind and nothing else — the title and the owner are the
 * content, and printing them "for context" would be the bypass with extra
 * steps.
 */
export function describeReportSubject(subject: ReportSubjectPreview): string {
	const kind = REPORT_SUBJECT_HEADINGS[subject.kind]
	if (subject.isMissing) return `${kind} · no longer exists`
	if (subject.isWithheld) return `${kind} · not visible to you`
	return subject.title ? `${kind} · ${subject.title}` : kind
}

/** Who owns a subject, when the reviewer is allowed to know. */
export function reportSubjectOwner(
	subject: ReportSubjectPreview,
): string | null {
	if (!subject.owner) return null
	const { name, lastName, username } = subject.owner
	return [name, lastName].filter(Boolean).join(' ') || `@${username}`
}

/**
 * Which actions a report offers. Dismissing is always available, because a
 * report about something that no longer exists still has to leave the queue.
 */
export function availableReviewActions(report: ModerationReport): {
	canDismiss: boolean
	canHide: boolean
	canRestore: boolean
	canOpen: boolean
} {
	const resolved = report.status !== 'OPEN'
	return {
		canDismiss: !resolved,
		canHide: !resolved && !report.subject.isMissing && !report.subject.isHidden,
		// A restore is offered on a resolved report too: undoing a hide is the
		// one thing a reviewer needs after the report has left the queue.
		canRestore: report.subject.isHidden,
		canOpen: !report.subject.isMissing && !report.subject.isWithheld,
	}
}

/** Other reports about the same subject, stated rather than implied by a badge. */
export function describeOtherReports(count: number): string | null {
	if (count < 1) return null
	return count === 1
		? '1 other report about this is still open'
		: `${count} other reports about this are still open`
}

export function describeReportFiled(report: ModerationReport): string {
	const filed = new Date(report.createdAt).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
	const reporter =
		[report.reporter.name, report.reporter.lastName]
			.filter(Boolean)
			.join(' ') || `@${report.reporter.username}`
	return `Filed ${filed} by ${reporter}`
}

export function describeModerationAction(
	action: ModerationActionRecord,
): string {
	const when = new Date(action.createdAt).toLocaleString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
	const who =
		[action.moderator.name, action.moderator.lastName]
			.filter(Boolean)
			.join(' ') || `@${action.moderator.username}`
	return `${MODERATION_ACTION_LABELS[action.kind]} · ${who} · ${when}`
}

/**
 * The owner's side of a hide. It says what happened and what did not, because
 * a routine that has quietly stopped resolving while its own visibility still
 * reads "Public" is a control with nothing behind it.
 */
export const ROUTINE_HIDDEN_BY_MODERATION =
	'A moderator has hidden this routine. Nobody else can open it, including through a link you shared. It is unchanged and still yours, and its own visibility setting applies again if it is restored.'

export const SESSION_SHARE_HIDDEN_BY_MODERATION =
	'A moderator has hidden this shared workout, so the link opens for nobody. The link is not revoked and the workout is unchanged.'
