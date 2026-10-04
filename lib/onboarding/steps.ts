import type {
	OnboardingState,
	TrainingExperienceLevel,
	TrainingGoal,
	UserProfile,
} from '@sunsteel/contracts'

import type { userService } from '@/lib/api/services/userService'

/**
 * ONBOARD-01: the one registry of onboarding steps. Each step names what it
 * configures -- profile fields, a write the app already makes, or a route --
 * and the version it arrived in. An account stores the version it completed
 * (contracts' `OnboardingState`), so a member is offered only the steps added
 * after it; `steps.test.ts` fails when a step stops mapping to a real
 * preference or route.
 *
 * **Adding a first-run choice:** add its step here with `since` set to the
 * next version, raise `ONBOARDING_VERSION`, and give it its messages under
 * `onboarding.steps`. The frontend `CLAUDE.md` "Closing a slice" holds the
 * rule.
 */
export const ONBOARDING_VERSION = 1

export const ONBOARDING_STEP_IDS = [
	'units',
	'goals',
	'days',
	'equipment',
	'target',
	'recommendation',
] as const
export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number]

export type OnboardingTarget =
	/** Fields of the owner's profile the step writes. */
	| { kind: 'profile'; fields: readonly (keyof UserProfile)[] }
	/** A write the app already makes, by its `userService` method. */
	| { kind: 'request'; service: keyof typeof userService }
	/** A page the step hands over to. */
	| { kind: 'route'; href: string }

export interface OnboardingStep {
	id: OnboardingStepId
	/** The registry version the step arrived in. */
	since: number
	configures: OnboardingTarget
	/** Where the member changes this later. */
	settingsHref: string
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
	{
		id: 'units',
		since: 1,
		configures: {
			kind: 'profile',
			fields: ['weightUnit', 'lengthUnit', 'timeZone', 'weekStartsOn'],
		},
		settingsHref: '/settings/account',
	},
	{
		id: 'goals',
		since: 1,
		configures: { kind: 'profile', fields: ['trainingIdentity'] },
		settingsHref: '/settings',
	},
	{
		// The weekdays feed the recommended template rather than a stored
		// preference: weekdays already live on routines (owner, 2026-10-04).
		id: 'days',
		since: 1,
		configures: { kind: 'route', href: '/routines/new' },
		settingsHref: '/routines',
	},
	{
		id: 'equipment',
		since: 1,
		configures: { kind: 'request', service: 'replaceTrainingLocations' },
		settingsHref: '/settings/training',
	},
	{
		id: 'target',
		since: 1,
		configures: { kind: 'request', service: 'replaceMeasurableGoals' },
		settingsHref: '/settings/training',
	},
	{
		id: 'recommendation',
		since: 1,
		configures: { kind: 'route', href: '/routines/new' },
		settingsHref: '/routines/new',
	},
]

/**
 * The steps this account has yet to see: those added after the version it
 * completed, less the ones done in the current run. An account the server
 * says nothing about has none, so an older server never opens the flow.
 */
export function pendingSteps(
	onboarding: OnboardingState | undefined,
	steps: readonly OnboardingStep[] = ONBOARDING_STEPS,
): OnboardingStep[] {
	if (!onboarding) return []
	return steps.filter(
		step =>
			step.since > onboarding.completedVersion &&
			!onboarding.stepsDone.includes(step.id),
	)
}

/**
 * A new account's first visit opens the flow once (owner, 2026-10-04): never
 * again once it has been offered, and never for an account that completed a
 * version before.
 */
export function shouldOpenWelcome(
	onboarding: OnboardingState | undefined,
): boolean {
	return (
		!!onboarding &&
		onboarding.completedVersion === 0 &&
		onboarding.offeredAt === null &&
		pendingSteps(onboarding).length > 0
	)
}

export type OnboardingRecommendation =
	| {
			kind: 'template'
			slug: 'full-body-foundations' | 'upper-lower' | 'push-pull-legs'
			/** The chosen weekdays, when the template can take them. */
			weekdays: number[] | null
	  }
	| { kind: 'build' }

const STRENGTH_GOALS: readonly TrainingGoal[] = [
	'STRENGTH',
	'MUSCLE_GROWTH',
	'FAT_LOSS',
	'GENERAL_FITNESS',
	'ATHLETIC_PERFORMANCE',
]

/**
 * The first action the answers point to. Every starter template is a
 * strength programme, so a member whose goals are only endurance or mobility
 * is pointed at building their own routine. Otherwise a beginner, or three
 * days or fewer, starts with Full Body Foundations; four days is Upper /
 * Lower; five or more is Push / Pull / Legs. The chosen weekdays go into the
 * template only where its own number of days matches (a rotation takes any).
 */
export function recommendStart({
	goals,
	experience,
	weekdays,
}: {
	goals: readonly TrainingGoal[]
	experience: TrainingExperienceLevel | null
	weekdays: readonly number[]
}): OnboardingRecommendation {
	if (goals.length > 0 && !goals.some(goal => STRENGTH_GOALS.includes(goal))) {
		return { kind: 'build' }
	}
	const days = [...new Set(weekdays)]
	if (experience !== 'BEGINNER' && days.length >= 5) {
		return { kind: 'template', slug: 'push-pull-legs', weekdays: days }
	}
	if (experience !== 'BEGINNER' && days.length === 4) {
		return { kind: 'template', slug: 'upper-lower', weekdays: days }
	}
	return {
		kind: 'template',
		slug: 'full-body-foundations',
		weekdays: days.length === 3 ? days : null,
	}
}

/** The routine builder opened on the recommended template and its weekdays. */
export function recommendationHref(
	recommendation: OnboardingRecommendation,
): string {
	if (recommendation.kind === 'build') return '/routines/new'
	const query = new URLSearchParams({ template: recommendation.slug })
	if (recommendation.weekdays?.length) {
		query.set('days', recommendation.weekdays.join(','))
	}
	return `/routines/new?${query.toString()}`
}
