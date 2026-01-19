'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Check, ChevronRight } from 'lucide-react'

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
			{/* Mobile Version - Vertical Layout */}
			<div className="block sm:hidden">
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
								{/* Step Circle */}
								<div
									className={cn(
										'flex shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold cursor-pointer transition-all duration-200',
										isCompleted
											? 'border-green-500 bg-green-500 text-white hover:bg-green-600 hover:border-green-600 h-8 w-8'
											: isActive
												? 'border-blue-500 bg-blue-50 text-blue-600  h-10 w-10'
												: isClickable
													? 'border-blue-400 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:border-blue-500 h-8 w-8'
													: 'border-gray-300 bg-gray-50 text-gray-400 h-8 w-8',
									)}
									onClick={() => isClickable && onStepClick?.(step.id)}
								>
									{isCompleted ? (
										<Check className="h-4 w-4" />
									) : (
										<span className={cn(isActive ? 'text-sm' : 'text-xs')}>
											{step.id}
										</span>
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
											'font-medium transition-colors',
											isCompleted
												? 'text-green-700 hover:text-green-800 text-sm'
												: isActive
													? 'text-blue-600 text-base font-semibold'
													: isClickable
														? 'text-blue-600 hover:text-blue-700 text-sm'
														: 'text-gray-500 text-sm',
										)}
									>
										{step.title}
									</div>

									{/* Description - Only show for active step */}
									{isActive && (
										<div className="text-sm mt-2 text-gray-600 leading-relaxed">
											{step.description}
										</div>
									)}
								</div>

								{/* Active Indicator */}
								{isActive && (
									<div className="mt-1">
										<ChevronRight className="h-4 w-4 text-blue-500" />
									</div>
								)}
							</div>
						)
					})}
				</div>
			</div>

			{/* Desktop Version - Horizontal Layout */}
			<div className="hidden sm:block">
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
										isClickable && 'cursor-pointer hover:opacity-80',
									)}
									onClick={() => isClickable && onStepClick?.(step.id)}
								>
									{/* Step Circle Wrapper - Fixed Height for Alignment */}
									<div className="flex items-center justify-center h-12 mb-2">
										<div
											className={cn(
												'flex items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200',
												isCompleted
													? 'border-green-500 bg-green-500 text-white h-10 w-10'
													: isActive
														? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm shadow-blue-100 h-12 w-12'
														: isClickable
															? 'border-blue-400 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:border-blue-500 h-10 w-10'
															: 'border-gray-300 bg-gray-50 text-gray-400 h-10 w-10',
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
											'text-center font-medium transition-colors',
											isCompleted
												? 'text-green-700 text-sm'
												: isActive
													? 'text-blue-600 text-sm font-semibold'
													: isClickable
														? 'text-blue-600 hover:text-blue-700 text-xs'
														: 'text-gray-500 text-xs',
										)}
									>
										{step.title}
									</div>

									{/* Step Description */}
									<div
										className={cn(
											'text-center text-xs mt-1 transition-colors max-w-[150px]',
											isActive ? 'text-gray-600' : 'text-gray-400',
										)}
									>
										{step.description}
									</div>
								</div>

								{/* Connector Line */}
								{!isLast && (
									<div
										className={cn(
											'flex-1 h-0.5 mx-4 transition-colors duration-300 mt-6',
											isCompleted
												? 'bg-green-500'
												: isActive
													? 'bg-blue-500'
													: 'bg-gray-300',
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
