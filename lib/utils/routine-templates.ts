import type {
	RoutineScheduleMode,
	TrainingExperienceLevel,
	TrainingGoal,
} from '@sunsteel/contracts'

import type {
	RoutineWizardData,
	RoutineWizardDay,
	RoutineWizardExercise,
} from '@/features/routines/wizard/types'

/**
 * ROUT-03: curated starter programmes that open in the routine wizard as an
 * editable draft. Nothing is stored until the member saves the routine, and a
 * template never carries a load -- the member's first logged weight is where
 * progression starts. Exercises are named, not keyed: catalog ids differ per
 * environment while catalog names are unique, so a template resolves against
 * the catalog the member already has loaded.
 */

type Kind = 'compound' | 'isolation' | 'bodyweight'

interface TemplateExercise {
	name: string
	sets: number
	minReps: number
	maxReps: number
	kind: Kind
	/** Dumbbell work steps by 2 kg; barbell, machine and cable by 2.5 kg. */
	dumbbell?: boolean
}

interface TemplateDay {
	/** The weekday on a weekly template; its position on a rotation. */
	slot: number
	name: string
	exercises: TemplateExercise[]
}

export interface RoutineTemplate {
	slug: string
	name: string
	summary: string
	description: string
	goal: TrainingGoal
	experienceLevel: TrainingExperienceLevel
	scheduleMode: RoutineScheduleMode
	/** SCHED-06: the weekdays a rotation is placed on. */
	rotationWeekdays: number[]
	days: TemplateDay[]
}

const REST_SECONDS: Record<Kind, number> = {
	compound: 150,
	isolation: 75,
	bodyweight: 90,
}

const ex = (
	name: string,
	sets: number,
	minReps: number,
	maxReps: number,
	kind: Kind = 'compound',
	dumbbell = false,
): TemplateExercise => ({ name, sets, minReps, maxReps, kind, dumbbell })

export const ROUTINE_TEMPLATES: readonly RoutineTemplate[] = [
	{
		slug: 'full-body-foundations',
		name: 'Full Body Foundations',
		summary: 'Monday, Wednesday, Friday · Beginner',
		description:
			'Three full-body sessions, each built around one squat or hinge, one press and one pull.',
		goal: 'GENERAL_FITNESS',
		experienceLevel: 'BEGINNER',
		scheduleMode: 'WEEKLY',
		rotationWeekdays: [],
		days: [
			{
				slot: 1,
				name: 'Full Body A',
				exercises: [
					ex('Squat', 3, 5, 8),
					ex('Bench Press', 3, 5, 8),
					ex('Bent-over Row', 3, 8, 10),
					ex('Dead Bug', 2, 10, 12, 'bodyweight'),
				],
			},
			{
				slot: 3,
				name: 'Full Body B',
				exercises: [
					ex('Romanian Deadlift', 3, 8, 10),
					ex('Overhead Press', 3, 6, 8),
					ex('Lat Pulldown', 3, 8, 12),
					ex('Lunges', 2, 10, 12, 'bodyweight'),
				],
			},
			{
				slot: 5,
				name: 'Full Body C',
				exercises: [
					ex('Leg Press', 3, 10, 12),
					ex('Dumbbell Bench Press', 3, 8, 12, 'compound', true),
					ex('Cable Row', 3, 10, 12),
					ex('Crunches', 2, 12, 15, 'bodyweight'),
				],
			},
		],
	},
	{
		slug: 'upper-lower',
		name: 'Upper / Lower',
		summary: 'Monday, Tuesday, Thursday, Friday · Intermediate',
		description:
			'Two upper-body and two lower-body sessions, a heavier and a lighter version of each.',
		goal: 'MUSCLE_GROWTH',
		experienceLevel: 'INTERMEDIATE',
		scheduleMode: 'WEEKLY',
		rotationWeekdays: [],
		days: [
			{
				slot: 1,
				name: 'Upper A',
				exercises: [
					ex('Bench Press', 4, 6, 8),
					ex('Bent-over Row', 4, 6, 8),
					ex('Overhead Press', 3, 8, 10),
					ex('Lat Pulldown', 3, 10, 12),
					ex('Tricep Pushdown', 2, 12, 15, 'isolation'),
					ex('Barbell Curl', 2, 10, 12, 'isolation'),
				],
			},
			{
				slot: 2,
				name: 'Lower A',
				exercises: [
					ex('Squat', 4, 6, 8),
					ex('Romanian Deadlift', 3, 8, 10),
					ex('Leg Press', 3, 10, 12),
					ex('Leg Curl', 3, 10, 12, 'isolation'),
					ex('Standing Calf Raise', 3, 10, 15, 'isolation'),
				],
			},
			{
				slot: 4,
				name: 'Upper B',
				exercises: [
					ex('Incline Dumbbell Press', 3, 8, 12, 'compound', true),
					ex('Cable Row', 3, 10, 12),
					ex('Dumbbell Shoulder Press', 3, 8, 12, 'compound', true),
					ex('Pull-ups', 3, 6, 10, 'bodyweight'),
					ex('Lateral Raises', 3, 12, 15, 'isolation', true),
					ex('Hammer Curl', 2, 10, 12, 'isolation', true),
				],
			},
			{
				slot: 5,
				name: 'Lower B',
				exercises: [
					ex('Deadlift', 3, 4, 6),
					ex('Bulgarian Split Squat', 3, 8, 10, 'compound', true),
					ex('Leg Extension', 3, 12, 15, 'isolation'),
					ex('Hip Thrust', 3, 8, 12),
					ex('Hanging Leg Raise', 3, 10, 15, 'bodyweight'),
				],
			},
		],
	},
	{
		slug: 'push-pull-legs',
		name: 'Push / Pull / Legs',
		summary: '3-day rotation, Monday to Saturday · Intermediate',
		description:
			'Each day comes up twice a week; a missed day moves the rotation along rather than being skipped.',
		goal: 'MUSCLE_GROWTH',
		experienceLevel: 'INTERMEDIATE',
		scheduleMode: 'ROTATION',
		rotationWeekdays: [1, 2, 3, 4, 5, 6],
		days: [
			{
				slot: 0,
				name: 'Push',
				exercises: [
					ex('Bench Press', 4, 6, 8),
					ex('Overhead Press', 3, 8, 10),
					ex('Incline Dumbbell Press', 3, 10, 12, 'compound', true),
					ex('Lateral Raises', 3, 12, 15, 'isolation', true),
					ex('Tricep Pushdown', 3, 10, 12, 'isolation'),
				],
			},
			{
				slot: 1,
				name: 'Pull',
				exercises: [
					ex('Pull-ups', 4, 6, 10, 'bodyweight'),
					ex('Bent-over Row', 3, 8, 10),
					ex('Cable Row', 3, 10, 12),
					ex('Rear Delt Fly', 3, 12, 15, 'isolation', true),
					ex('Barbell Curl', 3, 8, 12, 'isolation'),
				],
			},
			{
				slot: 2,
				name: 'Legs',
				exercises: [
					ex('Squat', 4, 6, 8),
					ex('Romanian Deadlift', 3, 8, 10),
					ex('Leg Press', 3, 10, 12),
					ex('Leg Curl', 3, 10, 12, 'isolation'),
					ex('Standing Calf Raise', 4, 10, 15, 'isolation'),
				],
			},
		],
	},
]

