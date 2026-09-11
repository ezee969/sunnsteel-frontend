'use client'

import { Check } from 'lucide-react'
import React from 'react'

import { cn } from '@/lib/utils'

interface Step {
	id: number
	title: string
	description: string
}

interface StepperProps {
	steps: Step[]
	currentStep: number
	className?: string
	onStepClick?: (stepId: number) => void
	visitedSteps?: Set<number>
	// Optional advanced control:
	// - completedSteps: specify which steps should render as completed, overriding the default (currentStep > id)
	// - canStepClick: decide whether a given step is clickable, overriding the default (visitedSteps contains step)
	completedSteps?: Set<number>
	canStepClick?: (stepId: number) => boolean
}

type StepState = {
	isCompleted: boolean
	isActive: boolean
	isClickable: boolean
}

const MARKER_BASE =
	'type-data flex shrink-0 items-center justify-center rounded-sm border transition-colors duration-[var(--motion-fast)] ease-standard'

/**
 * Marker tone by state — v1.0 §12.1: completed is `--success` (§4.3 rule 2),
 * the current step an ink outline rather than a fill (rule 1 reserves the fill
 * for the wizard's Next button), a visited step a plain bounded marker, and an
 * unreached step the rule 7 disabled treatment. Square: §7 keeps
 * `rounded-full` for avatars.
 */
function markerTone({ isCompleted, isActive, isClickable }: StepState) {
	if (isCompleted) return 'border-success bg-success text-background'
	if (isActive) return 'border-2 border-primary bg-surface text-foreground'
	if (isClickable)
		return 'border-rule bg-surface text-ink-2 group-hover:bg-muted'
	return 'border-rule-faint bg-surface-sunk text-ink-3'
}

function titleTone({ isCompleted, isActive, isClickable }: StepState) {
	if (isActive) return 'text-foreground'
	if (isCompleted) return 'text-ink-2'
	if (isClickable) return 'text-ink-2 group-hover:text-foreground'
	return 'text-ink-3'
}

function stateLabel({ isCompleted, isActive, isClickable }: StepState) {
	if (isActive) return 'current step'
	if (isCompleted) return 'completed'
	if (isClickable) return 'available'
	return 'not available yet'
}

const FOCUS_RING =
	'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/**
 * The routine wizard's step indicator.
 *
 * a11y review 3: every step is a real `<button>`. It used to put `onClick` on
 * plain `<div>`s — no tab stop, no key handling, no role — so a keyboard user
 * could not return to a visited step the UI presented as clickable. The current
 * step carries `aria-current="step"`, unreachable steps `aria-disabled`, and
 * each label names its state. The click guard is unchanged: a step is only
 * acted on when `canStepClick`/`visitedSteps` allows it, exactly as before.
 *
 * Final review 11: below `lg` the tracker is one compact row of markers plus
 * the current step's title, instead of a four-row vertical list that pushed the
 * form below the first viewport. The horizontal layout still needs `lg` — at a
 * 768 viewport the shell's main column is only 512px (Findings 39).
 */
export function Stepper({
	steps,
	currentStep,
	className,
	onStepClick,
	visitedSteps,
	completedSteps,
	canStepClick,
}: StepperProps) {
	const total = steps.length

	const stateOf = (step: Step): StepState => {
		const isCompleted = completedSteps
			? completedSteps.has(step.id)
			: currentStep > step.id
		const isActive = currentStep === step.id
		const canClick = canStepClick
			? canStepClick(step.id)
			: visitedSteps?.has(step.id)
		return { isCompleted, isActive, isClickable: !!canClick && !isActive }
	}

	const buttonProps = (step: Step, state: StepState) => ({
		type: 'button' as const,
		onClick: () => state.isClickable && onStepClick?.(step.id),
		'aria-current': state.isActive ? ('step' as const) : undefined,
		'aria-disabled': !state.isClickable && !state.isActive ? true : undefined,
		'aria-label': `Step ${step.id} of ${total}: ${step.title}, ${stateLabel(state)}`,
	})

	const current = steps.find(step => step.id === currentStep)

	return (
		<div className={cn('w-full', className)}>
			{/* Compact tracker, below `lg` */}
			<div className="lg:hidden">
				<ol className="flex items-center gap-2" aria-label="Routine steps">
					{steps.map((step, index) => {
						const state = stateOf(step)
						const isLast = index === total - 1
						return (
							<li
								key={step.id}
								className={cn('flex items-center gap-2', !isLast && 'flex-1')}
							>
								<button
									{...buttonProps(step, state)}
									className={cn(
										'group relative rounded-sm',
										FOCUS_RING,
										state.isActive && 'cursor-default',
										// 32px marker, 44px hit area (a11y review 12)
										"after:absolute after:-inset-1.5 after:content-['']",
									)}
								>
									<span
										className={cn(MARKER_BASE, 'size-8', markerTone(state))}
									>
										{state.isCompleted ? (
											<Check className="h-4 w-4" aria-hidden />
										) : (
											<span aria-hidden>{step.id}</span>
										)}
									</span>
								</button>
								{!isLast && (
									<span
										aria-hidden
										className={cn(
											'h-px flex-1 transition-colors duration-[var(--motion-base)] ease-standard',
											state.isCompleted ? 'bg-success' : 'bg-rule-faint',
										)}
									/>
								)}
							</li>
						)
					})}
				</ol>
				{current && (
					<div className="mt-3">
						<p className="type-panel text-foreground">
							<span className="type-data mr-2 text-ink-3">
								{current.id}/{total}
							</span>
							{current.title}
						</p>
						<p className="type-body-sm mt-0.5 text-ink-3">
							{current.description}
						</p>
					</div>
				)}
			</div>

			{/* Horizontal layout, from `lg` */}
			<ol
				className="hidden w-full items-start lg:flex"
				aria-label="Routine steps"
			>
				{steps.map((step, index) => {
					const state = stateOf(step)
					const isLast = index === total - 1
					return (
						<li
							key={step.id}
							className={cn('flex items-start', !isLast && 'flex-1')}
						>
							<button
								{...buttonProps(step, state)}
								className={cn(
									'group flex shrink-0 flex-col items-center rounded-sm px-2 text-center',
									FOCUS_RING,
									state.isActive && 'cursor-default',
								)}
							>
								{/* Marker wrapper - fixed height for alignment */}
								<span className="mb-2 flex h-12 items-center justify-center">
									<span
										className={cn(
											MARKER_BASE,
											state.isActive ? 'size-12' : 'size-10',
											markerTone(state),
										)}
									>
										{state.isCompleted ? (
											<Check className="h-5 w-5" aria-hidden />
										) : (
											<span aria-hidden>{step.id}</span>
										)}
									</span>
								</span>
								<span
									className={cn(
										'type-panel transition-colors duration-[var(--motion-fast)] ease-standard',
										titleTone(state),
									)}
								>
									{step.title}
								</span>
								<span
									className={cn(
										'type-body-sm mt-1 max-w-[150px] transition-colors duration-[var(--motion-fast)] ease-standard',
										state.isActive ? 'text-ink-2' : 'text-ink-3',
									)}
								>
									{step.description}
								</span>
							</button>
							{!isLast && (
								<span
									aria-hidden
									className={cn(
										'mx-4 mt-6 h-px flex-1 transition-colors duration-[var(--motion-base)] ease-standard',
										state.isCompleted
											? 'bg-success'
											: state.isActive
												? 'bg-rule'
												: 'bg-rule-faint',
									)}
								/>
							)}
						</li>
					)
				})}
			</ol>
		</div>
	)
}
