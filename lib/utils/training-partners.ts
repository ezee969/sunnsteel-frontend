import type {
	TrainingPartnerPermissions,
	TrainingPartnership,
} from '@sunsteel/contracts'

export const TRAINING_PARTNER_PERMISSION_FIELDS: Array<{
	key: keyof TrainingPartnerPermissions
	label: string
	description: string
}> = [
	{
		key: 'schedule',
		label: 'Schedule',
		description: 'Share dates, planned workout counts and whether you trained.',
	},
	{
		key: 'progress',
		label: 'Progress',
		description:
			'Share follower-level workout totals, records and achievements; never body metrics.',
	},
	{
		key: 'activity',
		label: 'Activity',
		description: 'Share activity whose audience already allows followers.',
	},
	{
		key: 'routines',
		label: 'Routines',
		description:
			'Share routines whose own visibility already allows followers.',
	},
	{
		key: 'encouragement',
		label: 'Encouragement',
		description:
			'Allow lightweight encouragement when that feature is enabled.',
	},
]

export function findTrainingPartnership(
	items: TrainingPartnership[],
	memberId: string,
): TrainingPartnership | undefined {
	return items.find(item => item.member.id === memberId)
}

export function trainingPartnerActionLabel(
	partnership: TrainingPartnership | undefined,
):
	| 'Add Training Partner'
	| 'Accept Partner Request'
	| 'Request Pending'
	| 'Training Partner' {
	if (!partnership) return 'Add Training Partner'
	if (partnership.status === 'ACTIVE') return 'Training Partner'
	return partnership.requestedByMe
		? 'Request Pending'
		: 'Accept Partner Request'
}