export function findRoutineTemplate(
	slug: string | null | undefined,
): RoutineTemplate | null {
	return ROUTINE_TEMPLATES.find(template => template.slug === slug) ?? null
}

/** "12 exercises" */
export function describeTemplateSize(template: RoutineTemplate): string {
	const exercises = template.days.reduce(
		(total, day) => total + day.exercises.length,
		0,
	)
	return `${exercises} exercises`
}

export type TemplateDraft =
	{ ok: true; draft: RoutineWizardData } | { ok: false; missing: string[] }

const makeClientId = () =>
	globalThis.crypto?.randomUUID?.() ??
	`${Date.now()}-${Math.random().toString(16).slice(2)}`

/**
 * The wizard draft a template opens as, resolved against the catalog by
 * exercise name. When any exercise is missing the template is not offered as
 * a draft at all -- opening one with a hole in it would read as the template.
 */
export function templateDraft(
	template: RoutineTemplate,
	catalog: readonly { id: string; name: string }[],
): TemplateDraft {
	const byName = new Map(catalog.map(item => [item.name, item.id]))
	const missing = [
		...new Set(
			template.days.flatMap(day =>
				day.exercises
					.map(exercise => exercise.name)
					.filter(name => !byName.has(name)),
			),
		),
	]
	if (missing.length) return { ok: false, missing }

	const days: RoutineWizardDay[] = template.days.map(day => ({
		slot: day.slot,
		name: day.name,
		exercises: day.exercises.map((exercise): RoutineWizardExercise => ({
			clientId: makeClientId(),
			exerciseId: byName.get(exercise.name)!,
			progressionScheme: 'DOUBLE_PROGRESSION',
			minWeightIncrement: exercise.dumbbell ? 2 : 2.5,
			restSeconds: REST_SECONDS[exercise.kind],
			sets: Array.from({ length: exercise.sets }, (_, index) => ({
				setNumber: index + 1,
				repType: 'RANGE' as const,
				reps: null,
				minReps: exercise.minReps,
				maxReps: exercise.maxReps,
				weight: null,
				rir: 2,
			})),
		})),
	}))
	return {
		ok: true,
		draft: {
			name: template.name,
			description: template.description,
			goal: template.goal,
			experienceLevel: template.experienceLevel,
			scheduleMode: template.scheduleMode,
			trainingDays: days.map(day => day.slot),
			restDays: [],
			rotationWeekdays: [...template.rotationWeekdays],
			days,
		},
	}
}
