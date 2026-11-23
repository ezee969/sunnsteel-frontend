import {
	ACHIEVEMENT_CATEGORIES,
	ACHIEVEMENT_DEFINITIONS,
	type AchievementCategory,
	calculatePlateLoading,
	LP_STEPS,
	lpLoadKg,
	type MuscleGroup,
	PLATE_SETS,
} from '@sunsteel/contracts'

import type { Exercise } from '@/lib/api/types/exercise.type'
import { plannedMuscleSets } from '@/lib/utils/body-map'

import {
	DEFAULT_STEP_KG,
	LEDGER_RANGE,
	LEDGER_ROWS,
	nextDoubleProgressionWeight,
	PLAN_TEMPLATE,
	TRAIN_EXAMPLE,
} from './landing-examples'

/**
 * SITE-01 §12.14, §12.16: the feature pages' worked examples, each produced
 * by the rule the app or the server uses, so a page can never show
 * something the product would not do. `feature-examples.test.ts` holds the
 * numbers the copy deck calls out.
 */

/**
 * The muscles of the exercises the examples use, restated from the
 * backend's seed (`prisma/exercise-catalog.ts`), which the browser build
 * cannot read; the test checks Bench Press against the copy deck. Change
 * both together.
 */
export const EXAMPLE_MUSCLES: Record<
	string,
	{ primary: MuscleGroup[]; secondary: MuscleGroup[] }
> = {
	'Bench Press': {
		primary: ['PECTORAL'],
		secondary: ['ANTERIOR_DELTOIDS', 'TRICEPS'],
	},
	'Bent-over Row': {
		primary: ['LATISSIMUS_DORSI', 'TRAPEZIUS'],
		secondary: ['BICEPS', 'REAR_DELTOIDS'],
	},
	'Overhead Press': {
		primary: ['ANTERIOR_DELTOIDS', 'MEDIAL_DELTOIDS'],
		secondary: ['TRICEPS', 'CORE'],
	},
	'Lat Pulldown': {
		primary: ['LATISSIMUS_DORSI'],
		secondary: ['BICEPS', 'REAR_DELTOIDS'],
	},
	'Tricep Pushdown': { primary: ['TRICEPS'], secondary: [] },
	'Barbell Curl': { primary: ['BICEPS'], secondary: ['FOREARMS'] },
	Squat: {
		primary: ['QUADRICEPS', 'GLUTES'],
		secondary: ['HAMSTRINGS', 'CORE', 'CALVES'],
	},
	'Romanian Deadlift': {
		primary: ['HAMSTRINGS', 'GLUTES'],
		secondary: ['ERECTOR_SPINAE'],
	},
	'Leg Press': { primary: ['QUADRICEPS'], secondary: ['GLUTES'] },
	'Leg Curl': { primary: ['HAMSTRINGS'], secondary: [] },
	'Standing Calf Raise': { primary: ['CALVES'], secondary: [] },
	'Incline Dumbbell Press': {
		primary: ['PECTORAL'],
		secondary: ['ANTERIOR_DELTOIDS', 'TRICEPS'],
	},
	'Cable Row': {
		primary: ['LATISSIMUS_DORSI', 'TRAPEZIUS'],
		secondary: ['BICEPS', 'REAR_DELTOIDS'],
	},
	'Dumbbell Shoulder Press': {
		primary: ['ANTERIOR_DELTOIDS', 'MEDIAL_DELTOIDS'],
		secondary: ['TRICEPS', 'CORE'],
	},
	'Pull-ups': {
		primary: ['LATISSIMUS_DORSI'],
		secondary: ['BICEPS', 'REAR_DELTOIDS', 'TERES_MAJOR_MINOR'],
	},
	'Lateral Raises': {
		primary: ['MEDIAL_DELTOIDS'],
		secondary: ['ANTERIOR_DELTOIDS'],
	},
	'Hammer Curl': { primary: ['BICEPS', 'FOREARMS'], secondary: [] },
	Deadlift: {
		primary: ['ERECTOR_SPINAE', 'HAMSTRINGS', 'GLUTES'],
		secondary: ['LATISSIMUS_DORSI', 'TRAPEZIUS', 'QUADRICEPS'],
	},
	'Bulgarian Split Squat': {
		primary: ['QUADRICEPS', 'GLUTES'],
		secondary: ['HAMSTRINGS', 'CORE', 'CALVES'],
	},
	'Leg Extension': { primary: ['QUADRICEPS'], secondary: [] },
	'Hip Thrust': { primary: ['GLUTES'], secondary: ['HAMSTRINGS'] },
	'Hanging Leg Raise': { primary: ['CORE'], secondary: ['FOREARMS'] },
}

