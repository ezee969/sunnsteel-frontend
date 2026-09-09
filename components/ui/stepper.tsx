'use client'

import { Check, ChevronRight } from 'lucide-react'
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

/**
 * The routine wizard's step indicator.
 *
 * This carried the largest raw-palette cluster left in the app — 22 classes
 * across `blue-*`, `green-*` and `gray-*`. v1.0 §12.1 maps them by meaning, not
 * by name: **completed is `--success`** (§4.3 rule 2 — done, as planned), the
 * **current step is an ink outline, not an ink fill** (rule 1 reserves the
 * filled `--primary` for the region's one real control, which is the wizard's
 * Next button), a **visited step is a plain bounded marker**, and an unreached
 * step takes the §4.3 rule 7 disabled treatment — `--ink-3` on `--surface-sunk`,
 * never a global opacity drop.
 *
 * The markers are square. §7 keeps `rounded-full` for avatars only.
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
	return (
		<div className={cn('w-full', className)}>
			{/* Stacked layout. It runs to `lg`, not `sm`: the horizontal stepper
			    needs ~700px and the shell only gives its main column 512px at a 768
			    viewport, so four steps ran 88px past the edge there. The `before`
			    baseline shows the same overflow with step 4 already cut off —
			    pre-existing, but this batch's type ranks widened it. */}
			<div className="block lg:hidden">
				<div className="space-y-4">
					{steps.map(step => {
						const isCompleted = completedSteps
							? completedSteps.has(step.id)
							: currentStep > step.id
						const isActive = currentStep === step.id
						const canClick = canStepClick
							? canStepClick(step.id)
							: visitedSteps?.has(step.id)
						const isClickable = !!canClick && !isActive

						return (
							<div key={step.id} className="flex items-start gap-4">
								{/* Step Marker */}
								<div
									className={cn(
										'type-data flex shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors duration-[var(--motion-fast)] ease-standard',
										isCompleted
											? 'h-8 w-8 border-success bg-success text-background'
											: isActive
												? 'h-10 w-10 border-2 border-primary bg-surface text-foreground'
												: isClickable
													? 'h-8 w-8 border-rule bg-surface text-ink-2 hover:bg-muted'
													: 'h-8 w-8 border-rule-faint bg-surface-sunk text-ink-3',
									)}
									onClick={() => isClickable && onStepClick?.(step.id)}
								>
									{isCompleted ? (
										<Check className="h-4 w-4" />
									) : (
										<span>{step.id}</span>
									)}
								</div>

								{/* Step Content */}
								<div
									className={cn(
										'flex-1 min-w-0',
										isClickable && 'cursor-pointer',
									)}
									onClick={() => isClickable && onStepClick?.(step.id)}
								>
									<div
										className={cn(
											'type-panel transition-colors duration-[var(--motion-fast)] ease-standard',
											isCompleted
												? 'text-ink-2'
												: isActive
													? 'text-foreground'
													: isClickable
														? 'text-ink-2 hover:text-foreground'
														: 'text-ink-3',
										)}
									>
										{step.title}
									</div>

									{/* Description - Only show for active step */}
									{isActive && (
										<div className="type-body-sm mt-1 text-ink-3">
											{step.description}
										</div>
									)}
								</div>

								{/* Active Indicator */}
								{isActive && (
									<div className="mt-1">
										<ChevronRight className="h-4 w-4 text-ink-3" aria-hidden />
									</div>
								)}
							</div>
						)
					})}
				</div>
			</div>

			{/* Horizontal Layout */}
			<div className="hidden lg:block">
				<div className="flex items-start justify-between w-full">
					{steps.map((step, index) => {
						const isCompleted = completedSteps
							? completedSteps.has(step.id)
							: currentStep > step.id
						const isActive = currentStep === step.id
						const canClick = canStepClick
							? canStepClick(step.id)
							: visitedSteps?.has(step.id)
						const isClickable = !!canClick && !isActive
						const isLast = index === steps.length - 1

						return (
							<React.Fragment key={step.id}>
								{/* Step Container */}
								<div
									className={cn(
										'flex flex-col items-center relative shrink-0 px-2',
										isClickable && 'cursor-pointer',
									)}
									onClick={() => isClickable && onStepClick?.(step.id)}
								>
									{/* Step Marker Wrapper - Fixed Height for Alignment */}
									<div className="mb-2 flex h-12 items-center justify-center">
										<div
											className={cn(
												'type-data flex items-center justify-center rounded-sm border transition-colors duration-[var(--motion-fast)] ease-standard',
												isCompleted
													? 'h-10 w-10 border-success bg-success text-background'
													: isActive
														? 'h-12 w-12 border-2 border-primary bg-surface text-foreground'
														: isClickable
															? 'h-10 w-10 border-rule bg-surface text-ink-2 hover:bg-muted'
															: 'h-10 w-10 border-rule-faint bg-surface-sunk text-ink-3',
											)}
										>
											{isCompleted ? (
												<Check className="h-5 w-5" />
											) : (
												<span>{step.id}</span>
											)}
										</div>
									</div>

									{/* Step Title */}
									<div
										className={cn(
											'type-panel text-center transition-colors duration-[var(--motion-fast)] ease-standard',
											isCompleted
												? 'text-ink-2'
												: isActive
													? 'text-foreground'
													: isClickable
														? 'text-ink-2 hover:text-foreground'
														: 'text-ink-3',
										)}
									>
										{step.title}
									</div>

									{/* Step Description */}
									<div
										className={cn(
											'type-body-sm mt-1 max-w-[150px] text-center transition-colors duration-[var(--motion-fast)] ease-standard',
											isActive ? 'text-ink-2' : 'text-ink-3',
										)}
									>
										{step.description}
									</div>
								</div>

								{/* Connector Line */}
								{!isLast && (
									<div
										className={cn(
											'mx-4 mt-6 h-px flex-1 transition-colors duration-[var(--motion-base)] ease-standard',
											isCompleted
												? 'bg-success'
												: isActive
													? 'bg-rule'
													: 'bg-rule-faint',
										)}
									/>
								)}
							</React.Fragment>
						)
					})}
				</div>
			</div>
		</div>
	)
}
