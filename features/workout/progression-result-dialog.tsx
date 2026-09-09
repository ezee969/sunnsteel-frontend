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
					<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 sm:mx-0">
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
							className="space-y-3 rounded-lg border bg-muted/30 p-4"
						>
							<div>
								<h3 className="font-semibold">{change.exerciseName}</h3>
								<p className="mt-1 text-sm text-muted-foreground">
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
											className="flex items-center justify-between gap-4 rounded-md bg-background px-3 py-2 text-sm"
										>
											<div>
												<p className="font-medium">{presentation.setLabel}</p>
												<p className="text-xs text-muted-foreground">
													{presentation.repsLabel}
												</p>
											</div>
											<span className="font-semibold text-emerald-700 dark:text-emerald-300">
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
