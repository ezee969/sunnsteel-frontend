import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

interface WizardNavigationProps {
	/**
	 * Current active step (1-based index)
	 */
	currentStep: number
	/**
	 * Total number of steps
	 */
	totalSteps: number
	/**
	 * Handler for Previous button click
	 */
	onPrevious: () => void
	/**
	 * Handler for Next button click
	 */
	onNext: () => void
	/**
	 * Whether the Previous button is disabled
	 */
	isPreviousDisabled: boolean
	/**
	 * Whether the Next button is disabled
	 */
	isNextDisabled: boolean
	/**
	 * Whether a submission is in progress (shows spinner)
	 */
	isSubmitting?: boolean
	/**
	 * Optional custom label for the Next button.
	 * If not provided, defaults to 'Review' for the penultimate step and 'Next' for others.
	 */
	nextLabel?: string
}

/**
 * Shared sticky footer navigation for Routine wizard pages.
 */
export function WizardNavigation({
	currentStep,
	totalSteps,
	onPrevious,
	onNext,
	isPreviousDisabled,
	isNextDisabled,
	isSubmitting = false,
	nextLabel,
}: WizardNavigationProps) {
	// Determine default label if not provided
	const defaultLabel = currentStep === totalSteps - 1 ? 'Review' : 'Next'
	const label = nextLabel ?? defaultLabel

	// Should show next button? (Only if strictly less than total steps)
	// Because the final step (Review) usually has its own "Create/Update" button within the content
	const showNextButton = currentStep < totalSteps

	return (
		<div className="sticky bottom-0 z-20 mt-6 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="py-3 flex items-center justify-between px-4 sm:px-6 lg:px-8">
				<Button
					variant="outline"
					onClick={onPrevious}
					disabled={isPreviousDisabled || isSubmitting}
					className="gap-2"
					aria-label="Previous"
				>
					<ArrowLeft className="h-4 w-4" />
					<span className="sr-only sm:not-sr-only">Previous</span>
				</Button>

				{showNextButton ? (
					<Button
						onClick={onNext}
						disabled={isNextDisabled || isSubmitting}
						className="gap-2"
						aria-label={label}
						variant="classical"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							<>
								<span className="sr-only sm:not-sr-only">{label}</span>
								<ArrowRight className="h-4 w-4" />
							</>
						)}
					</Button>
				) : null}
			</div>
		</div>
	)
}
