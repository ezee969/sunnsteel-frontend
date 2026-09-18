import type {
	BlockedMember,
	ReportReason,
	ReportSubjectKind,
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
 * What a report does today, said honestly: it is recorded. The queue, the
 * review and the enforcement are `TRUST-04` and do not exist yet, so nothing
 * here may promise that a human will read it, or when.
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
