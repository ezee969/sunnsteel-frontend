import {
	buildWarmUpRamp,
	calculatePlateLoading,
	CUSTOM_EXERCISES_MAX,
	EXERCISE_GROUP_MAX,
	MUSCLE_GROUPS,
	type MuscleGroup,
	PLANS,
	PLATE_SETS,
	RENAISSANCE_RANK_DEFINITIONS,
	REVOCATION_WINDOW_DAYS,
	SUBSCRIPTION_TRIAL_DAYS,
	TRAINING_PARTNERS_MAX,
} from '@sunsteel/contracts'

import { PRIVACY_SECTION_LABEL_KEYS } from '@/lib/utils/privacy-overview'
import {
	findRoutineTemplate,
	ROUTINE_TEMPLATES,
	type RoutineTemplate,
} from '@/lib/utils/routine-templates'

/**
 * SITE-01 §12.4-§12.13: the synthetic examples the landing's mock-ups show
 * and every number its copy quotes. Each example is worked out by the app's
 * own rules (plate loading, warm-up ramps, the body map's bands) or read from
 * contracts, so the site can never show something the app would not do; the
 * tests hold the ones the copy deck calls out.
 */

/** The default weight step of a new exercise in the builder. */
export const DEFAULT_STEP_KG = 2.5

/** §12.4 Plan: the template the Plan phone opens. */
export const PLAN_TEMPLATE = findRoutineTemplate(
	'upper-lower',
) as RoutineTemplate

/** §12.4 Train: a 100 kg working load on a 20 kg bar with the default plates. */
export const TRAIN_EXAMPLE = (() => {
	const workingKg = 100
	const barKg = 20
	const platePairs = PLATE_SETS.KG.STANDARD
	const loading = calculatePlateLoading(workingKg, barKg, [...platePairs])
	const ramp = buildWarmUpRamp({
		workingWeightKg: workingKg,
		barLoaded: true,
		barWeightKg: barKg,
		platePairs,
		incrementKg: DEFAULT_STEP_KG,
		room: 4,
	})
	return {
		workingKg,
		barKg,
		platesPerSide: loading.platesPerSide.flatMap(plate =>
			Array.from({ length: plate.platesPerSide }, () => plate.weightKg),
		),
		ramp: ramp.sets.map(set => ({ weightKg: set.weightKg, reps: set.reps })),
	}
})()

/** §12.4 Measure and §12.6: bench press estimated 1RM, one value a week. */
export const STRENGTH_EXAMPLE = {
	exercise: 'Bench Press',
	/** Eight weeks, +4 kg in all, the last four the progress stage's weeks. */
	weeklyE1rmKg: [98, 98.5, 98.5, 99, 99, 100, 101, 102],
} as const

export const strengthChange = (values: readonly number[]) =>
	values[values.length - 1] - values[0]

/**
 * A week's sets in the plan's ten groups, spread over the catalog's muscles:
 * the back's set count reaches the lats, traps and erectors, the shoulders'
 * the three heads of the deltoid.
 */
function week(
	chest: number,
	back: number,
	quadriceps: number,
	hamstrings: number,
	shoulders: number,
	biceps: number,
	triceps: number,
	glutes: number,
	calves: number,
	core: number,
): Partial<Record<MuscleGroup, number>> {
	return {
		PECTORAL: chest,
		LATISSIMUS_DORSI: back,
		TRAPEZIUS: Math.round(back / 2),
		ERECTOR_SPINAE: Math.round(back / 2),
		TERES_MAJOR_MINOR: Math.round(back / 2),
		ANTERIOR_DELTOIDS: shoulders,
		MEDIAL_DELTOIDS: shoulders,
		REAR_DELTOIDS: Math.round(shoulders / 2),
		BICEPS: biceps,
		TRICEPS: triceps,
		QUADRICEPS: quadriceps,
		HAMSTRINGS: hamstrings,
		GLUTES: glutes,
		CALVES: calves,
		CORE: core,
	}
}

