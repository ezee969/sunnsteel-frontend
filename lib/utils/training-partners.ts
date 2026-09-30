import {
	TRAINING_PARTNER_ENCOURAGEMENT_KINDS,
	type TrainingPartnerEncouragementKind,
	TrainingPartnerPermissions,
	TrainingPartnership,
} from '@sunsteel/contracts'

import type { MessageKey, Translator } from '@/i18n/translator'

type Namespace = 'settings.trainingPartners'

/**
 * The English wording, kept only for `lib/utils/notifications.ts`, which still
 * words its own copy in English (I18N social pass) and reads it from here.
 * Settings and profiles read the message keys below through a translator.
 */
export const TRAINING_PARTNER_ENCOURAGEMENT_LABELS = {
	READY_TO_TRAIN: 'Ready to train',
	STRONG_SESSION: 'Strong session',
	GOOD_WORK: 'Good work',
	KEEP_GOING: 'Keep going',
} as const satisfies Record<TrainingPartnerEncouragementKind, string>

export const trainingPartnerEncouragementLabel = (
	kind: TrainingPartnerEncouragementKind,
) => TRAINING_PARTNER_ENCOURAGEMENT_LABELS[kind]

const ENCOURAGEMENT_KEYS = {
	READY_TO_TRAIN: 'encouragement.READY_TO_TRAIN',
	STRONG_SESSION: 'encouragement.STRONG_SESSION',
	GOOD_WORK: 'encouragement.GOOD_WORK',
	KEEP_GOING: 'encouragement.KEEP_GOING',
} as const satisfies Record<
	TrainingPartnerEncouragementKind,
	MessageKey<Namespace>
>

export const trainingPartnerEncouragementOptions = (t: Translator<Namespace>) =>
	TRAINING_PARTNER_ENCOURAGEMENT_KINDS.map(kind => ({
		kind,
		label: t(ENCOURAGEMENT_KEYS[kind]),
	}))

/** The four things a partner can be shown; the copy is `permission.<key>`. */
export const TRAINING_PARTNER_PERMISSION_KEYS: Array<
	keyof TrainingPartnerPermissions
> = ['schedule', 'progress', 'activity', 'routines', 'encouragement']

export function findTrainingPartnership(
	items: TrainingPartnership[],
	memberId: string,
): TrainingPartnership | undefined {
	return items.find(item => item.member.id === memberId)
}

export function trainingPartnerActionLabel(
	t: Translator<Namespace>,
	partnership: TrainingPartnership | undefined,
): string {
	if (!partnership) return t('action.add')
	if (partnership.status === 'ACTIVE') return t('action.active')
	return partnership.requestedByMe ? t('action.pending') : t('action.accept')
}