const exerciseOf = (name: string) =>
	({
		primaryMuscles: EXAMPLE_MUSCLES[name]?.primary ?? [],
		secondaryMuscles: EXAMPLE_MUSCLES[name]?.secondary ?? [],
	}) as unknown as Exercise

/**
 * The limit on extra sets an exercise takes in a workout, restated from the
 * backend (`MAX_EXTRA_SETS`, `workouts/session-extra-sets.ts`).
 */
export const MAX_EXTRA_SETS = 10

/** The kinds a set can be that the workout-tracker page names. */
export const NAMED_SET_KINDS = [
	'WORKING',
	'WARMUP',
	'DROP',
	'OPTIONAL',
] as const

/** Workout tracker: the warm-up ramp and the plates for a 100 kg set. */
export const WARM_UP_TABLE = [
	...TRAIN_EXAMPLE.ramp.map(set => ({ ...set, working: false })),
	{ weightKg: TRAIN_EXAMPLE.workingKg, reps: null, working: true },
].map(row => ({
	...row,
	platesPerSide: calculatePlateLoading(row.weightKg, TRAIN_EXAMPLE.barKg, [
		...PLATE_SETS.KG.STANDARD,
	]).platesPerSide.flatMap(plate =>
		Array.from({ length: plate.platesPerSide }, () => plate.weightKg),
	),
}))

/** Routine builder: the sets Upper / Lower plans for each muscle a week. */
export const UPPER_LOWER_WEEKLY_SETS = (() => {
	const days = PLAN_TEMPLATE.days.map(day => ({
		exercises: day.exercises.map(exercise => ({
			exerciseId: exercise.name,
			sets: Array.from({ length: exercise.sets }, () => ({
				kind: 'WORKING' as const,
			})),
		})),
	}))
	const exercises = Object.fromEntries(
		PLAN_TEMPLATE.days.flatMap(day =>
			day.exercises.map(exercise => [exercise.name, exerciseOf(exercise.name)]),
		),
	)
	const totals = plannedMuscleSets(
		days as unknown as Parameters<typeof plannedMuscleSets>[0],
		exercises,
	)
	return [...totals.entries()]
		.map(([muscle, sets]) => ({ muscle, sets }))
		.sort((a, b) => b.sets - a.sets || a.muscle.localeCompare(b.muscle))
})()

/** Automatic progression: the double-progression ledger, workout by workout. */
export const LEDGER_TABLE = LEDGER_ROWS.filter(row => row.reps.length > 0).map(
	(row, index) => ({
		workout: index + 1,
		weightKg: row.weightKg,
		reps: row.reps,
		nextKg: nextDoubleProgressionWeight(
			row.weightKg,
			row.reps,
			LEDGER_RANGE.max,
			DEFAULT_STEP_KG,
		),
	}),
)

/** Automatic progression (Pro): an 8-week block from a 100 kg reference. */
export const BLOCK_REFERENCE_KG = 100
export const BLOCK_TABLE = LP_STEPS.map(step => ({
	week: step.step,
	percentage: step.percentage,
	loadKg: lpLoadKg(BLOCK_REFERENCE_KG, step.percentage, DEFAULT_STEP_KG),
	rir: step.sets.map(set =>
		set.amrap ? 'AMRAP' : `${set.rirMin}–${set.rirMax}`,
	),
}))

/** Progress: one Bench Press workout of three working sets on the map. */
export const BENCH_ON_MAP = (() => {
	const workSets = 3
	const muscles = EXAMPLE_MUSCLES['Bench Press']
	return [
		...muscles.primary.map(muscle => ({
			muscle,
			role: 'primary' as const,
			sets: workSets,
		})),
		...muscles.secondary.map(muscle => ({
			muscle,
			role: 'secondary' as const,
			sets: workSets * 0.5,
		})),
	]
})()

/** Ranks and achievements: the milestones, category by category. */
export const MILESTONES_BY_CATEGORY: Array<{
	category: AchievementCategory
	thresholds: number[]
}> = ACHIEVEMENT_CATEGORIES.map(category => ({
	category,
	thresholds: ACHIEVEMENT_DEFINITIONS.filter(
		definition => definition.category === category,
	).map(definition => definition.threshold),
}))
