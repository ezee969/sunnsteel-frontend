import type {
	PreferredTrainingStyle,
	TrainingDiscipline,
	TrainingExperienceLevel,
	TrainingGoal,
	TrainingIdentity,
} from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'

type T = Translator<'routines.identity'>

interface IdentityOption<V extends string> {
	value: V
	label: string
}

const GOAL_KEYS = {
	STRENGTH: 'goalStrength',
	MUSCLE_GROWTH: 'goalMuscleGrowth',
	FAT_LOSS: 'goalFatLoss',
	ENDURANCE: 'goalEndurance',
	GENERAL_FITNESS: 'goalGeneralFitness',
	ATHLETIC_PERFORMANCE: 'goalAthleticPerformance',
	MOBILITY: 'goalMobility',
} as const satisfies Record<TrainingGoal, string>

const EXPERIENCE_KEYS = {
	BEGINNER: 'experienceBeginner',
	INTERMEDIATE: 'experienceIntermediate',
	ADVANCED: 'experienceAdvanced',
} as const satisfies Record<TrainingExperienceLevel, string>

const DISCIPLINE_KEYS = {
	BODYBUILDING: 'disciplineBodybuilding',
	POWERLIFTING: 'disciplinePowerlifting',
	WEIGHTLIFTING: 'disciplineWeightlifting',
	CALISTHENICS: 'disciplineCalisthenics',
	STRONGMAN: 'disciplineStrongman',
	HYBRID_TRAINING: 'disciplineHybridTraining',
	GENERAL_STRENGTH: 'disciplineGeneralStrength',
} as const satisfies Record<TrainingDiscipline, string>

const STYLE_KEYS = {
	FULL_BODY: 'styleFullBody',
	UPPER_LOWER: 'styleUpperLower',
	PUSH_PULL_LEGS: 'stylePushPullLegs',
	BODY_PART_SPLIT: 'styleBodyPartSplit',
	CIRCUIT: 'styleCircuit',
} as const satisfies Record<PreferredTrainingStyle, string>

type Key = Parameters<T>[0]

function options<V extends string>(
	keys: Record<V, Key>,
	t: T,
): IdentityOption<V>[] {
	return (Object.keys(keys) as V[]).map(value => ({
		value,
		label: t(keys[value]),
	}))
}

export const trainingGoalOptions = (t: T) => options(GOAL_KEYS, t)
export const trainingExperienceOptions = (t: T) => options(EXPERIENCE_KEYS, t)
export const trainingDisciplineOptions = (t: T) => options(DISCIPLINE_KEYS, t)
export const preferredTrainingStyleOptions = (t: T) => options(STYLE_KEYS, t)

const label = <V extends string>(
	keys: Record<V, Key>,
	value: V,
	t: T,
): string => (value in keys ? t(keys[value]) : value)

export const getTrainingGoalLabel = (value: TrainingGoal, t: T) =>
	label(GOAL_KEYS, value, t)

export const getTrainingExperienceLabel = (
	value: TrainingExperienceLevel,
	t: T,
) => label(EXPERIENCE_KEYS, value, t)

export const getTrainingDisciplineLabel = (value: TrainingDiscipline, t: T) =>
	label(DISCIPLINE_KEYS, value, t)

export const getPreferredTrainingStyleLabel = (
	value: PreferredTrainingStyle,
	t: T,
) => label(STYLE_KEYS, value, t)

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
