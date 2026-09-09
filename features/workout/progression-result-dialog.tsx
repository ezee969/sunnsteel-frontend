'use client'

import type { ProgressionChange } from '@sunsteel/contracts'
import { TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import {
	getProgressionRuleExplanation,
	getProgressionSetPresentation,
} from '@/lib/utils/progression-change'

interface ProgressionResultDialogProps {
	changes: ProgressionChange[]
	onContinue: () => void
}

export function ProgressionResultDialog({
	changes,
	onContinue,
}: ProgressionResultDialogProps) {
	const weightUnit = useWeightUnit()
	const isOpen = changes.length > 0

	return (
		<Dialog
			open={isOpen}
			onOpenChange={open => {
				if (!open) onContinue()
			}}
		>
			<DialogContent
				className="max-h-[85vh] overflow-y-auto"
				showCloseButton={false}
			>
				<DialogHeader>
					<div className="flex size-10 items-center justify-center rounded-sm bg-surface-sunk text-success">
						<TrendingUp className="size-6" aria-hidden="true" />
					</div>
					<DialogTitle>Progression applied</DialogTitle>
					<DialogDescription>
						Your next workout prescriptions were updated from today&apos;s
						completed sets.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{changes.map(change => (
						<section
							key={change.routineExerciseId}
							className="space-y-3 rounded-none border border-rule-faint bg-surface-sunk p-4"
						>
							<div>
								<h3 className="type-panel text-foreground">
									{change.exerciseName}
								</h3>
								<p className="type-body-sm mt-1 text-ink-3">
									{getProgressionRuleExplanation(change, weightUnit)}
								</p>
							</div>
							<ul className="space-y-2">
								{change.sets.map(set => {
									const presentation = getProgressionSetPresentation(
										set,
										weightUnit,
									)
									return (
										<li
											key={set.setNumber}
											className="flex items-center justify-between gap-4 rounded-none bg-background px-3 py-2"
										>
											<div>
												<p className="type-body-sm text-foreground">
													{presentation.setLabel}
												</p>
												<p className="type-body-sm text-ink-3">
													{presentation.repsLabel}
												</p>
											</div>
											<span className="type-data type-data-strong text-honour">
												{presentation.weightLabel}
											</span>
										</li>
									)
								})}
							</ul>
						</section>
					))}
				</div>

				<DialogFooter>
					<Button onClick={onContinue} className="w-full sm:w-auto">
						Continue to dashboard
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
