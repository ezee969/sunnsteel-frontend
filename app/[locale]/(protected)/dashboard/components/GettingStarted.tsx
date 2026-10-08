'use client'

import { Check, Compass } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { useWeightUnit } from '@/hooks/use-weight-unit'
import { cn } from '@/lib/utils'
import {
	type GettingStartedStep,
	type GettingStartedStepId,
} from '@/lib/utils/dashboard-growth'
import { getWeightUnitLabel } from '@/lib/utils/weight-unit'

const STEP_HREF: Record<GettingStartedStepId, string> = {
	setup: '/welcome',
	routine: '/routines/new',
	workout: '/workouts',
	gym: '/settings/training',
}

/**
 * UX-19: three steps a new account takes, each read from data it already
 * has. It is not a DASH-05 section -- it cannot be moved or hidden, and it
 * leaves on its own once every step is done or the account has finished
 * three workouts. Ruled like the sections around it; the one filled action
 * stays in Today's Workouts (DASH-02), so each step is a link.
 */
export default function GettingStarted({
	steps,
}: {
	steps: GettingStartedStep[]
}) {
	const t = useTranslations('planning.gettingStarted')
	const weightUnit = useWeightUnit()
	const done = steps.filter(step => step.done).length
	if (done === steps.length) return null

	return (
		<section aria-labelledby="dashboard-getting-started-heading">
			<div className="rule-heading flex flex-wrap items-end justify-between gap-x-6 gap-y-1 pb-2">
				<h2
					id="dashboard-getting-started-heading"
					className="type-section flex items-center gap-2 text-foreground"
				>
					<Compass className="h-4 w-4 text-ink-3" aria-hidden />
					{t('title')}
				</h2>
				<p className="type-body-sm text-ink-3">
					{t('progress', { done, total: steps.length })}
				</p>
			</div>
			<ol>
				{steps.map((step, index) => (
					<li
						key={step.id}
						className="rule-row grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 py-3"
					>
						<span
							aria-hidden
							className={cn(
								'type-data mt-0.5 flex size-6 items-center justify-center rounded-full border',
								step.done
									? 'border-rule text-ink-3'
									: 'border-ink-3 text-foreground',
							)}
						>
							{step.done ? (
								<Check aria-hidden className="size-3.5" />
							) : (
								index + 1
							)}
						</span>
						<div className="min-w-0">
							<h3 className="type-panel">
								<Link
									href={STEP_HREF[step.id]}
									className={cn(
										'underline-offset-4 hover:underline',
										step.done ? 'text-ink-3' : 'text-foreground',
									)}
								>
									{t(`steps.${step.id}.title`)}
								</Link>
								{step.done ? (
									<span className="sr-only">{` (${t('done')})`}</span>
								) : null}
							</h3>
							{step.done ? null : (
								<p className="type-body-sm mt-0.5 text-ink-3">
									{step.id === 'gym'
										? t.rich('steps.gym.detail', {
												unit: getWeightUnitLabel(weightUnit),
												link: chunks => (
													<Link
														href="/settings"
														className="text-ink-2 underline underline-offset-4 hover:text-foreground"
													>
														{chunks}
													</Link>
												),
											})
										: t(`steps.${step.id}.detail`)}
								</p>
							)}
						</div>
					</li>
				))}
			</ol>
		</section>
	)
}
