import type { SetKind } from '@sunsteel/contracts'

import type { MessageKey, Translator } from '@/i18n/translator'

/**
 * LIVE-12: contracts' SET_KIND_LABELS is English, built outside this
 * repository, so the label a member reads is looked up here from the stable
 * kind instead (rule 9 of docs/reference/i18n.md). The stored value never
 * changes; only its label does. The four words live in the workout namespace,
 * which named them first; a second copy under routines would drift from it.
 */
const SET_KIND_KEYS = {
	WORKING: 'WORKING',
	WARMUP: 'WARMUP',
	DROP: 'DROP',
	OPTIONAL: 'OPTIONAL',
} as const satisfies Record<SetKind, MessageKey<'workout.setKinds'>>

export function setKindLabel(
	kind: SetKind,
	t: Translator<'workout.setKinds'>,
): string {
	return t(SET_KIND_KEYS[kind])
}
