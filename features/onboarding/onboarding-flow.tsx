'use client'

import { DEFAULT_WEEK_STARTS_ON, isWeekStartsOn } from '@sunsteel/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useUpdateOnboarding } from '@/lib/api/hooks/useOnboarding'
import { useUser } from '@/lib/api/hooks/useUser'
import {
	ONBOARDING_VERSION,
	type OnboardingStep,
	type OnboardingStepId,
	pendingSteps,
} from '@/lib/onboarding/steps'

import {
	DaysStep,
	EquipmentStep,
	GoalsStep,
	RecommendationStep,
	TargetStep,
	UnitsStep,
} from './onboarding-steps'

/** The training days live on this device until the recommendation uses them. */
const DAYS_KEY = 'ss-onboarding-days'

function readDays(): number[] {
	try {
		const parsed = JSON.parse(window.localStorage.getItem(DAYS_KEY) ?? '[]')
		return Array.isArray(parsed)
			? parsed.filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
			: []
	} catch {
		return []
	}
}

function writeDays(days: number[]) {
	try {
		window.localStorage.setItem(DAYS_KEY, JSON.stringify(days))
	} catch {
		// Blocked storage: the answer still holds for this visit.
	}
}

/**
 * ONBOARD-01: the steps this account has yet to see, one per screen, in
 * registry order. The list is fixed when the page opens, so answering a step
 * never reshuffles the ones after it. Every step is recorded as done when it
 * hands on, so leaving and coming back resumes at the next one; the last step
 * completes the version.
 */
export function OnboardingFlow() {
	const t = useTranslations('onboarding.page')
	const { user } = useUser()
	const update = useUpdateOnboarding()
	const [queue, setQueue] = useState<OnboardingStep[] | null>(null)
	const [index, setIndex] = useState(0)
	const [days, setDays] = useState<number[]>([])
	const offered = useRef(false)

	useEffect(() => {
		if (!user || queue) return
		setQueue(pendingSteps(user.onboarding))
		setDays(readDays())
	}, [user, queue])

	// Every step was done on an earlier visit: the version is complete.
	useEffect(() => {
		const onboarding = user?.onboarding
		if (
			queue?.length === 0 &&
			onboarding &&
			onboarding.completedVersion < ONBOARDING_VERSION
		) {
			update.mutate({ completedVersion: ONBOARDING_VERSION })
		}
	}, [queue, user, update])

	// Opened directly: it must not open again by itself later.
	useEffect(() => {
		if (!user?.onboarding || user.onboarding.offeredAt || offered.current)
			return
		offered.current = true
		update.mutate({ offered: true })
	}, [user, update])

	if (!user || !queue) {
		return (
			<div role="status" aria-label={t('loading')} className="space-y-3">
				<Skeleton className="h-10 max-w-sm" />
				<Skeleton className="h-40" />
			</div>
		)
	}

	const step = queue[index]
	// The last step of the run completes the version, whichever step it is.
	const done = (id: OnboardingStepId) => {
		update.mutate(
			index + 1 >= queue.length
				? { completedVersion: ONBOARDING_VERSION }
				: { stepsDone: [id] },
		)
		setIndex(current => current + 1)
	}
	const complete = () => update.mutate({ completedVersion: ONBOARDING_VERSION })
	const changeDays = (next: number[]) => {
		setDays(next)
		writeDays(next)
	}
	const weekStartsOn = isWeekStartsOn(user.weekStartsOn)
		? user.weekStartsOn
		: DEFAULT_WEEK_STARTS_ON
	// Exhaustive on purpose: a registry step without a screen fails the build.
	const renderStep = (id: OnboardingStepId) => {
		switch (id) {
			case 'units':
				return <UnitsStep key={id} profile={user} onDone={() => done(id)} />
			case 'goals':
				return <GoalsStep key={id} profile={user} onDone={() => done(id)} />
			case 'days':
				return (
					<DaysStep
						key={id}
						weekStartsOn={weekStartsOn}
						days={days}
						onChange={changeDays}
						onDone={() => done(id)}
					/>
				)
			case 'equipment':
				return <EquipmentStep key={id} profile={user} onDone={() => done(id)} />
			case 'target':
				return <TargetStep key={id} days={days} onDone={() => done(id)} />
			case 'recommendation':
				return (
					<RecommendationStep
						key={id}
						profile={user}
						days={days}
						onComplete={complete}
					/>
				)
			default: {
				const unhandled: never = id
				return unhandled
			}
		}
	}

	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-8">
			<header className="space-y-3">
				<div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
					<h1 className="type-page corner-brackets inline-block text-foreground">
						{t('title')}
					</h1>
					{step ? (
						<Link
							href="/dashboard"
							className="type-body-sm text-ink-2 underline-offset-4 hover:underline"
						>
							{t('skipForNow')}
						</Link>
					) : null}
				</div>
				<p className="type-body max-w-[68ch] text-ink-2">{t('intro')}</p>
				{step ? (
					<p className="type-body-sm text-ink-3" aria-live="polite">
						{t('stepOf', { current: index + 1, total: queue.length })}
					</p>
				) : null}
			</header>

			{!step ? (
				<section
					aria-labelledby="onboarding-done-heading"
					className="space-y-4"
				>
					<h2
						id="onboarding-done-heading"
						className="type-section text-foreground"
					>
						{t('doneTitle')}
					</h2>
					<p className="type-body max-w-[68ch] text-ink-2">{t('doneBody')}</p>
					<Button asChild>
						<Link href="/dashboard">{t('toDashboard')}</Link>
					</Button>
				</section>
			) : (
				renderStep(step.id)
			)}
		</div>
	)
}
