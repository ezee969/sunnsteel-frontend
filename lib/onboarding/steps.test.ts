import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { isOnboardingStepId, type OnboardingState } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'
import { userService } from '@/lib/api/services/userService'
import {
	findRoutineTemplate,
	parseTemplateWeekdays,
	templateDraft,
} from '@/lib/utils/routine-templates'
import { MESSAGES } from '@/messages'

import {
	ONBOARDING_STEP_IDS,
	ONBOARDING_STEPS,
	ONBOARDING_VERSION,
	pendingSteps,
	recommendationHref,
	recommendStart,
	shouldOpenWelcome,
} from './steps'

/** A page route exists when its `page.tsx` does, under the protected shell. */
const routeExists = (href: string) => {
	const path = href.split(/[?#]/)[0].replace(/^\//, '')
	return existsSync(
		join(process.cwd(), 'app', '[locale]', '(protected)', path, 'page.tsx'),
	)
}

const state = (overrides: Partial<OnboardingState> = {}): OnboardingState => ({
	completedVersion: 0,
	stepsDone: [],
	offeredAt: null,
	...overrides,
})

describe('the onboarding registry (ONBOARD-01)', () => {
	it('lists every step once, by an id the server accepts', () => {
		const ids = ONBOARDING_STEPS.map(step => step.id)
		expect(new Set(ids).size).toBe(ids.length)
		expect([...ids].sort()).toEqual([...ONBOARDING_STEP_IDS].sort())
		for (const id of ids) expect(isOnboardingStepId(id)).toBe(true)
	})

	it('dates every step to a released version, and the current one adds steps', () => {
		for (const step of ONBOARDING_STEPS) {
			expect(step.since).toBeGreaterThanOrEqual(1)
			expect(step.since).toBeLessThanOrEqual(ONBOARDING_VERSION)
		}
		expect(
			ONBOARDING_STEPS.some(step => step.since === ONBOARDING_VERSION),
		).toBe(true)
	})

	it('maps every step to a real write or page, and a place to change it later', () => {
		for (const step of ONBOARDING_STEPS) {
			const target = step.configures
			if (target.kind === 'request') {
				expect(typeof userService[target.service], step.id).toBe('function')
			} else if (target.kind === 'route') {
				expect(routeExists(target.href), `${step.id} ${target.href}`).toBe(true)
			} else {
				// Profile fields are checked by the compiler (`keyof UserProfile`).
				expect(target.fields.length, step.id).toBeGreaterThan(0)
			}
			expect(
				routeExists(step.settingsHref),
				`${step.id} ${step.settingsHref}`,
			).toBe(true)
		}
	})

	it('names every step in both languages', () => {
		for (const locale of ['en', 'es'] as const) {
			const steps = MESSAGES[locale].onboarding.steps as Record<
				string,
				{ title?: string }
			>
			for (const step of ONBOARDING_STEPS) {
				expect(steps[step.id]?.title, `${locale} ${step.id}`).toBeTruthy()
			}
		}
	})
})

describe('who sees which steps', () => {
	it('offers a new account every step, and resumes after the ones done', () => {
		expect(pendingSteps(state()).map(step => step.id)).toEqual([
			...ONBOARDING_STEP_IDS,
		])
		expect(pendingSteps(state({ stepsDone: ['units', 'goals'] }))[0].id).toBe(
			'days',
		)
	})

	it('offers an account only the steps added after the version it completed', () => {
		expect(
			pendingSteps(state({ completedVersion: ONBOARDING_VERSION })),
		).toEqual([])
		const later = [
			...ONBOARDING_STEPS,
			{
				id: 'units' as const,
				since: ONBOARDING_VERSION + 1,
				configures: { kind: 'route' as const, href: '/settings' },
				settingsHref: '/settings',
			},
		]
		expect(
			pendingSteps(state({ completedVersion: ONBOARDING_VERSION }), later),
		).toHaveLength(1)
		// An older server that sends nothing never opens anything.
		expect(pendingSteps(undefined)).toEqual([])
	})

	it('opens by itself once, and only for a new account', () => {
		expect(shouldOpenWelcome(state())).toBe(true)
		expect(
			shouldOpenWelcome(state({ offeredAt: '2026-10-04T12:00:00.000Z' })),
		).toBe(false)
		expect(shouldOpenWelcome(state({ completedVersion: 1 }))).toBe(false)
		expect(shouldOpenWelcome(undefined)).toBe(false)
	})
})

describe('the recommendation', () => {
	it('starts a beginner, or three days or fewer, with Full Body Foundations', () => {
		expect(
			recommendStart({
				goals: ['STRENGTH'],
				experience: 'BEGINNER',
				weekdays: [1, 2, 3, 4, 5],
			}),
		).toEqual({
			kind: 'template',
			slug: 'full-body-foundations',
			weekdays: null,
		})
		expect(
			recommendStart({ goals: [], experience: null, weekdays: [1, 3, 5] }),
		).toEqual({
			kind: 'template',
			slug: 'full-body-foundations',
			weekdays: [1, 3, 5],
		})
		expect(
			recommendStart({ goals: [], experience: null, weekdays: [] }),
		).toEqual({
			kind: 'template',
			slug: 'full-body-foundations',
			weekdays: null,
		})
	})

	it('gives four days Upper / Lower and five or more Push / Pull / Legs', () => {
		expect(
			recommendStart({
				goals: ['MUSCLE_GROWTH'],
				experience: 'INTERMEDIATE',
				weekdays: [1, 2, 4, 5],
			}),
		).toMatchObject({ slug: 'upper-lower', weekdays: [1, 2, 4, 5] })
		expect(
			recommendStart({
				goals: [],
				experience: 'ADVANCED',
				weekdays: [1, 2, 3, 4, 5, 6],
			}),
		).toMatchObject({ slug: 'push-pull-legs' })
	})

	it('points endurance or mobility alone at building a routine', () => {
		expect(
			recommendStart({
				goals: ['ENDURANCE', 'MOBILITY'],
				experience: null,
				weekdays: [1, 3],
			}),
		).toEqual({ kind: 'build' })
		expect(
			recommendStart({
				goals: ['ENDURANCE', 'STRENGTH'],
				experience: null,
				weekdays: [],
			}),
		).toMatchObject({ kind: 'template' })
	})

	it('opens the builder on the template and the chosen weekdays', () => {
		expect(
			recommendationHref({
				kind: 'template',
				slug: 'upper-lower',
				weekdays: [1, 2, 4, 5],
			}),
		).toBe('/routines/new?template=upper-lower&days=1%2C2%2C4%2C5')
		expect(
			recommendationHref({
				kind: 'template',
				slug: 'full-body-foundations',
				weekdays: null,
			}),
		).toBe('/routines/new?template=full-body-foundations')
		expect(recommendationHref({ kind: 'build' })).toBe('/routines/new')
		for (const slug of [
			'full-body-foundations',
			'upper-lower',
			'push-pull-legs',
		]) {
			expect(findRoutineTemplate(slug), slug).not.toBeNull()
		}
	})
})

describe('a template on the member’s weekdays', () => {
	const t = translatorFor('en', 'routines.templates')
	const catalogFor = (slug: string) =>
		findRoutineTemplate(slug)!.days.flatMap(day =>
			day.exercises.map(exercise => ({
				id: exercise.name,
				name: exercise.name,
			})),
		)

	it('reads ?days= Monday first and refuses anything else', () => {
		expect(parseTemplateWeekdays('0,3,1')).toEqual([1, 3, 0])
		expect(parseTemplateWeekdays('1,1')).toBeNull()
		expect(parseTemplateWeekdays('1,9')).toBeNull()
		expect(parseTemplateWeekdays('x')).toBeNull()
		expect(parseTemplateWeekdays(null)).toBeNull()
	})

	it('places a weekly template on as many days, and keeps its own otherwise', () => {
		const template = findRoutineTemplate('full-body-foundations')!
		const placed = templateDraft(
			template,
			catalogFor(template.slug),
			t,
			[2, 4, 6],
		)
		expect(placed.ok && placed.draft.days.map(day => day.slot)).toEqual([
			2, 4, 6,
		])
		const kept = templateDraft(template, catalogFor(template.slug), t, [2, 4])
		expect(kept.ok && kept.draft.days.map(day => day.slot)).toEqual([1, 3, 5])
	})

	it('trains a rotation on the chosen days', () => {
		const template = findRoutineTemplate('push-pull-legs')!
		const draft = templateDraft(
			template,
			catalogFor(template.slug),
			t,
			[1, 2, 4, 5, 6],
		)
		expect(draft.ok && draft.draft.rotationWeekdays).toEqual([1, 2, 4, 5, 6])
	})
})
