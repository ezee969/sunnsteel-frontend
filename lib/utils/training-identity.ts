import type {
	PreferredTrainingStyle,
	TrainingDiscipline,
	TrainingExperienceLevel,
	TrainingGoal,
	TrainingIdentity,
} from '@sunsteel/contracts'

interface IdentityOption<T extends string> {
	value: T
	label: string
}

export const TRAINING_GOAL_OPTIONS: IdentityOption<TrainingGoal>[] = [
	{ value: 'STRENGTH', label: 'Strength' },
	{ value: 'MUSCLE_GROWTH', label: 'Muscle growth' },
	{ value: 'FAT_LOSS', label: 'Fat loss' },
	{ value: 'ENDURANCE', label: 'Endurance' },
	{ value: 'GENERAL_FITNESS', label: 'General fitness' },
	{ value: 'ATHLETIC_PERFORMANCE', label: 'Athletic performance' },
	{ value: 'MOBILITY', label: 'Mobility' },
]

export const TRAINING_EXPERIENCE_OPTIONS: IdentityOption<TrainingExperienceLevel>[] =
	[
		{ value: 'BEGINNER', label: 'Beginner' },
		{ value: 'INTERMEDIATE', label: 'Intermediate' },
		{ value: 'ADVANCED', label: 'Advanced' },
	]

export const TRAINING_DISCIPLINE_OPTIONS: IdentityOption<TrainingDiscipline>[] =
	[
		{ value: 'BODYBUILDING', label: 'Bodybuilding' },
		{ value: 'POWERLIFTING', label: 'Powerlifting' },
		{ value: 'WEIGHTLIFTING', label: 'Weightlifting' },
		{ value: 'CALISTHENICS', label: 'Calisthenics' },
		{ value: 'STRONGMAN', label: 'Strongman' },
		{ value: 'HYBRID_TRAINING', label: 'Hybrid training' },
		{ value: 'GENERAL_STRENGTH', label: 'General strength' },
	]

export const PREFERRED_TRAINING_STYLE_OPTIONS: IdentityOption<PreferredTrainingStyle>[] =
	[
		{ value: 'FULL_BODY', label: 'Full body' },
		{ value: 'UPPER_LOWER', label: 'Upper / lower' },
		{ value: 'PUSH_PULL_LEGS', label: 'Push / pull / legs' },
		{ value: 'BODY_PART_SPLIT', label: 'Body-part split' },
		{ value: 'CIRCUIT', label: 'Circuit' },
	]

function getOptionLabel<T extends string>(
	options: IdentityOption<T>[],
	value: T,
): string {
	return options.find(option => option.value === value)?.label ?? value
}

export const getTrainingGoalLabel = (value: TrainingGoal) =>
	getOptionLabel(TRAINING_GOAL_OPTIONS, value)

export const getTrainingExperienceLabel = (value: TrainingExperienceLevel) =>
	getOptionLabel(TRAINING_EXPERIENCE_OPTIONS, value)

export const getTrainingDisciplineLabel = (value: TrainingDiscipline) =>
	getOptionLabel(TRAINING_DISCIPLINE_OPTIONS, value)

export const getPreferredTrainingStyleLabel = (value: PreferredTrainingStyle) =>
	getOptionLabel(PREFERRED_TRAINING_STYLE_OPTIONS, value)

export function hasTrainingIdentity(
	identity: TrainingIdentity | null | undefined,
): boolean {
	return Boolean(
		identity &&
		(identity.goals.length > 0 ||
			identity.experienceLevel ||
			identity.disciplines.length > 0 ||
			identity.preferredStyle ||
			identity.favoriteExercises.length > 0),
	)
}