/** §12.6: four weeks of sets per muscle, crossing bands as they pass. */
export const MUSCLE_WEEKS: ReadonlyArray<Partial<Record<MuscleGroup, number>>> =
	[
		week(8, 9, 6, 4, 5, 3, 3, 4, 0, 0),
		week(10, 11, 8, 6, 7, 5, 5, 6, 2, 0),
		week(12, 13, 10, 8, 9, 6, 7, 8, 2, 2),
		week(14, 16, 12, 10, 11, 8, 9, 10, 4, 4),
	]

export function muscleSets(
	week: Partial<Record<MuscleGroup, number>>,
): Map<MuscleGroup, number> {
	return new Map(
		MUSCLE_GROUPS.map(muscle => [muscle, week[muscle] ?? 0] as const),
	)
}

/** §12.5: the progression ledger, Bench Press 8-12 at 80 kg. */
export const LEDGER_RANGE = { min: 8, max: 12 } as const
export const LEDGER_ROWS: ReadonlyArray<{ weightKg: number; reps: number[] }> =
	[
		{ weightKg: 80, reps: [8, 8, 8] },
		{ weightKg: 80, reps: [9, 9, 8] },
		{ weightKg: 80, reps: [10, 10, 9] },
		{ weightKg: 80, reps: [12, 11, 11] },
		{ weightKg: 80, reps: [12, 12, 12] },
		{ weightKg: 82.5, reps: [] },
	]

/**
 * The server's double progression (backend `buildProgressionOutcome`): the
 * weight rises by the step only when every working set reached the top of
 * its range; otherwise the weight lifted carries over.
 */
export function nextDoubleProgressionWeight(
	weightKg: number,
	reps: readonly number[],
	maxReps: number,
	stepKg: number,
): number {
	return reps.length > 0 && reps.every(rep => rep >= maxReps)
		? weightKg + stepKg
		: weightKg
}

/** §12.7: the ladder, in order, straight from contracts. */
export const RANKS = RENAISSANCE_RANK_DEFINITIONS

/** §12.4 Earn: a real rank and a real milestone of the catalog. */
export const EARN_EXAMPLE = { rankId: 'ARTISAN', milestoneId: 'sessions:50' }

/** §12.8: the templates by level; Advanced has none of its own. */
export const TEMPLATE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type TemplateLevel = (typeof TEMPLATE_LEVELS)[number]

export function templatesForLevel(level: TemplateLevel): RoutineTemplate[] {
	const experience = level.toUpperCase()
	return ROUTINE_TEMPLATES.filter(
		template => template.experienceLevel === experience,
	)
}

/** The weekdays a template trains on, `Date.getDay()` numbers. */
export function templateWeekdays(template: RoutineTemplate): number[] {
	return template.scheduleMode === 'ROTATION'
		? template.rotationWeekdays
		: template.days.map(day => day.slot)
}

/** Every number the landing's copy quotes, from contracts or the app. */
export const LANDING_FACTS = {
	step: DEFAULT_STEP_KG,
	groupMax: EXERCISE_GROUP_MAX,
	partnersMax: TRAINING_PARTNERS_MAX,
	privacyParts: Object.keys(PRIVACY_SECTION_LABEL_KEYS).length,
	customExercisesMax: CUSTOM_EXERCISES_MAX,
	revocationDays: REVOCATION_WINDOW_DAYS,
	trialDays: SUBSCRIPTION_TRIAL_DAYS,
	ranks: RENAISSANCE_RANK_DEFINITIONS.length,
	muscleWeeksFree: PLANS.FREE.limits.MUSCLE_HISTORY_WEEKS ?? 0,
	muscleWeeksPro: PLANS.PRO.limits.MUSCLE_HISTORY_WEEKS ?? 0,
	freeVersions: PLANS.FREE.limits.ROUTINE_VERSIONS ?? 0,
	freeGoals: PLANS.FREE.limits.GOALS ?? 0,
	freeGyms: PLANS.FREE.limits.TRAINING_LOCATIONS ?? 0,
	proDrafts: PLANS.PRO.limits.ROUTINE_DRAFTS_PER_MONTH ?? 0,
	proReviews: PLANS.PRO.limits.TRAINING_REVIEWS_PER_MONTH ?? 0,
} as const
