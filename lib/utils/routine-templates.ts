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
import type { Translator } from '@/i18n/translator'

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

type T = Translator<'routines.templates'>

type TemplateKey = 'fullBody' | 'upperLower' | 'pushPullLegs'
type DayKey =
	| 'fullBodyA'
	| 'fullBodyB'
	| 'fullBodyC'
	| 'upperA'
	| 'lowerA'
	| 'upperB'
	| 'lowerB'
	| 'push'
	| 'pull'
	| 'legs'

interface TemplateDay {
	/** The weekday on a weekly template; its position on a rotation. */
	slot: number
	/** Names the day through messages, so a draft is in the viewer's language. */
	key: DayKey
	exercises: TemplateExercise[]
}

export interface RoutineTemplate {
	slug: string
	/** Names the template through messages; the slug stays the address. */
	key: TemplateKey
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
		key: 'fullBody',
		goal: 'GENERAL_FITNESS',
		experienceLevel: 'BEGINNER',
		scheduleMode: 'WEEKLY',
		rotationWeekdays: [],
		days: [
			{
				slot: 1,
				key: 'fullBodyA',
				exercises: [
					ex('Squat', 3, 5, 8),
					ex('Bench Press', 3, 5, 8),
					ex('Bent-over Row', 3, 8, 10),
					ex('Dead Bug', 2, 10, 12, 'bodyweight'),
				],
			},
			{
				slot: 3,
				key: 'fullBodyB',
				exercises: [
					ex('Romanian Deadlift', 3, 8, 10),
					ex('Overhead Press', 3, 6, 8),
					ex('Lat Pulldown', 3, 8, 12),
					ex('Lunges', 2, 10, 12, 'bodyweight'),
				],
			},
			{
				slot: 5,
				key: 'fullBodyC',
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
		key: 'upperLower',
		goal: 'MUSCLE_GROWTH',
		experienceLevel: 'INTERMEDIATE',
		scheduleMode: 'WEEKLY',
		rotationWeekdays: [],
		days: [
			{
				slot: 1,
				key: 'upperA',
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
				key: 'lowerA',
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
				key: 'upperB',
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
				key: 'lowerB',
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
		key: 'pushPullLegs',
		goal: 'MUSCLE_GROWTH',
		experienceLevel: 'INTERMEDIATE',
		scheduleMode: 'ROTATION',
		rotationWeekdays: [1, 2, 3, 4, 5, 6],
		days: [
			{
				slot: 0,
				key: 'push',
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
				key: 'pull',
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
				key: 'legs',
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

/** The template's name, its one-line summary and what it is, in words. */
export function templateText(template: RoutineTemplate, t: T) {
	return {
		name: t(`${template.key}.name`),
		summary: t(`${template.key}.summary`),
		description: t(`${template.key}.description`),
	}
}

export const templateDayName = (day: TemplateDay, t: T) => t(`days.${day.key}`)

/** "12 exercises" */
export function describeTemplateSize(template: RoutineTemplate, t: T): string {
	const exercises = template.days.reduce(
		(total, day) => total + day.exercises.length,
		0,
	)
	return t('size', { count: exercises })
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
	t: T,
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
		name: templateDayName(day, t),
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
			name: templateText(template, t).name,
			description: templateText(template, t).description,
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
