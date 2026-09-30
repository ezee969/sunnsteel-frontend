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

import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import type { MessageKey, Translator } from '@/i18n/translator'

/**
 * PROF-10 copy, in `social.moderation`. Two things have to be said plainly,
 * because guessing either one wrong is how a safety control becomes a false
 * promise:
 *
 * - `blockExplanation`: a block is symmetric, and the copy says which way it
 *   runs -- both.
 * - `blockLinkCaveat`: what a block cannot do. A `SOC-07` session link and a
 *   `ROUT-04` routine link carry no viewer identity -- the token is the
 *   credential -- so a block cannot withdraw one, and saying otherwise would
 *   be a false promise.
 * - `unblockExplanation`: unblocking restores nothing, which the confirmation
 *   states before it acts.
 * - `reportReceipt`: what a report does, said honestly: it is recorded.
 *   `TRUST-04` shipped the queue that reads it, and **this copy did not
 *   change** -- a queue existing is not a promise that anyone will reach a
 *   particular row, or when. Nothing here may acquire one.
 */
type Key = MessageKey<'social.moderation'>
type T = Translator<'social.moderation'>

export const REPORT_REASON_LABELS: Record<ReportReason, Key> = {
	SPAM: 'reasonSpam',
	HARASSMENT: 'reasonHarassment',
	IMPERSONATION: 'reasonImpersonation',
	UNSAFE_ADVICE: 'reasonUnsafeAdvice',
	SEXUAL_CONTENT: 'reasonSexualContent',
	OTHER: 'reasonOther',
}

export const REPORT_REASON_OPTIONS = REPORT_REASONS.map(value => ({
	value,
	label: REPORT_REASON_LABELS[value],
}))

export const REPORT_SUBJECT_LABELS: Record<ReportSubjectKind, Key> = {
	MEMBER: 'subjectMember',
	ROUTINE: 'subjectRoutine',
	SESSION: 'subjectSession',
	COMMENT: 'subjectComment',
}

const SHORT_DATE: Intl.DateTimeFormatOptions = {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
}

/** Blocked members newest first, which is the order the server returns. */
export function describeBlockedSince(
	block: BlockedMember,
	locale: Locale,
): string {
	return dateFormatter(locale, SHORT_DATE).format(new Date(block.blockedAt))
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
//
// - `queueScope`: opening a subject is recorded.
// - `accessNote`: there is no bypass, and the queue says so where a reviewer
//   would otherwise assume one. `PROF-06` and `PROF-10` decide what a reviewer
//   reads exactly as they decide what anyone reads.
// - `withheldActionsNote`: the second half of the withheld note, and only when
//   something is still on offer. A hidden subject is withheld from the
//   reviewer who hid it, and telling them they may "still dismiss or hide it"
//   when the report is already resolved describes controls the row is not
//   showing.
// - `hideExplanation`: what hiding does, and the two things it deliberately
//   does not do.

/**
 * A status describes what was decided about **the report**, not what is
 * currently true of its subject. Two reports can name one subject, so a
 * restore taken through one leaves the other resolved while the content is
 * visible again -- a label reading "Content hidden" would then be asserting
 * something false. The live fact is `subject.isHidden`, which the row shows
 * separately.
 */
export const REPORT_STATUS_LABELS: Record<ReportStatus, Key> = {
	OPEN: 'statusOpen',
	DISMISSED: 'statusDismissed',
	ACTIONED: 'statusActioned',
}

export const MODERATION_ACTION_LABELS: Record<ModerationActionKind, Key> = {
	VIEW_SUBJECT: 'actionViewSubject',
	DISMISS_REPORT: 'actionDismissReport',
	HIDE_SUBJECT: 'actionHideSubject',
	RESTORE_SUBJECT: 'actionRestoreSubject',
}

export const REPORT_SUBJECT_HEADINGS: Record<ReportSubjectKind, Key> = {
	MEMBER: 'headingMember',
	ROUTINE: 'headingRoutine',
	SESSION: 'headingSession',
	COMMENT: 'headingComment',
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
		case 'COMMENT':
			// SOC-06. A comment has no page of its own — it lives on the activity
			// entry it hangs from, and the queue already shows its text as the
			// subject title. Sending a reviewer to a route that would have to
			// find the entry first, and might refuse it, is worse than showing
			// them the words they need and no link.
			return null
	}
}

/**
 * What a row can say about a subject without revealing it. A withheld subject
 * is named by its kind and nothing else — the title and the owner are the
 * content, and printing them "for context" would be the bypass with extra
 * steps.
 */
export function describeReportSubject(
	subject: ReportSubjectPreview,
	t: T,
): string {
	const heading: Key = REPORT_SUBJECT_HEADINGS[subject.kind]
	const kind = t(heading)
	if (subject.isMissing) return t('subjectMissing', { kind })
	if (subject.isWithheld) return t('subjectWithheld', { kind })
	return subject.title
		? t('subjectTitled', { kind, title: subject.title })
		: kind
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
export function describeOtherReports(count: number, t: T): string | null {
	if (count < 1) return null
	return t('otherReports', { count })
}

export function describeReportFiled(
	report: ModerationReport,
	t: T,
	locale: Locale,
): string {
	const filed = dateFormatter(locale, SHORT_DATE).format(
		new Date(report.createdAt),
	)
	const reporter =
		[report.reporter.name, report.reporter.lastName]
			.filter(Boolean)
			.join(' ') || `@${report.reporter.username}`
	return t('filed', { date: filed, reporter })
}

export function describeModerationAction(
	action: ModerationActionRecord,
	t: T,
	locale: Locale,
): string {
	const when = dateFormatter(locale, {
		...SHORT_DATE,
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(action.createdAt))
	const who =
		[action.moderator.name, action.moderator.lastName]
			.filter(Boolean)
			.join(' ') || `@${action.moderator.username}`
	const label: Key = MODERATION_ACTION_LABELS[action.kind]
	return t('actionLine', { action: t(label), who, when })
}

// `routineHidden` and `sessionShareHidden` are the owner's side of a hide.
// They say what happened and what did not, because a routine that has quietly
// stopped resolving while its own visibility still reads "Public" is a control
// with nothing behind it.
